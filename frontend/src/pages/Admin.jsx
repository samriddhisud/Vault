import { useState, useEffect } from 'react'
import api from '../api/index'

function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function timeAgo(d) {
  const diff = Math.floor((new Date() - new Date(d)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const actionLabels = {
  login: '🔑 Logged in', register: '✨ Registered', logout: '👋 Logged out',
  add_expense: '➕ Added expense', edit_expense: '✏️ Edited expense',
  delete_expense: '🗑️ Deleted expense', update_budget: '💰 Updated budget',
}

const emptyCreate = { name: '', email: '', password: '', role: 'user' }

export default function Admin({ addToast }) {
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')
  const [openTabs, setOpenTabs] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [createErrors, setCreateErrors] = useState({})
  const [creating, setCreating] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', newPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [usersRes, activityRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/activity'),
      ])
      setUsers(usersRes.data)
      setActivity(activityRes.data)
    } catch {
      addToast('Could not load admin data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openTab = (type, user, expenses = []) => {
    const key = `${type}-${user._id}`
    setOpenTabs(prev => {
      const exists = prev.find(t => t.key === key)
      if (exists) return prev.map(t => t.key === key ? { ...t, expenses } : t)
      return [...prev, { key, type, user, expenses }]
    })
    setTab(key)
    setSelectedUserId(user._id)
    if (type === 'profile') {
      setProfileForm({ name: user.name, email: user.email, newPassword: '' })
    }
  }

  const closeTab = (key) => {
    setOpenTabs(prev => prev.filter(t => t.key !== key))
    if (tab === key) setTab('users')
  }

  const handleViewExpenses = async (user) => {
    try {
      const res = await api.get(`/admin/users/${user._id}/expenses`)
      openTab('expenses', res.data.user, res.data.expenses)
    } catch {
      addToast('Could not load expenses.', 'error')
    }
  }

  const handleEditUser = (user) => {
    openTab('profile', user)
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole })
      addToast(`Role updated to ${newRole}! ✓`, 'success')
      setOpenTabs(prev => prev.map(t =>
        t.user._id === userId ? { ...t, user: { ...t.user, role: newRole } } : t
      ))
      loadData()
    } catch {
      addToast('Could not update role.', 'error')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`)
      addToast('User deleted.', 'success')
      setOpenTabs(prev => prev.filter(t => t.user._id !== deleteTarget._id))
      if (tab.includes(deleteTarget._id)) setTab('users')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not delete user.', 'error')
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!createForm.name.trim()) errs.name = 'Name is required.'
    if (!createForm.email.trim()) errs.email = 'Email is required.'
    if (!createForm.password) errs.password = 'Password is required.'
    if (createForm.password.length < 6) errs.password = 'Min 6 characters.'
    if (Object.keys(errs).length) { setCreateErrors(errs); return }
    setCreating(true)
    try {
      await api.post('/admin/users', createForm)
      addToast('User created! ✓', 'success')
      setCreateForm(emptyCreate)
      setCreateErrors({})
      setShowCreateForm(false)
      loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not create user.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const currentTab = openTabs.find(t => t.key === tab)
    if (!currentTab) return
    setSavingProfile(true)
    try {
      await api.put(`/admin/users/${currentTab.user._id}`, {
        name: profileForm.name,
        email: profileForm.email,
      })
      if (profileForm.newPassword) {
        if (profileForm.newPassword.length < 6) {
          addToast('Password must be at least 6 characters.', 'error')
          setSavingProfile(false)
          return
        }
        await api.put(`/admin/users/${currentTab.user._id}/password`, {
          newPassword: profileForm.newPassword
        })
      }
      addToast('Profile updated! ✓', 'success')
      setProfileForm(prev => ({ ...prev, newPassword: '' }))
      setOpenTabs(prev => prev.map(t =>
        t.key === tab ? { ...t, user: { ...t.user, name: profileForm.name, email: profileForm.email } } : t
      ))
      loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update profile.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) return (
    <div className="page-wrapper">
      <div className="loading-page"><div className="spinner"></div></div>
    </div>
  )

  const catColorMap = {
    Food: 'cat-food', Transport: 'cat-transport', Shopping: 'cat-shopping',
    Bills: 'cat-bills', Entertainment: 'cat-entertainment', Health: 'cat-health', Other: 'cat-other'
  }

  const currentTabData = openTabs.find(t => t.key === tab)

  const tabStyle = (key) => ({
    padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: tab === key ? 'var(--tx)' : 'transparent',
    color: tab === key ? (document.body.classList.contains('dark') ? '#0d0d0d' : '#fff') : 'var(--mu)',
    border: '2px solid var(--border)',
    borderBottom: tab === key ? '2px solid var(--tx)' : '2px solid var(--border)',
    borderRadius: '8px 8px 0 0', marginBottom: -2,
    display: 'flex', alignItems: 'center', gap: 6,
  })

  return (
    <div className="page-wrapper">
      <div className="page-content">

        <div className="flex-between mb-16">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Admin panel</h1>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>
              {users.length} users · {activity.length} activity logs
            </div>
          </div>
          <button className="btn btn-lime" onClick={() => { setShowCreateForm(!showCreateForm); setTab('users') }}>
            {showCreateForm ? '✕ Cancel' : '+ Create user'}
          </button>
        </div>

        {/* CREATE USER FORM */}
        {showCreateForm && (
          <div className="card mb-16">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>+ Create new user</div>
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className={`form-input ${createErrors.name ? 'error' : ''}`}
                    placeholder="Full name" value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
                  {createErrors.name && <span className="field-error">{createErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className={`form-input ${createErrors.email ? 'error' : ''}`}
                    type="email" placeholder="email@example.com" value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
                  {createErrors.email && <span className="field-error">{createErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className={`form-input ${createErrors.password ? 'error' : ''}`}
                    type="password" placeholder="Min 6 characters" value={createForm.password}
                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
                  {createErrors.password && <span className="field-error">{createErrors.password}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={createForm.role}
                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-8 mt-16">
                <button className="btn btn-primary" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create user'}
                </button>
                <button className="btn btn-ghost" type="button"
                  onClick={() => { setShowCreateForm(false); setCreateForm(emptyCreate); setCreateErrors({}) }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', flexWrap: 'wrap' }}>
          <button style={tabStyle('users')} onClick={() => setTab('users')}>👥 Users</button>
          <button style={tabStyle('activity')} onClick={() => setTab('activity')}>📋 Activity log</button>
          {openTabs.map(t => (
            <button key={t.key} style={tabStyle(t.key)} onClick={() => {
              setTab(t.key)
              setSelectedUserId(t.user._id)
              if (t.type === 'profile') setProfileForm({ name: t.user.name, email: t.user.email, newPassword: '' })
            }}>
              {t.type === 'expenses' ? `💸 ${t.user.name}'s expenses` : `👤 ${t.user.name}'s profile`}
              <span onClick={e => { e.stopPropagation(); closeTab(t.key) }}
                style={{ marginLeft: 2, fontSize: 11, color: 'var(--mu)', cursor: 'pointer' }}>✕</span>
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No users yet</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Expenses</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="td-title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--violet)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>
                            {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-lime' : 'badge-violet'}`}>{u.role}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>{u.expenseCount}</td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn btn-sm btn-secondary" onClick={() => handleViewExpenses(u)}>View expenses</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'user' : 'admin')}>
                            {u.role === 'admin' ? 'Demote' : 'Make admin'}
                          </button>
                          <button className="btn-icon" onClick={() => handleEditUser(u)} title="Edit profile">✏️</button>
                          <button className="btn-icon" onClick={() => setDeleteTarget(u)} title="Delete user">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ACTIVITY TAB */}
        {tab === 'activity' && (
          activity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No activity yet</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>User</th><th>Action</th><th>Detail</th><th>Time</th></tr></thead>
                <tbody>
                  {activity.map(a => (
                    <tr key={a._id}>
                      <td className="td-title">{a.userId?.name || 'Unknown'}</td>
                      <td>{actionLabels[a.action] || a.action}</td>
                      <td style={{ color: 'var(--mu)' }}>{a.detail || '—'}</td>
                      <td style={{ color: 'var(--mu)' }}>{timeAgo(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* EXPENSES TAB — view only */}
        {currentTabData?.type === 'expenses' && (
          <>
            <div className="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--violet)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                {currentTabData.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{currentTabData.user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>
                  {currentTabData.user.email} · {currentTabData.expenses.length} expenses · {formatCurrency(currentTabData.expenses.reduce((s, e) => s + e.amount, 0))} total
                </div>
              </div>
            </div>
            {currentTabData.expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💸</div>
                <div className="empty-state-title">No expenses</div>
                <div className="empty-state-body">This user hasn't added any expenses yet.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Title</th><th>Date</th><th>Category</th><th>Payment</th><th>Amount</th></tr></thead>
                  <tbody>
                    {currentTabData.expenses.map(e => (
                      <tr key={e._id}>
                        <td className="td-title">{e.title}</td>
                        <td>{formatDate(e.date)}</td>
                        <td><span className={`cat-pill ${catColorMap[e.category] || 'cat-other'}`}>{e.category}</span></td>
                        <td>{e.paymentMethod || '—'}</td>
                        <td className="td-amount">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* PROFILE TAB */}
        {currentTabData?.type === 'profile' && (
          <div style={{ maxWidth: 560 }}>
            <div className="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--violet)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>
                {currentTabData.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{currentTabData.user.name}</div>
                <div style={{ fontSize: 13, color: 'var(--mu)' }}>{currentTabData.user.email}</div>
                <span className={`badge ${currentTabData.user.role === 'admin' ? 'badge-lime' : 'badge-violet'}`} style={{ marginTop: 6 }}>
                  {currentTabData.user.role}
                </span>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>✏️ Edit profile</div>
              <form onSubmit={handleSaveProfile}>
                <div className="form-group mb-12">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div className="form-group mb-12">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
                <div className="form-group mb-16">
                  <label className="form-label">New password <span style={{ color: 'var(--mu)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(leave blank to keep current)</span></label>
                  <input className="form-input" type="password" placeholder="Min 6 characters"
                    value={profileForm.newPassword}
                    onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })} />
                </div>
                <div className="flex gap-8">
                  <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save changes'}
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button"
                    onClick={() => handleRoleChange(currentTabData.user._id, currentTabData.user.role === 'admin' ? 'user' : 'admin')}>
                    {currentTabData.user.role === 'admin' ? '⬇ Demote to user' : '⬆ Promote to admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* DELETE USER MODAL */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete "{deleteTarget.name}"?</div>
            <div className="modal-body">This will permanently delete the user and all their data.</div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteUser}>Delete user</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

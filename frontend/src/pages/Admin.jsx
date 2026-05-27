// Admin.jsx
// Admin-only panel for managing users, viewing activity logs,
// and inspecting individual user profiles and expenses.
// Uses a dynamic tab system where each user's profile or expenses
// opens as a closeable tab alongside the static Users and Activity tabs.

import { useState, useEffect } from 'react'
import api from '../api/index'

// Formats a number as Australian currency e.g. $1,234.56
function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Formats a date as a readable string e.g. "25 May 2026"
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Returns a human-readable relative time string for activity log entries.
// e.g. "just now", "5m ago", "2h ago", "3d ago"
function timeAgo(d) {
  const diff = Math.floor((new Date() - new Date(d)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Maps backend action strings to human-readable labels with icons
// for display in the activity log table
const actionLabels = {
  login: '🔑 Logged in', register: '✨ Registered', logout: '👋 Logged out',
  add_expense: '➕ Added expense', edit_expense: '✏️ Edited expense',
  delete_expense: '🗑️ Deleted expense', update_budget: '💰 Updated budget',
}

// Default empty state for the create user form
const emptyCreate = { name: '', email: '', password: '', role: 'user' }

export default function Admin({ addToast }) {
  // All users and activity logs fetched from the admin API
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // The currently active tab key - either 'users', 'activity',
  // or a dynamic key like 'expenses-<userId>' or 'profile-<userId>'
  const [tab, setTab] = useState('users')

  // Array of dynamically opened tabs - each has a key, type, user, and expenses array.
  // useState is used here because the tab list changes when the admin
  // opens or closes user-specific tabs.
  const [openTabs, setOpenTabs] = useState([])

  // The user object targeted for deletion - null when no modal is open
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [createErrors, setCreateErrors] = useState({})
  const [creating, setCreating] = useState(false)

  // Profile editing state for the profile tab
  const [profileForm, setProfileForm] = useState({ name: '', email: '', newPassword: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Tracks which user's data is currently being viewed in a dynamic tab
  const [selectedUserId, setSelectedUserId] = useState(null)

  // Load all users and activity logs on mount
  useEffect(() => { loadData() }, [])

  // Fetches users and activity in parallel using Promise.all
  // to avoid sequential round trips to the backend
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

  // Opens a dynamic tab for a user's expenses or profile.
  // If a tab for this user+type already exists, it updates the data rather
  // than creating a duplicate. The key format 'type-userId' ensures uniqueness.
  const openTab = (type, user, expenses = []) => {
    const key = `${type}-${user._id}`
    setOpenTabs(prev => {
      const exists = prev.find(t => t.key === key)
      if (exists) return prev.map(t => t.key === key ? { ...t, expenses } : t)
      return [...prev, { key, type, user, expenses }]
    })
    setTab(key)
    setSelectedUserId(user._id)
    // Pre-populate the profile form when opening a profile tab
    if (type === 'profile') {
      setProfileForm({ name: user.name, email: user.email, newPassword: '' })
    }
  }

  // Removes a tab from the openTabs array and navigates back to the users tab
  const closeTab = (key) => {
    setOpenTabs(prev => prev.filter(t => t.key !== key))
    if (tab === key) setTab('users')
  }

  // Fetches a user's expenses from the API and opens them in a new tab
  const handleViewExpenses = async (user) => {
    try {
      const res = await api.get(`/admin/users/${user._id}/expenses`)
      openTab('expenses', res.data.user, res.data.expenses)
    } catch {
      addToast('Could not load expenses.', 'error')
    }
  }

  // Opens a profile tab for the given user
  const handleEditUser = (user) => {
    openTab('profile', user)
  }

  // Toggles a user's role between 'admin' and 'user'.
  // Also updates the role in any open tabs so the UI stays in sync
  // without needing a full page reload.
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole })
      addToast(`Role updated to ${newRole}! ✓`, 'success')
      // Update the role in any open tabs for this user
      setOpenTabs(prev => prev.map(t =>
        t.user._id === userId ? { ...t, user: { ...t.user, role: newRole } } : t
      ))
      loadData()
    } catch {
      addToast('Could not update role.', 'error')
    }
  }

  // Deletes a user and all their associated data.
  // Also closes any open tabs for this user and navigates back to the users tab.
  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`)
      addToast('User deleted.', 'success')
      // Remove all open tabs belonging to the deleted user
      setOpenTabs(prev => prev.filter(t => t.user._id !== deleteTarget._id))
      if (tab.includes(deleteTarget._id)) setTab('users')
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not delete user.', 'error')
    }
  }

  // Creates a new user account from the admin panel.
  // Validates client-side before submitting to avoid unnecessary API calls.
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

  // Saves changes to a user's name, email, and optionally their password.
  // Password update is only sent if the admin has typed a new password,
  // allowing name/email changes without resetting the password.
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const currentTab = openTabs.find(t => t.key === tab)
    if (!currentTab) return
    setSavingProfile(true)
    try {
      // Always update name and email
      await api.put(`/admin/users/${currentTab.user._id}`, {
        name: profileForm.name,
        email: profileForm.email,
      })
      // Only update password if the admin has entered a new one
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
      // Clear the password field after a successful save
      setProfileForm(prev => ({ ...prev, newPassword: '' }))
      // Update the user data in the open tab so the tab header reflects the new name
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

  // Show loading spinner while data is being fetched
  if (loading) return (
    <div className="page-wrapper">
      <div className="loading-page"><div className="spinner"></div></div>
    </div>
  )

  // Maps category names to CSS classes for coloured pills in the expenses tab
  const catColorMap = {
    Food: 'cat-food', Transport: 'cat-transport', Shopping: 'cat-shopping',
    Bills: 'cat-bills', Entertainment: 'cat-entertainment', Health: 'cat-health', Other: 'cat-other'
  }

  // The data for whichever dynamic tab is currently active (expenses or profile)
  const currentTabData = openTabs.find(t => t.key === tab)

  // Returns inline style for a tab button based on whether it is active.
  // The active tab inverts its colours (dark background, light text) to indicate selection.
  // document.body.classList.contains('dark') is checked to use the correct
  // text colour in dark mode, since CSS variables cannot be read directly in JS.
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

        {/* CREATE USER FORM - conditionally rendered when showCreateForm is true */}
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

        {/* TAB BAR - static tabs (Users, Activity) plus any dynamically opened user tabs.
            Dynamic tabs have a close button that removes them from openTabs.
            stopPropagation prevents the close click from also activating the tab. */}
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

        {/* USERS TAB - table of all registered users with management actions */}
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
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Expenses</th><th>Actions</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="td-title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* Avatar showing the user's initials - max 2 characters */}
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
                      {/* whiteSpace: nowrap prevents action buttons from wrapping to a new line */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="flex gap-8">
                          <button className="btn btn-sm btn-secondary" onClick={() => handleViewExpenses(u)}>View expenses</button>
                          {/* Role toggle - label and action depend on the user's current role */}
                          <button className="btn btn-sm btn-ghost" onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'user' : 'admin')}>
                            {u.role === 'admin' ? 'Demote' : 'Make admin'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-8">
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

        {/* ACTIVITY TAB - chronological log of all user actions across the platform */}
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
                      {/* Optional chaining handles cases where the user has been deleted
                          but their activity logs still exist */}
                      <td className="td-title">{a.userId?.name || 'Unknown'}</td>
                      <td>{actionLabels[a.action] || a.action}</td>
                      <td style={{ color: 'var(--mu)' }}>{a.detail || '-'}</td>
                      <td style={{ color: 'var(--mu)' }}>{timeAgo(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* EXPENSES TAB - read-only view of a specific user's expenses.
            currentTabData is looked up from openTabs using the active tab key. */}
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
                        <td>{e.paymentMethod || '-'}</td>
                        <td className="td-amount">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* PROFILE TAB - allows the admin to edit a user's name, email, and password */}
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
                    {currentTabData.user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* DELETE USER MODAL - clicking the overlay dismisses it without deleting */}
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
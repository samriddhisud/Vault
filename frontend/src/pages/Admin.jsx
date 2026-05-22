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
  login: '🔑 Logged in',
  register: '✨ Registered',
  logout: '👋 Logged out',
  add_expense: '➕ Added expense',
  edit_expense: '✏️ Edited expense',
  delete_expense: '🗑️ Deleted expense',
  update_budget: '💰 Updated budget',
}

export default function Admin({ addToast }) {
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userExpenses, setUserExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

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

  const handleViewExpenses = async (user) => {
    try {
      const res = await api.get(`/admin/users/${user._id}/expenses`)
      setSelectedUser(res.data.user)
      setUserExpenses(res.data.expenses)
      setTab('userExpenses')
    } catch {
      addToast('Could not load user expenses.', 'error')
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole })
      addToast(`Role updated to ${newRole}! ✓`, 'success')
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
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not delete user.', 'error')
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

  return (
    <div className="page-wrapper">
      <div className="page-content">

        {/* HEADER */}
        <div className="flex-between mb-16">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Admin panel</h1>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>
              {users.length} users · {activity.length} activity logs
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
          {[
            { key: 'users', label: '👥 Users' },
            { key: 'activity', label: '📋 Activity log' },
            ...(selectedUser ? [{ key: 'userExpenses', label: `💸 ${selectedUser.name}'s expenses` }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: tab === t.key ? 'var(--tx)' : 'transparent',
                color: tab === t.key ? (document.body.classList.contains('dark') ? '#0d0d0d' : '#fff') : 'var(--mu)',
                border: '2px solid var(--border)',
                borderBottom: tab === t.key ? '2px solid var(--tx)' : '2px solid var(--border)',
                borderRadius: '8px 8px 0 0',
                marginBottom: -2,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <>
            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">No users yet</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Expenses</th>
                      <th>Actions</th>
                    </tr>
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
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-lime' : 'badge-violet'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>{u.expenseCount}</td>
                        <td>
                          <div className="flex gap-8">
                            <button className="btn btn-sm btn-secondary" onClick={() => handleViewExpenses(u)}>
                              View expenses
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'user' : 'admin')}>
                              {u.role === 'admin' ? 'Demote' : 'Make admin'}
                            </button>
                            <button className="btn-icon" onClick={() => setDeleteTarget(u)} title="Delete user">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ACTIVITY TAB */}
        {tab === 'activity' && (
          <>
            {activity.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No activity yet</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                      <th>Detail</th>
                      <th>Time</th>
                    </tr>
                  </thead>
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
            )}
          </>
        )}

        {/* USER EXPENSES TAB */}
        {tab === 'userExpenses' && selectedUser && (
          <>
            <div className="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--violet)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedUser.name}</div>
                <div style={{ fontSize: 12, color: 'var(--mu)' }}>{selectedUser.email} · {userExpenses.length} expenses · {formatCurrency(userExpenses.reduce((s, e) => s + e.amount, 0))} total</div>
              </div>
            </div>
            {userExpenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💸</div>
                <div className="empty-state-title">No expenses</div>
                <div className="empty-state-body">This user hasn't added any expenses yet.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Date</th><th>Category</th><th>Payment</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {userExpenses.map(e => (
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
      </div>

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete "{deleteTarget.name}"?</div>
            <div className="modal-body">This will permanently delete the user and all their expenses and activity. This cannot be undone.</div>
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

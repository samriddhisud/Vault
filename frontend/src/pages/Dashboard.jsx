import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index'

function getGreeting(name) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${name.split(' ')[0]}! 👋`
}

function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getCurrentMonthExpenses(expenses) {
  const now = new Date()
  return expenses.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
}

function getBudgetStatus(pct) {
  if (pct >= 100) return 'danger'
  if (pct >= 80) return 'warning'
  return ''
}

export default function Dashboard({ addToast }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [expRes, budRes] = await Promise.all([
          api.get('/expenses'),
          api.get('/budget'),
        ])
        setExpenses(expRes.data)
        setBudget(budRes.data)
      } catch {
        addToast('Could not load dashboard data.', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="page-wrapper">
      <div className="loading-page"><div className="spinner"></div></div>
    </div>
  )

  const monthExpenses = getCurrentMonthExpenses(expenses)
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const daysPassed = new Date().getDate()
  const dailyAvg = totalSpent / daysPassed
  const budgetPct = budget ? Math.round((totalSpent / budget.monthlyBudget) * 100) : 0
  const remaining = budget ? budget.monthlyBudget - totalSpent : null
  const budgetStatus = getBudgetStatus(budgetPct)

  const categoryTotals = {}
  monthExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })
  const topCategory = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0]

  const recentExpenses = [...expenses].slice(0, 5)

  const catColorMap = {
    Food: 'cat-food', Transport: 'cat-transport', Shopping: 'cat-shopping',
    Bills: 'cat-bills', Entertainment: 'cat-entertainment', Health: 'cat-health', Other: 'cat-other'
  }

  return (
    <div className="page-wrapper">

      {/* Budget warning banner */}
      {budgetStatus === 'danger' && (
        <div style={{ background: 'var(--red)', color: '#fff', padding: '10px 40px', fontSize: 13, fontWeight: 700, borderBottom: '2px solid var(--border)' }}>
          ⚠️ You've exceeded your monthly budget!
        </div>
      )}
      {budgetStatus === 'warning' && (
        <div style={{ background: 'var(--amber)', color: '#1a1a1a', padding: '10px 40px', fontSize: 13, fontWeight: 700, borderBottom: '2px solid var(--border)' }}>
          ⚠️ You've used {budgetPct}% of your monthly budget — slow down!
        </div>
      )}

      {/* HERO */}
      <div className="hero">
        <div>
          <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 8 }}>{getGreeting(user.name)}</div>
          <div className="hero-h1">
            You've spent<br />
            <span className="hero-highlight">{formatCurrency(totalSpent)}</span><br />
            this month.
          </div>
          <div className="hero-sub">
            {budget
              ? `${formatCurrency(remaining > 0 ? remaining : 0)} remaining from your ${formatCurrency(budget.monthlyBudget)} budget — ${budgetPct}% used.`
              : 'No budget set yet — go to Profile to set one.'}
            {' '}Daily average {formatCurrency(dailyAvg)}.
          </div>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/expenses')}>
              + Add expense
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
              View reports →
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-val">{monthExpenses.length}</div>
              <div className="hero-stat-lbl">Transactions</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{topCategory || '—'}</div>
              <div className="hero-stat-lbl">Top category</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{formatCurrency(dailyAvg)}</div>
              <div className="hero-stat-lbl">Daily avg</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{budget ? `${budgetPct}%` : '—'}</div>
              <div className="hero-stat-lbl">Budget used</div>
            </div>
          </div>
        </div>

        {/* Hero right cards */}
        <div className="hero-cards">
          <div className="card">
            <div className="flex-between mb-8">
              <span className="form-label">Spent this month</span>
              <span className={`badge ${budgetStatus === 'danger' ? 'badge-red' : budgetStatus === 'warning' ? 'badge-amber' : 'badge-lime'}`}>
                {budgetStatus === 'danger' ? 'Over budget!' : budgetStatus === 'warning' ? `${budgetPct}% used` : 'On track'}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: 'var(--tx)' }}>
              {formatCurrency(totalSpent)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--mu)', marginTop: 4 }}>
              {monthExpenses.length} transactions this month
            </div>
          </div>

          <div className="card">
            <div className="flex-between mb-8">
              <span className="form-label">Monthly budget</span>
              <span className="badge badge-violet">{budget ? formatCurrency(budget.monthlyBudget) : 'Not set'}</span>
            </div>
            {budget ? (
              <>
                <div className="progress-track mt-8">
                  <div className={`progress-fill ${budgetStatus}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                </div>
                <div className="flex-between mt-8">
                  <span style={{ fontSize: 12, color: 'var(--mu)' }}>{formatCurrency(totalSpent)} used</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)' }}>{formatCurrency(Math.max(remaining, 0))} left</span>
                </div>
              </>
            ) : (
              <button className="btn btn-sm btn-secondary mt-8" onClick={() => navigate('/profile')}>
                Set budget →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEATURE STRIP */}
      <div className="feat-strip">
        {[
          { icon: '📊', title: 'Spending trends', sub: 'Charts, 12-month range', to: '/reports' },
          { icon: '🔒', title: 'Secure & private', sub: 'JWT auth, per-user data', to: null },
          { icon: '🧮', title: 'Smart tracking', sub: 'Categories & filters', to: '/expenses' },
          { icon: '👥', title: 'Admin dashboard', sub: 'Manage all accounts', to: user?.role === 'admin' ? '/admin' : null },
        ].map((f, i) => (
          <div key={i} className="feat-item" style={{ cursor: f.to ? 'pointer' : 'default' }} onClick={() => f.to && navigate(f.to)}>
            <div className="feat-icon">{f.icon}</div>
            <div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-sub">{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="main-grid">
        <div className="main-col">
          <div className="section-label">Recent expenses</div>
          {recentExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-title">No expenses yet</div>
              <div className="empty-state-body">Add your first expense to start tracking.</div>
              <button className="btn btn-primary mt-12" onClick={() => navigate('/expenses')}>
                + Add expense
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map(e => (
                    <tr key={e._id}>
                      <td className="td-title">{e.title}</td>
                      <td>{new Date(e.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</td>
                      <td><span className={`cat-pill ${catColorMap[e.category] || 'cat-other'}`}>{e.category}</span></td>
                      <td className="td-amount">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button className="btn btn-ghost btn-sm mt-12" onClick={() => navigate('/expenses')}>
            View all expenses →
          </button>
        </div>

        {/* SIDEBAR */}
        <div className="side-col">
          <div className="card-flat">
            <div className="flex-between mb-12">
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>By category</span>
              <span style={{ fontSize: 11, color: 'var(--mu)' }}>This month</span>
            </div>
            {Object.keys(categoryTotals).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--mu)' }}>No data yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(categoryTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, border: '1.5px solid var(--border)', background: `var(--cat-${cat.toLowerCase()})`, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--mu)', flex: 1 }}>{cat}</span>
                      <div style={{ flex: 2, height: 5, borderRadius: 999, background: 'var(--cream2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: `var(--cat-${cat.toLowerCase()})`, width: `${(amt / totalSpent) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)', minWidth: 55, textAlign: 'right' }}>{formatCurrency(amt)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="bottom-row">
        {[
          { icon: '📈', color: 'var(--lime)', title: 'Spending trends', body: 'Bar chart and category breakdown across 3, 6 or 12 months.', label: 'View charts', to: '/reports' },
          { icon: '👥', color: 'var(--violet)', title: 'Admin panel', body: 'View all users, their expenses, and activity logs.', label: 'Open admin', to: '/admin' },
          { icon: '👤', color: 'var(--pink)', title: 'Your profile', body: 'Update your name, email, password and monthly budget.', label: 'Edit profile', to: '/profile' },
        ].map((c, i) => (
          <div key={i} className="bottom-card">
            <div className="bottom-card-icon" style={{ background: c.color }}>{c.icon}</div>
            <div className="bottom-card-title">{c.title}</div>
            <div className="bottom-card-body">{c.body}</div>
            <button className="bottom-card-link" onClick={() => navigate(c.to)}>{c.label} →</button>
          </div>
        ))}
      </div>
    </div>
  )
}

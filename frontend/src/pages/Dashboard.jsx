// Dashboard.jsx
// The main landing page after login. Shows a summary of the user's spending,
// budget status, recent expenses, category breakdown, and quick navigation cards.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index'

// Returns a time-appropriate greeting using the user's first name only
function getGreeting(name) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${name.split(' ')[0]}! 👋`
}

// Formats a number as Australian currency e.g. $1,234.56
function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Filters the full expense list down to only the current calendar month.
// Used to calculate monthly totals, daily averages, and category breakdowns.
function getCurrentMonthExpenses(expenses) {
  const now = new Date()
  return expenses.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
}

// Returns a CSS class string based on how much of the budget has been used.
// Used to colour the progress bar and trigger warning banners.
// danger >= 100%, warning >= 80%, empty string = on track
function getBudgetStatus(pct) {
  if (pct >= 100) return 'danger'
  if (pct >= 80) return 'warning'
  return ''
}

export default function Dashboard({ addToast }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  // useState is used for expenses and budget because they are async data
  // that arrives after the component mounts. When they update, React re-renders
  // the component with the new values automatically.
  const [expenses, setExpenses] = useState([])
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch both expenses and budget in parallel on mount.
  // Promise.all fires both requests simultaneously rather than sequentially,
  // halving the wait time compared to two separate awaits.
  // Empty dependency array means this only runs once when the component mounts.
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
        // Always hide the loading spinner regardless of success or failure
        setLoading(false)
      }
    }
    load()
  }, [])

  // Show loading spinner while data is being fetched
  if (loading) return (
    <div className="page-wrapper">
      <div className="loading-page"><div className="spinner"></div></div>
    </div>
  )

  // --- Derived values calculated from fetched data ---

  // Filter expenses to current month only for all dashboard calculations
  const monthExpenses = getCurrentMonthExpenses(expenses)

  // Total amount spent in the current month
  const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0)

  // Daily average = total spent divided by the current day of the month
  // e.g. on the 10th, divide total by 10
  const daysPassed = new Date().getDate()
  const dailyAvg = totalSpent / daysPassed

  // Budget percentage used, rounded to nearest integer
  // Defaults to 0 if no budget has been set
  const budgetPct = budget ? Math.round((totalSpent / budget.monthlyBudget) * 100) : 0

  // Remaining budget (can be negative if over budget)
  const remaining = budget ? budget.monthlyBudget - totalSpent : null

  // CSS class string for the progress bar colour ('danger', 'warning', or '')
  const budgetStatus = getBudgetStatus(budgetPct)

  // Build a map of category name to total amount spent this month.
  // e.g. { Food: 120.50, Transport: 45.00 }
  const categoryTotals = {}
  monthExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })

  // The category with the highest total spending this month
  const topCategory = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0]

  // Show the 6 most recent expenses across all time (not just this month)
  const recentExpenses = [...expenses].slice(0, 6)

  // Maps category names to their CSS class for coloured pills
  const catColorMap = {
    Food: 'cat-food', Transport: 'cat-transport', Shopping: 'cat-shopping',
    Bills: 'cat-bills', Entertainment: 'cat-entertainment', Health: 'cat-health', Other: 'cat-other'
  }

  return (
    <div className="page-wrapper">

      {/* Budget warning banners - shown at the top of the page when
          the user is approaching (80%+) or has exceeded (100%+) their budget */}
      {budgetStatus === 'danger' && (
        <div style={{ background: 'var(--red)', color: '#fff', padding: '10px 40px', fontSize: 13, fontWeight: 700, borderBottom: '2px solid var(--border)' }}>
          You've exceeded your monthly budget!
        </div>
      )}
      {budgetStatus === 'warning' && (
        <div style={{ background: 'var(--amber)', color: '#1a1a1a', padding: '10px 40px', fontSize: 13, fontWeight: 700, borderBottom: '2px solid var(--border)' }}>
          You've used {budgetPct}% of your monthly budget - slow down!
        </div>
      )}

      {/* HERO - large spending summary with greeting and quick action buttons */}
      {/* gridTemplateColumns: '1fr' overrides the default two-column hero layout
          since the budget card was moved to the sidebar */}
      <div className="hero" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--mu)', marginBottom: 8 }}>{getGreeting(user.name)}</div>
          <div className="hero-h1">
            You've spent<br />
            <span className="hero-highlight">{formatCurrency(totalSpent)}</span><br />
            this month.
          </div>
          <div className="hero-sub">
            {budget
              ? `${formatCurrency(remaining > 0 ? remaining : 0)} remaining from your ${formatCurrency(budget.monthlyBudget)} budget - ${budgetPct}% used.`
              : 'No budget set yet - go to Profile to set one.'}
            {' '}Daily average {formatCurrency(dailyAvg)}.
          </div>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/expenses')}>
              + Add expense
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
              View reports
            </button>
          </div>

          {/* 4-stat summary bar - rendered from an array to keep JSX clean.
              Each stat shows a value and a label in a bordered grid cell. */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginTop: 32,
            border: '2px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--surface)',
          }}>
            {[
              { val: monthExpenses.length, lbl: 'Transactions' },
              { val: topCategory || '-', lbl: 'Top category' },
              { val: formatCurrency(dailyAvg), lbl: 'Daily avg' },
              { val: budget ? `${budgetPct}%` : '-', lbl: 'Budget used' },
            ].map((s, i, arr) => (
              <div key={i} style={{
                padding: '13px 16px',
                // Add right border to all cells except the last one
                borderRight: i < arr.length - 1 ? '2px solid var(--border)' : 'none',
              }}>
                <div className="hero-stat-val">{s.val}</div>
                <div className="hero-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN GRID - two-column layout with recent expenses on the left
          and budget + category breakdown sidebar on the right */}
      <div className="main-grid">
        <div className="main-col">
          <div className="section-label">Recent expenses</div>
          {recentExpenses.length === 0 ? (
            // Empty state shown when the user has no expenses at all
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
            View all expenses
          </button>
        </div>

        {/* SIDEBAR */}
        <div className="side-col">

          {/* Monthly budget card - shows progress bar with colour-coded status.
              Math.min(budgetPct, 100) prevents the bar from overflowing its container
              when spending exceeds 100% of the budget. */}
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
                Set budget
              </button>
            )}
          </div>

          {/* Category breakdown card - shows a proportional bar for each category.
              Bar width = (category amount / total spent) * 100%
              Categories are sorted by amount descending so the largest is always first. */}
          <div className="card">
            <div className="flex-between mb-12">
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>By category</span>
              <span style={{ fontSize: 12, color: 'var(--mu)' }}>This month</span>
            </div>
            {Object.keys(categoryTotals).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--mu)' }}>No data yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(categoryTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {/* Small colour swatch matching the category's design token */}
                          <div style={{ width: 9, height: 9, borderRadius: 2, border: '1.5px solid var(--border)', background: `var(--cat-${cat.toLowerCase()})`, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--mu)' }}>{cat}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>{formatCurrency(amt)}</span>
                      </div>
                      {/* Proportional bar - width represents share of total monthly spending */}
                      <div style={{ height: 7, borderRadius: 999, background: 'var(--cream2)', border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: `var(--cat-${cat.toLowerCase()})`, width: `${(amt / totalSpent) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW - three quick navigation cards rendered from an array.
          Each card links to a key section of the app. */}
      <div className="bottom-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { icon: '📈', color: 'var(--lime)', title: 'Spending trends', body: 'Bar chart and category breakdown across 3, 6 or 12 months.', label: 'View charts', to: '/reports' },
          { icon: '💸', color: 'var(--violet)', title: 'Track expenses', body: 'Add, edit and delete expenses. Filter by category, search and export to CSV.', label: 'Go to expenses', to: '/expenses' },
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
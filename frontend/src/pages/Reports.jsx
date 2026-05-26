import { useState, useEffect, useRef } from 'react'
import api from '../api/index'
import Chart from 'chart.js/auto'

const catColorMap = {
  Food: '#c8ff3e', Transport: '#4dc8ff', Shopping: '#b49dff',
  Bills: '#ffb83e', Entertainment: '#ff9ec4', Health: '#4caf7d', Other: '#d0d0d0'
}

function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getMonthKey(d) {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthKey(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

export default function Reports({ addToast }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [barRange, setBarRange] = useState(6)
  const [pieMonth, setPieMonth] = useState('')
  const barRef = useRef(null)
  const pieRef = useRef(null)
  const barChart = useRef(null)
  const pieChart = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    api.get('/expenses')
      .then(res => { setExpenses(res.data); setLoading(false) })
      .catch(() => { addToast('Could not load expenses.', 'error'); setLoading(false) })
  }, [])

  const availableMonths = [...new Set(expenses.map(e => getMonthKey(e.date)))].sort((a, b) => b.localeCompare(a))

  useEffect(() => {
    if (availableMonths.length && !pieMonth) setPieMonth(availableMonths[0])
  }, [expenses])

  useEffect(() => {
    if (loading || !barRef.current) return
    if (barChart.current) { barChart.current.destroy(); barChart.current = null }

    const now = new Date()
    const labels = []
    const totals = []

    for (let i = barRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      labels.push(formatMonthKey(key))
      totals.push(expenses.filter(e => getMonthKey(e.date) === key).reduce((s, e) => s + e.amount, 0))
    }

    const isDark = document.body.classList.contains('dark')
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Spending',
          data: totals,
          backgroundColor: isDark ? 'rgba(200,255,62,0.7)' : 'rgba(180,157,255,0.85)',
borderColor: isDark ? '#c8ff3e' : '#b49dff',
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.parsed.y)}` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? '#888' : '#666' } },
          y: { beginAtZero: true, ticks: { color: isDark ? '#888' : '#666', callback: v => `$${v}` } }
        }
      }
    })

    return () => { if (barChart.current) { barChart.current.destroy(); barChart.current = null } }
  }, [expenses, barRange, loading])

  useEffect(() => {
    if (loading || !pieRef.current || !pieMonth) return
    if (pieChart.current) { pieChart.current.destroy(); pieChart.current = null }

    const monthExpenses = expenses.filter(e => getMonthKey(e.date) === pieMonth)
    const totals = {}
    monthExpenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount })
    if (!Object.keys(totals).length) return

    const isDark = document.body.classList.contains('dark')
    pieChart.current = new Chart(pieRef.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(totals),
        datasets: [{
          data: Object.values(totals),
          backgroundColor: Object.keys(totals).map(c => catColorMap[c] || '#d0d0d0'),
          borderColor: isDark ? '#1c1c1c' : '#fff',
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '52%',
        plugins: {
          legend: { position: 'bottom', labels: { color: isDark ? '#888' : '#666', padding: 12, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.parsed)}` } }
        }
      }
    })

    return () => { if (pieChart.current) { pieChart.current.destroy(); pieChart.current = null } }
  }, [expenses, pieMonth, loading])

  if (loading) return <div className="page-wrapper"><div className="loading-page"><div className="spinner"></div></div></div>

  const monthExpenses = expenses.filter(e => getMonthKey(e.date) === pieMonth)
  const catTotals = {}
  monthExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })
  const totalForMonth = Object.values(catTotals).reduce((s, v) => s + v, 0)

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="mb-16">
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Reports</h1>
          <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>Visualise your spending patterns over time.</div>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No data yet</div>
            <div className="empty-state-body">Add some expenses to see your spending charts.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="card-flat">
                <div className="flex-between mb-12">
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Monthly expenditure</span>
                  <div className="filter-chip">
                    <select value={barRange} onChange={e => setBarRange(Number(e.target.value))}>
                      <option value={3}>Last 3 months</option>
                      <option value={6}>Last 6 months</option>
                      <option value={12}>Last 12 months</option>
                    </select>
                  </div>
                </div>
                <div style={{ height: 220 }}><canvas ref={barRef} /></div>
              </div>

              <div className="card-flat">
                <div className="flex-between mb-12">
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Category breakdown</span>
                  <div className="filter-chip">
                    <select value={pieMonth} onChange={e => setPieMonth(e.target.value)}>
                      {availableMonths.map(m => <option key={m} value={m}>{formatMonthKey(m)}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ height: 220 }}>
                  {Object.keys(catTotals).length === 0
                    ? <div className="empty-state"><div className="empty-state-body">No data for this month.</div></div>
                    : <canvas ref={pieRef} />
                  }
                </div>
              </div>
            </div>

            <div className="section-label">Category breakdown — {pieMonth ? formatMonthKey(pieMonth) : ''}</div>
            {Object.keys(catTotals).length === 0 ? (
              <div className="empty-state"><div className="empty-state-body">No expenses for this month.</div></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} className="card-flat" style={{ borderTop: `3px solid ${catColorMap[cat] || '#d0d0d0'}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8 }}>{cat}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)', letterSpacing: -0.5 }}>{formatCurrency(amt)}</div>
                    <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 4 }}>{Math.round((amt / totalForMonth) * 100)}% of total</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

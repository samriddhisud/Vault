// Reports.jsx
// Displays two Chart.js visualisations: a bar chart of monthly spending trends
// and a doughnut chart of category breakdown for a selected month.
// Also shows category breakdown cards below the charts.

import { useState, useEffect, useRef } from 'react'
import api from '../api/index'
import Chart from 'chart.js/auto'

// Maps category names to their hex colour values for the doughnut chart.
// These match the CSS design tokens defined in index.css.
const catColorMap = {
  Food: '#c8ff3e', Transport: '#4dc8ff', Shopping: '#b49dff',
  Bills: '#ffb83e', Entertainment: '#ff9ec4', Health: '#4caf7d', Other: '#d0d0d0'
}

// Formats a number as Australian currency e.g. $1,234.56
function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Converts a date string to a YYYY-MM key for grouping expenses by month
// e.g. "2026-05-15" -> "2026-05"
function getMonthKey(d) {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Converts a YYYY-MM key to a short readable label for chart axes
// e.g. "2026-05" -> "May 26"
function formatMonthKey(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

export default function Reports({ addToast }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  // Number of months to show in the bar chart (3, 6, or 12)
  const [barRange, setBarRange] = useState(6)

  // The selected month key for the doughnut chart e.g. "2026-05"
  const [pieMonth, setPieMonth] = useState('')

  // Refs to the canvas DOM elements that Chart.js renders into.
  // useRef is used instead of useState because updating a ref does not
  // trigger a re-render, which is correct here since the canvas elements
  // are managed entirely by Chart.js, not by React.
  const barRef = useRef(null)
  const pieRef = useRef(null)

  // Refs to the Chart.js instances so they can be destroyed before
  // recreating them when dependencies change.
  // These must be refs, not state, because destroying/recreating charts
  // should not trigger a React re-render.
  const barChart = useRef(null)
  const pieChart = useRef(null)

  // Guard ref to prevent the data-fetching useEffect from running twice.
  // React 19 in development mode intentionally runs effects twice to detect
  // side effects. Without this guard, two chart instances would be created
  // on the same canvas element, causing visual glitches.
  const initialized = useRef(false)

  // Fetch expenses once on mount, guarded by the initialized ref.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    api.get('/expenses')
      .then(res => { setExpenses(res.data); setLoading(false) })
      .catch(() => { addToast('Could not load expenses.', 'error'); setLoading(false) })
  }, [])

  // Derive the sorted list of unique months that have at least one expense.
  // Used to populate the month selector dropdown for the doughnut chart.
  // Set is used to deduplicate months before sorting in descending order.
  const availableMonths = [...new Set(expenses.map(e => getMonthKey(e.date)))].sort((a, b) => b.localeCompare(a))

  // Set the default selected month to the most recent month with data
  // once expenses have loaded. Only runs when expenses change.
  useEffect(() => {
    if (availableMonths.length && !pieMonth) setPieMonth(availableMonths[0])
  }, [expenses])

  // Build and render the bar chart whenever expenses, barRange, or loading changes.
  // The chart is destroyed before recreating it to prevent Chart.js
  // from rendering a second chart on top of the existing one.
  // The cleanup function in the return also destroys the chart when
  // the component unmounts to prevent memory leaks.
  useEffect(() => {
    if (loading || !barRef.current) return
    if (barChart.current) { barChart.current.destroy(); barChart.current = null }

    const now = new Date()
    const labels = []
    const totals = []

    // Build one data point per month going back barRange months from today
    for (let i = barRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      labels.push(formatMonthKey(key))
      totals.push(expenses.filter(e => getMonthKey(e.date) === key).reduce((s, e) => s + e.amount, 0))
    }

    // Check dark mode at render time to apply the correct colours.
    // Chart.js does not respond to CSS variables, so colours must be
    // read from the DOM and passed as explicit config values.
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
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.parsed.y)}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: isDark ? '#888' : '#666' } },
          y: { beginAtZero: true, ticks: { color: isDark ? '#888' : '#666', callback: v => `$${v}` } }
        }
      }
    })

    return () => { if (barChart.current) { barChart.current.destroy(); barChart.current = null } }
  }, [expenses, barRange, loading])

  // Build and render the doughnut chart whenever the selected month changes.
  // Same destroy-before-recreate pattern as the bar chart.
  useEffect(() => {
    if (loading || !pieRef.current || !pieMonth) return
    if (pieChart.current) { pieChart.current.destroy(); pieChart.current = null }

    // Aggregate spending by category for the selected month
    const monthExpenses = expenses.filter(e => getMonthKey(e.date) === pieMonth)
    const totals = {}
    monthExpenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount })

    // Don't render the chart if there is no data for the selected month
    if (!Object.keys(totals).length) return

    const isDark = document.body.classList.contains('dark')
    pieChart.current = new Chart(pieRef.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(totals),
        datasets: [{
          data: Object.values(totals),
          // Map each category to its designated colour from catColorMap
          backgroundColor: Object.keys(totals).map(c => catColorMap[c] || '#d0d0d0'),
          borderColor: isDark ? '#1c1c1c' : '#fff',
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        // cutout controls the size of the hole in the doughnut
        cutout: '52%',
        plugins: {
          legend: { position: 'bottom', labels: { color: isDark ? '#888' : '#666', padding: 12, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${formatCurrency(ctx.parsed)}` } }
        }
      }
    })

    return () => { if (pieChart.current) { pieChart.current.destroy(); pieChart.current = null } }
  }, [expenses, pieMonth, loading])

  if (loading) return <div className="page-wrapper"><div className="loading-page"><div className="spinner"></div></div></div>

  // Aggregate category totals for the selected month (used for the cards below the charts)
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

        {/* Empty state shown when the user has no expenses at all */}
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No data yet</div>
            <div className="empty-state-body">Add some expenses to see your spending charts.</div>
          </div>
        ) : (
          <>
            {/* Two-column chart grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

              {/* BAR CHART - monthly spending trend */}
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
                {/* Fixed height container required for Chart.js responsive sizing */}
                <div style={{ height: 220 }}><canvas ref={barRef} /></div>
              </div>

              {/* DOUGHNUT CHART - category breakdown for selected month */}
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

            {/* CATEGORY BREAKDOWN CARDS - one card per category sorted by amount descending.
                Border top colour matches the category's colour in the doughnut chart. */}
            <div className="section-label">Category breakdown - {pieMonth ? formatMonthKey(pieMonth) : ''}</div>
            {Object.keys(catTotals).length === 0 ? (
              <div className="empty-state"><div className="empty-state-body">No expenses for this month.</div></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <div key={cat} className="card-flat" style={{ borderTop: `3px solid ${catColorMap[cat] || '#d0d0d0'}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 8 }}>{cat}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)', letterSpacing: -0.5 }}>{formatCurrency(amt)}</div>
                    {/* Percentage is calculated relative to total spending for the selected month */}
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
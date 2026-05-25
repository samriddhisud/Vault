import { useState, useEffect, useMemo } from 'react'
import api from '../api/index'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
const PAYMENT_METHODS = ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Digital Wallet', 'Other']

const catColorMap = {
  Food: 'cat-food', Transport: 'cat-transport', Shopping: 'cat-shopping',
  Bills: 'cat-bills', Entertainment: 'cat-entertainment', Health: 'cat-health', Other: 'cat-other'
}

function formatCurrency(n) {
  return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function relativeDate(d) {
  const diff = Math.floor((new Date() - new Date(d)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return formatDate(d)
}

const empty = { title: '', date: '', category: '', description: '', paymentMethod: '', amount: '' }

export default function Expenses({ addToast }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('month')
  const [sortBy, setSortBy] = useState('newest')
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Bulk delete state
  const [bulkMode, setBulkMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { loadExpenses() }, [])

  const loadExpenses = async () => {
    try {
      const res = await api.get('/expenses')
      setExpenses(res.data)
    } catch {
      addToast('Could not load expenses.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    let list = [...expenses]
    const now = new Date()

    if (filterPeriod === 'week') {
      const start = new Date(now)
      const day = start.getDay()
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
      start.setHours(0, 0, 0, 0)
      list = list.filter(e => new Date(e.date) >= start)
    } else if (filterPeriod === 'month') {
      list = list.filter(e => {
        const d = new Date(e.date)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (e.paymentMethod || '').toLowerCase().includes(q)
      )
    }

    if (sortBy === 'newest') list.sort((a, b) => new Date(b.date) - new Date(a.date))
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.date) - new Date(b.date))
    else if (sortBy === 'highest') list.sort((a, b) => b.amount - a.amount)
    else if (sortBy === 'lowest') list.sort((a, b) => a.amount - b.amount)

    return list
  }, [expenses, search, filterPeriod, sortBy])

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0)

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required.'
    if (!form.date) e.date = 'Date is required.'
    if (!form.category) e.category = 'Category is required.'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0.'
    if (form.date > today) e.date = 'Future dates are not allowed.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    const payload = { ...form, amount: parseFloat(form.amount) }
    try {
      if (editId) {
        await api.put(`/expenses/${editId}`, payload)
        addToast('Expense updated! ✓', 'success')
      } else {
        await api.post('/expenses', payload)
        addToast('Expense added! ✓', 'success')
      }
      setForm(empty)
      setEditId(null)
      setErrors({})
      setShowForm(false)
      loadExpenses()
    } catch (err) {
      addToast(err.response?.data?.error || 'Something went wrong.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (exp) => {
    setForm({
      title: exp.title,
      date: exp.date.substring(0, 10),
      category: exp.category,
      description: exp.description || '',
      paymentMethod: exp.paymentMethod || '',
      amount: exp.amount,
    })
    setEditId(exp._id)
    setErrors({})
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/expenses/${deleteTarget._id}`)
      addToast('Expense deleted.', 'success')
      setDeleteTarget(null)
      loadExpenses()
    } catch {
      addToast('Could not delete expense.', 'error')
    }
  }

  // Bulk delete handlers
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelected([])
  }

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([])
    } else {
      setSelected(filtered.map(e => e._id))
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await Promise.all(selected.map(id => api.delete(`/expenses/${id}`)))
      addToast(`${selected.length} expense${selected.length > 1 ? 's' : ''} deleted! ✓`, 'success')
      setSelected([])
      setBulkMode(false)
      setShowBulkConfirm(false)
      loadExpenses()
    } catch {
      addToast('Could not delete some expenses.', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Title', 'Date', 'Category', 'Description', 'Payment Method', 'Amount']
    const rows = filtered.map(e => [
      e.title, formatDate(e.date), e.category,
      e.description || '', e.paymentMethod || '', e.amount
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'vault-expenses.csv'; a.click()
    URL.revokeObjectURL(url)
    addToast('Exported to CSV! ✓', 'success')
  }

  if (loading) return (
    <div className="page-wrapper">
      <div className="loading-page"><div className="spinner"></div></div>
    </div>
  )

  const allSelected = filtered.length > 0 && selected.length === filtered.length
  const someSelected = selected.length > 0 && !allSelected

  return (
    <div className="page-wrapper">
      <div className="page-content">

        {/* HEADER */}
        <div className="flex-between mb-16">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Expenses</h1>
            <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>
              {filtered.length} expense{filtered.length !== 1 ? 's' : ''} · {formatCurrency(totalFiltered)} total
            </div>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
            <button
              className={`btn btn-sm ${bulkMode ? 'btn-danger' : 'btn-secondary'}`}
              onClick={toggleBulkMode}
            >
              {bulkMode ? '✕ Cancel' : '🗑 Delete expenses'}
            </button>
            <button className="btn btn-lime" onClick={() => { setForm(empty); setEditId(null); setErrors({}); setShowForm(!showForm) }}>
              {showForm ? '✕ Close form' : '+ Add expense'}
            </button>
          </div>
        </div>

        {/* ADD / EDIT FORM */}
        {showForm && (
          <div className="card mb-16">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              {editId ? '✏️ Edit expense' : '+ New expense'}
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className={`form-input ${errors.title ? 'error' : ''}`} placeholder="e.g. Grocery run"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  {errors.title && <span className="field-error">{errors.title}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" placeholder="0.00" min="0.01" step="0.01"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  {errors.amount && <span className="field-error">{errors.amount}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className={`form-input ${errors.category ? 'error' : ''}`}
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  {errors.category && <span className="field-error">{errors.category}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className={`form-input ${errors.date ? 'error' : ''}`} type="date" max={today}
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  {errors.date && <span className="field-error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Payment method</label>
                  <select className="form-input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="Optional note"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-8 mt-16">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editId ? 'Update expense' : 'Add expense'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => { setForm(empty); setEditId(null); setErrors({}); setShowForm(false) }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="search-input">
            <span>🔍</span>
            <input
              placeholder="Search title, category, description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mu)' }} onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="filter-chip">
            📅 <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
              <option value="all">All time</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
          <div className="filter-chip">
            ↕ <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </div>
        </div>

        {/* BULK SELECT BAR */}
        {bulkMode && filtered.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', marginBottom: 10,
            background: 'var(--cream)', border: '2px solid var(--border)',
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>
                {selected.length === 0 ? 'Select all' : `${selected.length} selected`}
              </span>
            </div>
            {selected.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowBulkConfirm(true)}>
                🗑 Delete {selected.length} expense{selected.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* TABLE */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{search ? '🔍' : '💸'}</div>
            <div className="empty-state-title">{search ? 'No results found' : 'No expenses yet'}</div>
            <div className="empty-state-body">{search ? `No expenses match "${search}"` : 'Add your first expense above.'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {bulkMode && <th style={{ width: 40 }}></th>}
                  <th>Title</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th>Description</th>
                  <th>Amount</th>
                  {!bulkMode && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e._id} style={{ background: selected.includes(e._id) ? 'var(--accent2)' : '' }}
                    onClick={() => bulkMode && toggleSelect(e._id)}>
                    {bulkMode && (
                      <td onClick={ev => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(e._id)}
                          onChange={() => toggleSelect(e._id)}
                          style={{ width: 15, height: 15, cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td className="td-title">{e.title}</td>
                    <td title={formatDate(e.date)}>{relativeDate(e.date)}</td>
                    <td><span className={`cat-pill ${catColorMap[e.category] || 'cat-other'}`}>{e.category}</span></td>
                    <td>{e.paymentMethod || '—'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '—'}</td>
                    <td className="td-amount">{formatCurrency(e.amount)}</td>
                    {!bulkMode && (
                      <td>
                        <div className="flex gap-8">
                          <button className="btn-icon" onClick={() => handleEdit(e)} title="Edit">✏️</button>
                          <button className="btn-icon" onClick={() => setDeleteTarget(e)} title="Delete">🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SINGLE DELETE MODAL */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete "{deleteTarget.title}"?</div>
            <div className="modal-body">This cannot be undone.</div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE MODAL */}
      {showBulkConfirm && (
        <div className="modal-overlay" onClick={() => setShowBulkConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete {selected.length} expense{selected.length > 1 ? 's' : ''}?</div>
            <div className="modal-body">This will permanently delete {selected.length} selected expense{selected.length > 1 ? 's' : ''}. This cannot be undone.</div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowBulkConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Deleting...' : `Delete ${selected.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Login.jsx
// Handles user authentication. Validates the form client-side,
// sends credentials to the backend, stores the returned JWT via AuthContext,
// and redirects to the dashboard on success.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index'

export default function Login({ addToast }) {
  // login() from AuthContext stores the user object and JWT in state and localStorage
  const { login } = useAuth()
  const navigate = useNavigate()

  // Form state - useState is used here because the two fields are simple
  // and independent, with no complex state transitions needed
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Client-side validation before sending the request.
  // Returns an object of field-level error messages.
  // An empty object means the form is valid.
  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required.'
    if (!form.password) e.password = 'Password is required.'
    return e
  }

  // Submits the login form to the backend.
  // On success, the backend returns the user object and JWT token.
  // login() is called to store both in context and localStorage,
  // then the user is redirected to the dashboard.
  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      // res.data contains { name, email, role, token }
      login(res.data)
      addToast(`Welcome back, ${res.data.name}! 👋`, 'success')
      navigate('/dashboard')
    } catch (err) {
      // Show the backend error message if available, otherwise a generic fallback
      addToast(err.response?.data?.error || 'Login failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="navbar-mark">🔒</div>
          <span className="navbar-name">Vault</span>
        </div>
        <h1 className="auth-title">Welcome back!</h1>
        <p className="auth-sub">Log in to track your spending.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className={`form-input ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input ${errors.password ? 'error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        {/* Link to register page for users without an account */}
        <div className="auth-switch">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
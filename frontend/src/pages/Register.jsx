// Register.jsx
// Handles new user registration. Validates the form client-side,
// sends the data to the backend where the password is hashed before storage,
// then auto-logs the user in and redirects to the dashboard.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index'

export default function Register({ addToast }) {
  // login() from AuthContext stores the returned user object and JWT
  // in both React state and localStorage
  const { login } = useAuth()
  const navigate = useNavigate()

  // Single form state object for all four fields.
  // useState is used rather than separate states for each field
  // because all fields are submitted together as one unit.
  // confirm is only used client-side for validation and is not sent to the backend.
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Client-side validation before sending the request.
  // Returns an object of field-level error messages.
  // Password length and match are checked here to avoid unnecessary API calls.
  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Name is required.'
    if (!form.email) e.email = 'Email is required.'
    if (!form.password) e.password = 'Password is required.'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    // Confirm password check is done client-side only - it never reaches the backend
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.'
    return e
  }

  // Submits the registration form to the backend.
  // Note: only name, email, and password are sent - confirm is excluded
  // since it is only needed for client-side validation.
  // On success, the backend returns the new user object and a JWT token.
  // login() is called to store both, then the user is redirected to the dashboard.
  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      // Auto-login after registration so the user doesn't have to log in separately
      login(res.data)
      addToast(`Account created! Welcome, ${res.data.name} 🎉`, 'success')
      navigate('/dashboard')
    } catch (err) {
      // The backend returns a specific error if the email is already in use
      addToast(err.response?.data?.error || 'Registration failed.', 'error')
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start tracking your spending today.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className={`form-input ${errors.name ? 'error' : ''}`}
              type="text"
              placeholder="Alex Johnson"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
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
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input
              className={`form-input ${errors.confirm ? 'error' : ''}`}
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        {/* Link to login page for users who already have an account */}
        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  )
}
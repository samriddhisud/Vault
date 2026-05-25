import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../api/index'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('vault_theme') === 'dark')

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('vault_theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const isAdmin = user?.role === 'admin'

  return (
    <nav className="navbar">
      <NavLink to={isAdmin ? '/admin' : '/dashboard'} className="navbar-brand">
        <div className="navbar-mark">🔒</div>
        <span className="navbar-name">Vault</span>
      </NavLink>

      <div className="navbar-links">
        {isAdmin ? (
          <NavLink to="/admin" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
            Admin
          </NavLink>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/expenses" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              Expenses
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              Reports
            </NavLink>
          </>
        )}
      </div>

      <div className="navbar-right">
        <button className="theme-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">
          {dark ? '☀️' : '🌙'}
        </button>
        {!isAdmin && (
          <NavLink to="/profile" className="navbar-avatar" title={user?.name}>
            {initials}
          </NavLink>
        )}
        {isAdmin && (
          <div className="navbar-avatar" title={user?.name}>
            {initials}
          </div>
        )}
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </nav>
  )
}

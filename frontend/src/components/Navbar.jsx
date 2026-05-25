import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../api/index'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dark, setDark] = useState(() => localStorage.getItem('vault_theme') === 'dark')
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location])

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
    <>
      <nav className="navbar">
        <NavLink to={isAdmin ? '/admin' : '/dashboard'} className="navbar-brand">
          <div className="navbar-mark">🔒</div>
          <span className="navbar-name">Vault</span>
        </NavLink>

        {/* Desktop links */}
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

        {/* Desktop right */}
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
            <div className="navbar-avatar" title={user?.name}>{initials}</div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`ham-line ${menuOpen ? 'open' : ''}`}></span>
        </button>
      </nav>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="mobile-menu">
          {isAdmin ? (
            <NavLink to="/admin" className="mobile-link">👥 Admin</NavLink>
          ) : (
            <>
              <NavLink to="/dashboard" className="mobile-link">🏠 Dashboard</NavLink>
              <NavLink to="/expenses" className="mobile-link">💸 Expenses</NavLink>
              <NavLink to="/reports" className="mobile-link">📊 Reports</NavLink>
              <NavLink to="/profile" className="mobile-link">👤 Profile</NavLink>
            </>
          )}
          <div className="mobile-menu-footer">
            <button className="theme-btn" onClick={() => setDark(!dark)}>
              {dark ? '☀️ Light mode' : '🌙 Dark mode'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      )}
    </>
  )
}

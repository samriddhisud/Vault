// Navbar.jsx
// Top navigation bar with responsive mobile support.
// Handles dark mode toggling, logout, and role-based link visibility.
// Admin users only see the Admin link; regular users see Dashboard, Expenses, Reports.

import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../api/index'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Initialise dark mode from localStorage so the preference persists across sessions.
  // useState with a function (lazy initialiser) reads localStorage only once on mount,
  // not on every render.
  const [dark, setDark] = useState(() => localStorage.getItem('vault_theme') === 'dark')

  // Controls whether the mobile hamburger menu is open
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu automatically whenever the route changes.
  // useLocation() provides the current route object - when it changes,
  // this effect runs and closes the menu.
  useEffect(() => { setMenuOpen(false) }, [location])

  // Apply or remove the 'dark' class on document.body whenever dark mode changes.
  // All CSS variables in index.css are scoped to body.dark, so toggling this
  // class switches the entire app's colour scheme instantly.
  // The preference is also saved to localStorage so it persists across page loads.
  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('vault_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Calls the backend logout endpoint to log the activity, then clears
  // the user from context and localStorage via logout(), and redirects to login.
  // The try/catch ensures the logout still works even if the API call fails.
  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  // Generate up to 2 uppercase initials from the user's name for the avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const isAdmin = user?.role === 'admin'

  return (
    <>
      <nav className="navbar">
        {/* Brand logo - links to admin panel for admins, dashboard for users */}
        <NavLink to={isAdmin ? '/admin' : '/dashboard'} className="navbar-brand">
          <div className="navbar-mark">🔒</div>
          <span className="navbar-name">Vault</span>
        </NavLink>

        {/* Desktop navigation links - hidden on mobile via CSS */}
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

        {/* Desktop right side - theme toggle, avatar, logout */}
        <div className="navbar-right">
          <button className="theme-btn" onClick={() => setDark(!dark)} aria-label="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          {/* Regular users get a clickable avatar that links to their profile.
              Admins get a non-clickable avatar since they have no profile page. */}
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

        {/* Hamburger button - only visible on mobile via CSS.
            aria-expanded communicates the menu state to screen readers. */}
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

      {/* Mobile menu drawer - conditionally rendered when hamburger is clicked.
          The menu closes automatically on route change via the useEffect above. */}
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
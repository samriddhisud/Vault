// AuthContext.jsx
// Provides global authentication state to the entire React app.
// Any component can access the current user, login, and logout
// by calling useAuth() without needing to pass props down the tree.

import { createContext, useContext, useState } from 'react'

// Create the context with a null default value.
// The actual value is provided by AuthProvider below.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Initialise user state from localStorage using a lazy initialiser function.
  // This means localStorage is only read once on mount, not on every render.
  // If a user was previously logged in, they stay logged in after a page refresh.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vault_user')
    return saved ? JSON.parse(saved) : null
  })

  // Stores the JWT token and user object in localStorage and updates React state.
  // Called after a successful login or register response from the backend.
  // Both token and user are stored separately:
  // - vault_token is read by the Axios interceptor in api/index.js
  // - vault_user is read here to restore the session on page refresh
  const login = (userData) => {
    localStorage.setItem('vault_token', userData.token)
    localStorage.setItem('vault_user', JSON.stringify(userData))
    setUser(userData)
  }

  // Clears all auth data from localStorage and sets user to null.
  // Called by the Navbar logout handler after the backend logout request completes.
  const logout = () => {
    localStorage.removeItem('vault_token')
    localStorage.removeItem('vault_user')
    setUser(null)
  }

  return (
    // Provide user, login, and logout to all descendant components
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook that wraps useContext for cleaner imports.
// Usage: const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
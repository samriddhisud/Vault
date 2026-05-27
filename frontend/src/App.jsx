// App.jsx
// Root component that sets up routing, authentication context, and global layout.
// Contains route guard components that protect pages based on auth state and role.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useToast } from './hooks/useToast'
import { useState } from 'react'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ToastContainer from './components/ToastContainer'
import SplashScreen from './components/SplashScreen'

// Redirects unauthenticated users to /login.
// Used for any route that requires a logged-in user regardless of role.
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// Restricts a route to admin users only.
// Unauthenticated users go to /login.
// Authenticated non-admin users go to /dashboard.
function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

// Restricts a route to regular users only.
// Unauthenticated users go to /login.
// Admin users are redirected to /admin because they have a separate interface
// and should not access user-facing pages.
function UserRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

// Inner layout component that has access to AuthContext.
// Separated from App so it can call useAuth() inside the AuthProvider tree.
// Renders the Navbar, all routes, footer (for non-admin users), and toast notifications.
function AppLayout() {
  const { user } = useAuth()
  // useToast provides the toast queue and the addToast function that is
  // passed down to every page component as a prop
  const { toasts, addToast, removeToast } = useToast()

  return (
    <>
      {/* Navbar is only shown when a user is logged in */}
      {user && <Navbar />}
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route path="/login" element={<Login addToast={addToast} />} />
        <Route path="/register" element={<Register addToast={addToast} />} />

        {/* User-only routes - admin users are redirected to /admin */}
        <Route path="/dashboard" element={
          <UserRoute><Dashboard addToast={addToast} /></UserRoute>
        } />
        <Route path="/expenses" element={
          <UserRoute><Expenses addToast={addToast} /></UserRoute>
        } />
        <Route path="/reports" element={
          <UserRoute><Reports addToast={addToast} /></UserRoute>
        } />
        <Route path="/profile" element={
          <UserRoute><Profile addToast={addToast} /></UserRoute>
        } />

        {/* Admin-only route - regular users are redirected to /dashboard */}
        <Route path="/admin" element={
          <AdminRoute><Admin addToast={addToast} /></AdminRoute>
        } />

        {/* Redirect root and unknown paths to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Footer is only shown to logged-in regular users, not admins */}
      {user && user.role !== 'admin' && <Footer />}

      {/* Toast container renders fixed-position notifications in the bottom right */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}

export default function App() {
  // Controls the splash screen shown on first load.
  // useState is used because hiding the splash screen triggers a re-render
  // to reveal the app underneath.
  const [showSplash, setShowSplash] = useState(true)

  return (
    // AuthProvider wraps everything so all components can access auth state
    <AuthProvider>
      <BrowserRouter>
        {/* Rainbow strip fixed at the very top of the viewport */}
        <div className="rainbow-strip" />
        {/* Splash screen shown for ~2 seconds on first load, then fades out */}
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
        {/* AppLayout is inside BrowserRouter so it can use React Router hooks */}
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}
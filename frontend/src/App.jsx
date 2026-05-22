import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useToast } from './hooks/useToast'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import ToastContainer from './components/ToastContainer'

// Blocks logged-out users from protected pages
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// Blocks non-admins from admin page
function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppLayout() {
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login addToast={addToast} />} />
        <Route path="/register" element={<Register addToast={addToast} />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard addToast={addToast} /></ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute><Expenses addToast={addToast} /></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute><Reports addToast={addToast} /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><Admin addToast={addToast} /></AdminRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile addToast={addToast} /></ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="rainbow-strip" />
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}

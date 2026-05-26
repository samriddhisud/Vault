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

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function UserRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
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
          <UserRoute><Dashboard addToast={addToast} /></UserRoute>
        } />
        <Route path="/expenses" element={
          <UserRoute><Expenses addToast={addToast} /></UserRoute>
        } />
        <Route path="/reports" element={
          <UserRoute><Reports addToast={addToast} /></UserRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><Admin addToast={addToast} /></AdminRoute>
        } />
        <Route path="/profile" element={
          <UserRoute><Profile addToast={addToast} /></UserRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {user && user.role !== 'admin' && <Footer />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="rainbow-strip" />
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}
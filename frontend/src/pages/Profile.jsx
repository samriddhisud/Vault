// Profile.jsx
// Allows the logged-in user to manage their account settings.
// Contains three independent forms: edit profile, change password, and set budget.
// Each form has its own state, validation, and submission handler so they
// operate independently without affecting each other.

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/index'

export default function Profile({ addToast }) {
  // user contains the current user's data from AuthContext.
  // login() is used to update the context after a successful profile save,
  // so the navbar and other components reflect the new name/email immediately.
  const { user, login } = useAuth()

  // Profile form - pre-populated with the current user's name and email
  // using optional chaining in case user is briefly null on first render
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' })

  // Password form - kept separate from profileForm so the two forms
  // are completely independent and don't interfere with each other
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  // Budget is a single number input, so it uses a simple string state
  // rather than an object like the other forms
  const [budgetAmount, setBudgetAmount] = useState('')

  // Each form has its own error state so validation messages are scoped
  // to the correct form and don't bleed between sections
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [budgetError, setBudgetError] = useState('')

  // Separate loading states for each form so submitting one form
  // doesn't disable the buttons on the other forms
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingBudget, setSavingBudget] = useState(false)

  // Validates and submits the profile update form.
  // On success, calls login() to update the user object in AuthContext
  // so the navbar avatar and other components reflect the changes immediately.
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!profileForm.name.trim()) errs.name = 'Name is required.'
    if (!profileForm.email.trim()) errs.email = 'Email is required.'
    if (Object.keys(errs).length) { setProfileErrors(errs); return }
    setSavingProfile(true)
    try {
      const res = await api.put('/auth/profile', profileForm)
      // Merge the updated fields into the existing user object in context
      login({ ...user, ...res.data })
      addToast('Profile updated! ✓', 'success')
      setProfileErrors({})
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update profile.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  // Validates and submits the password change form.
  // Requires the current password to verify the user's identity before
  // allowing the change - this is verified on the backend via bcrypt.compare().
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password is required.'
    if (!passwordForm.newPassword) errs.newPassword = 'New password is required.'
    if (passwordForm.newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters.'
    // Confirm password check is done client-side only to avoid an extra round trip
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    if (Object.keys(errs).length) { setPasswordErrors(errs); return }
    setSavingPassword(true)
    try {
      await api.put('/auth/password', passwordForm)
      addToast('Password updated! ✓', 'success')
      // Clear all password fields after a successful update
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({})
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update password.', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  // Validates and submits the monthly budget form.
  // parseFloat ensures the value is stored as a number in the database,
  // not as a string from the input element.
  const handleBudgetSubmit = async (e) => {
    e.preventDefault()
    if (!budgetAmount || Number(budgetAmount) <= 0) {
      setBudgetError('Budget must be greater than 0.')
      return
    }
    setSavingBudget(true)
    try {
      await api.put('/budget', { monthlyBudget: parseFloat(budgetAmount) })
      addToast('Budget saved! ✓', 'success')
      setBudgetAmount('')
      setBudgetError('')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not save budget.', 'error')
    } finally {
      setSavingBudget(false)
    }
  }

  // Generates up to 2 uppercase initials from the user's name
  // e.g. "Sam Smith" -> "SS", "Sam" -> "S"
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="mb-16">
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Profile</h1>
          <div style={{ fontSize: 13, color: 'var(--mu)', marginTop: 4 }}>Manage your account settings and budget.</div>
        </div>

        {/* Avatar card - shows initials, name, email and role badge */}
        <div className="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--violet)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--mu)' }}>{user?.email}</div>
            <span className={`badge ${user?.role === 'admin' ? 'badge-lime' : 'badge-violet'}`} style={{ marginTop: 6 }}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Two-column grid for the three settings cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* EDIT PROFILE FORM */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>✏️ Edit profile</div>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group mb-12">
                <label className="form-label">Name</label>
                <input className={`form-input ${profileErrors.name ? 'error' : ''}`}
                  value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                {profileErrors.name && <span className="field-error">{profileErrors.name}</span>}
              </div>
              <div className="form-group mb-16">
                <label className="form-label">Email</label>
                <input className={`form-input ${profileErrors.email ? 'error' : ''}`} type="email"
                  value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                {profileErrors.email && <span className="field-error">{profileErrors.email}</span>}
              </div>
              <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* CHANGE PASSWORD FORM */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🔒 Change password</div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group mb-12">
                <label className="form-label">Current password</label>
                <input className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`} type="password"
                  value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}
              </div>
              <div className="form-group mb-12">
                <label className="form-label">New password</label>
                <input className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`} type="password"
                  value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}
              </div>
              <div className="form-group mb-16">
                <label className="form-label">Confirm new password</label>
                <input className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`} type="password"
                  value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                {passwordErrors.confirmPassword && <span className="field-error">{passwordErrors.confirmPassword}</span>}
              </div>
              <button className="btn btn-primary" type="submit" disabled={savingPassword}>
                {savingPassword ? 'Saving...' : 'Update password'}
              </button>
            </form>
          </div>

          {/* SET BUDGET FORM */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>💰 Monthly budget</div>
            <form onSubmit={handleBudgetSubmit}>
              <div className="form-group mb-16">
                <label className="form-label">Budget amount ($)</label>
                {/* Clearing budgetError onChange gives immediate feedback that the error is resolved */}
                <input className={`form-input ${budgetError ? 'error' : ''}`} type="number" placeholder="e.g. 2000" min="0.01" step="0.01"
                  value={budgetAmount} onChange={e => { setBudgetAmount(e.target.value); setBudgetError('') }} />
                {budgetError && <span className="field-error">{budgetError}</span>}
              </div>
              <button className="btn btn-lime" type="submit" disabled={savingBudget}>
                {savingBudget ? 'Saving...' : 'Set budget'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
// Footer.jsx
// Site-wide footer shown on all user pages (not admin).
// Contains the brand, navigation links, newsletter signup, and contact form.
// Newsletter and contact form use local state only - no backend integration needed
// since this is a student project demo.

import { useState } from 'react'

export default function Footer() {
  // Newsletter signup state - subscribed switches the form to a success message
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  // Contact form state - sent switches the form to a success message
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  // Handles newsletter signup - validates email then shows success state
  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email) return
    setSubscribed(true)
    setEmail('')
  }

  // Handles contact form submission - validates all fields then shows success state
  const handleContact = (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) return
    setSent(true)
    setContactForm({ name: '', email: '', message: '' })
  }

  return (
    <footer className="footer">
      <div className="footer-top">

        {/* Brand column - logo, tagline, social links */}
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="navbar-mark" style={{ width: 32, height: 32, fontSize: 16 }}>🔒</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)' }}>Vault</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--mu)', lineHeight: 1.7, marginTop: 10, maxWidth: 220 }}>
            Track your spending, set budgets, and take control of your finances - all in one place.
          </p>
          <div className="footer-socials">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="social-btn" title="GitHub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-btn" title="Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-btn" title="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        {/* Product navigation links */}
        <div className="footer-links-col">
          <div className="footer-heading">Product</div>
          <a href="/dashboard" className="footer-link">Dashboard</a>
          <a href="/expenses" className="footer-link">Expenses</a>
          <a href="/reports" className="footer-link">Reports</a>
          <a href="/profile" className="footer-link">Profile</a>
        </div>

        {/* Support links */}
        <div className="footer-links-col">
          <div className="footer-heading">Support</div>
          <a href="#" className="footer-link">FAQ</a>
          <a href="#" className="footer-link">Privacy policy</a>
          <a href="#" className="footer-link">Terms of service</a>
          <a href="#" className="footer-link">Contact us</a>
        </div>

        {/* Newsletter signup - shows success message after submission */}
        <div className="footer-newsletter">
          <div className="footer-heading">Stay updated</div>
          <p style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12, lineHeight: 1.6 }}>
            Get tips on budgeting and new features straight to your inbox.
          </p>
          {subscribed ? (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lime)', background: '#1a1a1a', padding: '10px 14px', borderRadius: 8, border: '2px solid var(--border)' }}>
              You're subscribed!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, minWidth: 160, fontSize: 12, padding: '8px 12px' }}
              />
              <button className="btn btn-lime btn-sm" type="submit">Subscribe</button>
            </form>
          )}
        </div>

        {/* Contact form - shows success message after submission */}
        <div className="footer-contact">
          <div className="footer-heading">Contact us</div>
          {sent ? (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lime)', background: '#1a1a1a', padding: '10px 14px', borderRadius: 8, border: '2px solid var(--border)' }}>
              Message sent! We'll get back to you.
            </div>
          ) : (
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="form-input"
                placeholder="Your name"
                value={contactForm.name}
                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                style={{ fontSize: 12, padding: '8px 12px' }}
              />
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={contactForm.email}
                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                style={{ fontSize: 12, padding: '8px 12px' }}
              />
              <textarea
                className="form-input"
                placeholder="Your message..."
                rows={3}
                value={contactForm.message}
                onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                style={{ fontSize: 12, padding: '8px 12px', resize: 'vertical' }}
              />
              <button className="btn btn-primary btn-sm" type="submit">Send message</button>
            </form>
          )}
        </div>
      </div>

      {/* Copyright bar */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Vault. All rights reserved.</span>
        <span style={{ color: 'var(--mu)', fontSize: 12 }}>Built with ❤️ for better finances.</span>
      </div>
    </footer>
  )
}
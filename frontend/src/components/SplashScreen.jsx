// SplashScreen.jsx
// Full-screen animated splash shown for ~2 seconds on first load.
// Fades out after 1.8 seconds and calls onDone() at 2.3 seconds
// to remove it from the DOM and reveal the app.

import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  // Controls the CSS opacity transition for the fade-out effect
  const [fading, setFading] = useState(false)

  // Two timers: one to start the fade, one to call onDone after the fade completes.
  // The cleanup function clears both timers if the component unmounts early,
  // preventing memory leaks and setState calls on unmounted components.
  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1800)
    const doneTimer = setTimeout(() => onDone(), 2300)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      // Opacity transitions from 1 to 0 when fading is true
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.5s ease',
      // Disable pointer events during fade so clicks pass through to the app
      pointerEvents: fading ? 'none' : 'all',
    }}>
      {/* Logo icon - uses popIn animation to scale up from 0 */}
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: '#c8ff3e',
        border: '3px solid #1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36,
        boxShadow: '4px 4px 0 #1a1a1a',
        animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        🔒
      </div>
      {/* App name - uses fadeUp animation with a slight delay after the logo */}
      <div style={{
        fontSize: 36, fontWeight: 800, letterSpacing: -1.5,
        color: 'var(--tx)',
        animation: 'fadeUp 0.4s ease 0.2s both',
      }}>
        Vault
      </div>
      {/* Tagline - uses fadeUp with a longer delay so it appears last */}
      <div style={{
        fontSize: 14, color: 'var(--mu)',
        animation: 'fadeUp 0.4s ease 0.4s both',
      }}>
        Track your spending. Stay in control.
      </div>
      {/* Keyframe animations defined inline since they are only used by this component */}
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
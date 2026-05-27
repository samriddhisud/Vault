// useToast.js
// Custom hook that manages a queue of toast notifications.
// Returns addToast to show a notification and removeToast to dismiss one early.
// Used in AppLayout and passed down to every page as the addToast prop.

import { useState, useCallback } from 'react'

export function useToast() {
  // Array of active toast objects - each has an id, message, and type
  const [toasts, setToasts] = useState([])

  // Adds a new toast to the queue and automatically removes it after 3.5 seconds.
  // Date.now() is used as the ID because it is guaranteed to be unique
  // for toasts added in different milliseconds.
  // useCallback is used so addToast has a stable reference and does not
  // cause unnecessary re-renders in components that receive it as a prop.
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    // Auto-remove after 3.5 seconds using the id to target the correct toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  // Removes a specific toast immediately when the user clicks it.
  // useCallback gives removeToast a stable reference for the same reason as addToast.
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
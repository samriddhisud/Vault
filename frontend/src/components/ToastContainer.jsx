// ToastContainer.jsx
// Renders the list of active toast notifications in the bottom-right corner.
// Each toast is clickable to dismiss it early.
// The toast-success, toast-error, and toast-info CSS classes control the colour.

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        // Clicking a toast dismisses it immediately via removeToast
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
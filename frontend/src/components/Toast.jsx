import React, { useEffect } from 'react'

export default function Toast({ message, visible, onDismiss, duration = 2200 }) {
  useEffect(() => {
    if (!visible) return

    const timer = setTimeout(() => {
      if (onDismiss) onDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [visible, duration, onDismiss])

  if (!visible) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon">✓</span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

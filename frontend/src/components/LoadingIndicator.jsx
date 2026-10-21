import React from 'react'

export default function LoadingIndicator({ message = 'Loading…', className = '' }) {
  return (
    <div className={`loading-indicator ${className}`.trim()}>
      <span className="spinner" />
      <span>{message}</span>
    </div>
  )
}

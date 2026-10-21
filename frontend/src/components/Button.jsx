import React from 'react'

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
  const isActionDisabled = disabled || loading

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      disabled={isActionDisabled}
      {...props}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}

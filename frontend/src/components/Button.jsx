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
  let variantClass = 'btn-primary'
  if (variant === 'secondary') {
    variantClass = 'btn-secondary'
  } else if (variant === 'warning') {
    variantClass = 'btn-warning'
  }
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

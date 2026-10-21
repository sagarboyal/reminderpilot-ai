import React from 'react'
import { formatDueDate } from '../../../utils/dateUtils'

export default function DuplicateWarning({ existingReminder, onViewExisting }) {
  if (!existingReminder) return null

  const handleView = (e) => {
    e.preventDefault()
    if (onViewExisting) {
      onViewExisting(existingReminder.id)
    }
  }

  const formattedAmount =
    existingReminder.amount !== null && existingReminder.amount !== undefined
      ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(existingReminder.amount)
      : null

  return (
    <div className="duplicate-banner" role="alert">
      <div className="duplicate-header">
        <span className="duplicate-icon" aria-hidden="true">⚠️</span>
        <div className="duplicate-message">
          <strong>This might be a duplicate</strong> — you already have a reminder for{' '}
          <em>"{existingReminder.task}"</em> due {formatDueDate(existingReminder.dueDate)}.
        </div>
      </div>

      <div className="duplicate-preview">
        <div className="duplicate-preview-info">
          <span className="duplicate-preview-task">{existingReminder.task}</span>
          {formattedAmount && (
            <span className="duplicate-preview-amount">₹{formattedAmount}</span>
          )}
          <span className="duplicate-preview-date">
            Due: {formatDueDate(existingReminder.dueDate)}
          </span>
          <span className="duplicate-preview-category">
            {existingReminder.category || 'Other'}
          </span>
        </div>

        <button
          type="button"
          className="btn-view-existing"
          onClick={handleView}
        >
          View Existing Reminder ↓
        </button>
      </div>
    </div>
  )
}

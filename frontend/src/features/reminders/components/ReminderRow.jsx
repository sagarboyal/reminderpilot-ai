import React from 'react'
import { formatDueDate, getUrgencyStatus } from '../../../utils/dateUtils'

export default function ReminderRow({ reminder }) {
  const urgency = getUrgencyStatus(reminder.dueDate)
  const isUrgent = urgency === 'overdue' || urgency === 'today'
  const categoryLower = (reminder.category || 'other').toLowerCase()

  const formattedAmount =
    reminder.amount !== null && reminder.amount !== undefined
      ? new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 2
        }).format(reminder.amount)
      : null

  return (
    <div
      className={`reminder-row ${isUrgent ? 'urgent' : ''}`}
      id={`reminder-${reminder.id}`}
    >
      <div className="reminder-content">
        <div className="reminder-main">
          <span className="reminder-task">{reminder.task}</span>
          {formattedAmount && (
            <span className="reminder-amount">₹{formattedAmount}</span>
          )}
        </div>

        <div className="reminder-meta">
          <div className="reminder-date-wrapper">
            {urgency === 'overdue' && (
              <span className="urgency-tag overdue">Overdue</span>
            )}
            {urgency === 'today' && (
              <span className="urgency-tag today">Due Today</span>
            )}
            <span className={`reminder-date ${isUrgent ? 'date-urgent' : ''}`}>
              {formatDueDate(reminder.dueDate)}
            </span>
          </div>

          <span className={`category-pill category-${categoryLower}`}>
            {reminder.category || 'Other'}
          </span>
        </div>
      </div>
    </div>
  )
}

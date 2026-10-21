import React, { useState } from 'react'
import { formatDueDate, getUrgencyStatus } from '../../../utils/dateUtils'
import { REMINDER_CATEGORIES, DEFAULT_CATEGORY } from '../constants'
import Button from '../../../components/Button'

export default function ReminderRow({ reminder, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Edit form state
  const [editTask, setEditTask] = useState(reminder.task)
  const [editDueDate, setEditDueDate] = useState(reminder.dueDate || '')
  const [editAmount, setEditAmount] = useState(
    reminder.amount !== null && reminder.amount !== undefined ? reminder.amount : ''
  )
  const [editCategory, setEditCategory] = useState(reminder.category || DEFAULT_CATEGORY)

  const urgency = getUrgencyStatus(reminder.dueDate)
  const isUrgent = urgency === 'overdue' || urgency === 'today'
  const categoryLower = (reminder.category || 'other').toLowerCase()

  const formattedAmount =
    reminder.amount !== null && reminder.amount !== undefined
      ? new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 2
        }).format(reminder.amount)
      : null

  const handleDone = () => {
    if (isDone) return
    setIsDone(true)
    setTimeout(() => {
      if (onDelete) onDelete(reminder.id)
    }, 1400)
  }

  const handleStartEdit = () => {
    setEditTask(reminder.task)
    setEditDueDate(reminder.dueDate || '')
    setEditAmount(reminder.amount !== null && reminder.amount !== undefined ? reminder.amount : '')
    setEditCategory(reminder.category || DEFAULT_CATEGORY)
    setShowDeleteConfirm(false)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editTask.trim()) return

    if (onUpdate) {
      onUpdate(reminder.id, {
        task: editTask.trim(),
        dueDate: editDueDate || null,
        amount: editAmount !== '' ? Number(editAmount) : null,
        category: editCategory
      })
    }
    setIsEditing(false)
  }

  const handleDeleteConfirm = () => {
    if (onDelete) onDelete(reminder.id)
  }

  return (
    <div
      className={`reminder-row ${isUrgent ? 'urgent' : ''} ${isDone ? 'done-fade' : ''}`}
      id={`reminder-${reminder.id}`}
    >
      {/* 1. Inline Edit Mode */}
      {isEditing ? (
        <form className="inline-edit-form" onSubmit={handleSaveEdit}>
          <div className="form-grid">
            <div className="form-group-full">
              <label className="form-label" htmlFor={`edit-task-${reminder.id}`}>
                Task Name
              </label>
              <input
                id={`edit-task-${reminder.id}`}
                type="text"
                className="form-input"
                value={editTask}
                onChange={(e) => setEditTask(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" htmlFor={`edit-date-${reminder.id}`}>
                Due Date
              </label>
              <input
                id={`edit-date-${reminder.id}`}
                type="date"
                className="form-input"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" htmlFor={`edit-amount-${reminder.id}`}>
                Amount (₹)
              </label>
              <input
                id={`edit-amount-${reminder.id}`}
                type="number"
                step="any"
                className="form-input"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="form-group-full">
              <label className="form-label" htmlFor={`edit-category-${reminder.id}`}>
                Category
              </label>
              <select
                id={`edit-category-${reminder.id}`}
                className="form-select"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {REMINDER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="inline-edit-actions">
            <Button type="button" variant="secondary" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      ) : showDeleteConfirm ? (
        /* 2. Delete Confirmation Dialog */
        <div className="delete-confirm-box">
          <p className="delete-confirm-text">
            Delete <strong>"{reminder.task}"</strong>?
          </p>
          <div className="delete-confirm-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <button
              type="button"
              className="btn-danger-confirm"
              onClick={handleDeleteConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        /* 3. Normal Display Mode */
        <div className="reminder-content">
          <div className="reminder-main">
            <button
              type="button"
              className={`btn-done-check ${isDone ? 'checked' : ''}`}
              onClick={handleDone}
              title="Mark as done"
              aria-label="Mark reminder as done"
            >
              ✓
            </button>
            <div className="reminder-titles">
              <span className={`reminder-task ${isDone ? 'task-done' : ''}`}>
                {reminder.task}
              </span>
              {formattedAmount && (
                <span className="reminder-amount">₹{formattedAmount}</span>
              )}
            </div>
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

            <div className="row-actions">
              <button
                type="button"
                className="btn-row-action"
                onClick={handleStartEdit}
                title="Edit reminder"
                aria-label="Edit reminder"
              >
                ✎
              </button>
              <button
                type="button"
                className="btn-row-action btn-delete-action"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete reminder"
                aria-label="Delete reminder"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

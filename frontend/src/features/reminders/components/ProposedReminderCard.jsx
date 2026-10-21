import React, { useState } from 'react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import { REMINDER_CATEGORIES, DEFAULT_CATEGORY } from '../constants'

export default function ProposedReminderCard({
  extractedData,
  onApprove,
  onCancel,
  duplicateWarning = null,
  saving = false
}) {
  const [task, setTask] = useState(() => extractedData?.task || '')
  const [dueDate, setDueDate] = useState(() => extractedData?.dueDate || '')
  const [amount, setAmount] = useState(() =>
    extractedData?.amount !== null && extractedData?.amount !== undefined
      ? extractedData.amount
      : ''
  )
  const [category, setCategory] = useState(() => extractedData?.category || DEFAULT_CATEGORY)

  const handleApprove = () => {
    onApprove({
      task: task.trim() || 'Untitled Reminder',
      dueDate: dueDate || null,
      amount: amount !== '' ? Number(amount) : null,
      category: category || DEFAULT_CATEGORY
    })
  }

  return (
    <Card className="proposed-card">
      <div className="proposed-header">
        <h3 className="proposed-title">Review Proposed Reminder</h3>
        {extractedData?.extractionNote && (
          <span className="note-badge" title={extractedData.extractionNote}>
            AI Note Available
          </span>
        )}
      </div>

      {extractedData?.extractionNote && (
        <p style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '1rem', fontStyle: 'italic' }}>
          {extractedData.extractionNote}
        </p>
      )}

      {duplicateWarning}

      <div className="form-grid">
        <div className="form-group-full">
          <label className="form-label" htmlFor="edit-task">
            Task Name
          </label>
          <input
            id="edit-task"
            type="text"
            className="form-input"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Pay electricity bill"
          />
        </div>

        <div>
          <label className="form-label" htmlFor="edit-due-date">
            Due Date
          </label>
          <input
            id="edit-due-date"
            type="date"
            className="form-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="edit-amount">
            Amount (Optional)
          </label>
          <input
            id="edit-amount"
            type="number"
            step="any"
            className="form-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1250"
          />
        </div>

        <div className="form-group-full">
          <label className="form-label" htmlFor="edit-category">
            Category
          </label>
          <select
            id="edit-category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {REMINDER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleApprove}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Approve & Save'}
        </Button>
      </div>
    </Card>
  )
}

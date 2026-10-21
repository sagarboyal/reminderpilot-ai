import React from 'react'
import Card from '../../../components/Card'
import ReminderRow from './ReminderRow'

export default function ReminderList({ reminders }) {
  const hasReminders = Array.isArray(reminders) && reminders.length > 0

  return (
    <Card className="reminders-card">
      <div className="reminders-header">
        <h2 className="reminders-title">
          Upcoming Reminders
          {hasReminders && (
            <span className="reminders-count">{reminders.length}</span>
          )}
        </h2>
      </div>

      {!hasReminders ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p className="empty-text">
            No reminders yet. Paste your first message above to get started.
          </p>
        </div>
      ) : (
        <div className="reminder-list">
          {reminders.map((reminder) => (
            <ReminderRow key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}
    </Card>
  )
}

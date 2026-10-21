import React from 'react'
import Card from './components/Card'
import AnalyzePanel from './features/reminders/components/AnalyzePanel'
import ProposedReminderCard from './features/reminders/components/ProposedReminderCard'
import { useAnalyzeReminder } from './features/reminders/hooks/useAnalyzeReminder'

export default function App() {
  const {
    loading,
    loadingSlow,
    extractedData,
    error,
    analyze,
    clear
  } = useAnalyzeReminder()

  const handleApprove = (reminder) => {
    alert(
      `Approved reminder: "${reminder.task}" due ${reminder.dueDate || 'No date'} (${reminder.category}). Slice 2 will persist this into localStorage!`
    )
    clear()
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">ReminderPilot</h1>
        <p className="app-tagline">Paste it. We'll remind you.</p>
      </header>

      <main>
        {/* Paste Box & Analyze Button */}
        <AnalyzePanel
          onAnalyze={analyze}
          loading={loading}
          loadingSlow={loadingSlow}
        />

        {/* Error message */}
        {error && (
          <Card style={{ borderLeft: '4px solid var(--error-color)', background: 'var(--error-bg)' }}>
            <p style={{ color: 'var(--error-text)', fontSize: '0.9rem' }}>{error}</p>
          </Card>
        )}

        {/* Review Proposed Reminder Card */}
        {extractedData && (
          <ProposedReminderCard
            extractedData={extractedData}
            onApprove={handleApprove}
            onCancel={clear}
          />
        )}

        {/* Upcoming Reminders Section */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Upcoming Reminders
          </h2>
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No reminders yet. Paste your first message above to get started.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

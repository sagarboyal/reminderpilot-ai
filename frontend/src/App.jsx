import React, { useState } from 'react'
import Card from './components/Card'
import Toast from './components/Toast'
import AnalyzePanel from './features/reminders/components/AnalyzePanel'
import ProposedReminderCard from './features/reminders/components/ProposedReminderCard'
import ReminderList from './features/reminders/components/ReminderList'
import { useAnalyzeReminder } from './features/reminders/hooks/useAnalyzeReminder'
import { useReminders } from './features/reminders/hooks/useReminders'

export default function App() {
  const [inputText, setInputText] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  const {
    loading,
    loadingSlow,
    extractedData,
    error: analyzeError,
    analyze,
    clear: clearAnalysis
  } = useAnalyzeReminder()

  const {
    reminders,
    addReminder,
    storageError,
    clearStorageError
  } = useReminders()

  const handleApprove = async (reminderData) => {
    try {
      setSaving(true)
      addReminder(reminderData)
      setToastVisible(true)
      setInputText('')
      clearAnalysis()
    } catch (err) {
      console.error('Error saving reminder:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Retain inputText in paste box so user can edit and retry, just dismiss proposed card
    clearAnalysis()
  }

  const handleViewExisting = (reminderId) => {
    const el = document.getElementById(`reminder-${reminderId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlight-flash')
      setTimeout(() => {
        el.classList.remove('highlight-flash')
      }, 1600)
    }
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
          message={inputText}
          onMessageChange={setInputText}
          onAnalyze={analyze}
          loading={loading}
          loadingSlow={loadingSlow}
        />

        {/* Extraction Error */}
        {analyzeError && (
          <Card style={{ borderLeft: '4px solid var(--error-color)', background: 'var(--error-bg)' }}>
            <p style={{ color: 'var(--error-text)', fontSize: '0.9rem' }}>{analyzeError}</p>
          </Card>
        )}

        {/* Storage Error */}
        {storageError && (
          <Card style={{ borderLeft: '4px solid var(--error-color)', background: 'var(--error-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--error-text)', fontSize: '0.9rem' }}>{storageError}</p>
              <button
                type="button"
                onClick={clearStorageError}
                style={{ background: 'none', border: 'none', color: 'var(--error-text)', cursor: 'pointer', fontWeight: 600 }}
              >
                Dismiss
              </button>
            </div>
          </Card>
        )}

        {/* Review Proposed Reminder Card */}
        {extractedData && (
          <ProposedReminderCard
            key={`${extractedData.task}-${extractedData.dueDate}-${extractedData.amount}-${extractedData.sourceFingerprint || ''}`}
            extractedData={extractedData}
            existingReminders={reminders}
            onApprove={handleApprove}
            onCancel={handleCancel}
            onViewExisting={handleViewExisting}
            saving={saving}
          />
        )}

        {/* Upcoming Reminders List */}
        <ReminderList reminders={reminders} />
      </main>

      {/* Confirmation Toast */}
      <Toast
        message="Reminder saved ✓"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </div>
  )
}

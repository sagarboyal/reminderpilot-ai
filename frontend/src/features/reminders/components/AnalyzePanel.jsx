import React, { useState } from 'react'
import Card from '../../../components/Card'
import Button from '../../../components/Button'

export default function AnalyzePanel({
  onAnalyze,
  loading,
  loadingSlow,
  disabled,
  message: controlledMessage,
  onMessageChange
}) {
  const [internalMessage, setInternalMessage] = useState('')
  const isControlled = controlledMessage !== undefined
  const message = isControlled ? controlledMessage : internalMessage
  const setMessage = isControlled ? onMessageChange : setInternalMessage

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = (message || '').trim()
    if (!trimmed || loading || disabled) return
    onAnalyze(trimmed)
  }

  const isSubmitDisabled = !(message || '').trim() || loading || disabled

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <label htmlFor="message-input" className="paste-label">
          Paste your notice or bill
        </label>
        <textarea
          id="message-input"
          className="paste-textarea"
          placeholder="Paste a bill, message, or appointment notice here (e.g., 'Your electricity bill of ₹1,250 is due on 25 October 2026')..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading || disabled}
          rows={4}
        />
        <div className="action-row">
          {loading && (
            <div className="analysis-status" role="status" aria-live="polite">
              <span className="analysis-status-text">
                {loadingSlow ? 'Still working…' : 'Analyzing your message…'}
              </span>
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={isSubmitDisabled}
          >
            {loading ? 'Analyzing…' : 'Analyze Message'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

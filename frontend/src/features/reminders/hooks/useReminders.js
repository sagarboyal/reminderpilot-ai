import { useState, useCallback } from 'react'
import { loadReminders, saveReminders } from '../../../services/storageService'
import { sortReminders } from '../../../utils/dateUtils'
import { DEFAULT_CATEGORY } from '../constants'

export function useReminders() {
  const [reminders, setReminders] = useState(() => sortReminders(loadReminders()))
  const [storageError, setStorageError] = useState(null)

  const addReminder = useCallback((reminderData) => {
    try {
      setStorageError(null)
      const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'rem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)

      const newReminder = {
        id,
        task: (reminderData.task || 'Untitled Reminder').trim(),
        dueDate: reminderData.dueDate || null,
        amount:
          reminderData.amount !== null &&
          reminderData.amount !== undefined &&
          reminderData.amount !== ''
            ? Number(reminderData.amount)
            : null,
        category: reminderData.category || DEFAULT_CATEGORY,
        sourceFingerprint: reminderData.sourceFingerprint || null,
        createdAt: new Date().toISOString()
      }

      setReminders((prev) => {
        const updated = sortReminders([newReminder, ...prev])
        saveReminders(updated)
        return updated
      })

      return newReminder
    } catch (err) {
      console.error('Failed to add reminder:', err)
      setStorageError(err.message || 'Failed to save reminder to storage.')
      throw err
    }
  }, [])

  return {
    reminders,
    addReminder,
    storageError,
    clearStorageError: () => setStorageError(null)
  }
}

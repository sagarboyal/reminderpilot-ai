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

  const updateReminder = useCallback((id, updatedFields) => {
    try {
      setStorageError(null)
      setReminders((prev) => {
        const updated = prev.map((item) => {
          if (item.id !== id) return item
          return {
            ...item,
            task: (updatedFields.task || item.task).trim(),
            dueDate: updatedFields.dueDate !== undefined ? updatedFields.dueDate : item.dueDate,
            amount:
              updatedFields.amount !== undefined &&
              updatedFields.amount !== null &&
              updatedFields.amount !== ''
                ? Number(updatedFields.amount)
                : updatedFields.amount === '' ? null : item.amount,
            category: updatedFields.category || item.category
          }
        })
        const sorted = sortReminders(updated)
        saveReminders(sorted)
        return sorted
      })
    } catch (err) {
      console.error('Failed to update reminder:', err)
      setStorageError(err.message || 'Failed to update reminder in storage.')
      throw err
    }
  }, [])

  const deleteReminder = useCallback((id) => {
    try {
      setStorageError(null)
      setReminders((prev) => {
        const filtered = prev.filter((item) => item.id !== id)
        saveReminders(filtered)
        return filtered
      })
    } catch (err) {
      console.error('Failed to delete reminder:', err)
      setStorageError(err.message || 'Failed to remove reminder from storage.')
      throw err
    }
  }, [])

  return {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    storageError,
    clearStorageError: () => setStorageError(null)
  }
}

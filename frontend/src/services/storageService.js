/**
 * Safe localStorage wrapper for ReminderPilot reminders.
 * Centralizes all persistence and guards against storage quota limits.
 */

const REMINDERS_KEY = 'reminders'

export function loadReminders() {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to read reminders from localStorage:', err)
    return []
  }
}

export function saveReminders(reminders) {
  try {
    const serialized = JSON.stringify(reminders)
    localStorage.setItem(REMINDERS_KEY, serialized)
    return true
  } catch (err) {
    console.error('Failed to save reminders to localStorage:', err)
    throw new Error('Could not save reminder. Your browser storage may be full or disabled.')
  }
}

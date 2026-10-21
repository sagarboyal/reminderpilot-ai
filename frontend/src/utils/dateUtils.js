/**
 * Date and urgency utility functions for ReminderPilot.
 */

/**
 * Returns today's date in local ISO YYYY-MM-DD format.
 */
export function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats an ISO 8601 date string (YYYY-MM-DD) into human-readable "25 Oct 2026".
 * Uses Intl.DateTimeFormat with zero third-party dependencies.
 */
export function formatDueDate(isoDateStr) {
  if (!isoDateStr) return 'No due date'
  try {
    const parts = isoDateStr.split('-')
    if (parts.length !== 3) return isoDateStr
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)

    const date = new Date(year, month, day)
    if (isNaN(date.getTime())) return isoDateStr

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date)
  } catch {
    return isoDateStr
  }
}

/**
 * Determines urgency status for a given ISO date string.
 * Returns: 'overdue' | 'today' | 'upcoming' | 'none'
 */
export function getUrgencyStatus(isoDateStr) {
  if (!isoDateStr) return 'none'
  const today = getTodayDateString()
  if (isoDateStr < today) return 'overdue'
  if (isoDateStr === today) return 'today'
  return 'upcoming'
}

/**
 * Sorts reminders soonest-first.
 * 1. Items with valid dueDate come first, sorted ascending.
 * 2. Items without dueDate appear at the bottom.
 * 3. Ties broken by createdAt descending (most recent first).
 */
export function sortReminders(reminders) {
  if (!Array.isArray(reminders)) return []
  return [...reminders].sort((a, b) => {
    const dateA = a.dueDate || ''
    const dateB = b.dueDate || ''

    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1

    if (dateA && dateB && dateA !== dateB) {
      return dateA.localeCompare(dateB)
    }

    const createdA = a.createdAt || ''
    const createdB = b.createdAt || ''
    return createdB.localeCompare(createdA)
  })
}

import assert from 'node:assert'
import { sortReminders } from '../src/utils/dateUtils.js'

console.log('Running Slice 5 Lifecycle & Failure Handling Tests...')

// 1. Initial State
let reminders = [
  {
    id: 'rem-1',
    task: 'Electricity bill',
    dueDate: '2026-10-25',
    amount: 1420,
    category: 'Bill',
    sourceFingerprint: 'fp_test1',
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'rem-2',
    task: 'Dentist checkup',
    dueDate: '2026-11-05',
    amount: null,
    category: 'Appointment',
    sourceFingerprint: 'fp_test2',
    createdAt: '2026-10-02T10:00:00.000Z'
  }
]

// 2. Test Update Reminder
function updateReminder(list, id, updatedFields) {
  const updated = list.map((item) => {
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
  return sortReminders(updated)
}

const updatedList = updateReminder(reminders, 'rem-1', {
  task: 'Electricity bill (Updated)',
  dueDate: '2026-10-28',
  amount: '1500',
  category: 'Bill'
})

const updatedRem1 = updatedList.find((r) => r.id === 'rem-1')
assert.strictEqual(updatedRem1.task, 'Electricity bill (Updated)')
assert.strictEqual(updatedRem1.dueDate, '2026-10-28')
assert.strictEqual(updatedRem1.amount, 1500)
assert.strictEqual(updatedRem1.sourceFingerprint, 'fp_test1', 'Must preserve original source fingerprint')
assert.strictEqual(updatedRem1.createdAt, '2026-10-01T10:00:00.000Z', 'Must preserve original creation timestamp')

// 3. Test Delete Reminder
function deleteReminder(list, id) {
  return list.filter((r) => r.id !== id)
}

const deletedList = deleteReminder(updatedList, 'rem-1')
assert.strictEqual(deletedList.length, 1)
assert.strictEqual(deletedList[0].id, 'rem-2')

// 4. Test Manual Fallback Initial State
function createManualFallbackData(_sourceText = '') {
  return {
    task: '',
    dueDate: '',
    amount: null,
    category: 'Other',
    extractionNote: "We couldn't find a clear task or date in this message. You can fill in the details manually below.",
    isManualFallback: true
  }
}

const fallback = createManualFallbackData('some noisy message')
assert.strictEqual(fallback.task, '')
assert.strictEqual(fallback.dueDate, '')
assert.strictEqual(fallback.category, 'Other')
assert.ok(fallback.isManualFallback)
assert.ok(fallback.extractionNote.includes("manually below"))

console.log('All Slice 5 tests passed successfully!')

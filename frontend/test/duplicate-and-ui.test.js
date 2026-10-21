import assert from 'node:assert'
import { computeMessageFingerprint } from '../src/utils/fingerprint.js'

console.log('Running ReminderPilot Duplicate & UI Logic Tests...')

// --- Requirement 1: Deterministic source fingerprinting ---
const originalMsg = `Airtel Xstream Fiber: Your monthly broadband bill of ₹999 for October is due on 30 October 2026. Pay via Airtel Thanks app to avoid service suspension.`
const reanalyzedMsgWithWhitespace = `  Airtel Xstream Fiber: Your monthly broadband bill of ₹999 for October is due on 30 October 2026. \nPay via Airtel Thanks app to avoid service suspension.  `

const fp1 = computeMessageFingerprint(originalMsg)
const fp2 = computeMessageFingerprint(reanalyzedMsgWithWhitespace)

assert.ok(fp1.startsWith('fp_'), 'Fingerprint must start with fp_ prefix')
assert.strictEqual(fp1, fp2, 'Same message with different whitespace/newlines must yield identical fingerprint')

// --- Requirement 2: Different month is NOT classified as duplicate ---
const nextMonthMsg = `Airtel Xstream Fiber: Your monthly broadband bill of ₹999 for November is due on 30 November 2026. Pay via Airtel Thanks app to avoid service suspension.`
const fpNextMonth = computeMessageFingerprint(nextMonthMsg)
assert.notStrictEqual(fp1, fpNextMonth, 'Different month bill must have a different fingerprint')

// --- Helper matching logic mirror of ProposedReminderCard ---
function checkDuplicate(existingReminders, currentTask, currentDueDate, currentFingerprint) {
  const trimmedTask = (currentTask || '').trim().toLowerCase()
  return existingReminders.find((r) => {
    // 1. Primary signal: exact source message fingerprint match
    if (
      currentFingerprint &&
      r.sourceFingerprint &&
      r.sourceFingerprint === currentFingerprint
    ) {
      return true
    }

    // 2. Semantic match (preserved for manual edits and legacy reminders without fingerprints)
    if (!trimmedTask) return false
    const existingTask = (r.task || '').trim().toLowerCase()
    const existingDate = r.dueDate || ''
    const currentDate = currentDueDate || ''
    return existingTask === trimmedTask && existingDate === currentDate
  }) || null
}

// --- Test Case 1: Same message with different extracted task titles matches via fingerprint ---
// Previously saved reminder (extracted by Gemini):
const savedGeminiReminder = {
  id: 'rem-1',
  task: 'Pay broadband bill',
  dueDate: '2026-10-30',
  amount: 999,
  category: 'Bill',
  sourceFingerprint: fp1
}

// Current extraction by local fallback (different task title):
const fallbackTask = 'Airtel Xstream Fiber: Your monthly broadband bill...'
const fallbackDueDate = '2026-10-30'
const fallbackFingerprint = fp2 // from reanalyzed text

const match1 = checkDuplicate([savedGeminiReminder], fallbackTask, fallbackDueDate, fallbackFingerprint)
assert.ok(match1 !== null, 'Must match duplicate via sourceFingerprint even when task titles differ')
assert.strictEqual(match1.id, 'rem-1')

// --- Test Case 2: Legitimate bill for a different month is NOT classified as duplicate ---
const matchNextMonth = checkDuplicate([savedGeminiReminder], 'Pay broadband bill', '2026-11-30', fpNextMonth)
assert.strictEqual(matchNextMonth, null, 'Bill for next month must not be flagged as duplicate')

// --- Test Case 3: Legacy reminder without fingerprint still matches via task + date ---
const legacyReminder = {
  id: 'legacy-1',
  task: 'Pay electricity bill',
  dueDate: '2026-10-25',
  amount: 1420,
  category: 'Bill',
  sourceFingerprint: null // No fingerprint saved in older version
}

const matchLegacy = checkDuplicate([legacyReminder], '  pay electricity bill  ', '2026-10-25', 'fp_some_random')
assert.ok(matchLegacy !== null, 'Legacy reminder without fingerprint must match on normalized task and date')
assert.strictEqual(matchLegacy.id, 'legacy-1')

// --- Test Case 4: Non-matching task on legacy reminder does not match ---
const noMatchLegacy = checkDuplicate([legacyReminder], 'Pay water bill', '2026-10-25', 'fp_some_random')
assert.strictEqual(noMatchLegacy, null, 'Different task should not match legacy reminder')

// --- Test Case 5: Non-blocking override simulation ---
const duplicateFound = checkDuplicate([savedGeminiReminder], fallbackTask, fallbackDueDate, fallbackFingerprint)
const actionButtonText = duplicateFound ? 'Save Anyway' : 'Approve & Save'
assert.strictEqual(actionButtonText, 'Save Anyway', 'Button must change to "Save Anyway" when duplicate is flagged')

console.log('All 5 Duplicate & UI logic tests passed successfully!')

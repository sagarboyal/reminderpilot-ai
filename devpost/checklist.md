---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Paste a message and see the extracted reminder preview**
  Becomes usable: A running end-to-end flow where you paste a message in the React frontend, click "Analyze Message", the Spring Boot backend queries Google Gemini, and the editable "Review Proposed Reminder" card appears with the extracted task, due date, amount, and category.
  Why now: Proves the highest technical risk and unique kernel right away — Spring Boot calling Gemini with structured prompt/JSON parsing, hooked up to the React frontend with Vite proxy.
  PRD ref: `prd.md > The Core Journey` (steps 1–6), `prd.md > Paste and Analyze`, `prd.md > Proposed Reminder Card`
  Spec ref: `spec.md > The Core Journey Through the System` (steps 1–4), `spec.md > Components` (`AnalyzeController`, `ExtractionService`, `ExtractionResult`, `CorsConfig`, `App.jsx`, `AnalyzePanel.jsx`, `ProposedReminderCard.jsx`)
  Build: Initialize Spring Boot backend with Maven wrapper and Web dependency; implement `ExtractionService` calling Gemini 1.5 Flash via REST API using `application.properties` (with key from env var), `AnalyzeController` (`POST /api/analyze`), and DTOs; bootstrap React with Vite; build `AnalyzePanel` with textarea and button, loading state, and `ProposedReminderCard` displaying editable fields.
  Verify (mechanical): Run backend health/analyze test with mock/curl to `http://localhost:8080/api/analyze`; run Vite dev server; verify POST returns valid JSON structure.
  Learner check: Open http://localhost:5173, paste the sample electricity bill message, click "Analyze Message", and verify the editable proposed reminder card displays with task, date, amount, and category.
  Commit: add analyze endpoint and proposed reminder preview

- [x] **2. Startup Gemini connectivity check and diagnostic logging**
  Becomes usable: When the Spring Boot backend boots up, it makes a lightweight 0-token call to verify Gemini API key validity and network reachability, logging clear diagnostic status (INFO on success, ERROR on failure/unreachable) without blocking server startup or exposing secrets.
  Why now: Provides immediate runtime observability so developers know if their Gemini environment configuration is healthy before any request is made.
  PRD ref: `prd.md > States and Boundaries` (error states and boundaries)
  Spec ref: `spec.md > External Services and Dependencies` (Google Gemini)
  Build: Implement `GeminiStartupCheck` component implementing `ApplicationRunner`, making a lightweight GET request for model metadata using `RestClient`, logging clear SLF4J diagnostic messages with safe error extraction, and adding unit tests.
  Verify (mechanical): Run backend tests with mocked scenarios (healthy, 403 invalid key, host unreachable); run Spring Boot application and inspect console logs for clean diagnostic line.
  Learner check: Start the Spring Boot backend (`mvnw spring-boot:run`) and inspect the startup logs to see the Gemini diagnostic check message.
  Commit: backend: add startup gemini connectivity check and logging

- [ ] **3. Approve and save reminders to localStorage and view upcoming list**
  Becomes usable: Clicking "Approve & Save" saves the reminder into browser `localStorage`, displays a brief "Reminder saved ✓" toast, clears the paste box, and renders the reminder in the Upcoming Reminders list sorted soonest-first with urgency cues and category pills. Reminders persist on page reload.
  Why now: Completes the full core loop and data persistence model so user-approved data is safely stored and visible.
  PRD ref: `prd.md > Approve and Save`, `prd.md > Upcoming Reminders List`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Data Model`, `spec.md > Components` (`storage.js`, `ReminderList.jsx`, `ReminderRow.jsx`, `Toast.jsx`)
  Build: Create `storage.js` for localStorage CRUD; wire "Approve & Save" to store reminder; add `Toast.jsx`; add `ReminderList.jsx` and `ReminderRow.jsx` with date sorting (soonest first), Inter font styling, urgency indicator (due today/overdue), and empty state.
  Verify (mechanical): Add sample reminders via frontend storage helper, verify `localStorage` persistence and correct date sorting in component tests / browser evaluation.
  Learner check: Approve an extracted reminder, verify the toast appears and the item shows up in the upcoming list. Refresh the page to verify it persists.
  Commit: add reminder approval and localstorage persistence with upcoming list

- [ ] **4. Detect duplicates and show amber warning with override**
  Becomes usable: When analyzing a message whose extracted task and date match an existing saved reminder in localStorage, an amber warning banner appears above the card showing the existing item, and the button changes to "Save Anyway" to allow deliberate override.
  Why now: Delivers the core anti-duplicate promise of ReminderPilot before adding management actions.
  PRD ref: `prd.md > Duplicate Detection`
  Spec ref: `spec.md > Components` (`DuplicateWarning.jsx`, `ProposedReminderCard.jsx`)
  Build: Implement case-insensitive task + date duplicate check in `ProposedReminderCard.jsx`; create `DuplicateWarning.jsx` banner with preview and "View Existing Reminder" link; update button label to "Save Anyway" during warning.
  Verify (mechanical): Test duplicate detection function with matching and non-matching entries; verify amber banner renders on duplicate match.
  Learner check: Paste the same bill message a second time, click Analyze, and verify the amber duplicate warning appears and "Save Anyway" allows saving.
  Commit: add duplicate reminder detection with warning banner

- [ ] **5. Reminder management and graceful failure handling**
  Becomes usable: Full reminder lifecycle (Mark Done with 1.5s strikethrough animation before removal, inline Edit with save/cancel, Delete with confirmation dialog), plus graceful handling when AI extraction fails (gentle message with blank editable card) and Cancel button behavior.
  Why now: Completes all secondary behaviors and edge cases needed for a robust one-minute demo.
  PRD ref: `prd.md > Upcoming Reminders List (Actions per row)`, `prd.md > Extraction Failure`, `prd.md > Cancel`
  Spec ref: `spec.md > Components` (`ReminderRow.jsx`, `AnalyzePanel.jsx`), `spec.md > Important Failure Modes`
  Build: Implement Mark Done (strikethrough then remove), inline Edit mode on `ReminderRow`, Delete confirmation modal; add extraction failure fallback (blank card with editable inputs) and Cancel handler in `AnalyzePanel`.
  Verify (mechanical): Verify Mark Done, Edit, and Delete update localStorage; verify unparseable message returns graceful fallback.
  Learner check: Try marking a reminder done, edit another inline, delete one with confirmation, and paste ambiguous text to verify graceful fallback.
  Commit: add reminder actions and extraction failure fallback

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 3 (full paste-extract-approve-persist loop)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 5

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be filled during learning wrap-up]
Route and stops: [to be filled during learning wrap-up]
Edit outcome: [to be filled during learning wrap-up]
Reflection: [to be filled during learning wrap-up]
Activity mode: [to be filled during learning wrap-up]

## Revisions

- Inserted Slice 2 for backend startup Gemini connectivity check and diagnostic logging per learner request before persisting reminders. Configured default model to gemini-3.8-flash per Google API requirements.

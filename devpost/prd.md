---
doc: prd
status: approved
---

# ReminderPilot — Product Requirements

A single-page web app for students and professionals who receive bills, appointment notices,
and time-sensitive messages. The user pastes a message; the app extracts the task and due
date, checks for duplicates, and proposes a reminder the user must explicitly approve before
it is saved.

Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`.

---

## The Core Journey

1. **Arrival** — The user opens the app in a browser. No login, no onboarding. They see a
   single clean page with the paste box as the dominant element.
2. **Empty state** — No reminders exist yet. The reminders section shows a soft illustration
   or icon and the message: *"No reminders yet. Paste your first message above to get
   started."*
3. **Paste** — The user pastes a message (bill, appointment notice, confirmation text) into
   the textarea.
4. **Analyze** — The user clicks "Analyze Message." The button becomes "Analyzing…" with a
   spinner and disables. The textarea becomes read-only. A loading indicator appears below.
5. **Extraction result** — A "Review Proposed Reminder" card appears with pre-filled,
   editable fields. If a duplicate is detected, an amber warning banner appears above the
   card.
6. **Review and edit** — The user reviews the extracted fields, corrects any errors, and
   either approves or cancels.
7. **Approve** — The reminder is saved to localStorage. The card fades out. The paste box
   clears and becomes editable. The new reminder appears at the top of the list with a
   brief highlight. A "Reminder saved ✓" toast fades after ~2 seconds.
8. **Cancel** — The card disappears. Nothing is saved. The paste box retains its text so the
   user can edit and retry.
9. **Manage reminders** — Saved reminders are displayed in due-date order. The user can mark
   done, edit inline, or delete (with confirmation).

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

---

## Screens and Layout

**Single-page dashboard** — all interactions happen on one screen; no routing or navigation
needed for v1.

Top to bottom, visual hierarchy:

| Zone | Element | Notes |
|---|---|---|
| 1 | **Header** | App name "ReminderPilot" + tagline "Paste it. We'll remind you." No nav menu. |
| 2 | **Paste box** (primary focus) | Large labeled textarea + "Analyze Message" button. Dominant visual weight. Button disabled until textarea has text. |
| 3 | **Analysis result area** | Loading indicator → Proposed Reminder card → action buttons. Appears below paste box on analysis trigger; hidden otherwise. |
| 4 | **Upcoming Reminders** | List of saved reminders sorted soonest-first. Shows empty state when empty. |

Visual attention order: Paste box + button → Reminders section → Header/branding.

---

## Look and Feel

Source: interview — visual direction session.

**Tone:** Clean, calm, and trustworthy. Neither enterprise-cold nor playful-bubbly. The app
handles money and deadlines; it should feel *careful*, not cute.

**Reference:** Linear/Notion simplicity (whitespace, restrained color, clean type) × Google
Pay/banking-app trustworthiness (clear data hierarchy, calm colors).

**One-line brief:** *"If Notion and a banking app had a baby, and that baby was only allowed
to do one thing at a time."*

### Colors

| Role | Value | Usage |
|---|---|---|
| Background | `#FAFAFA` / `#F7F7F8` | Page background |
| Text (primary) | `#1A1A1A` | All primary text — near-black, not harsh |
| Accent (action) | `#3B5BDB` or `#4F6EF7` | "Analyze Message" button, "Approve & Save" button — the one action color |
| Warning | `#F5A623` (amber) | Duplicate warning banner |
| Error / urgent | `#E5484D` (soft red) | Overdue dates, delete confirmation |
| Success | `#2F9E44` (green) | "Reminder saved ✓" toast, Done confirmation flash |
| Category — Bill | Muted blue pill | |
| Category — Appointment | Muted purple pill | |
| Category — Subscription | Muted teal pill | |
| Category — Other | Muted grey pill | |

### Typography

- **Font:** Inter (free, web-safe, excellent readability at small sizes for dates/amounts).
- **Hierarchy:** Bold, slightly larger for task names; smaller muted grey for secondary info
  (amounts, category labels).
- No personality/quirk fonts — this handles financial and time-sensitive data.

### Shape and Spacing

- Rounded corners: 6–8 px radius on cards and buttons. Subtle, not bubbly.
- Generous whitespace, especially around the paste box and empty state.
- Soft box-shadow on cards (Proposed Reminder card, reminder rows) for gentle depth.
- Responsive layout — usable on desktop and phone browser. No native mobile app.

### Theme

- **Light mode only for v1.** Dark mode deferred (see Deferred).

---

## Features and Behavior

### Paste and Analyze

- The textarea displays placeholder text: *"Paste a bill, message, or appointment notice
  here…"*
- The "Analyze Message" button is **disabled** while the textarea is empty.
- On click:
  - Button label → "Analyzing…" + spinner; button disables.
  - Textarea → read-only (slightly greyed).
  - A thin loading bar or pulsing placeholder card appears below with label *"Reading your
    message…"*
  - If no response after 5 seconds, label updates to *"Still working…"* so the user knows
    the app hasn't frozen.
- The analysis request is sent to the Spring Boot backend REST API.

**Acceptance criteria:**
- [ ] Button is disabled and shows no spinner before text is entered.
- [ ] Clicking "Analyze Message" with text in the textarea triggers the loading state immediately.
- [ ] Textarea becomes non-editable during analysis.
- [ ] "Still working…" appears if analysis exceeds 5 seconds.

---

### Proposed Reminder Card

Shown after successful extraction. Title: *"Review Proposed Reminder."*

Fields displayed as **editable inputs**, pre-filled with extracted values:

| Field | Input type | Required |
|---|---|---|
| Task | Text field | Yes |
| Due date | Date picker | Yes |
| Amount | Text field | No — can be blank |
| Category | Dropdown (Bill / Appointment / Subscription / Other) | Yes — default to "Other" if undetected |

Visual distinction: editable fields have a visible border/background so the user immediately
knows what they can change.

**Action buttons** below the card:
- **"Approve & Save"** — primary button, solid accent color, visually dominant.
- **"Cancel"** — secondary, outlined or text-only.

**Acceptance criteria:**
- [ ] All four fields are shown and pre-filled when extraction succeeds.
- [ ] Every field is editable before approval.
- [ ] Category dropdown contains exactly: Bill, Appointment, Subscription, Other.
- [ ] Category defaults to "Other" when undetected.
- [ ] "Approve & Save" is visually dominant over "Cancel."

---

### Duplicate Detection

Performed by the React frontend against reminders stored in localStorage.

A **duplicate** is defined as: an existing reminder with the same task name AND the same due
date (case-insensitive task comparison).

When a duplicate is detected:
- An **amber warning banner** appears **above** the proposed reminder card.
- Banner text: *"This might be a duplicate — you already have a reminder for '[task]' on
  [date]."*
- A compact preview of the existing reminder (task + date) is shown below the banner text,
  so the user can compare without scrolling.
- A **"View Existing Reminder"** button scrolls to / highlights the matching reminder in
  the list.
- The duplicate check is a **warning, not a block.** The user can still approve.
- When a duplicate warning is active, "Approve & Save" relabels to **"Save Anyway"** to make
  the override explicit.

**Acceptance criteria:**
- [ ] Pasting an identical message twice shows the amber warning banner on the second analysis.
- [ ] The banner names the conflicting task and date.
- [ ] "Save Anyway" replaces "Approve & Save" when a duplicate is detected.
- [ ] Clicking "Save Anyway" saves the reminder and clears the card normally.
- [ ] No warning appears when there is no matching task + date pair.

---

### Approve and Save

On clicking "Approve & Save" (or "Save Anyway"):
1. Button briefly shows **"Saving…"** state.
2. Reminder is written to **localStorage**.
3. The proposed reminder card **fades/collapses** out.
4. The paste box **clears** and returns to editable.
5. The new reminder **appears at the top of the Upcoming Reminders list** with a brief
   highlight (soft color flash, ~1 second).
6. A **"Reminder saved ✓"** toast appears and fades after ~2 seconds.

**Acceptance criteria:**
- [ ] Saved reminder persists after page refresh (localStorage).
- [ ] Paste box is cleared and editable after save.
- [ ] New reminder is visible at the top of the list immediately after save.
- [ ] Toast appears and auto-dismisses without user action.

---

### Cancel

On clicking "Cancel":
- The proposed reminder card disappears.
- Nothing is saved.
- The paste box **retains its text** (not cleared) so the user can edit and retry.

**Acceptance criteria:**
- [ ] No reminder is added to the list after Cancel.
- [ ] localStorage is unchanged after Cancel.
- [ ] Paste box still contains the original pasted text.

---

### Extraction Failure

When the AI cannot find a clear task or due date in the message:

- **No** invented data is returned.
- A gentle message appears in place of the loading indicator:
  *"We couldn't find a clear task or date in this message. You can fill in the details
  manually below."*
- The same editable Proposed Reminder card appears, but with **empty fields**, so the user
  can fill it in manually rather than being blocked.
- The approval and cancel flow then works identically to the successful extraction path.

**Acceptance criteria:**
- [ ] A message with no identifiable task or date shows the failure message, not an error page.
- [ ] Empty card is shown and all fields are editable.
- [ ] User can fill in all fields manually and approve.
- [ ] No made-up task or date is pre-filled.

---

### Upcoming Reminders List

Source: `scope.md > The POC Boundary`.

**Sort order:** Soonest due date first. Automatic; no manual sorting in v1.

**Each reminder row shows:**

```
[urgency bar]  Task name (bold)            Due date    [Category]
               Amount (if present, muted)              [✓ Done] [✎ Edit] [🗑 Delete]
```

- **Urgency cue:** A red/orange left border or date color on reminders due today or
  overdue. Neutral styling for future reminders.
- **Category badge:** Small colored pill (muted pastels — see Look and Feel).
- **Amount:** Shown in smaller, muted grey text if present; hidden if blank.

**Actions per row:**

| Action | Trigger | Behavior |
|---|---|---|
| **Mark Done** | Checkbox or "Done" button | Brief strikethrough + grey-out (~1.5 s), then item removes itself from the list. |
| **Edit** | Click row or edit icon | Row expands inline to the same editable field layout as the Proposed Reminder card (task, date, amount, category). Save / Cancel buttons appear. Saves to localStorage on confirm. |
| **Delete** | Trash icon (hover on desktop, always visible on mobile) | Confirmation dialog: *"Delete this reminder?"* Deletes from localStorage on confirm. No undo in v1. |

- **Done ≠ Delete:** Done = handled/archived. Delete = remove entirely. These are distinct
  actions with distinct intent.

**Acceptance criteria:**
- [ ] List is always sorted soonest-first (re-sorts after add, edit, done, or delete).
- [ ] Reminders due today or overdue show the urgency cue.
- [ ] Mark Done shows brief strikethrough before removing the item.
- [ ] Edit inline shows the same fields as the approval card; changes persist to localStorage.
- [ ] Delete requires confirmation; no undo exists.
- [ ] Done and Delete are visually distinct actions.

---

## States and Boundaries

- **First use / empty state** — Paste box is ready, reminders section shows the empty-state
  message and illustration. No error; the app just hasn't been used yet.
- **Analysis in progress** — Paste box is read-only, button shows "Analyzing…", loading
  indicator is visible. User cannot submit a second analysis.
- **Duplicate warning active** — Amber banner above the proposed card; "Approve & Save"
  replaced by "Save Anyway." User can still approve.
- **Extraction failure** — Gentle message shown; empty editable card offered. User is not
  blocked.
- **Reminder saved** — Toast confirmation; list updated; paste box cleared.
- **Cancelled** — Card removed; paste box text retained; no change to storage.
- **Overdue reminder** — Red/orange urgency cue on the list row; no automatic action taken.
- **Persistence** — Reminders survive page refresh via localStorage. Clearing localStorage
  or switching browsers loses all data. No sync across devices. No accounts.
- **No undo for delete** — Delete is permanent within v1. A confirmation dialog is the only
  safeguard.

---

## Product Decisions

- **Duplicate = same task name + same due date** (case-insensitive) — simple enough to
  implement and check, covers the most likely real duplicate scenario.
- **Warn, don't block duplicates** — the user's intent may be legitimate (a recurring bill).
  "Save Anyway" makes the override explicit.
- **localStorage for persistence** — sufficient to prove the core loop without a database.
  Limitations (browser-specific, no sync) are accepted for v1.
- **Category list is fixed: Bill, Appointment, Subscription, Other** — keeps v1 simple;
  free-text categories introduce normalization complexity.
- **Cancel retains paste box text** — lets users correct and retry without retyping.
- **Light mode only** — dark mode doubles styling work for no demo value; deferred.
- **Mark Done removes from Upcoming list** — no separate "Done" history view in v1; simpler
  and sufficient for the demo.
- **Delete requires confirmation** — no undo exists in v1; a dialog is the only safeguard.

---

## What We're Building

- Single-page dashboard (one screen, no routing)
- Paste textarea + "Analyze Message" button with loading states
- AI extraction via Spring Boot REST API (task, date, amount, category)
- Graceful extraction failure: gentle message + empty editable card
- "Analyze…" / "Still working…" loading states with timeout handling (5 s)
- Proposed Reminder card with four editable fields + category dropdown
- Duplicate detection in the React frontend (localStorage comparison)
- Amber warning banner with existing-reminder preview and "View Existing" link
- "Approve & Save" / "Save Anyway" / "Cancel" action flow
- localStorage read/write for reminder persistence
- Upcoming Reminders list: soonest-first sort, urgency cues, category badges
- Mark Done (strikethrough → remove), Edit inline, Delete (with confirmation)
- "Reminder saved ✓" toast and new-item highlight animation
- Inter font, light theme, accent color `#3B5BDB`, semantic color system
- Responsive layout (desktop + phone browser)

---

## Deferred From the POC

- **Dark mode** — requires a second full color palette and doubles testing surface.
- **Database / server-side persistence** — localStorage is sufficient for the PoC; a real
  DB is the natural v2 upgrade.
- **User authentication** — no accounts in v1.
- **Done history / archive view** — marked-done reminders disappear; no separate log.
- **Free-text categories** — fixed list only in v1.
- **Undo for delete** — no undo; confirmation dialog is the safeguard.

---

## Possible Later Enhancements

- Push or email notifications as deadlines approach.
- Inbox integration (email, WhatsApp) to auto-feed messages.
- Multi-device sync with a real database and user accounts.
- Snooze, recurring reminders, reminder history.
- Category filters and search on the reminders list.
- Dark mode.

---

## Non-Goals

- **SMS / WhatsApp / email notifications** — third-party integrations; out of PoC scope.
- **Automatic inbox access** — requires OAuth; far beyond PoC.
- **Native mobile app** — responsive web covers the phone use case.
- **Inventing data** — the AI must never fabricate a task name or due date.
- **Silent auto-save** — every reminder requires explicit user approval.

---

## Open Questions

| Question | Blocks spec? |
|---|---|
| Which LLM API / provider for extraction? (OpenAI, Gemini, other) | Yes — `4-spec` decides. |
| Exact prompt design for extraction | No — implementation detail for `5-build`. |
| How to handle dates like "next Monday" or "end of month" (relative dates) | No — can default to extraction failure path for v1; refine in build. |

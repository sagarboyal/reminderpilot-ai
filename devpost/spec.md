---
doc: spec
status: approved
---

# ReminderPilot — Technical Specification

## How This Works, In Plain Language

ReminderPilot has two main pieces that talk to each other over a REST API.

**The backend (Spring Boot)** is a Java server that runs on your laptop. It receives the raw
message text the user pasted, builds a prompt, sends it to Google Gemini, and parses
whatever Gemini returns into a clean, structured set of fields (task name, due date, amount,
category). It normalises the date into `YYYY-MM-DD` format and returns the result to the
frontend. It has one job: extract and normalise. It knows nothing about existing reminders,
localStorage, or the user's history.

**The frontend (React)** is the web page the user sees in their browser. It sends the
message to the backend, receives the extracted fields, checks them against reminders already
stored in localStorage to detect duplicates, shows the Proposed Reminder card, and — only
after the user explicitly clicks Approve — writes the new reminder into localStorage. All
persistence and duplicate logic lives here.

**localStorage** is the browser's built-in key-value store — think of it as a sticky note
the browser keeps for one website. Reminders survive page refresh because they're saved
there. Clearing browser data or switching to a different browser loses them; that's an
accepted limitation for v1.

**Why this shape?** It keeps the AI integration isolated to one place (the backend), makes
the frontend responsible for user-facing data (no server-side state to manage), and avoids
any database setup while still proving the complete core loop.

---

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`

1. **User opens the app** → React loads in the browser. It reads localStorage and renders
   the Upcoming Reminders list (empty on first visit).

2. **User pastes a message and clicks "Analyze Message"** → React sends:
   ```
   POST http://localhost:8080/api/analyze
   { "message": "Your electricity bill of ₹1,250 is due on 25 October 2026..." }
   ```

3. **Backend receives the request** → Builds a prompt instructing Gemini to extract task,
   date, amount, and category as structured JSON, then calls the Gemini API.

4. **Gemini returns extracted text** → Backend parses the response, converts the date to
   `LocalDate` (ISO 8601), and returns:
   ```json
   {
     "task": "Pay electricity bill",
     "taskConfident": true,
     "dueDate": "2026-10-25",
     "dueDateConfident": true,
     "amount": 1250,
     "amountConfident": true,
     "category": "Bill",
     "categoryConfident": true,
     "extractionNote": null
   }
   ```
   If the date is unparseable or missing, `dueDate` is `null` and `dueDateConfident` is
   `false`. The backend never returns invented data.

5. **React receives the response** → Checks localStorage for an existing reminder with the
   same task name (case-insensitive) AND the same due date. Shows the amber warning banner
   if a match is found.

6. **User reviews, optionally edits, and clicks "Approve & Save"** → React writes the
   reminder object to localStorage. Updates the reminders list. Shows the "Reminder saved ✓"
   toast. Clears the paste box.

7. **Reminder appears in the list** → Sorted soonest-first. Red/orange urgency cue applied
   if due date is today or earlier (pure frontend date comparison).

PRD ref: `prd.md > Approve and Save`, `prd.md > Duplicate Detection`.

---

## Stack

### Backend

| Piece | Choice | Rationale |
|---|---|---|
| Language | Java 21 | Latest LTS (Sept 2023), supported until 2031, recommended for new Spring Boot 3.x projects |
| Framework | Spring Boot 3.x | Familiar; REST endpoints with minimal setup |
| Build tool | Maven | Standard Spring Boot default |
| Gemini client | `google-cloud-vertexai` or `google-ai-generativelanguage` Java SDK — **verify current artifact ID at build time** | Official Google SDK |
| JSON | Jackson (bundled with Spring Boot) | Zero config |
| Date | `java.time.LocalDate` | Native ISO 8601 support |

> ⚠️ **Verify at build time:** Confirm the current Maven artifact ID and version for the
> Gemini Java SDK at [Google AI Java SDK releases](https://github.com/googleapis/google-cloud-java).
> The SDK name has changed across releases; pin the version in `pom.xml` once confirmed.

Docs:
- Spring Boot: https://docs.spring.io/spring-boot/docs/current/reference/html/
- Gemini API (REST): https://ai.google.dev/api/rest
- Google AI Java SDK: https://github.com/googleapis/google-cloud-java

### Frontend

| Piece | Choice | Rationale |
|---|---|---|
| Framework | React 18 | Familiar to learner; component model fits card-based UI |
| Bootstrapped with | Vite (`npm create vite@latest`) | Fast dev server, no config overhead |
| Styling | CSS Modules or plain CSS | No extra library; Inter font via Google Fonts |
| HTTP client | `fetch` API (built into browser) | No dependency needed for one endpoint |
| Date display | `Intl.DateTimeFormat` (built into browser) | Formats `YYYY-MM-DD` → "25 Oct 2026" without a library |
| State | React `useState` + `useEffect` | Sufficient for one-screen app; no Redux/Zustand needed |

Docs:
- React: https://react.dev
- Vite: https://vitejs.dev

### External

| Service | Purpose |
|---|---|
| Google Gemini (`gemini-1.5-flash`) | AI extraction of task, date, amount, category |

API key stored in `backend/.env` (gitignored). Loaded via Spring Boot's
`application.properties` using `${GEMINI_API_KEY}`. Never committed to Git.

---

## Where It Runs and How Someone Tries It

**Runtime:** Two local processes — the Spring Boot backend and the Vite dev server.

**Requirements:**
- Java 17+
- Node.js 18+ and npm
- A Gemini API key from [Google AI Studio](https://aistudio.google.com) (free, no billing card required)

**Start the backend:**
```bash
cd backend
# Add your key to backend/src/main/resources/application.properties (gitignored)
# GEMINI_API_KEY=your-key-here
mvn spring-boot:run
# Listening on http://localhost:8080
```

**Start the frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens http://localhost:5173
```

**What to open:** `http://localhost:5173` in a browser.

**Demo recording:** Run both processes locally, record the browser screen.
Submission requires a short demo video and a public GitHub repository.
Deployment is optional and does not replace either.

---

## Look and Feel

Carried forward from `prd.md > Look and Feel` and `scope.md > Inspiration & Identity`.
No redesign needed here — these are the implementable constraints for the build.

- **Font:** Inter, loaded from Google Fonts (`<link>` in `index.html`).
- **Background:** `#FAFAFA`. **Primary text:** `#1A1A1A`.
- **Accent (action color):** `#3B5BDB` — used on "Analyze Message" and "Approve & Save"
  buttons only. This is the one color the eye follows.
- **Semantic colors:** Amber `#F5A623` (duplicate warning) · Red `#E5484D` (overdue, delete
  confirm) · Green `#2F9E44` (success toast, Done flash).
- **Category badge colors:** Muted pastels — Bill: soft blue · Appointment: soft purple ·
  Subscription: soft teal · Other: soft grey.
- **Cards:** `border-radius: 8px`, soft `box-shadow`, generous padding.
- **Tone of copy:** Calm, helpful, never alarming. Warnings are amber, not red. Error
  messages say what the user can do next.
- **Theme:** Light mode only for v1.

---

## Components

### Backend

#### `AnalyzeController`
Spring Boot REST controller. Exposes `POST /api/analyze`. Accepts `{ "message": "..." }`,
delegates to `ExtractionService`, returns the extraction response JSON.
PRD ref: `prd.md > Paste and Analyze`.

#### `ExtractionService`
Builds the Gemini prompt, calls the Gemini API, parses the response into an
`ExtractionResult` object. Validates the returned date string into `LocalDate`; on parse
failure sets `dueDate: null`, `dueDateConfident: false`. Handles Gemini API errors by
throwing a checked exception caught by the controller.
PRD ref: `prd.md > Proposed Reminder Card`, `prd.md > Extraction Failure`.

#### `ExtractionResult` (record/DTO)
```
task            String   (nullable)
taskConfident   boolean
dueDate         String   (ISO 8601 YYYY-MM-DD, nullable)
dueDateConfident boolean
amount          Double   (nullable)
amountConfident boolean
category        String   (nullable — one of: Bill, Appointment, Subscription, Other)
categoryConfident boolean
extractionNote  String   (nullable — human-readable note when fields are missing)
```

On true system failure (Gemini unreachable, empty input, unhandled exception):
```json
{ "success": false, "message": "Unable to process message. Please try again." }
```

#### CORS Configuration
Spring Boot CORS config to allow requests from `http://localhost:5173` (the Vite dev
server). Required because the browser treats different ports as different origins.

---

### Frontend

#### `App.jsx`
Root component. Owns the `reminders` array in state, synced with localStorage via
`useEffect`. Renders `AnalyzePanel` and `ReminderList`. Passes save and delete handlers
down as props.
PRD ref: `prd.md > The Core Journey`, `prd.md > Approve and Save`.

#### `AnalyzePanel.jsx`
Contains the paste textarea and "Analyze Message" button. Manages loading state, calls
`POST /api/analyze` via `fetch`. On success, passes the `ExtractionResult` to
`ProposedReminderCard`. On failure, shows the extraction-failure message.
PRD ref: `prd.md > Paste and Analyze`, `prd.md > Extraction Failure`.

#### `ProposedReminderCard.jsx`
Displays the four editable fields (task, dueDate, amount, category dropdown) pre-filled
from the `ExtractionResult`. Runs duplicate detection against the `reminders` array
(case-insensitive task + date match). Shows `DuplicateWarning` if a match is found.
Emits `onApprove(reminder)` and `onCancel()`.
PRD ref: `prd.md > Proposed Reminder Card`, `prd.md > Duplicate Detection`.

#### `DuplicateWarning.jsx`
Amber banner shown above `ProposedReminderCard` when a duplicate is detected. Shows the
conflicting reminder's task and date. Includes "View Existing Reminder" button (scrolls
to the matching row in the list).
PRD ref: `prd.md > Duplicate Detection`.

#### `ReminderList.jsx`
Renders the sorted (soonest-first) list of saved reminders. Shows empty state when the
list is empty. Passes per-row action handlers to `ReminderRow`.
PRD ref: `prd.md > Upcoming Reminders List`.

#### `ReminderRow.jsx`
Renders one reminder. Shows urgency cue (red/orange left border) when `dueDate <= today`.
Displays task, due date (formatted as "25 Oct 2026" via `Intl.DateTimeFormat`), category
badge, amount (if present). Action buttons: Done (strikethrough → fade → remove), Edit
(inline expand with same fields as `ProposedReminderCard`), Delete (confirmation, then
remove).
PRD ref: `prd.md > Upcoming Reminders List`.

#### `Toast.jsx`
Temporary "Reminder saved ✓" confirmation, auto-dismisses after ~2 seconds.
PRD ref: `prd.md > Approve and Save`.

#### `localStorage` utility (`storage.js`)
Helper functions: `loadReminders()`, `saveReminders(reminders)`. Wraps
`localStorage.getItem` / `localStorage.setItem` with JSON parse/stringify. Centralises
all storage access so the rest of the app never calls localStorage directly.
PRD ref: `prd.md > States and Boundaries — Persistence`.

---

## Data Model

### Reminder object (stored in localStorage)

```json
{
  "id": "uuid-v4-string",
  "task": "Pay electricity bill",
  "dueDate": "2026-10-25",
  "amount": 1250,
  "category": "Bill",
  "createdAt": "2026-10-20T15:30:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (UUID v4) | Generated on save with `crypto.randomUUID()` — built into modern browsers |
| `task` | `string` | Required |
| `dueDate` | `string` (ISO 8601) | Required |
| `amount` | `number` or `null` | Optional |
| `category` | `"Bill"` \| `"Appointment"` \| `"Subscription"` \| `"Other"` | Required |
| `createdAt` | `string` (ISO 8601 timestamp) | Set at save time for future sorting use |

**Where it lives:** `localStorage` key `"reminders"` — a JSON-serialised array.

**How it gets updated:** `saveReminders()` replaces the entire array on every change (add,
edit, done/remove, delete). Safe at PoC scale with a small number of reminders.

**When the user leaves and comes back:** `App.jsx` reads localStorage on mount via
`useEffect([], [])`. The list is immediately available on next visit.

**Duplicate check:** Before showing the approval step, `ProposedReminderCard` compares
`task.toLowerCase()` + `dueDate` against every stored reminder. A match triggers the amber
warning. The check is always in-browser; the backend is never involved.

---

## File Structure

```
RemainderPilot/
│
├── backend/                        # Spring Boot application
│   ├── src/
│   │   └── main/
│   │       ├── java/com/reminderpilot/
│   │       │   ├── ReminderPilotApplication.java   # Entry point
│   │       │   ├── controller/
│   │       │   │   └── AnalyzeController.java      # POST /api/analyze
│   │       │   ├── service/
│   │       │   │   └── ExtractionService.java      # Gemini call + parsing
│   │       │   ├── model/
│   │       │   │   └── ExtractionResult.java       # Response DTO
│   │       │   └── config/
│   │       │       └── CorsConfig.java             # Allow localhost:5173
│   │       └── resources/
│   │           └── application.properties          # GEMINI_API_KEY (gitignored)
│   └── pom.xml
│
├── frontend/                       # React + Vite application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyzePanel.jsx        # Paste box + Analyze button + loading
│   │   │   ├── ProposedReminderCard.jsx # Editable fields + duplicate check
│   │   │   ├── DuplicateWarning.jsx     # Amber banner
│   │   │   ├── ReminderList.jsx         # Sorted list + empty state
│   │   │   ├── ReminderRow.jsx          # One reminder: display + actions
│   │   │   └── Toast.jsx               # "Reminder saved ✓" notification
│   │   ├── utils/
│   │   │   └── storage.js              # localStorage helpers
│   │   ├── App.jsx                     # Root: state, localStorage sync, layout
│   │   ├── main.jsx                    # React entry point
│   │   └── index.css                   # Global styles, Inter font, CSS variables
│   ├── index.html
│   ├── vite.config.js                  # Proxy /api → localhost:8080
│   └── package.json
│
├── devpost/                        # Planning documents
│   ├── scope.md
│   ├── prd.md
│   └── spec.md
│
├── .gitignore                      # Includes: application.properties, .env, node_modules
└── README.md                       # Start instructions (written in 5-build)
```

> **Note on `vite.config.js` proxy:** Configuring Vite to proxy `/api` requests to
> `localhost:8080` means the frontend can call `/api/analyze` without hardcoding the backend
> port — and avoids CORS issues during development.

---

## External Services and Dependencies

### Google Gemini — `gemini-1.5-flash`

| Item | Detail |
|---|---|
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent` |
| Auth | API key — `?key=GEMINI_API_KEY` query param or `Authorization` header (verify with SDK docs) |
| Request | `{ "contents": [{ "parts": [{ "text": "<prompt>" }] }] }` |
| Response | `candidates[0].content.parts[0].text` — Gemini returns plain text; the prompt instructs it to return JSON |
| Rate limits | Free tier: 15 requests/min, 1,500 requests/day (verify at https://ai.google.dev/pricing) |
| Cost | Free tier is sufficient for development and demo |
| Docs | https://ai.google.dev/api/rest/v1beta/models/generateContent |

**Prompt strategy:** Instruct Gemini to return a JSON object with exactly the fields in
`ExtractionResult`. Ask it to return `null` for any field it cannot determine confidently.
Ask for the date in `YYYY-MM-DD` format to simplify backend parsing.

Example prompt skeleton (refined during `5-build`):
```
Extract the following fields from the message below and return ONLY a JSON object.
If you cannot determine a field confidently, set it to null.
Return the date in YYYY-MM-DD format only.
Fields: task (string), dueDate (YYYY-MM-DD string or null), amount (number or null),
category (one of: Bill, Appointment, Subscription, Other — or null).

Message:
"""
{userMessage}
"""
```

---

## Important Failure Modes

PRD ref: `prd.md > States and Boundaries`, `prd.md > Extraction Failure`.

- **Gemini API is unreachable or returns an error** → Backend catches the exception, returns
  `{ "success": false, "message": "Unable to process message. Please try again." }`.
  Frontend shows this message in place of the loading indicator. Paste box returns to
  editable. No data is lost.

- **Gemini returns a date the backend cannot parse** → `ExtractionService` catches the
  `DateTimeParseException`, sets `dueDate: null`, `dueDateConfident: false`. Frontend shows
  the empty date field highlighted for manual entry. No invented date is ever returned.

- **localStorage is full or unavailable** → `storage.js` wraps writes in a try/catch. If
  saving fails, the frontend shows a brief error message: *"Could not save reminder. Your
  browser storage may be full."* The reminder is not silently lost.

---

## What Was Simplified and Why

- **localStorage instead of a database** — A real database (PostgreSQL, H2) would add
  Docker, schema migrations, and connection config. localStorage proves the complete save
  → retrieve → display loop with zero infrastructure. Acknowledged tradeoff: data is
  browser-specific, no sync, cleared with browser data.

- **No authentication** — Accounts would require a session system, password hashing, and
  a users table before any core feature exists. The PoC proves the extraction and approval
  loop, not multi-user access.

- **Fixed category list (4 values)** — Free-text categories would require normalisation and
  fuzzy matching. Four values cover the demo cases and keep the dropdown trivial to build.

- **No dark mode** — A second full color palette and theme toggle doubles styling work for
  no demo value. Light mode only in v1.

- **No relative date resolution** ("next Monday") — Unparseable relative dates return
  `dueDateConfident: false` and the user fills in manually. Resolving relative dates would
  require knowing the current date on the backend and handling edge cases; not worth the
  PoC cost.

- **Vite proxy for API calls** — Rather than configuring full CORS or deploying the backend
  separately, Vite's built-in proxy forwards `/api` calls to `localhost:8080` during
  development. Simpler and standard practice for React + Spring Boot local development.

---

## Decisions and Open Issues

### Decisions

| Decision | Choice | Reason | Tradeoff accepted |
|---|---|---|---|
| AI provider | Google Gemini `gemini-1.5-flash` | Free tier, no billing card, excellent JSON extraction, Java SDK | Vendor dependency; if Gemini API changes, the backend service needs updating |
| Extraction response shape | Partial results with per-field boolean confidence | Preserves correctly-extracted fields even when one field is uncertain; avoids forcing the user to re-enter data the AI got right | Slightly more complex backend DTO than a single boolean; worth it |
| Date format | ISO 8601 `YYYY-MM-DD` for storage and transfer; formatted for display on frontend | Native `LocalDate` support, string-sortable, no regional ambiguity | None for this use case |
| Display vs. storage dates | Backend sends ISO 8601; frontend formats for display | Keeps sortability; `Intl.DateTimeFormat` handles it without a library | — |
| Past-date handling | Frontend urgency cue only (no backend flag) | Backend's job is extraction; overdue reminders already have a visual cue in the PRD; past dates may be intentional | No explicit warning during the approval step for stale extracted dates |
| Duplicate detection | Frontend only, against localStorage | Backend knows nothing about stored reminders; frontend has all the data it needs | — |
| Persistence | `localStorage` | Zero infrastructure; proves the loop | Browser-specific; no sync; cleared with browser data |

### Learner's Genuine Uncertainty — Discussed

**How the Gemini API fits into a Spring Boot service** was flagged in the learner profile as
a concept likely needing explanation. During this interview, the data flow was traced
concretely: Spring Boot receives the user's text → builds a prompt string → POSTs it to
Gemini's REST endpoint → parses the text response into a Java record → returns it as JSON
to React. The backend is the only part of the system that ever contacts Gemini; the frontend
never holds the API key or calls Gemini directly.

**Small investigation for `5-build`:** Confirm the current Maven artifact ID for the Gemini
Java SDK and pin the version in `pom.xml` before writing any service code.

### Open Issues

| Issue | Blocks build start? |
|---|---|
| Exact Maven artifact ID and version for Gemini Java SDK | Yes — verify before writing `ExtractionService` |
| Final prompt wording for Gemini (example skeleton above) | No — refined during `5-build` Step 1 |
| Whether `crypto.randomUUID()` is available in all target browsers | No — it is in all modern browsers; polyfill only if IE11 is a concern (it isn't for this PoC) |

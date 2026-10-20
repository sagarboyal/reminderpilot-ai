---
doc: scope
status: draft
---

# ReminderPilot

A web app that reads any message you paste and turns it into a reminder you approve before it's saved.

## The Unique Kernel

Most reminder apps make you fill in a form. ReminderPilot reads the message you already have — a bill, a booking confirmation, an appointment notice — and does the extraction for you. The approval gate is the other half of it: nothing is saved without your explicit sign-off, and the app warns you before creating a duplicate.

## Who It's For

A student tracking fee deadlines or a working professional managing bills and appointments — anyone who receives important notices and wants to act on them without losing track. Today they either ignore the message, screenshot it, or manually copy details into a calendar or notes app.

## The Core Loop

They open the app, paste a message into the input box, and click "Analyze Message." The AI extracts the task, due date, amount, and category. They review the proposed reminder (and can edit any field), then approve or cancel it. Approved reminders appear in an upcoming reminders list on the same dashboard. They come back whenever a new notice lands in their inbox.

## Inspiration & Identity

Clean and purposeful — closer to a utility than a product. Think of the no-friction feel of a simple task manager: nothing decorative that gets in the way of the one action the user came to do. Responsive enough to use on a phone browser, even though a mobile app is out of scope.

## Why This Matters to the Learner

> "I want to build something practical that I can actually implement and learn from."

ReminderPilot is something the builder would use themselves. It also puts all three learning goals into practice at once: a Spring Boot backend calling an LLM API, a React frontend managing state and user approval, and a REST API connecting them — with an AI agent helping architect and build the whole thing without the learner becoming dependent on it.

## What "Working" Looks Like

The user pastes:
> "Your electricity bill of ₹1,250 is due on 25 October 2026. Please make the payment before the due date."

The app extracts:
- **Task:** Pay electricity bill
- **Due date:** 25 October 2026
- **Amount:** ₹1,250
- **Category:** Bill payment

A preview card appears. The user reviews, optionally edits, and clicks Approve. The reminder appears in the upcoming list. If they paste the same message again, the app warns them of a likely duplicate — it doesn't silently create a second entry. If the message has no clear date, the app says so instead of inventing one.

That full cycle, end-to-end, is the one-minute demo.

## Persistence Decision (v1)

Approved reminders are stored in **browser localStorage**. The React frontend reads from and writes to localStorage; it also performs duplicate checking there. The Spring Boot backend handles AI-based message analysis only.

**Limitations to note:**
- Reminders are browser-specific — clearing localStorage or switching browsers loses the data.
- No sync across devices.
- No user accounts or authentication.
- No database in v1.

These are accepted constraints for the proof of concept, noted here so they can be revisited in v2.

## The POC Boundary

**In:**
- Paste-and-analyze input form
- AI extraction: task, due date, amount, category
- Graceful handling of missing or uncertain dates (surface the gap, don't invent)
- Duplicate detection with a warning (user can still override and save)
- Approval/edit/cancel step before any save
- Upcoming reminders list on the dashboard
- localStorage persistence across page refreshes
- Responsive UI usable on desktop and phone browser

**Out for v1 (see Later):**
- SMS, WhatsApp, email notifications
- Email/inbox integration
- Native mobile app
- Database or server-side persistence
- User authentication

## Later

- Push or email notifications when a deadline is approaching
- Connecting to a real inbox (email, WhatsApp) to analyze messages automatically
- A proper database with user accounts for multi-device sync
- Snooze, mark-as-done, and reminder history
- Categories and filters on the reminders list

## Explicitly Cut

- **SMS / WhatsApp / email notifications** — adds third-party integrations that triple the build surface for v1; the value is in the extraction and approval loop, not the delivery channel.
- **Automatic inbox access** — requires OAuth and API integrations with providers; far outside PoC scope.
- **Native mobile app** — the responsive web UI covers the phone use case without the overhead.
- **Database & authentication** — localStorage is sufficient to demonstrate the core loop; a real persistence layer is the natural v2 upgrade.

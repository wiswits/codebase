# 👩‍⚕️ COUNSELLOR GUIDE

You are the only person the system trusts with an individual child's data — and
even you are held to account for every look. This guide explains what you can
see, what you can't, and why.

## Your desk

- **Queue** — flags sorted by severity (🔴 red first) and SLA. This is a work
  queue of cases, never a ranking of students.
- **Context view** — the full picture for one student. Reachable **only** through
  the reason modal.
- **Cases** — acknowledge, note, refer, close, follow up, loop in a parent.

## The reason gate — every time

Before you open any individual's data you write **one line: why**. Minimum 10
characters. It is logged forever (`wb_access_audit`, append-only). This friction
is intentional — a second's pause so access never feels casual. It protects the
child, and it protects you (the record shows you acted properly).

## What you can see

- The current flag, its score, and the **signals** behind it.
- The 14-day **mood trend** and any notes the student left.
- **Teacher / warden concerns**.
- **Journal entries the student explicitly shared with you** — and only those.
- Case history.

## What you can never see

- The student's **marks, exam results, or fee status** (Waada 1).
- Any **discipline** record (Waada 4).
- **Unshared journal** entries — they are encrypted; you literally cannot read
  them (Waada 3).

> "You're here for them, not their file."

## Signals — what they mean, and don't

- **Self-raise / crisis keyword** → always red. The bravest signal. Respond in 24h
  (crisis: minutes).
- **Attendance + academics alone** → capped at 40 = amber. They can **never**
  produce a red flag on their own. Marks dropping is not a crisis.
- The engine **observes**, it does not diagnose or predict. Treat a flag as
  "someone looks different — take a look", nothing more.

## Session notes

Encrypted, **counsellor-only** — not the principal, not the platform owner, not
the DBA. Write observations, not diagnoses ("uska kehna hai ki neend nahi aati",
not "depression"). Write as if the child could read it — because one day they
might.

## Looping in a parent — the hardest decision

Most parents want to help. Sometimes home is the source of the pain. So:

- A **checklist**, the **child's response**, and a **mandatory written reason**.
- If the child refuses, a **concrete safety reason** is required.
- Mood data, journal, and session notes are **never** shared with a parent —
  chahe kuch bhi ho.
- The whole decision is logged with your name.

Confused? Talk to a senior. There is no rush unless there is a safety issue.

## Your own health

Caseload is capped at **40** open cases; past that you (and the principal) get a
warning. An overloaded counsellor is no counsellor. Use `/staff-check` — your
data is yours; the principal sees only an aggregate.

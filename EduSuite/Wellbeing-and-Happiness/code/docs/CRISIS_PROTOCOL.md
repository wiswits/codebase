# 🚨 CRISIS PROTOCOL

> Agar doubt ho — ZYADA respond karo, kam nahi.
> When in doubt, respond MORE, not less.

This is the most important part of the module. It can save a life. Everyone who
operates or maintains the Care Layer must know this cold.

## What triggers the crisis path

1. **Crisis keywords** in any free text a student writes — a pulse note, a
   journal entry, the "I want to talk" message. Detection is in
   [`wellbeing.crisis.keywords.js`](../apps/backend/src/modules/wellbeing/wellbeing.crisis.keywords.js)
   (EN / Hindi / Hinglish), in three tiers: **immediate → urgent → concern**.
2. A counsellor manually marking a case `crisis`.

A keyword match **bypasses scoring entirely** — it is never weighed against
anything. It fires immediately.

## What happens, in order (≈2 seconds)

| Step | Action |
|---|---|
| 1 | Encrypted crisis event logged (`wb_crisis_event`), `consent_overridden = true`, reason recorded |
| 2 | Immediate **red-100 flag** created (no scoring) |
| 3 | Highest-priority **case** opened with the SLA |
| 4 | Counsellor alerted on **all channels** (immediate: push+SMS+call+email) |
| 5 | Escalation timers scheduled |
| 6 | The student sees the **support screen immediately** — it is never empty |

## SLA + escalation ladder

| Level | SLA | Alert channels | Escalation |
|---|---|---|---|
| **immediate** (emergency) | 15 min | push · sms · call · email | counsellor → **principal @ 5 min** → **platform owner @ 10 min** |
| **urgent** | 2 hours | push · sms | → principal @ 120 min |
| **concern** | 24 hours | push | none (gentle outreach) |

Logic: [`escalationPlan`](../apps/backend/src/modules/wellbeing/wellbeing.crisis.js).

## Consent override

`CRISIS_OVERRIDES_CONSENT` — a keyword acts **even if the student opted out**.
Life-safety overrides consent. This is legally and ethically required. It is
always logged with a reason on the crisis event.

## The student's crisis screen

[`CrisisScreen.jsx`](../apps/frontend/src/CrisisScreen.jsx) — it **cannot be
dismissed** without an action. No "later", no "X". The child must call, breathe,
or press "main theek hoon" — and even that leaves the counsellor notified. Every
screen in the app also carries the helpline bar (Tele-MANAS 14416), always.

## ⚠️ Before production — human review (Part 13)

- [ ] Licensed counsellor has reviewed the crisis keyword list.
- [ ] The alerting stubs in
  [`wellbeing.crisis.responder.js`](../apps/backend/src/modules/wellbeing/wellbeing.crisis.responder.js)
  are replaced with **real** push/SMS/call/email gateways.
- [ ] The escalation scheduler is a **durable** job runner (not the in-process stub).
- [ ] Every helpline number verified working (re-verify every 6 months).

## If you are a human responder

1. A crisis alert is real until proven otherwise. Respond now.
2. Find the student. In person beats a call.
3. Do not diagnose. Listen. "Samajh sakta hoon" is enough.
4. Log what you did on the crisis event. Resolve only when the student is safe.

# EduSuite — Admission Management System (AMS)

A full-stack MERN implementation of the Admission Management System module described in the
PRD: **Enquiry → Application → Test → Interview → Offer → Admission**.

---

## 1. What's in this build

| Layer | Tech | Status |
|---|---|---|
| Frontend | React (Vite) + Tailwind + React Query + dnd-kit + Recharts | Fully built, all 12+ screens |
| Backend | Node.js + Express + Mongoose | Fully built, all 33 FRs wired to real endpoints |
| Database | MongoDB (Atlas or local) | Schemas + seed data included |
| Auth | JWT + RBAC (admin / admission_officer / counselor / panelist) | Implemented |
| File storage | Local disk by default, Cloudinary-ready | Implemented |
| Notifications | Email (Nodemailer) + SMS, console-mock fallback | Implemented |
| PDF | Offer letter generation via PDFKit | Implemented |

Every functional requirement in the PRD (FR1–FR33) maps to a real controller/route — see the
FR-comment above each controller function for direct traceability back to the PRD.

### Honest scope note
This is a genuinely working, runnable system, not a mockup. It has **not** been through a
multi-week QA/security hardening cycle a production rollout would need — treat it as a strong,
functional v1 to build on, review, and pen-test before going live with real applicant data.

---

## 2. Assumptions made (PRD Section 13 — Open Questions)

The PRD explicitly invites reasonable assumptions where things are marked "to confirm." Here's what
was assumed, and where to change it if the real answer differs:

1. **DnD library**: No existing Kanban DnD library was specified elsewhere in EduSuite, so `@dnd-kit`
   was used (lighter and more actively maintained than `react-dnd`). Swap in `client/src/components/kanban/`.
2. **Notification service**: Assumed *not* already built. Implemented a real Nodemailer/SMS service
   (`server/services/notificationService.js`) that **falls back to console logging** when
   SMTP/SMS credentials are blank in `.env`, so the app runs immediately without external accounts.
3. **Fees module handoff**: Assumed **not present**. Offer-accept simply sets `Application.status = 'Admitted'`
   with no payment step, per the PRD's own fallback instruction in Section 8.
4. **Staff/Student module for Staff/Sibling quota lookups**: Assumed **not present**. Staff/Sibling
   eligibility is captured as free-text (`quotaEligibility.staffEmployeeId` / `siblingStudentId`) for
   manual verification by an Admission Officer rather than an automated cross-module lookup.
5. **Seat-lock timing**: Seats are decremented from the Quota pool **on offer-accept** (not merely on
   "Admitted"), because FR24 says accept "triggers admission flow" and reject/expiry "releases seat back" —
   implying the seat was already held from acceptance onward. See `server/services/quotaService.js`.
6. **Single-tenant**: Assumed single-school/single-tenant, so application numbers are not prefixed with
   a school code (`APP/<FY>/<seq>`). If multi-tenant is confirmed, add a tenant prefix in
   `server/services/numberingService.js`.
7. **Tech stack**: Built exactly as specified in PRD Section 11 (MERN), even though this diverges from
   a SQL-based EduSuite core, per the PRD's own note that this is "to confirm" but should default to
   the stack given in the doc.
8. **Interview recommendation heuristic**: A simple score-based heuristic (≥7 Selected, 5–7 Waitlisted,
   <5 Rejected) was added on top of FR20's aggregation, since the PRD doesn't specify one. This is a
   clearly isolated function (`submitScore` in `interviewController.js`) — easy to replace with your
   school's real rubric-to-recommendation policy.
9. **Multi-language public form**: Not built in this pass (PRD marks this "confirm" and out of a hard
   requirement — v1 ships English only). The form architecture (all copy lives in
   `PublicApplicationForm.jsx`) makes adding i18n straightforward later.

---

## 3. Project structure

```
admission-management-system/
├── server/                  # Express API
│   ├── config/               # DB connection, shared enums/constants
│   ├── models/                # Mongoose schemas (12 collections)
│   ├── controllers/           # Business logic per FR group
│   ├── routes/                 # REST endpoints (public + authenticated)
│   ├── middleware/             # JWT auth, RBAC, error handling, uploads
│   ├── services/                # Numbering, quota, PDF, notification, audit, token
│   ├── seed/                     # Demo data loader
│   └── uploads/                   # Local file storage (documents, offer PDFs)
└── client/                  # React (Vite) SPA
    └── src/
        ├── pages/             # One file per screen
        ├── components/         # layout/, common/, kanban/
        ├── context/             # AuthContext
        └── services/            # Axios API clients, one per domain
```

---

## 4. Local setup

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a free MongoDB Atlas cluster

### Backend
```bash
cd server
cp .env.example .env
# edit .env — at minimum set MONGO_URI, JWT_SECRET, PUBLIC_TOKEN_SECRET
npm install
npm run seed     # loads demo users, enquiries, applications, quotas, a test with results
npm run dev      # starts on http://localhost:5000
```

### Frontend
```bash
cd client
cp .env.example .env
# VITE_API_URL should point at the backend above
npm install
npm run dev      # starts on http://localhost:5173
```

### Demo logins (seeded, password for all: `Password@123`)
| Role | Email |
|---|---|
| Admin | admin@edusuite.test |
| Admission Officer | officer@edusuite.test |
| Counselor | counselor@edusuite.test |
| Interview Panelist | panelist1@edusuite.test / panelist2@edusuite.test |

### Public (no-login) routes to try
- `http://localhost:5173/apply` — start a new application (auto-generates a resumable draft link)
- `http://localhost:5173/offer/:token` — offer accept/reject (token comes from an offer generated
  via the Applications screen once an application reaches "Interviewed")

---

## 5. Key implementation notes worth knowing about

- **Gap-less application numbering (FR29/FR30)**: `Counter` collection + atomic `findOneAndUpdate`
  with `$inc`, one document per FY. MongoDB serializes concurrent updates to the same document, so
  this is safe under concurrent public submissions without needing multi-document transactions.
- **Draft vs. submitted (FR1–FR3)**: `Application.isDraft` + `draftToken` let the public form auto-save
  every step to the *same* document; the application number is only minted in `submitApplication`.
- **Source lock + audit (FR8/FR9)**: `sourceLocked` flips to `true` on submit; any staff-side change
  after that requires a `reason` and writes to the `AuditLog` collection.
- **Bulk test result upload (FR15–FR17)**: CSV parsed in memory, processed in chunks of 200 rows so a
  multi-thousand-row cohort doesn't block the event loop; rank/percentile recomputed per class and per
  quota category after each upload.
- **Quota engine (FR25–FR28)**: `Quota` documents track `filled` vs `totalSeats` per class/FY/category;
  `releaseSeat()` auto-promotes the next waitlisted application (FR27).
- **RBAC**: `middleware/role.js` gates routes by role; the frontend also hides/restricts screens per
  role, but **the server is the source of truth** — never rely on the UI hide alone.

---

## 6. What to review before production

- Rotate `JWT_SECRET` / `PUBLIC_TOKEN_SECRET` to strong random values (never commit real ones).
- Point `STORAGE_DRIVER`/Cloudinary credentials at real object storage — local disk storage does not
  survive redeploys on most hosting platforms (Render/Railway free tiers wipe the filesystem).
- Wire real SMTP + an SMS gateway (MSG91/Twilio) — everything currently console-logs if left blank.
- Add rate limiting to the public `/api/public/*` routes (no-login endpoints are the most exposed
  surface) and a CAPTCHA on the public application form.
- Add automated tests (none are included in this pass) before treating this as production-ready.

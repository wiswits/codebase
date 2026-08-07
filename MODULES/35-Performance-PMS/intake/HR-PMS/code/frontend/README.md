# HR-PMS — Jatin's Frontend Contribution

Performance Management & Appraisal (`hr_pms`) module frontend, built for
WisWits per the **HR-PMS Module Engineering Contract** and the **WisWits
Engineering Standards**. This package contains **only Jatin's frontend
scope** — no backend (Neha) or database (Khushboo) implementation.

---

## 1. What was implemented

All five authoritative PMS capabilities, each with a coherent UI, centralized
service layer, TypeScript domain types, and every required screen state:

1. **Goal Setting** — list, create, edit, detail view
2. **Review-Cycle Management** — list, create, edit, detail view
3. **Self Review** — dedicated `SelfReviewForm`, always `review_type: "self"`
4. **Reviewer Form** — dedicated `ReviewerForm` + review queue, always
   `review_type: "reviewer"`
5. **Rating Summary** — display-only; never computes a score or formula

Plus a PMS dashboard/overview tying the five workflows together.

## 2. Stack (locked, as required)

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

No Redux/Zustand, no competing form/date/HTTP libraries, no new UI framework.

## 3. Folder structure

```
app/
  layout.tsx, page.tsx            # root shell + redirect into /hr/pms
  hr/pms/
    layout.tsx                    # PmsUserProvider + PmsShell (nav)
    page.tsx                      # dashboard / overview
    cycles/page.tsx                cycles/[id]/page.tsx
    goals/page.tsx                 goals/[id]/page.tsx
    self-review/page.tsx
    reviews/page.tsx               # reviewer form / queue
    summary/page.tsx

modules/pms/
  types/index.ts                  # domain types (Cycle, Goal, Review, Summary, API envelope)
  constants/index.ts               # module key, routes, permissions, status labels
  context/pms-user-context.tsx     # current user + permission checks (UX only)
  services/                        # ONE place API paths live
    http-client.ts                 # fetch wrapper for the real API
    cycle.service.ts, goal.service.ts, review.service.ts, summary.service.ts
  mocks/
    seed-data.ts                   # mock users/cycles/goals/reviews
    mock-api.ts                    # in-memory "backend" with latency + validation
  hooks/                           # useCycles, useGoals, useReviews, useRatingSummary, ...
  components/
    shared/                        # Button, Badge, Card, DataStates, FormField, PmsShell
    dashboard/, cycles/, goals/, reviews/, summary/
```

## 4. Routes implemented

| Route | Purpose |
|---|---|
| `/hr/pms` | Dashboard / overview |
| `/hr/pms/cycles` | Appraisal cycle list + create (HR admin) |
| `/hr/pms/cycles/[id]` | Cycle detail + edit + linked goals |
| `/hr/pms/goals` | Goal list + create |
| `/hr/pms/goals/[id]` | Goal detail + edit |
| `/hr/pms/self-review` | Employee self review |
| `/hr/pms/reviews` | Reviewer queue + reviewer form |
| `/hr/pms/summary` | Rating summary (self + reviewer + overall) |

## 5. Mock API architecture

The module runs fully standalone during independent frontend development:

```
Component -> Hook -> PMS Service -> Mock API (in-memory, simulated latency/errors)
```

To point at the real WisWits backend later:

1. Set `NEXT_PUBLIC_PMS_USE_MOCK=false` in `.env.local`
2. Set `NEXT_PUBLIC_API_BASE_URL` to the real API origin
3. No component/hook code changes are required — only the service files
   branch on `PMS_USE_MOCK`, calling `http-client.ts` instead of the mock.

The proposed API surface (per the contract) is isolated entirely inside the
four `*.service.ts` files:

```
GET/POST   /api/v1/hr/pms/cycles       GET/PATCH /api/v1/hr/pms/cycles/:id
GET/POST   /api/v1/hr/pms/goals        GET/PATCH /api/v1/hr/pms/goals/:id
GET/POST   /api/v1/hr/pms/reviews      GET/PATCH /api/v1/hr/pms/reviews/:id
GET        /api/v1/hr/pms/summary
```

This namespace is a **team implementation contract**, not a confirmed
production namespace — it's isolated in one place specifically so it can
change without touching UI code.

## 6. Permissions

`hr.pms.view`, `hr.pms.review`, `hr.pms.manage` drive UI behavior only
(hiding/disabling actions, unauthorized-state screens). The module ships a
**dev-only role switcher** ("Demo as" selector in the top bar) so reviewers,
HR admins, and employees can all be exercised without a real auth backend.

**This is not authorization.** The real WisWits backend independently
enforces every permission; the frontend's checks are UX convenience only.

## 7. Validation performed

- `npx tsc --noEmit` — passes with zero errors
- `npx eslint .` — passes with zero errors/warnings
- `npm run build` — production build succeeds; all 8 PMS routes generated
  (static where possible, dynamic for `[id]` routes)
- `npm run start` — smoke-tested every route (`/`, all 7 `/hr/pms/*` routes,
  both dynamic detail routes with a valid ID, and an invalid ID) — all
  returned HTTP 200, including the not-found ID path (handled gracefully by
  the Not Found UI state rather than crashing)

## 8. Contract assumptions (clearly separate from official requirements)

The Engineering Standards and Module Contract left several implementation
details unlocked. Where that happened, the safest, most API-ready choice was
made and is listed here — **none of this should be read as an official
WisWits requirement**:

- **Cycle status enum** (`draft | active | in_review | closed`) — not locked
  by the contract; chosen for a coherent lifecycle demo.
- **Goal status enum** (`not_started | in_progress | completed | cancelled`)
  — same reasoning.
- **Goal `weight` field** — included as an optional, display-only field for
  reference; the frontend never uses it to compute anything.
- **Rating scale (1-5) shown in the self/reviewer forms** — a UI input
  convenience only. The Rating Summary screen never computes an overall
  score from it; it only ever displays whatever `overallRating` the
  backend/API supplies (currently mocked as a passthrough of the reviewer's
  raw rating).
- **HTTP client** — implemented with native `fetch`, since no existing
  repository convention was available to inspect. Swappable in
  `services/http-client.ts` alone if the real repo standardizes on
  something else (e.g. axios).
- **Reviewer queue design** — the contract doesn't specify how reviewers
  discover pending reviews; the implementation derives a queue from
  "submitted self reviews without a matching reviewer review" for the
  selected cycle, which is a reasonable UX default pending backend
  confirmation of the actual assignment model.
- **Permission role mapping in the dev switcher** (`employee` -> view only,
  `manager` -> view + review, `hrAdmin` -> view + review + manage) — a mock
  convenience for demonstrating permission-aware UI, not an official role
  taxonomy.

## 9. Explicitly out of scope (per the contract's ownership rule)

- Neha's backend implementation
- Khushboo's database/schema
- Any direct MariaDB access from the frontend
- 360-feedback, peer review, AI scoring, payroll/promotion linkage,
  attendance/biometric scoring, PDF generation, email/SMS workflows,
  advanced analytics — none of these were requested and none were added

## 10. How to run

```bash
npm install
cp .env.example .env.local   # optional; defaults already run against the mock API
npm run dev                  # http://localhost:3000 -> redirects to /hr/pms
```

## 11. How to build

```bash
npm run build
npm run start
```

## 12. Integration notes for the team lead / integration lead

- Drop `app/hr/pms/**` and `modules/pms/**` into the real WisWits Next.js
  app (or merge `app/hr/pms` into the existing `app/` tree if a different
  route-group structure is already in place).
- Replace `PmsUserProvider`'s mock role switcher with the real
  authenticated-user/session provider once WisWits's auth/RBAC integration
  is available; `hasPermission()` should then be sourced from real session
  permissions rather than `mocks/seed-data.ts`.
- Flip `NEXT_PUBLIC_PMS_USE_MOCK=false` and set `NEXT_PUBLIC_API_BASE_URL`
  once the real `/api/v1/hr/pms/*` endpoints exist.
- No secrets, `.env`, `.env.local`, `node_modules`, or `.next` build output
  are included in this deliverable.

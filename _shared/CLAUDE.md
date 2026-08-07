# CLAUDE.md — WisWits APEX Engineering Constitution

> The enduring source of truth for Claude Code and every developer in this repository.
> Read fully at the start of every session. Do not violate any **LOCKED** constraint.
>
> **Version:** 4.3 · **Owner:** AK Sir (Anil Kumar), Founder & CTO · **Last updated:** 2026-07-21
>
> This file holds STABLE architecture and engineering principles only.
> Fast-changing operational detail lives in the companion docs — see §0.
>
> **v4.0 = the Native-First pivot (ADR-012).** `app.wiswits.com` is now THE product and the
> single system of record. ERPNext / Moodle / Keycloak are **retired to offline reference
> installs** — no longer integrated backends. §2, §3, §4, §6, §7, §17 rewritten accordingly.

---

## 0. Document Set & How To Use This

This is the constitution. It rarely changes. Operational state lives elsewhere:

| File | Purpose | Volatility |
|---|---|---|
| `CLAUDE.md` (this) | Engineering constitution — enduring principles | Low |
| `architecture/ARCHITECTURE.md` | System design detail | Low |
| `architecture/API_STANDARDS.md` | Gateway contracts, versioning, error/caching rules | Medium |
| `architecture/UI_DESIGN_SYSTEM.md` | Components, tokens, UX rules | Medium |
| `process/OPERATIONS.md` | Server ops, deployment procedures, infra | Medium |
| `process/RUNBOOK.md` | Emergency procedures | Medium |
| `QUESTION_BANK_STATUS.md` | Living Question Bank status (chapter/counts) | High |
| `architecture/ADR/ADR-*.md` | Architecture Decision Records — *why* each choice exists | Append-only |
| `CHANGELOG.md` | Version history across the doc set | Append-only |

**Rules of use:**
- Sections marked **LOCKED** are decisions. Changing one requires an ADR and a CHANGELOG entry.
- When two paths exist, resolve the tie with §14 **Engineering Decision Framework**.
- Before shipping, pass the feature through §1 **Product Principles** and §20 **Definition of Done**.
- **Never** put credentials, passwords, or secrets in any doc. See §17 Forbidden Practices.

---

## 1. Product Principles (LOCKED — the decision filter)

Every new feature must satisfy ALL of these. If it fails one, redesign it.

- ✓ Reduces teacher workload
- ✓ Saves administrator time
- ✓ Works without training
- ✓ Mobile-first
- ✓ ≤ 3 clicks whenever possible
- ✓ Beautiful by default
- ✓ No ERP terminology
- ✓ No LMS terminology
- ✓ Never expose technical implementation

**North-star rule:** The school must NEVER feel that it is using ERPNext or Moodle. Every visible pixel belongs to WisWits. We are building a *School Operating System*, not an ERP or LMS wrapped in a new skin. Staff must learn it in one day.

**Company:** WISWITS Edutech Pvt. Ltd. (CIN: U62010RJ2025PTC103180), Khairthal-Tijara, Rajasthan.
**Contact:** +91 99922-99744 · wiswits.edutech@gmail.com · www.wiswits.com

---

## 2. Core Stack (LOCKED — native-first, ADR-012)

| Layer | Technology |
|---|---|
| Product / System of Record | **`app.wiswits.com` — native** |
| Frontend | Next.js (App Router) · PWA · Mobile-Responsive |
| API | WisWits native API (`api.wiswits.com`) — Node.js / Express |
| Authentication | **Native JWT (HS256) + bcrypt** *(Keycloak retired — ADR-012)* |
| Database | **MariaDB** — multi-tenant, `org_id`-scoped, parameterized SQL only |
| Cache / Realtime | Redis · Socket.IO |
| Payments | Razorpay (native) |
| AI Layer | WisWits AI Services |

**Reference-only (NOT integrated, offline snapshots — ADR-012):** ERPNext · Moodle/IOMAD · ERPNext HRMS.
These are **not** sources of truth and carry **no** live customer traffic. A Moodle/ERPNext **connector**
(embedded, feature-flagged, per-tenant) is a *gated future option* — enabled only if a specific customer
needs SCORM/H5P (LMS) or compliance accounting (Finance). Do not build it speculatively.

*Why native-first? See `architecture/ADR/ADR-012-native-first.md`. Infra specifics live in `process/OPERATIONS.md`.*

**Live domains:** `app.wiswits.com` (product) · `api.wiswits.com` (API).
**Retired / offline reference:** `learn.wiswits.com` · `erp.wiswits.com` · `hrms.wiswits.com` (snapshot+offline) ·
`lms.wiswits.com` (wiped) · `login.wiswits.com` (decommissioned, Keycloak retired).

---

## 3. Architecture (LOCKED — native-first, ADR-012)

```
Organization / School
        │
        ▼
WisWits App  (app.wiswits.com — Next.js PWA)
        │   native API only
        ▼
WisWits API  (api.wiswits.com — Express)
        │
 ┌──────┴───────┐
 │              │
MariaDB       Redis + S3
(system of     (cache, realtime,
 record)        files/CDN)

Reference-only, OFFLINE (not in the request path):
   ERPNext · Moodle/IOMAD · ERPNext HRMS
```

### Architecture Principles
1. **API-first** — Frontend talks ONLY to the native WisWits API. Browser NEVER holds DB credentials or secrets, and NEVER reaches the database directly.
2. **Native system of record** — All tenant data lives in the WisWits MariaDB. There are no headless ERP/LMS backends in the live path; reference installs are offline (ADR-012).
3. **Configuration over customization** — Schools enable modules and adjust settings. Never require code changes.
4. **Self-service onboarding** — Sign up → first campus → working, with zero support contact.
5. **Mobile-first** — Every workflow works on phone, tablet, desktop.
6. **Simple by default** — Concise menus. Hide advanced options until needed.
7. **Scalable multi-tenancy** — One organization manages multiple schools; isolated data, centralized admin.
8. **Affordable SaaS** — Automate onboarding, minimize implementation, reduce support overhead.

---

## 4. Native API Responsibilities (LOCKED — exhaustive)

The browser NEVER touches the database or secrets directly. It calls the native WisWits API, which owns ALL of:

- Authentication (native JWT + bcrypt)
- Authorization (permission checks · `org_id` tenant scoping)
- Rate limiting
- Validation
- Response normalization (WisWits-shaped)
- Aggregation & transformation
- Caching
- Logging
- Audit
- Analytics
- Feature flags

No frontend code may ever hold DB credentials, connection strings, or secrets — `.env`/vault only.
If a reference/connector install (ERPNext/Moodle) is ever enabled for a tenant, it is wrapped
**server-side** behind this API — never called from the browser.
*Detailed contract, versioning, and caching rules → `architecture/API_STANDARDS.md`.*

---

## 5. Tenant Hierarchy (LOCKED)

```
Platform (WisWits)
  └─ Organization        ← owns subscription, one login
       └─ School         ← School A / B / C under one org
            └─ Academic Session
                 └─ Class
                      └─ Section
                           └─ Subject
                                └─ Student
```

---

## 6. Database Philosophy (LOCKED — native-first, ADR-012)

**The WisWits native MariaDB is the single system of record for ALL tenant data** — students, staff, fees, attendance, academics, content, assessments, analytics, subscription & billing. It is the **authoritative and only** copy.

Because it is the only copy, **backup/DR discipline is existential** (daily dumps · 30-day retention · separate bucket — see §15). Every tenant row carries `org_id`; queries MUST scope by it.

Reference installs (ERPNext/Moodle) are **NOT synced and NOT sources of truth**. The legacy WisWits↔ERPNext↔Moodle ID-mapping tables and gateway-wrapper code are **deprecated** (mark → migrate → remove, per §15). If a connector is ever enabled, its data flow is one-directional and clearly owned — never a competing source of truth.

---

## 7. Backend Ownership Map (LOCKED — all native, ADR-012)

Everything is owned by the WisWits native platform (MariaDB + Express). ERPNext/Moodle own nothing live.

| Module | Owner | | Module | Owner |
|---|---|---|---|---|
| Authentication | WisWits (native JWT) | | Finance / Fees | WisWits (school-simple) |
| Organizations | WisWits | | Courses / Learn | WisWits (native) |
| Multi-Tenant Mgmt | WisWits | | Learning Content | WisWits (native) |
| Subscription & Billing | WisWits | | Assignments | WisWits (native) |
| School Setup | WisWits | | Quizzes | WisWits (native) |
| Students | WisWits | | Question Bank | WisWits (native) — ADR-011 |
| Staff | WisWits | | Grades / Gradebook | WisWits (native) |
| HRMS / Payroll | WisWits (school-simple) | | Certificates | WisWits (native — to build) |
| | | | Analytics | WisWits (aggregated) |

*Compliance accounting (GST/PF/ESI/TDS) and SCORM/H5P are out-of-scope now; served later via connector if a customer needs them (ADR-012, §16).*

---

## 8. Phase 1 Modules (LOCK — do not add menus beyond these)

Dashboard · Organization · School Management · Admissions · Student Management · Parent Portal · Staff Management *(HRMS APIs)* · HRMS *(ERPNext)* · Academics · LMS *(Moodle APIs)* · Assessment · Communication · Finance · Library · Transport · Hostel · Inventory · Reports · AI Assistant · Settings

*Sub-items per module are enumerated in `architecture/ARCHITECTURE.md`.*

---

## 9. Navigation Rules (LOCKED)

- **Maximum sidebar depth = 2.** Never nest beyond level 2.
- **Maximum 8 items visible** before scrolling.
- Advanced settings hidden until needed.

New surface area goes into an existing module or waits for the gated Future Modules list (§16). Developers must not keep adding menus.

---

## 10. Roles & Permission Philosophy (LOCKED)

Roles: Organization Owner · Organization Admin · Principal · Vice Principal · Academic Coordinator · HR Manager · Accountant · Reception · Teacher · Class Teacher · Student · Parent.

**Inheritance:** Owner → Admin → Principal → Coordinator → Teacher → Student → Parent.
**Rule:** Higher roles inherit lower permissions UNLESS explicitly denied.

*Full scope-per-role table → `architecture/ARCHITECTURE.md`.*

---

## 11. Design System (LOCKED — summary)

| Token | Value |
|---|---|
| Navy | `#0F2147` |
| Gold | `#C8A04E` |
| Ivory | `#F7F4EC` |
| Headings | Playfair Display |
| Body | Source Sans 3 |
| Spacing | 4 · 8 · 16 · 24 · 32 |
| Radius | 8 |

Buttons: Primary/Secondary/Danger only. Cards: one elevation. Icons: outlined. Tables: striped. Forms: 1-col mobile / 2-col desktop.

**White-label rule:** the scrubber in Moodle's *Additional HTML head* must ALWAYS be preserved (golden backups on VPS host — see `process/OPERATIONS.md`).

*Full component/UX spec → `architecture/UI_DESIGN_SYSTEM.md`.*

---

## 12. Cross-Cutting Engineering Rules (LOCKED — summary)

These are enforced everywhere; full detail in the linked docs.

- **UI consistency:** every page = Title · Breadcrumb · Primary Action · Secondary Actions · Search · Filters · Table/Card · Pagination · Help. Nothing else. → `architecture/UI_DESIGN_SYSTEM.md`
- **Loading states:** every API call handles skeleton · empty · error · retry · offline · success. Spinner only if < 1 s. → `architecture/UI_DESIGN_SYSTEM.md`
- **Notifications:** green/red/amber/blue toasts. No `alert()`, no blocking dialogs except destructive actions. → `architecture/UI_DESIGN_SYSTEM.md`
- **Naming:** DB snake_case · API camelCase · components/React PascalCase · constants UPPER_CASE · routes kebab-case.
- **Error codes:** `WW1001` auth · `WW1002` permission · `WW2001` validation · `WW3001` ERP · `WW4001` LMS · `WW5001` unexpected. → `architecture/API_STANDARDS.md`
- **Logging:** levels Debug/Info/Warning/Error/Critical; every request carries Correlation, Tenant, School, User, Trace IDs.
- **Audit:** log Login, Password Reset, Fee Update, Admission, Student Delete, Exam Publish, Report Card Publish, Question Import, API Failure, Role Change, Billing.
- **Security:** CSRF on · rate limiting on · passwords via Keycloak · 2FA ready · uploads virus-scanned · JWT 15 min · refresh 7 days.
- **File storage:** documents S3-compatible · images CDN · Question XML private · student photos private · certificates immutable · backups separate bucket.
- **Performance budget:** dashboard < 2 s · student search < 1 s · attendance save < 500 ms · question generator < 5 s · worksheet PDF < 10 s.
- **AI rules:** never writes to ERP · never deletes · only suggests, human confirms · every output editable · every action logged.
- **Integration policy:** every external service wrapped · versioned · abstracted. Never consumed directly by frontend.
- **Observability:** metrics (CPU, RAM, API latency, error %, DB connections, queue size, disk); alerts via Slack/Email/SMS; pager for critical incidents. → `process/OPERATIONS.md`
- **Caching:** dashboard 30 s · student profile no-cache-after-update · attendance never stale · analytics 5 min. → `architecture/API_STANDARDS.md`
- **Feature flags:** Experimental (hidden) → Beta (pilot schools) → GA (everyone). → `architecture/API_STANDARDS.md`
- **Data lifecycle:** alumni retention, deleted-user handling, archived sessions, file/backup retention are defined once in `process/OPERATIONS.md` — never ad-hoc per developer.

### 12.1 Code-Minimizer Tooling (LOCKED — 2026-07-21)

Agent-side minimizers (e.g. **Ponytail** — `/ponytail`, `/ponytail-review`, `/ponytail-audit`) are permitted and encouraged: they push reuse-before-write and cut AI-generated duplication. They are **prompt-level plugins only** — they install into `~/.claude/`, never into this repo, and are never in the request path of `app.wiswits.com` / `api.wiswits.com`.

**Rules:**

1. **Constitution beats minimizer.** Where a minimizer flags repetition that this document mandates, the constitution wins — always. Non-negotiable, never "deduplicated":
   - all six loading states per API call (§12) · full page layout contract (§12)
   - `org_id` scoping on every tenant query (§6, §17) · parameterized SQL (§17)
   - audit-log calls on every listed action (§12) · role/permission checks (§10)
   - superadmin pages are standalone **by design** — not duplication.
2. **Audit output is a proposal list, never an action list.** `/ponytail-audit` and `/ponytail-review` are read-only findings. Nothing is deleted in the same step it is found.
3. **Deletions follow §15: mark → migrate → remove.** "Looks dead" is a hypothesis. Trace every usage across all roles and tenants first (`docs/BUG_PROTOCOL.md`) before removing anything.
4. **No shortcut past the pipeline.** Minimizer-driven cleanups are ordinary changes: staging first, flow-tested, then the gated prod deploy (§13.1). Being "just a cleanup" earns no exemption.
5. **Intensity:** run at `lite` or `full`. `ultra` is not approved for this repo — its aggression collides with the mandated contracts in rule 1.

---

## 13. Release, Testing & Accessibility (LOCKED)

- **Release flow:** Development → QA → Staging → Pilot → Production. Never deploy directly to production. **JDPS is always last.**
- **Testing:** unit + integration + e2e + smoke, all green before release.
- **Accessibility:** full keyboard nav · WCAG AA contrast · responsive on phone/tablet/desktop.

### 13.1 Code Sync & Deployment Pipeline (LOCKED — 2026-07-19)

**GitHub is the single hub.** All work — from any device — flows through `github.com/wiswits/wiswits-code`. The server never receives code any other way.

```
Mac (~/dev/wiswits-code)  ←──sync──→  GitHub  ←──work──→  Mobile (claude.ai/code)
                                        │
                        ./scripts/deploy-staging.sh <branch>
                                        ▼
                        STAGING — staging-app.wiswits.com
                        (separate dir/ports/DB/pm2 · mock payments ·
                         EVERY feature & module is flow-tested here first)
                                        │  tested & approved by AK Sir
                                        ▼
                        ./scripts/deploy-prod.sh   (main only)
                                        ▼
                        PRODUCTION — app.wiswits.com  (live clients)
```

**Rules:**
1. **Work anywhere, sync always.** On Mac: `./scripts/sync.sh` at session start/end. On mobile (Mac off): claude.ai/code works directly on the GitHub repo. A launchd autobackup runs **every minute** and snapshots the Mac working tree (including uncommitted files) to GitHub `refs/backups/wip-mac` — minute-level history, any minute can be reverted (`git fetch origin refs/backups/wip-mac && git log --first-parent FETCH_HEAD`). Unchanged minutes are skipped instantly (no commit, no network).
2. **Staging first, always.** Every feature/module goes to staging (`./scripts/deploy-staging.sh`) and its full flow is tested there before anything reaches production. Staging is fully isolated: own directory, ports, database, JWT secret, and payments in mock mode (`infra/STAGING_SETUP.md`).
3. **Production is gated.** `./scripts/deploy-prod.sh` only — it enforces: `main` branch, clean tree, GitHub-synced, local build green, a **typed confirmation phrase** (`DEPLOY PROD <date>`), a server-side rollback point, server build green before pm2 reload, and post-deploy health checks with a ready rollback command. Never bypass a gate, never hand-edit the server checkout. Existing clients must never notice a deploy.

---

## 14. Engineering Decision Framework (LOCKED)

When two solutions exist, choose the one that: requires less training · needs fewer clicks · uses configuration not code · scales multi-tenant · works on mobile · can be maintained by a small team.

---

## 15. Deprecation & Disaster Recovery (LOCKED — summary)

- **Deprecation:** APIs versioned; deprecated version supported ≥ 12 months after replacement. DB fields never hard-deleted live — mark → migrate → remove later. UI features removed only after replacement announced.
- **DR:** daily backups; 30-day retention; separate bucket; RPO ≤ 24 h, RTO ≤ 4 h. JDPS restore is rehearsed, never improvised. → `process/RUNBOOK.md`

---

## 16. Future Modules & Non-Goals (LOCKED)

**Gated (only after Phase 1 ships & is stable):** CRM · Hostel AI · Transport AI · Visitor Management · Medical Room · Placement · Alumni · Marketplace.

**Non-goals (WisWits will NOT become):** accounting software · website builder · video hosting · meeting platform · generic ERP · generic LMS.

---

## 17. Forbidden Practices (LOCKED — memorize)

- Never expose DB credentials, connection strings, or secrets to the browser.
- Never reach the database directly from the frontend — the native API only.
- Never treat a reference install (ERPNext/Moodle) as a live data source, or route customer traffic to it.
- Never modify production directly.
- Never hardcode organization IDs; always scope queries by `org_id`.
- Never build SQL by string concatenation — parameterized queries only.
- Never edit JDPS production for testing.
- Never store passwords, tokens, or secrets in code or docs. Use `.env` / the vault.

---

## 18. Glossary

| Term | Meaning |
|---|---|
| Organization | The paying customer; owns the subscription; may hold multiple schools |
| School | A single institution under an Organization |
| Campus | A physical location of a School |
| Session | An academic session (e.g., 2026–27) |
| Academic Year | The calendar span of a Session |
| Batch | A cohort progressing together |
| Class | A grade level (e.g., Class 10) |
| Section | A subdivision of a Class (e.g., 10-A) |
| Subject | A taught subject within a Class |
| Tenant | An isolated data boundary; maps to Organization/School |
| User | Any authenticated person (staff, student, parent) |
| Enrollment | Link between a Student and a Course/Class/Section |
| Course | A Moodle learning course |

---

## 19. Working Conventions (how to respond to AK Sir)

- **Communication:** Hinglish acceptable. Prefer ONE bold recommendation, not a menu.
- **Commands:** paste-ready blocks. NO `#` comments inside paste blocks (breaks Termux paste).
- **Environment:** mobile-first via Termux SSH on iPhone, plus Mac Mini M4.
- **Verification:** every math answer Python/sympy-verified before delivery.
- **Safety-first ops:** before any destructive DB/infra action, state exactly what changes and confirm it will not touch JDPS live data.

---

## 20. Definition of Done (per feature)

A feature is DONE only when:

1. Passes ALL nine Product Principles (§1).
2. Frontend calls the API Gateway ONLY — no direct ERPNext/Moodle/Keycloak calls (§4).
3. No backend-engine terminology leaks into the UI.
4. All six loading states handled; notifications and page layout match the design system (§11–12).
5. Respects tenant hierarchy (§5) and role scope + inheritance (§10).
6. Meets performance budget and security rules (§12).
7. Actions audit-logged with correlation/tenant/school/user/trace IDs (§12).
8. Unit + integration + e2e + smoke tests green; accessibility verified (§13).
9. **Documentation updated; API docs updated if applicable; migration script tested when schema changes.**
10. No secrets committed (§17). JDPS untouched; shipped via the release flow, JDPS last (§13).
11. For Question Bank: post-import count verified, `RESULT: CLEAN.` confirmed (see `QUESTION_BANK_STATUS.md`).

---

## 21. Navigation & Feature-Visibility Lifecycle (LOCKED — 2026-07-25, amended 2026-08-07 by ADR-015)

The sidebar for every customer role is built from **ONE plan**: `apps/web/src/config/navConfig.ts`
(Group → Menu → SubMenu). `DashLayout.buildRoleNav` renders it filtered by role. **Never**
role-namespace a menu route to make something appear — that is the anti-pattern this section exists to kill.

**Module-first routing (LOCKED).** Every feature is ONE canonical, permission-gated page at
`app/(dashboard)/<module>/page.tsx` (it may re-export the module component). Nav `route` values
point at that canonical path (`/crm`, `/fees`, `/people/students`) — **never** at a role path
(`/admin/crm`). Role folders (`admin/<m>`, `principal/<m>`) may exist transitionally and re-export
the canonical page; they are not nav targets. A new module ships its canonical page + a navConfig
entry in the same change.

**The `soon` lifecycle (LOCKED — this is the rule AK set; amended by ADR-015).** A nav item's
`soon: true` means *built but not yet promoted to production*. There are **three** states, and the
sidebar has no "soon" badge in any of them — an unpromoted item is either a normal clickable entry
or it is not there at all:
- **On STAGING** (detected build-time via `IS_STAGING` in `lib/apiUrl.ts`) a `soon` item **that has a
  `route`** is REVEALED — clickable, no badge — so it can be flow-tested.
- **On PRODUCTION, for the PREVIEW ORG** — the platform org and the pilot org
  (`PILOT_ORG_ID`, default 40 *WISWITS QA LAB*, env-overridable; backend
  `src/modules/features/orgTiers.js`) — a routed `soon` item is likewise REVEALED and clickable, so
  the feature is flow-tested on the real deployment before anyone else gets it. The API answers this
  with the boolean `preview_unreleased` on `myFeatures`; the browser never sees an org id.
- **On PRODUCTION, for EVERY OTHER ORG** a `soon` item renders **NOTHING** — no badge, no greyed
  row, no entry. A container menu whose children all vanish vanishes with them. A customer's sidebar
  is what they have, never a preview of what we are building. *(Until ADR-015 this showed a disabled
  "SOON" badge, and a paying school opened their sidebar to eleven of them.)*
- A `soon` item with **no `route`** is genuinely unbuilt: it is hidden everywhere, including staging.
- **Promotion:** once the feature is verified live-tested on prod, **remove `soon: true`** from its
  navConfig entry → it becomes clickable for its `roles` on prod too. That single-flag flip is the
  entire promotion; nothing else changes.

**Never hide an unpromoted entry by switching its module off.** `moduleKey`s are shared across
entries — `staff_hrms` covers My Desk *and* all eight HR & Payroll entries; `learner_records` covers
Groups/Alumni *and* Students; `content` covers Curriculum Setup *and* Lesson Content — so a module
toggle used to hide one new entry blanks live features the school is already paying for. Promotion
state is platform lifecycle; a module is a commercial unit. Never encode one in the other (ADR-015).

**The removal lives in `navResolve.ts`, not in `DashLayout`.** `resolveSidebar` is the ONE walk that
both the live sidebar and the SuperAdmin impact preview run. Two copies of a disappearance rule
drift, and the failure is a preview that confidently promises one thing while a school's sidebar
does another.

**Every item carries the right `roles`.** `roles` lists exactly who the feature is for (owner sees
all; admin↔principal inherit each other). A working page with no navConfig entry for its intended
roles is a **hidden feature** — a bug. When you build or find a page, ensure it has an entry so no
role is left unable to reach a feature meant for it.

**Rule of thumb when adding/finding a page:** canonical route + navConfig entry + correct `roles` +
`soon:true` until prod-blessed. Reachable on staging and for the preview org on prod; invisible to
every customer until one flag goes.

---

*End of CLAUDE.md — the constitution. Keep it stable; push volatile detail into the companion docs listed in §0.*

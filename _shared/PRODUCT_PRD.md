# WisWits — Product Requirements Document (Master)

> **One product. One shape. Every module.**
> This PRD unifies everything — the live platform, the team assemblies, the intern
> repos, the local builds — into a single product definition. Anything that ships must
> fit this document; anything that doesn't fit gets reshaped or rejected.
>
> Companion documents: `FINAL_LAUNCH_PLAN.md` (the execution plan, updated every
> session) · `intake/ROADMAP.md` (intake sequencing) · `CLAUDE.md` (the constitution —
> where this PRD and the constitution disagree, **the constitution wins**).

---

## 1. What the product is

**WisWits is a School Operating System** — `app.wiswits.com` — one login, one sidebar,
every workflow an Indian school runs, from admission enquiry to alumni donation.
Multi-tenant (Organization → School → Session → Class → Section → Student), native-first
(one MariaDB system of record, one Express API, one Next.js PWA — ADR-012).

It is explicitly **not**: an ERP wrapper, an LMS wrapper, accounting software, a website
builder, or a video platform (§16).

**Who pays:** the Organization (school owner/trust). Plans: Prarambh / Pragati / Prakhar /
Param. First real customer: JD Public School (org 50, ₹51,000/yr) — **whatever ships must
never disturb them.**

**How they pay (launch model, LOCKED by AK 2026-08-06):** direct sales — bargain,
onboard, invoice, live. Manual payment + manual org activation IS the launch billing
system. Automated subscriptions/Razorpay come later and must never gate a launch.

## 2. The one rule that makes it one product

Every module — whether written by us, ported from an intern build, or built from an intern PRD —
has exactly the same anatomy. A user cannot tell who built a module or where it came from.

### Module anatomy (the contract)

| Layer | Requirement |
|---|---|
| Backend | `apps/backend/src/modules/<name>/` — routes/controller/service/queries split, descriptor registered in `core/registry.js` MOUNT_ORDER |
| Auth | `middleware/auth.js` (cookie `access_token`) + `middleware/rbac.js` `requirePermission` — never module-local auth |
| Tenancy | Every query `org_id`-scoped from JWT (`req.user.org_id`), parameterized SQL only |
| DB | Migrations in `apps/backend/migrations/NNN_*.sql` — immutable, no `USE`, applied with `up --only` (ledger is unreliable; verify with `scripts/schema_inventory.js`) |
| Permissions | Dot-style keys (`<module>.view` / `<module>.manage`) in the catalog + relational grants (never JSON-only — the JSON store is dead when relational rows exist) |
| Audit | `utils/audit.js` `audit(req, 'ACTION', 'entity', id, {new_data})` on every mutating action |
| Frontend | One canonical page `apps/web/src/app/(dashboard)/<module>/page.tsx` on `ModulePage` + `useCan`; modals OUTSIDE ModulePage (it swallows children in empty state) |
| API client | Module block in `apps/web/src/lib/apiClient.ts` (or per-module `lib/api/<mod>.ts` for new modules) |
| Nav | One `navConfig.ts` entry, correct `roles`, `soon: true` until prod-blessed; promotion = delete the flag (§21) |
| Design | Navy `#0F2147` / Gold `#C8A04E` / Ivory `#F7F4EC`, Playfair + Source Sans, SimLab template, six loading states, no `alert()` — sonner toasts + ConfirmDialog only |
| Copy | Simple English. No Hinglish in product copy. No ERP/LMS jargon. No intern names — credit is "WisWits Tech Team" |
| Tests | Unit + integration (`node --test` style used by intake), cross-tenant 404 test mandatory |
| Done | §20 Definition of Done, all eleven points |

### Module lifecycle (every module, no exceptions)

```
intern team's upstream workspace (upstream)            wiswits-code (this repo)                    prod
┌─────────────────────┐   copy    ┌──────────────┐  port   ┌────────────┐ gate ┌──────┐
│ Modules_Repo + PRDs │ ────────► │ intake/<M>/│ ──────► │ apps/* +   │ ───► │ live │
│ (Khushboo assembles)│           │ code+PRD+    │ 1/cycle │ soon:true  │ AK   │ flag │
└─────────────────────┘           │ STATUS.md    │         │ on staging │ test │ off  │
                                  └──────────────┘         └────────────┘      └──────┘
```

- **`intake/` in this repo is the staging shelf** — inert, never imported by `apps/`.
- **PRD-first:** before porting, diff `PRD/` against `code/` — build what the PRD promises
  only where the code actually delivers it; log gaps in the module's `STATUS.md`.
- **One module per cycle** through the port stage — never batch (bisectability).

## 3. The complete catalog — the "60 modules"

Counted as *customer-visible modules* (internal chrome — auth, telemetry, uploads,
owner console, playbooks — excluded from the 60 but still maintained).

### Domain: People
| # | Module | Today | Source of remaining work |
|---|---|---|---|
| 1 | Students (profiles, lifecycle) | LIVE | — |
| 2 | Staff directory | LIVE | — |
| 3 | Parents + linking | LIVE (linking BE has no nav) | wire parent-link surface |
| 4 | Admissions (CRM pipeline) | LIVE | absorb number-series + doc-checklist ideas from intern builds; REJECT both intern admission modules |
| 5 | Groups (houses/clubs) | soon-gated | flow-test → flag off |
| 6 | Alumni (directory + network + mentorship) | soon-gated, 3 builds to reconcile | one reconciliation: native table + intern port + Neha's mentorship features |
| 7 | Visitor Management | soon-gated, DONE | flow-test → flag off |

### Domain: Academics
| # | Module | Today | Source |
|---|---|---|---|
| 8 | Classes & Sections | LIVE | — |
| 9 | Timetable | LIVE | — |
| 10 | Student Attendance | LIVE | — |
| 11 | Assessments & Exams | LIVE | the Exam Cell build = exam-ops layer (hall tickets, seating, invigilation) to evaluate ON TOP |
| 12 | Report Cards (designer) | LIVE | — |
| 13 | HPC Report Card (NEP holistic) | GAP — intern build ready | `intake/HPC-Report-Card/` |
| 14 | Question Bank | LIVE | — |
| 15 | Quizzes (CBT) | LIVE | mine Coaching build for OMR/batches/doubts later |
| 16 | Worksheets | LIVE | — |
| 17 | Homework Diary | LIVE | — |
| 18 | Curriculum (CIE) | soon-gated | flow-test → flag off (grade-agnostic, changes nothing for schools yet) |
| 19 | Lesson Content (Study Zone) | LIVE | — |
| 20 | Personalised Learning (Recovery) | LIVE (thin) | upgrade with Anil's engine — `intake/Personalised-Learning/` — as "recovery v2", NOT a parallel module |
| 21 | Student Observations | GAP | blocked upstream — the team hadn't assembled |
| 22 | Teaching Canvas | built, no nav | wire or park explicitly |

### Domain: Student Life
| # | Module | Today | Source |
|---|---|---|---|
| 23 | Wellbeing & Happiness (Care Layer) | GAP — build ready | `intake/Wellbeing-and-Happiness/` — best build in portfolio |
| 24 | Events | LIVE | — |
| 25 | Gallery | LIVE | — |
| 26 | Calendar | LIVE | — |
| 27 | Library | LIVE | diff intern build; port only real gaps |
| 28 | Transport | LIVE | — |
| 29 | Hostel Management | GAP — build ready | `intake/Hostel-Management/` — most mature intern build |
| 30 | Medical Room | HOLD | §16-gated — AK's explicit call required |

### Domain: Staff & HR
| # | Module | Today | Source |
|---|---|---|---|
| 31 | Staff Attendance (geofence) | LIVE | biometric contract = future device-sync layer |
| 32 | Staff Leaves | LIVE | — |
| 33 | Work Reports & Scorecards | LIVE | — |
| 34 | Payroll | placeholder tab | the ONE real HR gap — scope from Neha's build + the payroll contract, payroll only |
| 35 | Performance Mgmt (PMS) | thin | scope a school-sized version from the HR-PMS intern build (not corporate HR) |
| 36 | Recruitment | GAP — intern build ready | `intake/Recruitment-Management/` |
| 37 | EMPS extras (tasks/meetings/chat) | GAP (partial) | only the missing pieces from `intake/EMPS-Employee-Productivity/` |
| 38 | Utilization | HOLD | blocked upstream, low priority |

### Domain: Finance
| # | Module | Today | Source |
|---|---|---|---|
| 39 | Fee Structures & Assignment | LIVE | — |
| 40 | Fee Collection & Ledger | LIVE | — |
| 41 | Fee Gateway (school collects online) | config exists | verify end-to-end before marketing |
| 42 | Asset & Inventory | GAP — build ready | `intake/Asset-and-Inventory/` |
| 43 | Our SaaS Billing | **manual at launch (LOCKED by AK)** | Sales = bargain → onboard → invoice → live. Owner console invoices + manual org activation are the launch path; automated Razorpay subscriptions stay post-launch. Billing must never block a launch. |

### Domain: Communication & Community
| # | Module | Today | Source |
|---|---|---|---|
| 44 | Announcements & Messages | LIVE | the Communication contract = likely redundant; confirm then close |
| 45 | WhatsApp | LIVE | — |
| 46 | Notifications | LIVE (chrome) | — |
| 47 | Feedback Surveys | LIVE | — |
| 48 | Helpdesk / Report-an-Issue | LIVE | — |

### Domain: Intelligence & Platform
| # | Module | Today | Source |
|---|---|---|---|
| 49 | Dashboard + Widgets | LIVE | — |
| 50 | Analytics | LIVE | — |
| 51 | Reports & Exports | LIVE | — |
| 52 | AI Tools (5 tools) | LIVE | — |
| 53 | AI Config (BYOK) | LIVE | — |
| 54 | Custom Fields | LIVE | — |
| 55 | Public Forms | LIVE | — |
| 56 | Certificates | LIVE | intern build = REJECT (cherry-pick nothing unless diff proves otherwise) |
| 57 | Org Settings & Branding | LIVE | — |
| 58 | School/Branch Mgmt | BE built, thin surface | wire the surface |
| 59 | Onboarding (self-serve apply→provision) | LIVE | — |
| 60 | Module Mgmt (features on/off per org) | built, dark | the control plane — promote for owner/admin |

**Out of catalog (explicit):** SQAAF (not Phase-1), Registration & Admission intern
modules (duplicates — rejected), Communication Administration (pending redundancy
confirmation), Medical Room (gated), Utilization (blocked + low value).

## 4. Uniformity backlog (product-wide, not per-module)

These make 60 modules feel like ONE product; they are launch-scope:

1. **Reachability truth** — no module that works is invisible; no menu item that dies.
   Every navConfig entry resolves; every canonical page has an entry (§21 test gates green).
2. **One design system** — SimLab template everywhere; kill the second styling system
   (per UI-surface-inventory: `ModulePage.tsx` is the highest-leverage file).
3. **One dialog system** — zero native `alert()/confirm()` anywhere.
4. **Role integrity** — every custom role lands on a sane home route; every module's
   `roles` list audited against §10 inheritance. Verify as each role, not just admin.
5. **Money integrity** — one answer for every money question (`feeLedger`,
   `billableTotal()`); refunds/periods can never double-count.
6. **Tenant isolation** — cross-tenant test per module; `org_id` on every query.
7. **Migration truth** — every migration in the ledger OR verified by
   `schema_inventory.js`; no unapplied-migration "ghost features."

## 5. Non-functional launch bar

- Performance budget (§12): dashboard < 2s, search < 1s, attendance save < 500ms.
- Six loading states on every API call; offline-tolerant PWA shell.
- WCAG AA contrast; full keyboard nav on forms.
- Daily DB dumps, 30-day retention, restore rehearsed (§15).
- JWT 15min/refresh 7d; rate limiting per-user (not per-school-IP); uploads virus-scanned.
- Audit log on all §12-listed actions with correlation/tenant/school/user IDs.

## 6. Release discipline (unchanged, non-negotiable)

Dev → staging (`deploy-staging.sh`, isolated DB, mock payments) → AK flow-test per role →
gated prod (`deploy-prod.sh`: main-only, clean tree, typed phrase, rollback point,
health checks). Never hand-edit the server. JDPS never notices a deploy.

---

*Owner: AK Sir. Maintained by every session that touches product scope. Last updated:
2026-08-06 — first unified edition.*

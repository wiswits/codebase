# De-duplication report — 2026-08-12

**Goal:** one canonical copy per file (no module duplicacy), organised as
**Core → Shared → Module**, before per-module refinement.

## Result
- **24 cross-module duplicate prod-code files → 0.**
- Shared-domain code collapsed to `_shared/domains/{hr,payments,blueprints,fees}/`.
- Borrowed frontend pages removed from modules 08 & 11 (owners keep them).
- 14 modules got a `code/SHARED_CODE.md` pointer.

## Moves (canonical now under _shared/domains/)
| Domain | Files | Was copied in |
|---|---|---|
| hr | 6 backend + 2 web | 31, 33, 35, 37 (+ 32, 34 web) |
| payments | 5 backend | 41, 43 |
| blueprints | 3 backend | 57, 58 |
| fees | fees.routes.js + fees/page.tsx | 39, 40 |

## Owner-based removals (frontend, borrower → owner)
| Page | Owner (kept) | Removed from |
|---|---|---|
| academics/curriculum (+setup) | 18-Curriculum-CIE | 08 |
| academics/timetable | 09-Timetable | 08 |
| assessment/question-bank | 14-Question-Bank | 11 |
| assessment/quizzes | 15-Quizzes-CBT | 11 |
| assessment/report-cards | 12-Report-Cards | 11 |

## Deliberately NOT touched
- `intake/` intern builds' framework boilerplate (`eslint.config.js`,
  `postcss.config.js`, `next-env.d.ts`) — inherent to each scaffold.
- Metadata templates (`NOTE.md`, `SNAPSHOT.md`) and empty stub files.
- `erp/` per-module routes (already unique: students/classes/parents/…).

## Next
Refine each module one by one (full & final) on top of this clean base.

# Intake sources — where each intern build came from

Every module the intern team has built or spec'd — from the EduSuite repo, from their
personal repos, and from the local `INTERNS WORK/` folder — so we can track exactly
what's PRD, what's built, and what's already native.

**These are reference copies only.** Nothing here is wired into `apps/`, part of any
build, or shipped to a browser.

## Where they live now

There is no `EduSuite/` folder any more. Each of the 26 builds sits **inside the module
it belongs to**, so no module is ever two folders:

```
MODULES/NN-<Module-Name>/
  intake/<EduSuite-Module-Name>/
    code/            the actual build (or code-incoming/ where it was never assembled)
    PRD/             the spec — either Khushboo's full PRD+CTO+Engineering+Analysis set,
                      or the original pre-build CONTRACT.md where no PRD exists yet
    STATUS.md         one-page verdict: native equivalent, reachability, priority
```

`MODULES/README.md` maps all 26 to their slot. Three slots hold two builds each
(06-Alumni, 34-Payroll, 04-Admissions-CRM) — those are the reconciliations still owed.

## Where this came from

- **12 modules** ported from `Modules_Repo` / `Modules_Repo_PRD` in the EduSuite repo
  (originally scattered across `Internship26_jatin`, `internship_ankit`, `HMS_ankit`,
  `Internship26_khushboo`, `Internship26_neha`, `Internship26_sunidhi`,
  `edusuite-certificates`, plus two modules — Wellbeing and Personalised Learning — that
  only ever existed locally in this repo's `INTERNS WORK/` folder, never pushed to GitHub).
- **7 modules** already assembled directly in the EduSuite repo (Alumni Directory, Event
  Management, HPC Report Card, HR-PMS, Recruitment Management, Registration Management,
  Visitor Management) — code pulled from their `final/` build, PRD is their original
  engineering contract (Khushboo's newer PRD format hasn't been run on these yet).
- **2 modules** EduSuite has a contract for but hasn't assembled — Student Observations and
  Utilization Management are still sitting as unmerged per-developer folders
  (`code-incoming/`), not a working build.
- **5 modules** are contract-only, zero code anywhere — Biometric Attendance, Communication
  Administration, HR Payroll, Medical Room, SQAAF.

`INTERNS WORK/` in wiswits-code is NOT duplicated a second time here — its content is
already inside `23-Wellbeing-and-Happiness/intake/…/code/`,
`20-Personalised-Learning-Recovery/intake/…/code/`, `56-Certificates/intake/…/code/`,
`37-EMPS-Extras/intake/…/code/`, `42-Asset-and-Inventory/intake/…/code/` and
`27-Library/intake/…/code/` verbatim.

## How to use this before building anything

1. Open the module's own `MODULES/NN-<Module>/STATUS.md` first — its Intake table says
   MERGED or PENDING and exactly what is in the way. Then open the intern-side
   `intake/<Build>/STATUS.md` for their verdict.
2. If the verdict is a genuine gap, read `intake/<Build>/PRD/` and diff it against what's
   actually in `intake/<Build>/code/` — the PRD is the spec, the code is what was actually
   delivered, they are not always the same thing.
3. Follow the existing intake pipeline (`docs/pipeline/INTAKE_STANDARD.md`,
   `docs/pipeline/INTAKE_CHECKLIST.md`, `scripts/intake/check-module.sh`) to port — this is
   a port-to-format, not a cut-paste, same as Event/Alumni/Visitor before it.
4. See `MODULES/INTAKE_ROADMAP.md` for the full sequencing plan across all 26.

Full visual cross-reference: the "WisWits × EduSuite — Complete Module Catalog" artifact.

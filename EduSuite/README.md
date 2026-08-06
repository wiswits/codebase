# EduSuite — Intake Staging

Every module the intern team has built or spec'd — from the EduSuite repo, from their
personal repos, and from the local `INTERNS WORK/` folder at this repo's root — collected
here in one place, one folder per module, so we can track exactly what's PRD, what's built,
and what's already native before anything gets merged into the live product.

**This folder is reference/staging only.** It is not wired into `apps/`, not part of any
build, and ships nothing to a browser. It exists so intake work has one home instead of
five repos.

## Layout

```
EduSuite/
  <Module-Name>/
    code/            the actual build (or code-incoming/ if EduSuite hasn't assembled it yet)
    PRD/             the spec — either Khushboo's full PRD+CTO+Engineering+Analysis set,
                      or the original pre-build CONTRACT.md where no PRD exists yet
    STATUS.md         one-page verdict: native equivalent, reachability, priority
```

26 modules, all with a `STATUS.md`. Start there before opening `code/` or `PRD/`.

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

`INTERNS WORK/` at the repo root is NOT duplicated a second time here — its content is
already inside `Wellbeing-and-Happiness/code/`, `Personalised-Learning/code/`,
`Certificates-and-Documents/code/`, `EMPS-Employee-Productivity/code/`,
`Asset-and-Inventory/code/` and `Library-Management/code/` verbatim.

## How to use this before building anything

1. Open `<Module>/STATUS.md` first. It tells you the native equivalent (if any), whether
   it's reachable today, and the verdict — build it, dedup it, reject it, or it's blocked
   upstream.
2. If the verdict is a genuine gap, read `PRD/` and diff it against what's actually in
   `code/` — the PRD is the spec, the code is what was actually delivered, they are not
   always the same thing.
3. Follow the existing intake pipeline (`docs/pipeline/INTAKE_STANDARD.md`,
   `docs/pipeline/INTAKE_CHECKLIST.md`, `scripts/intake/check-module.sh`) to port — this is
   a port-to-format, not a cut-paste, same as Event/Alumni/Visitor before it.
4. See `EduSuite/ROADMAP.md` for the full sequencing plan across all 26.

Full visual cross-reference: the "WisWits × EduSuite — Complete Module Catalog" artifact.

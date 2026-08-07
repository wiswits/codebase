# wiswits/codebase — the WisWits Module Library

**Every module the company has ever thought of or built — one beautiful,
module-oriented structure.** This is where modules get ENHANCED one by one; from here
each one either ships into `wiswits-code` (the live platform) or gets packaged and
sold individually. The most solid, most beautiful structure wins.

## The library workflow

```
        enhance here, module by module
                    │
  wiswits/codebase ─┤──► port into wiswits-code (staging → prod)   [platform path]
                    │
                    └──► package standalone                        [individual-sale path]
```

## What's inside

**One folder per module — `MODULES/`. Nothing appears twice.** All 60 customer-visible
modules of app.wiswits.com with the code **exactly as prod runs it today** (prod commit
`31210d4e`, snapshot 2026-08-06), plus a 61st slot for SQAAF, which has no native
counterpart.

> **This repo is a SAFE COPY, never the workplace.** The live code is in
> `wiswits/wiswits-code` → `apps/`. All fixes and features happen THERE, through its
> staging→prod gates. This repo exists so that whatever happens during integration work,
> today's working platform is preserved, browsable, and restorable module by module.

```
MODULES/
  NN-<Module-Name>/
    STATUS.md      what it is, domain, status, features + the Intake table
    CODE_MAP.md    where the LIVE code lives in wiswits-code
    PRD/PRD.md     the spec — purpose, roles, workflow, scope
    code/          frozen snapshot from prod commit 31210d4e (or NOTE.md for gaps)
    intake/        the intern/EduSuite build for THIS module — only where one exists
      <EduSuite-Module-Name>/   STATUS.md + PRD/ + code/
  README.md            the index — all 61, with each one's intake state
  INTAKE_ROADMAP.md    sequencing plan for porting the pending intern builds
  INTAKE_SOURCES.md    where each intern build came from
_shared/           registry, navConfig, apiClient, moduleRegistry + constitution,
                   PRODUCT_PRD, FINAL_LAUNCH_PLAN — the cross-module contract files
```

**The 26 intern/EduSuite builds are not a separate shelf any more.** Each one now sits
inside the module it belongs to, as `intake/`. Alumni used to be three folders; Payroll
two; Events, Visitors, Wellbeing and Personalised Learning each had a second folder for
something already inside the product. That duplication is gone — 5 builds are **MERGED**
(their logic is running or ready to run) and 21 are **PENDING**, each with its blocker
written down in its module's `STATUS.md`.

So this ONE repo holds the complete picture in ONE list: every module in the company,
what prod runs, and what is still waiting in line behind it.

**Working vs backup, clearly:** everything here is a SAFE COPY — browsable, diffable,
restorable, but not runnable from this repo (no monorepo wiring). The runnable platform
is `wiswits/wiswits-code` only.

Full-tree restore points also exist as git tags in wiswits-code:
`safe/prod-2026-08-06` (= 31210d4e, what prod runs) and `safe/main-2026-08-06`.
One command brings everything back — this repo is the browsable, per-module view of
the same safety.

Refresh policy: re-snapshot after each prod deploy that changes module code
(one script run), so this copy always answers "what does prod run?"

## Library index (sister collections, own repos)

- `wiswits/wiswits-code` — THE runnable platform (live product; all real deploys)
- `wiswits/EduSuite` — intern team's upstream workspace (assemblies + Modules_Repo + PRDs)
- `wiswits/activities` — 499 activities · 65 tools · 20 labs (layout-is-the-schema)
- `wiswits/academics` — all teaching content (chapter.md front-matter state)

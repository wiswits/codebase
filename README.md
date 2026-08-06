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

**Module-by-module snapshot of app.wiswits.com** — all 60 customer-visible modules of
wiswits-code, one folder each, with the code **exactly as prod runs it today**
(prod commit `31210d4e`, snapshot 2026-08-06).

> **This repo is a SAFE COPY, never the workplace.** The live code is in
> `wiswits/wiswits-code` → `apps/`. All fixes and features happen THERE, through its
> staging→prod gates. This repo exists so that whatever happens during integration work,
> today's working platform is preserved, browsable, and restorable module by module.

```
WisWits-Modules/
  NN-<Module-Name>/
    STATUS.md      what it is, domain, status, features
    CODE_MAP.md    where the LIVE code lives in wiswits-code
    PRD/PRD.md     the spec — purpose, roles, workflow, scope
    code/          frozen snapshot from prod commit 31210d4e (or NOTE.md for gaps)
_shared/           registry, navConfig, apiClient, moduleRegistry + constitution,
                   PRODUCT_PRD, FINAL_LAUNCH_PLAN — the cross-module contract files
EduSuite/          ALL 26 intern/EduSuite modules — each with code/ + PRD/ + STATUS.md
                   (the intake shelf: builds waiting to be ported into wiswits-code)
```

So this ONE repo now holds the complete picture: the 60 native modules as prod runs
them, AND the 26 intern builds waiting in line — every module in the company, one
beautiful structure.

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

# wiswits/codebase — the safe, organized copy

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
```

Full-tree restore points also exist as git tags in wiswits-code:
`safe/prod-2026-08-06` (= 31210d4e, what prod runs) and `safe/main-2026-08-06`.
One command brings everything back — this repo is the browsable, per-module view of
the same safety.

Refresh policy: re-snapshot after each prod deploy that changes module code
(one script run), so this copy always answers "what does prod run?"

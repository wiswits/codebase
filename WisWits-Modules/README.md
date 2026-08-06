# WisWits-Modules — the native catalog

The same beautiful structure as `EduSuite/`, for OUR OWN platform: all 60
customer-visible modules of wiswits-code, one folder each, numbered by the
`PRODUCT_PRD.md` catalog.

**One deliberate difference from EduSuite/:** there is no `code/` copy here. The live
code already lives in `apps/` — a photocopy would go stale the day after it was made and
tempt someone to edit the wrong tree. Instead every module has a **`CODE_MAP.md`**: the
exact live paths, one click away. EduSuite modules need a code copy because their source
is external; ours doesn't because the source is this very repo.

```
WisWits-Modules/
  NN-<Module-Name>/
    STATUS.md      what it is, domain, status, features
    CODE_MAP.md    where the LIVE code is (never a copy)
    PRD/PRD.md     the spec — purpose, roles, workflow, scope, inherited requirements
```

## The 60 by domain

| Domain | Modules |
|---|---|
| People | 7 |
| Academics | 15 |
| Student Life | 8 |
| Staff & HR | 8 |
| Finance | 5 |
| Communication | 5 |
| Intelligence | 5 |
| Platform | 7 |

## How this relates to everything else

- `PRODUCT_PRD.md` (root) — the master catalog these 60 folders expand.
- `EduSuite/` — the intake staging shelf; where a module here says "source:
  EduSuite/<X>", that's the build waiting to be ported into it.
- `FINAL_LAUNCH_PLAN.md` — what's being done, in what order.

**Prod safety:** this folder is documentation only — nothing imports it, nothing builds
it, and it lives on the intake branch until AK merges. Prod cannot be affected by it.

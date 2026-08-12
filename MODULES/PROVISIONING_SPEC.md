# Provisioning spec — CORE + org-wise modules

The blueprint for: **onboard an org → pick modules → give exactly those** (plus
what they need to work), on a locked CORE base. Pricing is out of scope here —
this is the technical provisioning only.

Machine-readable graph: `_shared/module-graph.json`.

## 1. Standard CORE (locked-on for every org)
Cannot be turned off (`platform_institution_modules.status = 'core'`). The base
every org gets:

- **Identity/enrolment spine:** auth+roles · 01-Students · 03-Parents-and-Linking · 08-Classes-and-Sections
- **Org control plane:** 57-Org-Settings · 58-School-Branch · 59-Onboarding · 60-Module-Management
- **Everyday base:** 44-Announcements · 46-Notifications · 49-Dashboard · 54-Custom-Fields

Everything else is a toggleable module.

## 2. How selection works (already in the code)
Per-org module state lives in `client_feature_flags`, gated by
`middleware/moduleGate.requireModule`, driven by `60-Module-Management`:

- `platform_modules` — the catalog (module_key, name, category)
- `platform_institution_modules(institution_type, module_key, status)` — `core | off | (available)` per org-type
- `platform_plan_modules(plan_slug, module_key, granted)` — plan grants
- `platform_features(feature_key, module_key)` → `client_feature_flags(org_id, feature_key, is_enabled)`

Toggle = `POST /api/features/my-modules/toggle` (`toggleMyModule`) — enables every
feature of the module for that org. CORE off → 409; not-in-plan on → 402.

## 3. The missing piece — dependency closure
A subset must be **dependency-closed** or a module renders empty (Report-Cards
with no Assessments, Quizzes with no Question-Bank). The graph in
`_shared/module-graph.json` supplies each module's `dependsOn`.

**Enable closure (on turning a module ON):**
```
enable(org, M):
  need = transitiveDeps(M) ∪ {M}          # from module-graph.json
  for D in need (deps first):
     if status(org,D)=='core': continue    # already on
     if not planGrants(org,D):              # dep not in plan
        -> block with "Enabling M also needs D — not in your plan"
           (or, if policy allows, auto-grant D)
     writeFlags(org, D, on)
```

**Disable guard (on turning a module OFF):**
```
disable(org, M):
  dependents = { X enabled : M ∈ transitiveDeps(X) }
  if dependents non-empty:
     -> block "Turn off X first (it needs M)"
  writeFlags(org, M, off)
```

**Onboarding:** the picker calls enable-closure for the chosen set in one step;
the org lands on CORE + chosen + their closure.

## 4. Worked examples
| Client picks | Closure adds | Enabled (besides CORE) |
|---|---|---|
| 09, 11, 40 | 39 | 09 · 11 · 39 · 40 |
| 10, 15, 56 | 14 | 10 · 14 · 15 · 56 |
| 12 (Report-Cards) | 11 · 10 | 10 · 11 · 12 |

## 5. Cluster note
`hr`, `payments`, `fees` share one code folder. Enabling one cluster member
mounts the shared code for all; the graph still gates each as a separate
feature so an org can show only the surfaces it bought.

## 6. What's built vs to-build
- ✅ Per-org gating, plan gate, CORE lock, toggle, add-on grants — **exist**.
- ⬜ `dependsOn` graph + closure/guard in toggle + CORE seed — **this spec**
  (see `LIVECODE_PR_PLAN.md` for the exact wiswits-code changes).

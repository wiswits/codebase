# Live-code PR plan — dependency-closed module provisioning

Target repo: **wiswits/wiswits-code** (NOT this safe copy). Turns the existing
per-org toggle into a dependency-aware one, and locks Standard CORE.

Grounded in the real code: `apps/backend/src/modules/features/` +
`platform_modules` / `platform_institution_modules` / `platform_plan_modules` /
`platform_features` / `client_feature_flags`. Source of the graph:
`_shared/module-graph.json`.

## PR 1 — schema + seed (data, low risk)
1. **Dependency table**
   ```sql
   CREATE TABLE platform_module_deps (
     module_key     VARCHAR(64) NOT NULL,
     depends_on_key VARCHAR(64) NOT NULL,
     PRIMARY KEY (module_key, depends_on_key)
   );
   ```
   Seed from `module-graph.json` (map NN-names → real `module_key`s first — one
   lookup against `platform_modules.name`).
2. **Lock Standard CORE** — for every `institution_type`:
   ```sql
   INSERT INTO platform_institution_modules (institution_type, module_key, status)
   VALUES (:type, :coreKey, 'core')
   ON DUPLICATE KEY UPDATE status='core';
   ```
   `coreKey` ∈ the Standard CORE set (spine + org control plane + announcements/
   notifications/dashboard/custom-fields).
3. Backfill check: no CORE module_key may also appear as someone's `depends_on`
   that is off — CORE is always on, so closure treats it as satisfied.

## PR 2 — closure in the toggle (behaviour)
File: `apps/backend/src/modules/features/features.controller.js`

- Add a helper `transitiveDeps(module_key)` reading `platform_module_deps`
  (cache it; invalidate with the existing `clearPlanCache()`).
- In **`toggleMyModule`** (enabling branch, after the plan check):
  - compute `need = transitiveDeps(key) \ core`;
  - for each dep not granted by plan → return `402` with
    `{ needs: [depKey...] }` (or auto-enable if org policy allows);
  - enable features for `need ∪ {key}` in one transaction (loop the existing
    `client_feature_flags` upsert per module's `platform_features`).
- In **`toggleMyModule`** (disabling branch):
  - `dependents = enabled modules whose transitiveDeps include key`;
  - if non-empty → `409 { blockedBy: [...] }` ("turn those off first").
- Extend **`myModules`** response: add `depends_on` and `required_by` per module
  so the web UI can show "enabling X also enables Y" and grey-out unsafe toggles.

## PR 3 — onboarding one-shot
File: onboarding flow (`apps/backend/src/modules/onboarding/…`) + admin picker UI
- On finish, call the closure-enable for the chosen module set in a single
  transaction → org lands on CORE + chosen + closure.
- Web: the module picker calls `myModules` (for deps/labels) and posts the set;
  show the auto-added dependencies before confirm.

## Ordering / rollout
1. PR 1 (schema+seed) — deploy, verify CORE shows locked for all org-types.
2. PR 2 (closure) — behind a flag; test with the worked examples in
   `PROVISIONING_SPEC.md §4`.
3. PR 3 (onboarding) — wire the picker last.

## Test matrix (min)
- Enable Report-Cards alone → auto-enables Assessments + Attendance.
- Enable Quizzes alone → auto-enables Question-Bank.
- Disable Question-Bank while Quizzes on → blocked (409).
- Turn off a CORE module → 409 (unchanged).
- Enable a module not in plan → 402 with `needs`.
- Two org-types, different CORE seed → each locked correctly.

## Not in scope
Pricing/plan bundles (planGate already exists; tiers are a later business call).
No route/registry changes — `registry.dependsOn` stays for mount-order only; the
provisioning graph lives in `platform_module_deps`, a different namespace.

# cms module — Content CMS (content factory v2)

**Owns:** the org-scoped content taxonomy (Class → Subject → Chapter → Topic),
runtime-extensible content types, content assets with the
draft → in_review → (changes_requested)* → approved → published → archived
workflow, media **metadata** (external URL primary; attachments via the existing
uploads pipeline), and content work assignments.
**Distinct from `/api/content-dev`** (the v1 platform content factory) — no shim,
no shared tables; migration from `platform_content` is a future PR.

**Tables:** `client_cms_classes|subjects|chapters|topics` · `client_cms_types` ·
`client_cms_assets|media|assignments|review_log|versions` (migrations 013–014;
manual-only down scripts in `migrations/down/`).

## Routes (prefix → file; specific prefixes mount BEFORE bare /api/cms)

- `/api/cms/assets` → `assets.routes.js` — list/read (cms.asset.view) ·
  `POST /` (cms.asset.create) · `PATCH /reorder` (cms.reorder — declared before
  `/:id`) · `PATCH /:id` (cms.asset.update_own or update_any) ·
  `POST /:id/submit|review|publish|archive` (their own keys; review has SoD) ·
  `GET /:id/versions`, `POST /:id/restore/:versionId` · `POST /:id/move`
  (cms.reorder; published needs `confirm_published:true`)
- `/api/cms/media` → `media.routes.js` — `POST /external` (provider allowlist:
  youtube/vimeo/drive/direct-https; canonicalized, oEmbed best-effort 3s) ·
  `POST /attach` (storage_key from the existing uploads pipeline, ≤100MB) ·
  `PATCH /reorder` · `DELETE /:id` — all rights via the parent asset.
- `/api/cms/assignments` → `assignments.routes.js` — `POST /`, `GET /`,
  `PATCH /:id` (cms.assign) · `GET /me`, `PATCH /:id/status` (assignee-only).
- `/api/cms` → `taxonomy.routes.js` — drill-down reads (cms.view) · creates/
  renames (cms.taxonomy.manage) · `GET /topics/:id` (workspace breadcrumb) ·
  `PATCH /reorder` (bulk, transactional, same-parent + same-org validated) ·
  `/types` CRUD (cms.type.manage).

## Invariants (tested in tests/hr-cms-tamper.test.js + cms-cross-org.test.js)

- **Asset codes are LOCKED**: `{SUBJ}{CLASS}C{NN}T{NN}` (e.g. MATH10C05T02),
  generated server-side on create, immutable forever. Any payload carrying
  `asset_code`/`asset_code_prefix` is **rejected (400)**, not silently stripped.
- Server-managed on assets: `status`, `version`, `view_count`, authorship and
  every workflow stamp. Re-parenting only via `/move`.
- **LaTeX rules**: `$...$` rejected at validation (400); `\frac` returns a
  `\dfrac` warning. Applied to every string in `payload`.
- **SoD**: a reviewer can never review their own asset — even elevated roles.
- Published content never silently moves (`confirm_published` required).

## Rollback / kill-switch (corrected after the Step-5 schema capture)

**Do NOT plan on `platform_features.status='suspended'` — that value cannot be
stored** (prod ENUM is live/beta/coming_soon/planned only — SUG-0084). Working
kill-switches: per-org `client_feature_flags.is_enabled=0` (instant, no deploy);
global `status='planned'` (valid, org-1-visible only); code-level = remove the
`cms.*` MOUNT_ORDER entries + module folder in one revert. DB rollback:
`migrations/down/013–014` (manual-only, see that folder's README).

## Gotchas

- **Express 5**: `path-to-regexp` v8 rejects `:id(\d+)` — plain params; declare
  literal paths (`/reorder`, `/types`, `/topics/:id`) before parameterized ones.
- Known gap: no base `schema.sql` in repo — `scripts/dump-schema.sh` on the
  server is the fix; local envs bootstrap ad-hoc until then.
- Seeds: taxonomy `scripts/seed_cms_class10_maths.js` · permissions
  `scripts/migrations/015_hr_cms_permission_catalog.js` · sidebar
  `scripts/hr_cms_features_migration.js`.

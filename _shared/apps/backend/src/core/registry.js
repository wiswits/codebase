/**
 * Module registry loader (Phase 3 — replaces the hand-wired server.js mounts).
 *
 * Each domain folder ships a `<domain>.module.js` exporting one descriptor or
 * an array of descriptors:
 *
 *   { name: 'erp.students',            // unique, 'domain.router'
 *     prefix: '/api/students',         // mount path
 *     router: require('./students.routes'),
 *     middleware: [],                  // optional, mounted before the router
 *     dependsOn: [],                   // optional, declarative only (validated)
 *     stage: 'routes' }                // 'preLimiter' | 'routes' (default) | 'tail'
 *
 * Mount order comes ONLY from the explicit MOUNT_ORDER list below — never from
 * filesystem/glob order. It mirrors the hand-wired server.js order exactly and
 * grows one name at a time as mounts migrate. Stages preserve the three
 * order-critical slots: before the general limiter (manifest), the main routes
 * block, and the bare-/api tail (lifecycle, parent-link — mounted last).
 *
 * The loader hard-fails at boot (fail fast) on:
 *   - duplicate descriptor name
 *   - name in MOUNT_ORDER with no discovered descriptor
 *   - discovered descriptor missing from MOUNT_ORDER (the "unmounted module"
 *     bug class — a module file that silently never mounts)
 *   - dependsOn referencing an unknown name
 *   - malformed descriptor (bad name/prefix/router/middleware/stage)
 */
const fs = require('fs');
const path = require('path');

const STAGES = ['preLimiter', 'routes', 'tail'];

// Explicit global mount order — mirrors the pre-migration server.js order
// exactly (proven byte-identical against scripts/routes.baseline.txt).
// COMPLETE since B9: all 64 mounts. To add a module, see
// docs/BACKEND_MODULE_REGISTRY.md — create <domain>.module.js, then add the
// descriptor name here (position = registration order within its stage).
const MOUNT_ORDER = [
  // B9 — preLimiter stage (mounts before the general rate limiter)
  'org.manifest',     // /api (GET /manifest — reachable even when rate-limited)
  'telemetry.crash',  // /api/client (POST /crash — reachable even when rate-limited)
  // B1
  'auth.auth',        // /api/auth (authLimiter)
  'auth.roles',       // /api/roles
  // B2
  'erp.parents',                  // /api/parents
  'erp.student-portal',           // /api/student-portal
  'erp.timetable',                // /api/timetable
  'erp.assessments',              // /api/assessments
  'erp.reportcards',              // /api/reportcards
  'erp.assignments',              // /api/assignments
  'dashboard.home',               // /api/home
  'notifications.notifications',  // /api/notifications
  // B3
  'branding.branding',            // /api/branding
  'ai-config.ai-config',          // /api/ai-config
  'recovery.recovery',            // /api/recovery
  'ai-tools.ai-tools',            // /api/ai-tools (aiRateLimit + sanitizeAiBody)
  'content.content',              // /api/content
  'resources.resources',          // /api/resources
  'content-dev.content-dev',      // /api/content-dev
  'settings.settings',            // /api/settings
  // B4
  'feedback.feedback',            // /api/feedback
  'certificates.certificates',    // /api/certificates
  // Public verification MUST precede the admin surface: Express matches mounts in
  // registration order, and /api/cert-mgmt would otherwise swallow
  // /api/cert-mgmt/public/* into a router that starts with authenticate().
  'certificates.certmgmt-public', // /api/cert-mgmt/public (UNAUTHENTICATED by design)
  'public-forms.public',          // /api/public/forms (UNAUTHENTICATED intake — own limiter, T2.6)
  'certificates.certmgmt',        // /api/cert-mgmt
  'blueprints.institution',       // /api/institution (prefix≠folder, intentional)
  'gallery.gallery',              // /api/gallery
  'polish.polish',                // /api/polish
  'crm.crm',                      // /api/crm
  'owner.owner',                  // /api/owner (platform-owner surface)
  'plans.plans',                  // /api/plans (platform-owner surface, DISPLAY catalog)
  'pricing.pricing',              // /api/pricing (the pricing control plane — the real catalog)
  // B5a — org + uploads infra wedge (uploads MUST follow org: baseline 040-042)
  'org.org',                      // /api/org
  'uploads.static',               // /uploads (INFRA, not a domain API)
  'uploads.api-static',           // /api/uploads (INFRA, not a domain API)
  // B5b
  'payments.payments',            // /api/payments (webhook raw-body rule stays in server.js)
  'payments.billing',             // /api/billing (WisWits charging institutions; raw-body rule too)
  'payments.config',              // /api/payment-config (owner settings → gateway keys)
  'whatsapp.whatsapp',            // /api/whatsapp
  'qbank.qbank',                  // /api/qb
  'support.support',              // /api/support (legacy enquiry→email; superseded by helpdesk, §15)
  'helpdesk.helpdesk',            // /api/helpdesk (Report-an-Issue widget + triage inbox)
  'diary.diary',                  // /api/diary
  'worksheets.worksheets',        // /api/worksheets
  'admin-reports.reports',        // /api/admin/reports
  // B6
  'widgets.widgets',              // /api/v1/widgets (intentional versioned prefix)
  'teaching.teaching',            // /api/teaching
  'erp.students',                 // /api/students
  'erp.teachers',                 // /api/teachers
  'erp.classes',                  // /api/classes (single mount — academic-years footgun stays dead)
  'erp.transport',                // /api/transport
  'platform.playbooks',           // /api/playbooks (nested modules/platform/playbooks)
  'schools.schools',              // /api/schools
  // B7
  'staff.staff',                  // /api/staff
  'erp.library',                  // /api/library
  'erp.sections',                 // /api/sections
  'erp.fees',                     // /api/fees
  'erp.attendance',               // /api/attendance
  'lms.quizzes',                  // /api/quizzes
  'quiz-portal.bank',             // /api/quiz-portal/bank
  'quiz-portal.assessment',       // /api/quiz-portal/assessment
  'quiz-portal.attempts',         // /api/quiz-portal/attempts
  'quiz-portal.analytics',        // /api/quiz-portal/analytics
  // B8
  'onboarding.onboarding',        // /api/onboarding (onboardingLimiter)
  'features.features',            // /api/features
  'custom-fields.fields',         // /api/fields (custom field definitions — T2.6)
  'events.events',                // /api/events (Event Management — ported from EduSuite via intake pipeline)
  'visitors.visitors',            // /api/visitors (Visitor Management — ported from EduSuite via intake pipeline)
  'alumni.alumni',                // /api/alumni (Alumni Directory — ported from EduSuite via intake pipeline)
  'admissions.admissions',        // /api/admissions (document checklist + admission number series)
  'public-forms.admin',           // /api/forms (admissions form admin — T2.6)
  'communication.announcements',  // /api/announcements
  'communication.messages',       // /api/messages
  'hrms.leaves',                  // /api/leaves (nested hrms/leaves)
  'hr.employees',                 // /api/hr/employees (hr-cms module)
  'hr.attendance',                // /api/hr/attendance (geofenced check-in/out — distinct from /api/attendance)
  'hr.work-reports',              // /api/hr/work-reports (server-computed auto_metrics)
  'cms.assets',                   // /api/cms/assets (mounted before bare /api/cms)
  'cms.media',                    // /api/cms/media
  'cms.assignments',              // /api/cms/assignments
  'cms.taxonomy',                 // /api/cms (taxonomy + content types — bare cms mount LAST of the cms.*)
  'curriculum.curriculum',        // /api/curriculum (platform_curriculum spine — superseded by cie.cie, ADR-013)
  'cie.builder',                  // /api/cie/builder (org-1 curriculum + master-content authoring — platformOnly)
  'cie.myCurriculum',             // /api/cie/my-curriculum (RESOLVE v1 — a school's class+subject → content)
  'cie.school',                   // /api/cie/school (the school declares its board/medium; subject on-off)
  'cie.assignments',              // /api/cie/assignments (teacher sends resolved content to a section)
  'cie.learn',                    // /api/cie/learn (student path + progress; parent child summary)
  'cie.cie',                      // /api/cie (Curriculum Intelligence Engine — Atlas + board trees + mapping)
  'analytics.analytics',          // /api/analytics
  'dashboard.dashboard',          // /api/dashboard (dashboard.home is up in B2)
  // The .ics feed is UNAUTHENTICATED by design and must precede /api/calendar,
  // which opens with authenticate(). Registration order is match order.
  'groups.groups',                // /api/groups (student houses/clubs/teams — People)
  'calendar.feed',                // /api/calendar/feed (UNAUTHENTICATED .ics)
  'calendar.calendar',            // /api/calendar
  // B9 — tail stage (bare-/api catch mounts, MUST stay last, in this order)
  'lifecycle.lifecycle',          // /api (LEAD->ALUMNI)
  'parent-link.parent-link',      // /api (parent linking — final mount)
];

function findModuleFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findModuleFiles(p));
    else if (entry.name.endsWith('.module.js')) out.push(p);
  }
  return out.sort();
}

function validateDescriptor(d, file) {
  const fail = (msg) => {
    throw new Error(`[registry] ${file}: ${msg} (descriptor: ${JSON.stringify(d && d.name)})`);
  };
  if (!d || typeof d !== 'object') fail('descriptor must be an object');
  if (typeof d.name !== 'string' || !d.name.trim()) fail('name must be a non-empty string');
  if (typeof d.prefix !== 'string' || !d.prefix.startsWith('/')) fail(`prefix must be a string starting with '/'`);
  if (typeof d.router !== 'function') fail('router must be an express router (function)');
  if (d.middleware !== undefined) {
    if (!Array.isArray(d.middleware) || d.middleware.some((m) => typeof m !== 'function')) {
      fail('middleware must be an array of functions');
    }
  }
  if (d.dependsOn !== undefined) {
    if (!Array.isArray(d.dependsOn) || d.dependsOn.some((n) => typeof n !== 'string')) {
      fail('dependsOn must be an array of names');
    }
  }
  if (d.stage !== undefined && !STAGES.includes(d.stage)) {
    fail(`stage must be one of ${STAGES.join('|')}`);
  }
}

function createRegistry({ modulesDir, mountOrder }) {
  let cache = null;

  function load() {
    if (cache) return cache;
    const index = new Map();
    for (const file of findModuleFiles(modulesDir)) {
      const exported = require(file);
      const descriptors = Array.isArray(exported) ? exported : [exported];
      for (const d of descriptors) {
        validateDescriptor(d, file);
        if (index.has(d.name)) {
          throw new Error(`[registry] duplicate descriptor name '${d.name}' (${file})`);
        }
        index.set(d.name, d);
      }
    }
    const seen = new Set();
    for (const name of mountOrder) {
      if (seen.has(name)) throw new Error(`[registry] name '${name}' listed twice in MOUNT_ORDER`);
      seen.add(name);
      if (!index.has(name)) throw new Error(`[registry] MOUNT_ORDER lists '${name}' but no descriptor was discovered`);
    }
    for (const name of index.keys()) {
      if (!seen.has(name)) throw new Error(`[registry] descriptor '${name}' is not in MOUNT_ORDER — it would never mount`);
    }
    for (const [name, d] of index) {
      for (const dep of d.dependsOn || []) {
        if (!index.has(dep)) throw new Error(`[registry] '${name}' dependsOn unknown module '${dep}'`);
      }
    }
    cache = { index };
    return cache;
  }

  function mountModules(app, stage) {
    if (!STAGES.includes(stage)) throw new Error(`[registry] unknown stage '${stage}'`);
    const { index } = load();
    for (const name of mountOrder) {
      const d = index.get(name);
      if ((d.stage || 'routes') !== stage) continue;
      app.use(d.prefix, ...(d.middleware || []), d.router);
    }
  }

  return { load, mountModules };
}

const defaultRegistry = createRegistry({
  modulesDir: path.join(__dirname, '..', 'modules'),
  mountOrder: MOUNT_ORDER,
});

module.exports = {
  createRegistry,           // for tests
  MOUNT_ORDER,
  mountModules: defaultRegistry.mountModules,
};

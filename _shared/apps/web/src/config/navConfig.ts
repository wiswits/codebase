/**
 * navConfig — the ONE global navigation plan (Group → Menu → SubMenu).
 *
 * This is the approved structure (from the nav preview) rendered in OUR premium
 * style with professional lucide SVG icons. It defines how the sidebar is
 * ORGANISED and LABELLED; it does NOT decide access. Access stays with the
 * DB-driven menu (per-tenant feature-flags + RBAC + custom-role trimming).
 *
 * DashLayout reshapes the access-granted DB items into this structure by
 * matching each item's route slug against a menu/submenu `slugs` list. Items
 * that match nothing here are never dropped — they fall to an "Other" group.
 *
 * Roles inherit from this single global plan; a role simply sees the subset the
 * DB grants it, arranged the same way for everyone. Labels relabel for
 * School/Coaching via the terminology layer at render time.
 */
import {
  LayoutGrid, GraduationCap, Layers, BookMarked, Compass, CalendarDays,
  CalendarCheck, NotebookPen, ClipboardList, BookOpen, Library, Users,
  Wallet, Briefcase, Bus, MessageSquare, BarChart3, TrendingUp,
  Sparkles, Settings, Calendar, FolderOpen, Building2, Banknote, Activity,
  Tag, Target, GitBranch, LifeBuoy, UserCheck,
} from "lucide-react";

export type NavLeaf = {
  label: string;
  slugs: string[];        // DB route slugs that belong here (last path segment)
  route?: string;         // canonical module-first route once migrated
  termKey?: string;       // terminology noun to relabel by (School/Coaching)
  roles?: NavRole[];      // who sees this item (from the approved Nav Preview). owner sees all.
  soon?: boolean;         // built-but-pending → render as a SOON button (no live route yet)
};
export type NavRole = "owner" | "admin" | "principal" | "teacher" | "student" | "parent";
export type NavMenu = NavLeaf & { icon: any; submenus?: NavLeaf[] };
export type NavGroupDef = { group: string; menus: NavMenu[] };
/** Everyone except platform owner — the common "all school roles" set. */
export const ALL_SCHOOL: NavRole[] = ["admin", "principal", "teacher", "student", "parent"];

// group order + per-role visibility — matches the approved Nav Preview.
// `roles` = who sees each menu/submenu (owner sees everything, handled in the
// sidebar builder). `soon` = structure approved but no live page yet → SOON badge.
const A: NavRole[] = ["admin", "principal"];                    // school leadership
export const NAV_CONFIG: NavGroupDef[] = [
  { group: "Overview", menus: [
    { label: "Dashboard", icon: LayoutGrid, slugs: ["", "dashboard", "home"], roles: ALL_SCHOOL },
  ]},

  { group: "Teaching & Learning", menus: [
    { label: "Academics", icon: GraduationCap, slugs: ["academics"], route: "/academics", roles: ALL_SCHOOL, submenus: [
      // WW-22/WW-37: both items pointed at the same bare route, so "Sections"
      // opened the Classes tab. The tab existed all along — the link never said so.
      { label: "Classes",    slugs: ["classes"],    route: "/academics/classes?tab=classes", termKey: "classes", roles: ["admin", "principal", "teacher"] },
      // No separate "Sections" item: classes and sections are ONE page, and a
      // second link into the same screen only made people wonder which was
      // which. The Sections tab is still there, inside Classes. (AK, 2026-07-29)
      { label: "Subjects",   slugs: ["subjects"],   route: "/academics/subjects", termKey: "subjects", roles: ["admin", "principal", "teacher"] },
      // The same page, which branches by role: a student sees their own class,
      // subjects and teachers; a parent sees their child's. Both views existed
      // in the code with no way in — a hidden feature, which §21 calls a bug.
      { label: "My Class",   slugs: ["classes"],    route: "/academics/classes", termKey: "class", roles: ["student", "parent"] },
      // WW-84 — "just remove this page, my Teaching not required". They are
      // right, and it is not a preference: every tile on /teacher/teaching
      // (My Classes, My Students, Attendance, Timetable, Content, Simulations)
      // is already its own sidebar item, so the hub is a door to doors — and it
      // spent one of the eight visible slots §9 allows. WW-48 says the identical
      // thing about the parent Child Hub, from a different school; both menu
      // entries go. The PAGES stay mounted, so any saved link still opens
      // (§15: remove the menu first, the surface later).
      // The Curriculum Engine's school-facing door. This entry was reserved with
      // `soon` and NO route (genuinely unbuilt); it now has a canonical route, so
      // §21 reveals it on staging for flow-testing while production still shows
      // the disabled "soon" badge. Promotion to prod = delete `soon: true`, and
      // that single flag flip is the entire promotion.
      //
      // `roles` is deliberately wider than the leadership-only `A` this entry
      // started with: the resolved curriculum is FOR teachers and students most
      // of all, and a working page with no nav entry for the roles it was built
      // for is a hidden feature — the bug class §21 exists to kill. Server-side
      // scoping decides what each role actually gets (a student sees only their
      // own class), so a wider menu leaks nothing.
      { label: "Curriculum", slugs: ["curriculum"], route: "/academics/curriculum", termKey: "curriculum", roles: ALL_SCHOOL, soon: true },
      // Curriculum Setup — the school declares its board, medium and which
      // subjects it runs (056). Leadership only: it changes what every teacher
      // and student in the school sees, so it is not a teacher-level control.
      { label: "Curriculum Setup", slugs: ["curriculum-setup"], route: "/academics/curriculum/setup", roles: A, soon: true },
    ]},
    { label: "Timetable", icon: CalendarDays, slugs: ["timetable"], route: "/academics/timetable", termKey: "timetable", roles: ["admin", "principal", "teacher", "student", "parent"] },
    { label: "Events", icon: Calendar, slugs: ["events"], route: "/events", roles: ALL_SCHOOL },
    { label: "Attendance", icon: CalendarCheck, slugs: ["attendance", "register"], route: "/attendance", roles: ALL_SCHOOL, submenus: [
      { label: "Daily Register", slugs: ["register"], route: "/attendance", roles: ["admin", "principal", "teacher"] },
      { label: "My Attendance",  slugs: ["attendance"], route: "/attendance", roles: ["student", "parent"] },
      { label: "Leave Requests", slugs: ["leaves"], route: "/hr/leaves", roles: ["teacher", "student", "parent"] },
    ]},
    { label: "Homework", icon: NotebookPen, slugs: ["homework"], roles: ALL_SCHOOL, submenus: [
      { label: "Assignments", slugs: ["assignments"], route: "/assessment/assignments", roles: ALL_SCHOOL },
      { label: "Diary",       slugs: ["diary"], route: "/teacher/diary", roles: ["teacher"] },
      { label: "Worksheets",  slugs: ["worksheets"], route: "/assessment/worksheets", roles: ["admin", "principal", "teacher", "student"] },
    ]},
    { label: "Assessments", icon: ClipboardList, slugs: ["assessments", "assessments-hub", "tests-hub"], roles: ALL_SCHOOL, submenus: [
      { label: "Quizzes",       slugs: ["quizzes", "quiz-attempt", "quiz-result"], route: "/assessment/quizzes", roles: ["admin", "principal", "teacher", "student"] },
      { label: "Exams",         slugs: ["exams", "assessments", "assessments-hub", "tests-hub"], route: "/assessment/exams", roles: ALL_SCHOOL },
      { label: "Question Bank", slugs: ["question-bank"], route: "/assessment/question-bank", roles: ["admin", "principal", "teacher"] },
      { label: "Report Cards",  slugs: ["report-cards", "report-card"], route: "/assessment/report-cards", roles: ALL_SCHOOL },
      { label: "Performance",   slugs: ["performance"], route: "/analytics", roles: ["student", "parent"] },
    ]},
    { label: "Learning", icon: BookOpen, slugs: ["learn", "learn-hub", "courses"], route: "/academics/learn", roles: ALL_SCHOOL, submenus: [
      { label: "Study Zone",        slugs: ["learn", "learn-hub", "courses"], route: "/academics/learn", roles: ["teacher", "student"] },
      { label: "Simulations",       slugs: ["simulations"], route: "/academics/simulations", roles: ["admin", "teacher", "student"] },
      { label: "Personalized Path", slugs: ["personalized-learning"], route: "/academics/personalized", roles: ["teacher", "student", "parent"] },
      { label: "Weak Areas",        slugs: ["weak-areas"], route: "/student/personalized-learning/weak-areas", roles: ["student"] },
      { label: "Study Planner",     slugs: ["planner"], route: "/student/planner", roles: ["student"] },
      { label: "Rough Work",        slugs: ["rough-work"], route: "/student/rough-work", roles: ["student"] },
      { label: "Doubt Solver",      slugs: ["doubt-solver"], route: "/student/ai-tools/doubt-solver", roles: ["student"] },
      { label: "Live Class",        slugs: ["live-class"], route: "/teacher/lms/live-class", roles: ["teacher"] },
      { label: "Recovery",          slugs: ["recovery"], route: "/student/recovery", roles: ["student"] },
      { label: "Gallery",           slugs: ["gallery"], route: "/gallery", roles: ALL_SCHOOL },
    ]},
    { label: "Library", icon: Library, slugs: ["library", "books"], route: "/library", roles: ALL_SCHOOL, submenus: [
      { label: "Books",          slugs: ["books", "library"], route: "/library", roles: ["admin", "principal", "student", "parent"] },
      { label: "Lesson Content", slugs: ["content", "content-library", "lms"], route: "/content", roles: ["admin", "teacher", "student"] },
    ]},
    // AI Tools — real, built pages that had NO nav entry (a teacher could not reach
    // their AI helpers at all). Single-role absolute routes (no canonical needed).
    { label: "AI Tools", icon: Sparkles, slugs: ["lesson-plan", "question-gen", "essay-grader", "weekly-insights"], roles: ["teacher", "parent"], submenus: [
      { label: "Lesson Plan",        slugs: ["lesson-plan"],    route: "/teacher/ai-tools/lesson-plan",     roles: ["teacher"] },
      { label: "Question Generator", slugs: ["question-gen"],   route: "/teacher/ai-tools/question-gen",    roles: ["teacher"] },
      { label: "Essay Grader",       slugs: ["essay-grader"],   route: "/teacher/ai-tools/essay-grader",    roles: ["teacher"] },
      { label: "Weekly Insights",    slugs: ["weekly-insights"], route: "/parent/ai-tools/weekly-insights", roles: ["parent"] },
    ]},
  ]},

  { group: "School Operations", menus: [
    { label: "People", icon: Users, slugs: ["people"], roles: ["admin", "principal", "teacher", "parent"], submenus: [
      { label: "Students",    slugs: ["students"],   route: "/people/students", termKey: "students", roles: ["admin", "principal", "teacher"] },
      { label: "Teachers",    slugs: ["teachers"],   route: "/people/teachers", termKey: "teachers", roles: A },
      { label: "Staff",       slugs: ["staff"], route: "/people/staff", roles: A },
      // Houses, clubs, teams — the groups an event can be addressed to. `soon`
      // until it is verified on production (§21): revealed on staging so it can
      // be flow-tested, a disabled badge for existing clients until then.
      { label: "Groups",      slugs: ["groups"], route: "/people/groups", roles: A, soon: true },
      { label: "Parents",     slugs: ["parents"], route: "/parents", roles: A },
      // Alumni — former students, so it sits under People rather than becoming a
      // tenth top-level item in a group §9 already caps at eight. Ported via
      // docs/pipeline/; `soon: true` per §21 — live on staging, badged on prod.
      { label: "Alumni",      slugs: ["alumni"], route: "/alumni", roles: A, soon: true },
      { label: "My Children", slugs: ["children"], route: "/parent/children", roles: ["parent"] },
      // WW-48 — "all the buttons of child hub already used before so there is no
      // use of childs hub". Same finding as WW-84 for the teacher hub: all five
      // tiles (My Children, Attendance, Performance, Report Cards, Homework) are
      // sidebar items already. Menu entry removed, page left mounted.
    ]},
    // Admissions / Leads — its OWN workflow (prospective enquiries → convert to a
    // student), NOT a "People" sub-item. The public /apply form feeds this CRM board.
    { label: "Admissions", icon: Target, slugs: ["admissions", "leads", "crm"], route: "/crm", termKey: "admission", roles: A },
    // Forms & Fields — the no-code data/forms builder (T2.6). Promoted out of a buried
    // Settings tab to a first-class tool: custom fields on students/staff + public
    // forms (admissions enquiry, staff intake, any details form) with a live preview.
    { label: "Forms & Fields", icon: ClipboardList, slugs: ["forms", "fields"], route: "/forms", roles: A },
    // Visitor Management — the front-desk register: who is in the building, sign
    // in, sign out, gate pass. Ported from EduSuite via docs/pipeline/.
    // `soon: true` per §21 — revealed and clickable on STAGING so the flow can be
    // tested, badged and inert on PRODUCTION so existing schools see nothing
    // half-finished. Dropping this one flag is the whole promotion.
    { label: "Visitors", icon: UserCheck, slugs: ["visitor", "visitors"], route: "/visitors", roles: A, soon: true },
    // ONE item. Fees is one screen with its own tabs on it (Collections ·
    // Structures · Reports · Online Payments), so a sidebar tree that repeats
    // those tabs is a second menu for the same thing.
    //
    // History worth keeping, because it went both ways. Originally five items
    // all pointed at bare "/fees" and every one landed on Collections; an admin,
    // a principal and a parent each reported it separately (WW-30, WW-42,
    // WW-49). The first fix deep-linked each item at its tab. AK's call on
    // 2026-07-29, looking at it on production: the sub-items are not wanted at
    // all — open Fees, the tabs are right there. The parent already had this
    // shape (one item, WW-49); admin and principal now match it.
    // Fees is the ONE money entry. "Finance" used to sit beside it and opened a
    // hub of four cards — Fee Structure, Payments, Reports, Platform Billing —
    // every one of which is somewhere better already: the first three are tabs
    // inside Fees (a school opens Fees and the tabs are right there), and
    // Platform Billing is the school's subscription, which belongs under
    // Settings → Billing and is listed there.
    //
    // So it was a menu inside a page: an extra click to reach what the sidebar
    // already reaches in one (§1, §9), and the same pattern removed from
    // Messages ("Communicate") a day earlier. The /finance route still exists
    // and still renders — old links and bookmarks keep working — it simply is
    // not a menu any more. AK's call, on production, 2026-08-05.
    { label: "Fees", icon: Wallet, slugs: ["fees", "pay", "payments", "finance", "billing"], route: "/fees", termKey: "fees", roles: ["admin", "principal", "parent"] },
    { label: "HR & Payroll", icon: Briefcase, slugs: ["hr", "hrms"], route: "/hr", roles: A, submenus: [
      { label: "Staff Directory", slugs: ["hr", "hrms", "staff", "employees"], route: "/hr", roles: A },
      // SUG-0109 / WW-15. TARUN (JD PUBLIC SCHOOL) asked us to build staff
      // attendance. It was already built — day view, check-in/out times,
      // late-by minutes, audit-logged status override, and a policy editor with
      // shift hours, grace and geofence radius. It simply had no way in: the
      // "Attendance" menu above is student-only (Daily Register / My
      // Attendance), and this menu listed everything EXCEPT it. §21: a working
      // page with no navConfig entry for its intended roles is a hidden
      // feature — a bug. Third instance of that class (KI-109 Work Reports,
      // KI-151 owner triage inbox, this).
      { label: "Staff Attendance", slugs: ["hr-attendance", "staff-attendance"], route: "/hr?tab=attendance", roles: A },
      { label: "Staff Leaves",    slugs: ["leaves"], route: "/hr/leaves", roles: A },
      // KI-109 FIXED: the Work Reports SCREEN was always built — it is the
      // `work-reports` tab of the canonical /hr console. What was broken was the
      // wiring: this pointed at a role path (§21 forbids that) whose page was a
      // stub that redirected to /hr and dropped the admin on the Employees tab.
      // Now it deep-links the real tab, so `soon` is gone with it.
      { label: "Work Reports",    slugs: ["work-reports"], route: "/hr?tab=work-reports", roles: ["admin"] },
      // Same KI-109 defect, still live: this pointed at bare /hr, which lands
      // the admin on the Employees tab — the menu said Payroll and delivered
      // the staff list. Deep-link it like Work Reports. (The tab itself is
      // still the "Coming Q2 2026" placeholder until SUG-0111 ships; showing
      // the honest placeholder beats silently showing a different screen.)
      { label: "Payroll",         slugs: ["payroll"], route: "/hr?tab=payroll", roles: ["admin"] },
    ]},
    { label: "Transport", icon: Bus, slugs: ["transport"], route: "/transport", roles: ["admin", "principal", "parent"] },
    { label: "Communication", icon: MessageSquare, slugs: ["communication", "communicate"], roles: ALL_SCHOOL, submenus: [
      { label: "Announcements", slugs: ["announcements"], route: "/communication/announcements", roles: ALL_SCHOOL },
      { label: "Messages",      slugs: ["messages", "communicate", "inbox-hub"], route: "/communication/messages", roles: ALL_SCHOOL },
      { label: "Meetings",      slugs: ["meetings"], route: "/communication/meetings", roles: ["principal", "teacher", "parent"] },
      { label: "WhatsApp",      slugs: ["whatsapp"], route: "/whatsapp", roles: A },
    ]},
  ]},

  { group: "Insights", menus: [
    { label: "Reports", icon: BarChart3, slugs: ["reports"], route: "/reports", roles: ["admin", "principal", "teacher"] },
    { label: "Analytics", icon: TrendingUp, slugs: ["analytics", "performance"], route: "/analytics", roles: A },
    { label: "Recovery Insights", icon: Activity, slugs: ["recovery", "engines"], route: "/recovery", roles: A },
    { label: "Weak-Area Alerts", icon: Target, slugs: ["weak-alerts"], route: "/ai-tools/weak-alerts", roles: A },
  ]},

  { group: "System", menus: [
    { label: "Settings", icon: Settings, slugs: ["settings"], route: "/settings", roles: ALL_SCHOOL, submenus: [
      { label: "General",             slugs: ["settings"], route: "/settings", roles: ALL_SCHOOL },
      { label: "Roles & Permissions", slugs: ["roles"], route: "/settings/roles", roles: ["admin"] },
      // AI Assistant settings (BYOK). The page and its API were fully built — own
      // provider + encrypted key + budget (₹0 = unlimited) + Test Connection — but
      // were never listed in the nav, so no admin could reach them. That is why AI
      // looked permanently "coming soon" with no way to switch it on. Principal is
      // included because /principal/settings/ai exists for that role too.
      { label: "AI Assistant",        slugs: ["ai"], route: "/settings/ai", roles: ["admin", "principal"] },
      // Billing — the institution's own view of what it pays WisWits: plan, price, the
      // basis for that price, usage meters, invoices, and the upgrade ladder. None of
      // this was reachable before; the whole money relationship was invisible from
      // inside the product. `soon: true` per §21 — revealed on staging for flow-testing,
      // badged on production until AK has taken a real ₹1 through it.
      // PROMOTED 2026-07-27, earlier than "after a real ₹1" — deliberately, and the
      // reason that rule existed is now satisfied another way. AK registered a school
      // and had no way to learn which plan he was on or what else existed: the only
      // page that knew was this one, badged `soon` and unclickable. That is a worse
      // failure than showing a page whose checkout is not on yet.
      // What makes it safe: POST /billing/start now REFUSES while the gateway is not
      // live, so nothing here can transact against the mock gateway or write a
      // subscription that can never be charged. The page is fully readable — current
      // plan, trial end, the whole ladder, invoices — and the buttons say "Talk to us"
      // until payments are live. Re-add `soon: true` to hide it again; one flag.
      { label: "Billing",             slugs: ["billing"], route: "/settings/billing", roles: ["admin", "principal"] },
      { label: "Biometric Devices",   slugs: ["biometric"], route: "/admin/erp/biometric", roles: ["admin"] },
      { label: "Fee Gateway",         slugs: ["fee-gateway"], route: "/admin/erp/fee-gateway", roles: ["admin"] },
      // Fee reminders live INSIDE the defaulter report — you pick who is late by
      // age bucket and send from the same list, rather than crossing to a second
      // screen and guessing. Two §21 violations fixed with the feature itself:
      // the route pointed at a ROLE path (`/admin/erp/…`, never a nav target),
      // and it was admin-only, so the principal and the accountant — the two
      // people who actually chase fees — had no way to reach it at all.
      { label: "Fee Reminders",       slugs: ["fee-reminders"], route: "/fees?tab=reports&view=defaulters", roles: ["admin", "principal", "accountant"] },
      { label: "Features",            slugs: ["features"], roles: ["admin"], soon: true },
    ]},
    // KI-109 FIXED: /hr is permission-gated but explicitly admits a teacher
    // (`isTeacher` passes the gate) and renders the self-service MyPayslips
    // branch — so the canonical route IS this teacher's payslips page. The old
    // role path was a redirect stub, which is what made a built feature look
    // unbuilt.
    // WW-82 — a JD PUBLIC teacher filed "not showing this page" as a P1 break.
    // Nothing was broken: /hr renders the honest "My Payslips · Coming Q2 2026"
    // placeholder for a teacher. The defect is this line — a live, unbadged menu
    // item pointing at an unbuilt feature, which §21 says must carry `soon`
    // until it is prod-blessed. Now it reads "soon" on production (and stays
    // reachable on staging for testing). Drop the flag when SUG-0111 payroll
    // ships and the tab is real.
    { label: "My Payslips", icon: Wallet, slugs: ["my-payslips"], route: "/hr", roles: ["teacher"], soon: true },
    { label: "Feedback", icon: MessageSquare, slugs: ["feedback"], route: "/student/feedback", roles: ["student"] },
    { label: "Calendar", icon: Calendar, slugs: ["calendar"], route: "/calendar", roles: ALL_SCHOOL },
    // Reported problems. The floating "Report an issue" button is the way IN
    // (it is chrome, mounted in DashLayout, deliberately not a menu item); this
    // entry is the way BACK — where a reporter follows up and a principal watches
    // their school. Every school role gets it: the person who reports a problem
    // must be able to see what happened to it.
    { label: "Reported Problems", icon: LifeBuoy, slugs: ["support"], route: "/support", roles: ALL_SCHOOL },
    { label: "Documents", icon: FolderOpen, slugs: ["documents", "id-card"], roles: ["admin", "principal", "parent"], submenus: [
      // ── WHY admin IS NOT HERE (WW-12) ──────────────────────────────────────
      // This route lives in the PARENT namespace, and `AuthContext` bounces any user
      // off a role root that is not their own — deliberate isolation, not a bug. So an
      // admin clicking "ID Cards" went to /parent/id-card and was returned to /admin,
      // which TARUN reported as "it redirect on Dashboard".
      //
      // The fix is NOT to widen the isolation guard, and NOT to alias the page: it
      // renders the signed-in PARENT's children from `api.home.parent()`, so an admin
      // would get an empty card rather than their school's students. There is no
      // admin-facing ID card feature yet — printing student ID cards is a real thing a
      // school wants, and that is a FEATURE to build, not a menu entry pointed
      // somewhere plausible. A nav item with no working page for a role is the same lie
      // as a working page with no nav item (§21), reversed.
      { label: "ID Cards",     slugs: ["id-card"], route: "/parent/id-card", roles: ["parent"] },
      { label: "Certificates", slugs: ["certificates"], route: "/documents/certificates", roles: ["admin", "principal"] },
      { label: "Files",        slugs: ["documents", "files"], roles: A, soon: true },
    ]},
  ]},

  { group: "Platform", menus: [
    // ── NOTHING owner-only BELONGS HERE ─────────────────────────────────────
    // Seven entries used to sit at this spot with roles:["owner"] — Tenants,
    // Revenue, Health, Features & Pricing, Leads/CRM, Branches and Reported
    // Problems — and NONE of them could ever render. `DashLayout` builds the
    // platform sidebar from its own curated SUPERADMIN_MENU and skips this file
    // entirely for platform roles:
    //
    //     const specGroups = isPlatformOwn ? [] : buildRoleNav(...)
    //
    // So they were a second, silent nav plan: six of them also carried
    // `soon: true`, which made them look deliberately parked rather than dead.
    // The cost was real — "Reported Problems" appeared to be wired up for the
    // owner, so nobody noticed the triage inbox was unreachable for him while
    // every school could see their own copy of it.
    //
    // A platform surface goes in SUPERADMIN_MENU in DashLayout.tsx. This file is
    // the plan for TENANT roles (§21).
    //
    // ── THE COMMERCE ENTRY THAT USED TO SIT HERE HAS GONE ───────────────────
    // It was declared with roles:["owner"] so the nav-route gate would cover it,
    // with a note that it did NOT render from this file and that the follow-up
    // "belongs to whoever retires /superadmin/pricing and /superadmin/addons in
    // favour of this screen". That is now done: both are redirects into
    // /superadmin/commerce, and Commerce is reachable from SUPERADMIN_MENU in
    // DashLayout.tsx, which is the only list platform roles read.
    //
    // The entry is deleted rather than left as documentation because an inert
    // owner-only line here is precisely the shape of the KI-151 bug — a surface
    // that LOOKS wired up in the one nav plan and cannot render — and the guard
    // in tests/empty-state-children.test.mjs has been failing on it ever since.
    // Nothing was lost: Commerce keeps its DashLayout line, and the redirects
    // keep both old addresses answering.
  ]},
];

/** Ordered group names — used to sort/rank reshaped groups. */
export const NAV_GROUP_ORDER = NAV_CONFIG.map((g) => g.group);

/** slug (last path segment) → { group, menu, submenu?, icon, route } lookup. */
export type Placement = { group: string; groupRank: number; menu: string; menuRank: number; sub?: string; subRank?: number; icon: any; route?: string; termKey?: string; roles?: NavRole[] };

/** Does a user whose nav-role is `key` see an item with these `roles`?
 *  Platform owner sees everything. School leadership (admin/principal) inherit
 *  each other's items so a Principal never loses an admin-scoped menu. */
export function roleSees(roles: NavRole[] | undefined, key: NavRole): boolean {
  if (key === "owner") return true;
  if (!roles || roles.length === 0) return false;
  if (roles.includes(key)) return true;
  if ((key === "admin" || key === "principal") && (roles.includes("admin") || roles.includes("principal"))) return true;
  return false;
}

// A slug is NOT always unique across the whole nav plan — the same last-path
// segment can legitimately mean two different things for two different
// audiences (e.g. "leaves" = student/parent/teacher's own "Leave Requests"
// under Attendance, vs admin's "Staff Leaves" under HR & Payroll — same
// route family, different viewer, different category). The OLD code kept a
// single flat slug→placement map that a later registration silently
// overwrote, so whichever menu happened to be declared LAST in NAV_CONFIG
// won for every role — a student viewing their own leave requests saw the
// admin-facing "HR & Payroll › Staff Leaves" breadcrumb (found + fixed
// 2026-07-19). Fix: keep every candidate placement per slug, each tagged
// with its `roles`, and resolve by the VIEWING role at lookup time.
const PLACEMENT_CANDIDATES: Record<string, Placement[]> = {};
NAV_CONFIG.forEach((g, gi) => {
  g.menus.forEach((m, mi) => {
    const push = (slug: string, p: Placement) => {
      (PLACEMENT_CANDIDATES[slug] ??= []).push(p);
    };
    m.slugs.forEach((s) => push(s, { group: g.group, groupRank: gi, menu: m.label, menuRank: mi, icon: m.icon, route: m.route, termKey: m.termKey, roles: m.roles }));
    m.submenus?.forEach((sub, si) => {
      sub.slugs.forEach((s) => push(s, { group: g.group, groupRank: gi, menu: m.label, menuRank: mi, sub: sub.label, subRank: si, icon: m.icon, route: sub.route || m.route, termKey: sub.termKey, roles: sub.roles || m.roles }));
    });
  });
});

// canonical `route` → every roles[] declared for it. A route can be declared by
// several entries under DIFFERENT slugs (e.g. "Performance" for student/parent
// and "Analytics" for admin BOTH point at /analytics, but their slugs are
// "performance" and "analytics"). A slug-only access check would therefore
// wrongly deny a student the very page their own menu item links to, so route
// matches are consulted FIRST and the roles are UNIONed across declarations.
//
// WW-85 / WW-105 — keyed by the PATHNAME, never the raw `route` string.
// A route may deep-link a tab ("/academics/classes?tab=classes"). Keying by the
// raw string put that declaration under a key no pathname lookup can ever hit,
// so its roles vanished from the answer — and when a SECOND entry declared the
// same page without a query ("My Class", student+parent), that narrower set
// became the whole truth for /academics/classes and every teacher who clicked
// Classes was bounced to their dashboard. Strip the query on BOTH sides
// (`pathOf`, used again in roleSeesRoute) so declarations of one page always
// union, whether or not they deep-link a tab.
const pathOf = (route: string) => route.split("?")[0];
const ROUTE_ROLES: Record<string, Set<NavRole>> = {};
NAV_CONFIG.forEach((g) => g.menus.forEach((m) => {
  const add = (route: string | undefined, roles: NavRole[] | undefined) => {
    if (!route || !roles) return;
    const key = pathOf(route);
    (ROUTE_ROLES[key] ??= new Set()).add("owner");
    roles.forEach((r) => ROUTE_ROLES[key].add(r));
  };
  add(m.route, m.roles);
  m.submenus?.forEach((s) => add(s.route || m.route, s.roles || m.roles));
}));

/** Does the viewing role see ANY nav entry for this slug?
 *  `null` = the slug is not part of the nav plan at all (internal surfaces like
 *  /cms, /staff-desk, shareable links like /receipt/:id) — callers must treat
 *  null as "not our business", never as "deny".
 *
 *  NOTE this is deliberately NOT `placementForSlug(slug, role) !== null`:
 *  that function falls back to the last-registered candidate when the role
 *  matches nothing, because a breadcrumb must always render something. An
 *  access check must not have that fallback. */
export function roleSeesSlug(slug: string, role: NavRole): boolean | null {
  const candidates = PLACEMENT_CANDIDATES[slug];
  if (!candidates || candidates.length === 0) return null;
  return candidates.some((c) => roleSees(c.roles, role));
}

/** Access answer for a whole pathname: exact canonical `route` first (see
 *  ROUTE_ROLES), then the slug. `null` = not declared in the nav plan at all —
 *  callers must read null as "not my business", never as "deny". */
export function roleSeesRoute(pathname: string, slug: string, role: NavRole): boolean | null {
  const byRoute = ROUTE_ROLES[pathOf(pathname)];
  if (byRoute) return byRoute.has(role) || ((role === "admin" || role === "principal") && (byRoute.has("admin") || byRoute.has("principal")));
  return roleSeesSlug(slug, role);
}

/** Look up where a DB route slug belongs in the approved structure (or null).
 *  Pass the viewer's nav-role to resolve a slug that means different things
 *  for different roles (see PLACEMENT_CANDIDATES above) — the FIRST
 *  candidate whose `roles` includes that role wins; submenu-level
 *  candidates are checked before menu-level ones so a more specific match
 *  is preferred. Without a role, falls back to the last-registered
 *  candidate (the old behavior) for any caller that can't supply one. */
export function placementForSlug(slug: string, role?: NavRole): Placement | null {
  const candidates = PLACEMENT_CANDIDATES[slug];
  if (!candidates || candidates.length === 0) return null;
  if (role) {
    const subMatch = candidates.find((c) => c.sub && roleSees(c.roles, role));
    if (subMatch) return subMatch;
    const anyMatch = candidates.find((c) => roleSees(c.roles, role));
    if (anyMatch) return anyMatch;
  }
  return candidates[candidates.length - 1];
}

export default NAV_CONFIG;

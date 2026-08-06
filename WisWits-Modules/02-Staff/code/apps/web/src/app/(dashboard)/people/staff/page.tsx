// Thin route wrapper — the module-first People group (Students/Teachers already
// live under /people/*) had no /people/staff route, 404ing anyone whose sidebar
// or a bookmark pointed here. Reuses the existing working staff page verbatim.
export { default } from "@/app/(dashboard)/admin/staff/page";

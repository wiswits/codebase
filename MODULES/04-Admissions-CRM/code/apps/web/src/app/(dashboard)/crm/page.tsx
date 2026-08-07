"use client";
// Canonical module-first route (docs/CLAUDE.md §21). Re-exports the module page
// so the sidebar links here (/crm) instead of a role-namespaced path.
export { default } from "@/app/(dashboard)/admin/crm/page";

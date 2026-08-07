"use client";
/*
 * Curriculum — ONE canonical, permission-gated route for every school role
 * (CLAUDE.md §21 module-first routing). Server: /api/cie/*.
 *
 * ── WHY ONE ROUTE THAT BRANCHES, AND NOT THREE ROUTES ──────────────────────
 * A teacher, a student and a parent want three genuinely different screens from
 * the same curriculum. The tempting shape is /teacher/curriculum,
 * /student/curriculum, /parent/curriculum — and that is the exact anti-pattern
 * §21 exists to kill: role-namespaced routes drift, nav entries point at one of
 * them, and the other roles quietly lose the feature.
 *
 * So there is one route, one nav entry, and the ROLE decides which component
 * renders. Every branch is also enforced server-side — a student calling the
 * teacher's endpoints is rejected by the API, not by this file. What follows is
 * presentation only; it is not a security boundary.
 *
 * ── WHY THE HEAVY WORK IS IN THREE SEPARATE COMPONENTS ─────────────────────
 * TeacherCurriculum, StudentPath and ParentSummary are large and share almost
 * nothing but the design tokens. Inlining all three here would make a file
 * nobody can hold in their head, and the three surfaces change for unrelated
 * reasons.
 *
 * ── ROLE HANDLING: NO ALLOWLIST (AK, 2026-08-03: "koi new role ka chakkar nahi")
 * Only `student` and `parent` get a narrowed screen. EVERYTHING else — admin,
 * principal, teacher, and any role a school invented for itself — gets the staff
 * view. An allowlist here would repeat the bug this platform already shipped:
 * `useCan` gated on `role_slug`, so every school-built custom role was denied on
 * every module. Schools invent roles we cannot enumerate, and `base_role` is not
 * in the JWT.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ModulePage } from "@/components/module-kit/ModulePage";
import { Compass } from "lucide-react";
import TeacherCurriculum from "@/components/curriculum/TeacherCurriculum";
import StudentPath from "@/components/curriculum/StudentPath";
import ParentSummary from "@/components/curriculum/ParentSummary";

export default function CurriculumPage() {
  const { user } = useAuth();
  const role = String(user?.role_slug || "").toLowerCase();

  // The role arrives from context, which can be briefly empty on a hard reload.
  // Rendering the staff view during that gap would flash a teacher's screen at a
  // student, so hold the scaffold's loading state until we know who this is.
  const [ready, setReady] = useState(false);
  useEffect(() => { if (user) setReady(true); }, [user]);

  const isStudent = role === "student";
  const isParent = role === "parent";

  const title = isParent ? "Learning" : "Curriculum";
  const subtitle = isStudent
    ? "What to do next, in order."
    : isParent
      ? "How your child is doing."
      : "Your class and subject, matched to the published curriculum.";

  return (
    <ModulePage icon={Compass} title={title} subtitle={subtitle} loading={!ready}>
      {/* Children are evaluated BEFORE ModulePage picks a state, so nothing here
          may touch async data — each component owns its own fetching and states.
          This is the JSX-children trap that crashed /receipt/[id] on production
          while every deploy gate stayed green. */}
      {ready && (isStudent ? <StudentPath /> : isParent ? <ParentSummary /> : <TeacherCurriculum />)}
    </ModulePage>
  );
}

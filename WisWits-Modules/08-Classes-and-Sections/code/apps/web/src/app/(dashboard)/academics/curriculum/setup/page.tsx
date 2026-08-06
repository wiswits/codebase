"use client";
/*
 * Curriculum Setup — where the school SAYS what it is.
 * Server: GET/PUT /api/cie/school/profile, GET/POST /api/cie/school/subjects.
 *
 * ── WHY THIS SCREEN IS DIFFERENT FROM EVERY OTHER SETTINGS PAGE ──────────────
 * The board saved here is the FIRST link in the chain that decides what content
 * every class in this school is shown. A wrong board does not fail — it serves
 * the entire school somebody else's curriculum, in every class and every
 * subject, and the chapters look plausible the whole time. Turning a subject off
 * is nearly as loud: it disappears from every teacher's and every student's
 * screen at once.
 *
 * So this page is deliberately slow and explicit where other settings pages are
 * quick: one Save button (never save-on-change), a confirmation before anything
 * is switched OFF, a message that reads the saved values back in words, and a
 * refetch from the server after every write instead of trusting local state.
 *
 * ── WHY NOTHING HERE IS OPTIMISTIC ──────────────────────────────────────────
 * The usual argument for optimistic UI — "the write almost always succeeds, so
 * show it immediately" — inverts on this screen. A switch that reads "off" while
 * the server still says "on" tells an administrator the subject is hidden from
 * the school when it is not (or the reverse). She acts on that: she tells a
 * teacher, or she stops looking. A switch that takes 400ms to move is merely
 * slow; a switch that lies is a wrong answer about what a whole school can see.
 * Every toggle therefore waits for the server, then REFETCHES the class — the
 * counts change with the board anyway, so a local flip would be half-truth even
 * when it is right.
 *
 * ── TERMINOLOGY ─────────────────────────────────────────────────────────────
 * board · medium · session · class · subject · chapters · topics · lessons.
 * Nothing else (CLAUDE.md §1). No table names, no ids, no engine vocabulary.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { toast as notify } from "@/components/ui/Toast";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { ModulePage, primaryBtnStyle } from "@/components/module-kit/ModulePage";
import {
  SlidersHorizontal, School, BookOpen, Info, AlertTriangle, Check,
  Languages, RefreshCw, Loader2,
} from "lucide-react";

const C = {
  ink: "#0F2147", ink2: "#3A4663", muted: "#6B7488", faint: "#9AA1B2",
  line: "rgba(15,33,71,.08)", line2: "rgba(15,33,71,.05)", card: "#FFFFFF",
  gold: "#C8A04E", ivory: "#F7F4EC",
  amberBg: "#FFF8E8", amberLine: "rgba(200,160,78,.45)", amberInk: "#7A5A12",
  green: "#1F7A4D",
  sh: "0 1px 2px rgba(15,33,71,.04), 0 16px 40px -22px rgba(15,33,71,.24)",
};

const selectStyle: React.CSSProperties = {
  padding: "9px 11px", fontSize: 13.5, color: C.ink, background: "#fff",
  border: `1px solid ${C.line}`, borderRadius: 8, width: "100%",
};
const fieldLabelStyle: React.CSSProperties = {
  display: "block", fontSize: 11.5, fontWeight: 750, letterSpacing: ".04em",
  textTransform: "uppercase", color: C.muted, marginBottom: 6,
};
const cardStyle: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.line2}`, borderRadius: 16,
  boxShadow: C.sh, padding: 24,
};

/* "Always use the latest" is the value almost every school wants, and it is not
 * the same as "no answer" — the server reads an empty session as "follow the
 * newest published curriculum". The select therefore offers it as a real,
 * first-class choice rather than leaving the field blank. */
const LATEST = "";

/* The on/off control. A real `role="switch"` (not a checkbox styled to look like
 * one) so a screen reader announces its state, and `aria-label` carries the full
 * sentence — the visible text is just the subject name, which on its own does
 * not say what the switch does. */
/* `busy` = THIS subject is being written. `locked` = some OTHER subject is, and
 * one write at a time is deliberate here (two overlapping toggles on the same
 * class would each refetch and the later reply would win). Locked switches are
 * disabled and LOOK disabled — a control that accepts a click and does nothing
 * is read as a broken page, and this is the screen where that costs the most. */
function SubjectSwitch({
  on, busy, locked, label, onClick,
}: { on: boolean; busy: boolean; locked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label}
      disabled={busy || locked} onClick={onClick}
      style={{
        position: "relative", flex: "none", width: 40, height: 22, borderRadius: 999,
        border: "none", padding: 0,
        cursor: busy ? "progress" : locked ? "not-allowed" : "pointer",
        background: on ? C.gold : "rgba(15,33,71,.18)",
        opacity: busy || locked ? 0.55 : 1, transition: "background .15s ease",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16,
        borderRadius: 999, background: "#fff", transition: "left .15s ease",
        boxShadow: "0 1px 2px rgba(15,33,71,.35)",
      }} />
    </button>
  );
}

/* Panel-local skeleton. The subjects panel cannot hand its body to ModulePage's
 * `loading` branch — that branch does not render children, and the identity card
 * above must stay on screen (and stay editable) while a class reloads. */
function SubjectSkeleton() {
  return (
    <div aria-hidden="true">
      <style>{`@keyframes cs-shimmer{0%{background-position:-360px 0}100%{background-position:360px 0}}`}</style>
      <div style={gridStyle}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ ...subjectCardStyle, borderColor: C.line2 }}>
            <div style={{ ...shimmer, height: 13, width: "55%", borderRadius: 5 }} />
            <div style={{ ...shimmer, height: 11, width: "80%", borderRadius: 5, marginTop: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
const shimmer: React.CSSProperties = {
  background: "linear-gradient(90deg,#EEEADF 0%,#F6F3EC 40%,#EEEADF 80%)",
  backgroundSize: "720px 100%", animation: "cs-shimmer 1.3s infinite linear",
};

/* auto-fill + a 250px floor: on a phone the container is narrower than one
 * column's minimum, so the grid collapses to a single column by itself — no
 * media query, no breakpoint to keep in sync. */
const gridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12,
};
const subjectCardStyle: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, minWidth: 0,
};

export default function CurriculumSetupPage() {
  // Page-level: the identity card cannot be drawn at all without the profile.
  const [booting, setBooting] = useState(true);
  const [pageErr, setPageErr] = useState<string | null>(null);
  const [prof, setProf] = useState<any>(null);

  // The class list is a SEPARATE failure. If it breaks, the board and medium are
  // still saveable — blanking the whole page over the subjects panel would take
  // away the more consequential half of the screen for a fault in the lesser one.
  const [classes, setClasses] = useState<any[]>([]);
  const [clsErr, setClsErr] = useState<string | null>(null);
  const [classId, setClassId] = useState<number | null>(null);

  // Form state, seeded from the server and re-seeded after every save.
  const [boardKey, setBoardKey] = useState("");
  const [medium, setMedium] = useState("");
  const [session, setSession] = useState<string>(LATEST);
  const [saving, setSaving] = useState(false);

  const [subj, setSubj] = useState<any>(null);
  const [subjLoading, setSubjLoading] = useState(false);
  const [subjErr, setSubjErr] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  /* The ONE place the form is filled from the server. Called on load and again
   * after every save, so what is on screen is always what the school is stored
   * as — never what we hoped the write did. */
  const loadProfile = useCallback(async () => {
    const d: any = await api.cie.profile();
    setProf(d);
    setBoardKey(d?.profile?.board_key || "");
    setMedium(d?.profile?.medium || d?.mediums?.[0]?.key || "en");
    setSession(d?.profile?.session || LATEST);
    return d;
  }, []);

  const boot = useCallback(() => {
    setBooting(true); setPageErr(null); setClsErr(null);
    Promise.all([
      loadProfile().catch((e: any) =>
        setPageErr(e?.message || "Could not load your curriculum settings")),
      api.cie.mySubjects()
        .then((d: any) => {
          const cs = d?.classes || [];
          setClasses(cs);
          // Preselect so the panel is useful on arrival instead of asking a
          // question first. `?? ` keeps a class the user already picked across a
          // retry — a Retry that silently jumps back to Class 1 reads as a bug.
          setClassId((cur) => cur ?? (cs.length ? Number(cs[0].id) : null));
        })
        .catch((e: any) => setClsErr(e?.message || "Could not load your classes")),
    ]).finally(() => setBooting(false));
  }, [loadProfile]);

  useEffect(() => { boot(); }, [boot]);

  const loadSubjects = useCallback(() => {
    if (classId == null) { setSubj(null); return Promise.resolve(); }
    setSubjLoading(true); setSubjErr(null);
    return api.cie.orgSubjects(classId)
      .then((d: any) => setSubj(d))
      .catch((e: any) => {
        setSubj(null);
        setSubjErr(e?.message || "Could not load the subjects for this class");
      })
      .finally(() => setSubjLoading(false));
  }, [classId]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const boards: any[] = prof?.boards || [];
  const mediums: any[] = prof?.mediums || [];
  const saved = prof?.profile || null;
  const needsConfirm = !!prof?.needs_confirmation;

  const boardName = (key: string) =>
    boards.find((b: any) => b.board_key === key)?.name || key;
  const mediumLabel = (key: string) =>
    mediums.find((m: any) => m.key === key)?.label || key;

  /* A school may be pinned to a session that has nothing published in it yet
   * (pinning next year early is legitimate — the server accepts it). That
   * session is therefore absent from the offered list, and rendering the list
   * alone would show the field as "Always use the latest" — i.e. quietly tell
   * the school it is not pinned when it is. Its own session is merged in. */
  const sessionOptions = useMemo(() => {
    const list: string[] = (prof?.sessions || []).map((s: any) => String(s));
    const own = saved?.session ? String(saved.session) : null;
    return own && !list.includes(own) ? [own, ...list] : list;
  }, [prof?.sessions, saved?.session]);

  const pinnedButEmpty = !!session &&
    !(prof?.sessions || []).map((s: any) => String(s)).includes(session);

  const dirty = !saved
    || (saved.board_key || "") !== boardKey
    || (saved.medium || "") !== medium
    || (saved.session || LATEST) !== session;

  // Save is live when there is something to save OR something to confirm. The
  // second half matters: a school we filled in correctly changes nothing and
  // still has to be able to press Save — that press IS the confirmation.
  const canSave = !!boardKey && !saving && (dirty || needsConfirm);

  const subtitle = useMemo(() => {
    if (booting) return undefined;
    if (saved?.board_key) {
      return `${boardName(saved.board_key)} · ${mediumLabel(saved.medium)} medium${saved.session ? ` · ${saved.session}` : ""}`;
    }
    return "Tell us which board and language your school follows.";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, saved, boards, mediums]);

  async function save() {
    if (!boardKey) { notify.error("Choose the board this school follows"); return; }
    setSaving(true);
    try {
      const out: any = await api.cie.saveProfile({
        board_key: boardKey, medium, session: session || null,
      });
      // Read the saved values back in words. "Saved" alone is useless on the one
      // setting where the school needs to see WHAT it just told us.
      let msg = `Saved — ${boardName(boardKey)}, ${mediumLabel(medium)} medium${session ? `, ${session}` : ""}.`;
      if (session && out?.session_has_content === false) {
        msg += ` Nothing has been published for ${session} yet, so classes keep using the newest available curriculum until it is.`;
      }
      notify.success(msg);
      // Refetch rather than patching local state: the "please confirm" note must
      // disappear because the SERVER now records a confirmation, not because we
      // hid it. And the board decides which chapters resolve, so every count in
      // the panel below is stale the moment this write lands.
      await loadProfile();
      await loadSubjects();
    } catch (e: any) {
      notify.error(e?.message || "Could not save these settings");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(s: any) {
    if (classId == null || pendingId != null) return;
    const className = subj?.class?.name || "this class";
    const next = !s.is_enabled;

    // OFF is the consequential direction, so it is the only one that asks. ON
    // restores what was there and needs no ceremony (§1: ≤3 clicks).
    if (!next) {
      const ok = await confirmDialog({
        title: `Turn ${s.name} off for ${className}?`,
        description: `${s.name} will be hidden from every teacher and every student in the school for ${className}. Nothing is deleted — you can turn it back on from this screen at any time.`,
        confirmLabel: "Turn it off",
        danger: true,
      });
      if (!ok) return;
    }

    setPendingId(s.id);
    try {
      await api.cie.toggleSubject({ class_id: classId, subject_id: s.id, is_enabled: next });
      notify.success(next
        ? `${s.name} is on for ${className}. Teachers and students can see it again.`
        : `${s.name} is off for ${className}. It is now hidden from every teacher and student.`);
      // The switch moves HERE — after the server agreed — and it moves because
      // the class was refetched, not because we flipped a local boolean.
      await loadSubjects();
    } catch (e: any) {
      notify.error(e?.message || `Could not change ${s.name}`);
    } finally {
      setPendingId(null);
    }
  }

  const subjects: any[] = subj?.subjects || [];

  return (
    <ModulePage
      icon={SlidersHorizontal}
      title="Curriculum Setup"
      subtitle={subtitle}
      loading={booting}
      error={pageErr || undefined}
      onRetry={boot}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── 1. Who this school is ─────────────────────────────────────────── */}
        <section style={cardStyle} aria-labelledby="cs-identity">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <School size={17} style={{ color: C.gold, flex: "none" }} />
            <h2 id="cs-identity" style={{ fontSize: 15.5, fontWeight: 750, color: C.ink, margin: 0 }}>
              Your board and teaching language
            </h2>
          </div>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 18px" }}>
            Every class in your school follows the board you choose here. Please
            check it carefully — changing it changes the chapters your teachers
            and students see everywhere.
          </p>

          {/* Shown only while the server says this has never been confirmed. It
              is a calm note, not a warning: the value in the field is usually
              right. It must not read as an accusation, and it must not call
              itself a guess — a school does not need our internals to check a
              board name it already knows. */}
          {needsConfirm && (
            <div role="status" style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              background: C.amberBg, border: `1px solid ${C.amberLine}`,
              borderRadius: 10, padding: "11px 13px", marginBottom: 18,
            }}>
              <Info size={16} style={{ color: C.gold, flex: "none", marginTop: 1 }} />
              <div style={{ fontSize: 13, color: C.amberInk, lineHeight: 1.5 }}>
                We filled this in from your school profile. Please check it and save.
              </div>
            </div>
          )}

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16,
          }}>
            <div>
              <label htmlFor="cs-board" style={fieldLabelStyle}>Board</label>
              <select id="cs-board" aria-label="Board your school follows"
                value={boardKey} style={selectStyle}
                onChange={(e) => setBoardKey(e.target.value)}>
                <option value="">Choose a board…</option>
                {/* Guarded: ModulePage evaluates children BEFORE it picks a
                    state, so this renders once while the first fetch is still
                    in flight. A bare .map on an unloaded array crashes the
                    whole page — this platform has shipped exactly that. */}
                {(boards || []).map((b: any) => (
                  <option key={b.board_key} value={b.board_key}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cs-medium" style={fieldLabelStyle}>Medium</label>
              <select id="cs-medium" aria-label="Language lessons are shown in"
                value={medium} style={selectStyle}
                onChange={(e) => setMedium(e.target.value)}>
                {(mediums || []).map((m: any) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
              {/* The real behaviour, in one line, because a school WILL ask why
                  it is seeing English inside a Hindi-medium subject. */}
              <div style={{
                display: "flex", gap: 6, alignItems: "flex-start",
                fontSize: 11.5, color: C.faint, marginTop: 7, lineHeight: 1.5,
              }}>
                <Languages size={13} style={{ flex: "none", marginTop: 2 }} />
                <span>
                  Lessons appear in this language wherever they exist. Where a
                  translation has not been made yet, the English lesson is shown.
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="cs-session" style={fieldLabelStyle}>Session</label>
              <select id="cs-session" aria-label="Academic session to follow"
                value={session} style={selectStyle}
                onChange={(e) => setSession(e.target.value)}>
                <option value={LATEST}>Always use the latest</option>
                {(sessionOptions || []).map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {pinnedButEmpty && (
                <div style={{ fontSize: 11.5, color: C.faint, marginTop: 7, lineHeight: 1.5 }}>
                  Nothing has been published for {session} yet. Your classes will
                  keep using the newest available chapters until it is.
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.line2}`,
          }}>
            <button type="button" onClick={save} disabled={!canSave}
              aria-label="Save your board, medium and session"
              style={{
                ...primaryBtnStyle,
                opacity: canSave ? 1 : 0.5,
                cursor: canSave ? "pointer" : "not-allowed",
                boxShadow: canSave ? primaryBtnStyle.boxShadow : "none",
              }}>
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                : <><Check size={15} /> Save</>}
            </button>

            {/* Three honest, mutually exclusive statuses — never a bare button
                whose state the reader has to infer. */}
            {dirty && !saving && (
              <span style={{ fontSize: 12.5, color: C.muted }}>Not saved yet.</span>
            )}
            {!dirty && needsConfirm && !saving && (
              <span style={{ fontSize: 12.5, color: C.amberInk }}>
                Press Save to confirm these are correct.
              </span>
            )}
            {!dirty && !needsConfirm && !saving && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.green }}>
                <Check size={14} /> Confirmed by your school.
              </span>
            )}
          </div>
        </section>

        {/* ── 2. Which subjects each class runs ─────────────────────────────── */}
        <section style={cardStyle} aria-labelledby="cs-subjects">
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            flexWrap: "wrap", justifyContent: "space-between", marginBottom: 18,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                <BookOpen size={17} style={{ color: C.gold, flex: "none" }} />
                <h2 id="cs-subjects" style={{ fontSize: 15.5, fontWeight: 750, color: C.ink, margin: 0 }}>
                  Subjects for each class
                </h2>
              </div>
              <p style={{ fontSize: 13, color: C.muted, margin: 0, maxWidth: 560 }}>
                Switch off anything this class does not teach. A subject that is
                off is hidden from every teacher and student in the school.
              </p>
            </div>

            {classes.length > 0 && (
              <select aria-label="Class to set up" value={classId ?? ""}
                style={{ ...selectStyle, width: "auto", minWidth: 170 }}
                onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}>
                {(classes || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* ── the class list itself failed ─────────────────────────────────── */}
          {clsErr && (
            <div style={{
              display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
              border: `1px solid ${C.line}`, borderRadius: 10, padding: "13px 14px",
            }}>
              <AlertTriangle size={16} style={{ color: "#F59E0B", flex: "none" }} />
              <span style={{ fontSize: 13, color: C.ink2, flex: 1, minWidth: 180 }}>{clsErr}</span>
              <button type="button" onClick={boot} aria-label="Try loading your classes again"
                style={{ ...primaryBtnStyle, height: 34, fontSize: 12.5 }}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {/* ── no classes at all: say what to do, and where ─────────────────── */}
          {!clsErr && classes.length === 0 && (
            <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
              No classes have been added yet. Add your classes under School
              Management first — then come back here to choose the subjects each
              one teaches.
            </div>
          )}

          {/* ── loading this class ───────────────────────────────────────────── */}
          {!clsErr && classes.length > 0 && subjLoading && <SubjectSkeleton />}

          {/* ── this class failed to load ────────────────────────────────────── */}
          {!clsErr && classes.length > 0 && !subjLoading && subjErr && (
            <div style={{
              display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
              border: `1px solid ${C.line}`, borderRadius: 10, padding: "13px 14px",
            }}>
              <AlertTriangle size={16} style={{ color: "#F59E0B", flex: "none" }} />
              <span style={{ fontSize: 13, color: C.ink2, flex: 1, minWidth: 180 }}>{subjErr}</span>
              <button type="button" onClick={() => loadSubjects()}
                aria-label="Try loading the subjects for this class again"
                style={{ ...primaryBtnStyle, height: 34, fontSize: 12.5 }}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          {/* ── the class has no subjects yet ────────────────────────────────── */}
          {!clsErr && classes.length > 0 && !subjLoading && !subjErr && subjects.length === 0 && (
            <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
              {subj?.class?.name || "This class"} has no subjects yet. Add the
              subjects it teaches under School Management, and they will appear
              here to switch on or off.
            </div>
          )}

          {/* ── the real thing ──────────────────────────────────────────────── */}
          {!clsErr && !subjLoading && !subjErr && subjects.length > 0 && (
            <div style={gridStyle}>
              {subjects.map((s: any) => {
                const busy = pendingId === s.id;
                const on = !!s.is_enabled;
                return (
                  <div key={s.id} style={{
                    ...subjectCardStyle,
                    background: on ? C.card : C.ivory,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13.5, fontWeight: 700, color: on ? C.ink : C.muted,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{s.name}</div>
                        {!on && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.faint, marginTop: 2 }}>
                            Off — hidden from teachers and students
                          </div>
                        )}
                      </div>
                      <SubjectSwitch
                        on={on} busy={busy} locked={pendingId !== null && !busy}
                        onClick={() => toggle(s)}
                        label={on
                          ? `Turn ${s.name} off for ${subj?.class?.name || "this class"}`
                          : `Turn ${s.name} on for ${subj?.class?.name || "this class"}`}
                      />
                    </div>

                    <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.55 }}>
                      {/* A bare "0 lessons" reads to a school as "the platform
                          has nothing". When the server sends a note it has
                          already named WHICH link broke and what to do about
                          it, so the note replaces the zero rather than sitting
                          beside it — the zero is the least useful half. */}
                      {s.note ? (
                        <span style={{ color: C.faint }}>{s.note}</span>
                      ) : (
                        <span style={{ color: C.muted }}>
                          {s.chapters || 0} chapter{Number(s.chapters) === 1 ? "" : "s"}
                          {" · "}{s.topics || 0} topic{Number(s.topics) === 1 ? "" : "s"}
                          {" · "}
                          {s.items
                            ? `${s.items} lesson${Number(s.items) === 1 ? "" : "s"}`
                            : "no lessons yet"}
                        </span>
                      )}
                    </div>

                    {busy && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 11, color: C.faint, marginTop: 8,
                      }}>
                        <Loader2 size={12} className="animate-spin" /> Saving…
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Why the counts can differ from what a teacher sees — said once, here,
            instead of leaving an administrator to guess. */}
        {!clsErr && classes.length > 0 && subjects.length > 0 && <FooterNote />}
      </div>
    </ModulePage>
  );
}

/* A plain closing note, not a state card — nothing is empty or broken here; it
 * is simply the sentence that stops a support call about the numbers. */
function FooterNote() {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      fontSize: 12.5, color: C.muted, lineHeight: 1.6,
      background: C.ivory, border: `1px solid ${C.line2}`,
      borderRadius: 12, padding: "13px 15px",
    }}>
      <Info size={15} style={{ color: C.gold, flex: "none", marginTop: 2 }} />
      <span>
        Chapters and topics come from the board you chose above, so these numbers
        change when the board or session changes. Lessons are added over time —
        a subject with few lessons today will fill up without you doing anything.
      </span>
    </div>
  );
}

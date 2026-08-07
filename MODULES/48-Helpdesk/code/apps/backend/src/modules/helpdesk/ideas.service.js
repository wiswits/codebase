'use strict';
/**
 * Ideas — grouping what schools ask for, at no running cost.
 *
 * WHY GROUPING IS THE WHOLE FEATURE
 * ---------------------------------
 * One admin writing "print receipt" is a line in a queue. Eleven people across
 * four schools writing "print receipt", "print invoice against all records and
 * download" and "receipt print nahi hota" is a roadmap item, and nobody has to
 * argue about its priority. The value is not in capturing ideas — we already
 * capture them — it is in showing that the same want arrived many times.
 *
 * WHY NO AI HERE
 * --------------
 * An embedding call per idea is a per-idea bill forever, for a job that a
 * school-sized dataset does not need. This is deterministic: normalise, drop
 * the words every sentence has, and score two ideas by how much of their
 * remaining vocabulary they share (Jaccard) with a bonus for landing on the
 * same module. It costs one CPU pass over a few hundred rows, runs offline, and
 * gives the SAME answer every time — which matters more than being clever,
 * because a grouping that shuffles itself between runs cannot be trusted to
 * carry a priority list.
 *
 * It is deliberately a SUGGESTION engine. Nothing is merged automatically: the
 * console proposes, a human accepts. Wrong groupings are cheap to reject and
 * expensive to discover later inside an accepted cluster.
 */

// Words that carry no signal in a school's feature request. Kept small on
// purpose — an over-eager stop list is how "not working" and "working" end up
// looking identical.
const STOP = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'are', 'was', 'were',
  'you', 'your', 'our', 'their', 'its', 'his', 'her', 'they', 'them', 'we', 'us', 'it',
  'in', 'on', 'at', 'to', 'of', 'is', 'be', 'a', 'an', 'as', 'by', 'or', 'if', 'so', 'but',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'do', 'does', 'did', 'done',
  'please', 'kindly', 'want', 'need', 'like', 'also', 'there', 'here', 'when', 'then',
  'what', 'which', 'who', 'how', 'why', 'because', 'about', 'after', 'before', 'more',
  'some', 'any', 'all', 'not', 'no', 'yes', 'per', 'via', 'etc', 'ho', 'hai', 'kar', 'ke',
  'ki', 'ka', 'me', 'mein', 'se', 'bhi', 'nahi', 'kya', 'aur',
]);

// Same want, different word. Only pairs a school actually used — this list
// earns its place by evidence, not by imagination, and every entry should be
// traceable to a real report.
const SYNONYM = new Map(Object.entries({
  invoice: 'receipt', bill: 'receipt', receipts: 'receipt',
  print: 'print', printing: 'print', printed: 'print', download: 'print',
  remove: 'delete', deletion: 'delete', deleting: 'delete',
  attendence: 'attendance', attendace: 'attendance',
  calender: 'calendar',
  timetable: 'timetable', schedule: 'timetable',
  buttons: 'button', links: 'link', pages: 'page', lists: 'list',
  organised: 'organise', organized: 'organise', organise: 'organise', arrange: 'organise',
  beautiful: 'design', beautifully: 'design', ui: 'design', look: 'design', looks: 'design',
  parents: 'parent', students: 'student', teachers: 'teacher', staffs: 'staff',
}));

// The vocabulary a token may be "corrected" onto — every word the synonym map
// knows, on either side.
const KNOWN = [...new Set([...SYNONYM.keys(), ...SYNONYM.values()])];

/**
 * Edit distance, but it stops as soon as it exceeds `max`.
 *
 * WHY THIS IS HERE AT ALL: the ticket that made it necessary says "print
 * invoivce against all records and download". Schools type in a hurry, on
 * phones, in a second language — "invoivce", "attendence", "alredy", "tme".
 * An engine that only knows correct spellings is an engine tuned for data it
 * will never receive, and it silently splits one want into two.
 */
function within(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    let rowMin = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
      if (prev[j] < rowMin) rowMin = prev[j];
    }
    if (rowMin > max) return false;   // no path back under the budget
  }
  return prev[b.length] <= max;
}

/**
 * A word as this engine understands it: corrected onto the known vocabulary if
 * it is one slip away from a word we know, then mapped through the synonyms.
 * Only for words of 5+ letters — at four letters an edit is as likely to be a
 * different word as a typo ("date"/"gate", "list"/"last").
 */
function canonical(w) {
  if (SYNONYM.has(w)) return SYNONYM.get(w);
  if (w.length >= 5) {
    for (const k of KNOWN) {
      if (Math.abs(k.length - w.length) <= 1 && within(w, k, 1)) return SYNONYM.get(k) || k;
    }
  }
  return w;
}

/** The words an idea is actually about. Order-independent, punctuation-free. */
function tokens(text) {
  return [...new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map(canonical),
  )];
}

/**
 * How alike are two ideas — 0 to 1.
 *
 * Jaccard over the shared vocabulary, plus a small bonus when both landed on
 * the same module. The bonus is small on purpose: two different wants on the
 * Fees page are still two different wants, and a module match must never carry
 * a pair over the line by itself.
 */
function similarity(a, b) {
  const A = new Set(a.tokens || tokens(a.text));
  const B = new Set(b.tokens || tokens(b.text));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  const jaccard = shared / (A.size + B.size - shared);
  const sameModule = a.module && b.module && a.module === b.module ? 0.12 : 0;
  return Math.min(1, jaccard + (jaccard > 0 ? sameModule : 0));
}

const THRESHOLD = 0.34;

/**
 * Group ideas that are asking for the same thing.
 *
 * Single-link agglomeration in one pass: an idea joins the first group it is
 * close enough to, otherwise it starts its own. Deterministic given a stable
 * input order (callers pass oldest-first), which is why the console can show
 * the same groups tomorrow as today.
 *
 * Returns groups with their members and the numbers that decide priority —
 * how many people, how many roles, how many schools. A want reported by three
 * roles in three schools outranks one person asking three times, and this is
 * where that becomes visible rather than argued.
 */
function groupIdeas(ideas, threshold = THRESHOLD) {
  const prepared = ideas.map((i) => ({ ...i, tokens: tokens(`${i.title || ''} ${i.text || ''}`) }));
  const groups = [];

  for (const idea of prepared) {
    let best = null; let bestScore = 0;
    for (const g of groups) {
      // Score against the closest member, not an average: a group's meaning
      // drifts as it grows, and averaging quietly lets unrelated things in.
      for (const m of g.members) {
        const s = similarity(idea, m);
        if (s > bestScore) { bestScore = s; best = g; }
      }
    }
    if (best && bestScore >= threshold) best.members.push(idea);
    else groups.push({ members: [idea] });
  }

  return groups.map((g) => {
    const orgs = new Set(g.members.map((m) => m.org_id).filter(Boolean));
    const roles = new Set(g.members.map((m) => (m.role || '').toLowerCase()).filter(Boolean));
    const people = new Set(g.members.map((m) => m.reported_by).filter(Boolean));
    return {
      // The title is the SHORTEST member: schools write their clearest line
      // first and elaborate afterwards, and a short title stays readable in a list.
      title: g.members.map((m) => m.title || '').filter(Boolean)
        .sort((a, b) => a.length - b.length)[0] || 'Untitled idea',
      members: g.members.map((m) => ({ ...m, tokens: undefined })),
      count: g.members.length,
      people: people.size || g.members.length,
      roles: [...roles],
      orgs: orgs.size,
      module: g.members[0]?.module || null,
    };
  })
    // Most-asked first, then most roles, then most schools — the same order a
    // person would put them in if they read every ticket by hand.
    .sort((a, b) => b.people - a.people || b.roles.length - a.roles.length || b.orgs - a.orgs);
}

module.exports = { tokens, similarity, groupIdeas, canonical, THRESHOLD };

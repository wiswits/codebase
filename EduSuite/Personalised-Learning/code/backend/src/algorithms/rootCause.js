'use strict';

/**
 * ALGORITHM 2 — ROOT CAUSE ANALYSIS (pure core) ⭐⭐⭐
 *
 * "Ch07 weak? Nahi. Ch01 weak hai. Ch07 to sirf lakshan hai."
 *
 * Walks the curriculum prerequisite graph. If a weak topic's prerequisites are
 * themselves weak, it's a symptom — trace down to the deepest weak topic (the
 * root). Fix the root and the dependents improve on their own.
 *
 *   graph: { [wiswits_id]: { requires: [...], enables: [...] } }
 */

const { SEVERITY_RANK } = require('./constants');

const MAX_DEPTH = 10; // safety valve against pathological graphs

function severityRank(sev) {
  return SEVERITY_RANK[sev] ?? 99;
}

/**
 * Trace from `start` down its weak prerequisites to the root.
 * Cycle-guarded (visited set) and depth-capped — MANDATORY.
 */
function traceToRoot(graph, weakSet, byId, start) {
  const path = [start];
  const visited = new Set([start]);
  let current = start;
  let depth = 0;

  while (true) {
    const prereqs = (graph[current] && graph[current].requires) || [];

    // among weak, unvisited prereqs, descend into the worst (lowest accuracy)
    const weakPrereqs = prereqs
      .filter((p) => weakSet.has(p) && !visited.has(p))
      .sort((a, b) => byId[a].accuracy - byId[b].accuracy);

    if (weakPrereqs.length === 0) break; // yahi root hai

    current = weakPrereqs[0];
    visited.add(current); // ⚠️ cycle guard
    path.push(current);
    depth++;

    if (depth > MAX_DEPTH) break; // ⚠️ safety valve
  }

  return { root: current, depth, path: path.reverse() };
}

/**
 * Annotate each candidate with root-cause info and sort roots-first.
 * Mutates and returns the candidate list (matches spec contract).
 */
function findRootCauses(candidates, graph) {
  const weakSet = new Set(candidates.map((c) => c.wiswits_id));
  const byId = Object.fromEntries(candidates.map((c) => [c.wiswits_id, c]));

  for (const wa of candidates) {
    const prereqs = (graph[wa.wiswits_id] && graph[wa.wiswits_id].requires) || [];
    const weakPrereqs = prereqs.filter((p) => weakSet.has(p));

    if (weakPrereqs.length === 0) {
      // no weak prerequisite → this IS a root
      wa.is_root_cause = true;
      wa.root_wiswits_id = wa.wiswits_id;
      wa.depth_from_root = 0;
      wa.chain = [wa.wiswits_id];
    } else {
      // a prerequisite is weak → this is a symptom
      const chain = traceToRoot(graph, weakSet, byId, wa.wiswits_id);
      wa.is_root_cause = false;
      wa.root_wiswits_id = chain.root;
      wa.depth_from_root = chain.depth;
      wa.chain = chain.path; // full path for UI viz
    }
  }

  // PRIORITY — roots first, then by severity (worst first)
  candidates.sort((a, b) => {
    if (a.is_root_cause !== b.is_root_cause) return a.is_root_cause ? -1 : 1;
    return severityRank(a.severity) - severityRank(b.severity);
  });

  return candidates;
}

module.exports = { traceToRoot, findRootCauses, severityRank, MAX_DEPTH };

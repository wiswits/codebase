'use strict';

/**
 * Mock QBank + Curriculum adapters so the PL module runs standalone in dev.
 * Shapes mirror the real HTTP contract exactly — swapping to httpAdapters
 * changes nothing for callers.
 */

// ─── Curriculum: a small Class-10 Maths prerequisite graph ────
const PREREQ_GRAPH = {
  MATH10C01T01: { requires: ['MATH09C01T03'], enables: ['MATH10C01T02'] },
  MATH10C01T02: { requires: ['MATH10C01T01', 'MATH09C01T03'], enables: ['MATH10C01T03', 'MATH10C03T01'] },
  MATH10C01T03: { requires: ['MATH10C01T02'], enables: ['MATH10C03T02'] },
  MATH10C03T01: { requires: ['MATH10C01T02'], enables: ['MATH10C03T02'] },
  MATH10C03T02: { requires: ['MATH10C01T02', 'MATH10C03T01'], enables: ['MATH10C07T01'] },
  MATH10C05T01: { requires: ['MATH09C05T01'], enables: ['MATH10C05T02'] },
  MATH10C05T02: { requires: ['MATH10C05T01'], enables: [] },
  MATH10C07T01: { requires: ['MATH10C03T02'], enables: [] },
  MATH09C01T03: { requires: [], enables: ['MATH10C01T01', 'MATH10C01T02'] },
  MATH09C05T01: { requires: [], enables: ['MATH10C05T01'] },
};

const curriculumApi = {
  async getPrerequisiteGraph() {
    return PREREQ_GRAPH;
  },
};

// ─── QBank: synthesize deterministic questions on demand ──────
function makeQuestion(wiswits_id, difficulty, i) {
  const est = { easy: 60, medium: 90, hard: 150, extreme: 210 }[difficulty] || 90;
  return {
    id: Number(`${hashCode(wiswits_id + difficulty)}${i}`.slice(0, 9)),
    question_id: Number(`${hashCode(wiswits_id + difficulty)}${i}`.slice(0, 9)),
    wiswits_id,
    difficulty,
    bloom: ['remember', 'understand', 'apply', 'analyze'][i % 4],
    est_time_sec: est,
    marks: 2,
    stem: `[${wiswits_id} · ${difficulty}] Sample question #${i + 1}`,
    has_solution: true,
  };
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(h);
}

const qbankApi = {
  async pick({ wiswits_id, difficulty, count, exclude = [] }) {
    const out = [];
    const ex = new Set(exclude);
    let i = 0;
    while (out.length < count && i < count * 5) {
      const q = makeQuestion(wiswits_id, difficulty, i);
      if (!ex.has(q.id)) out.push(q);
      i++;
    }
    return out;
  },
  async pickOne({ wiswits_id, difficulty = 'medium' }) {
    return makeQuestion(wiswits_id, difficulty, 0);
  },
  async get(question_id) {
    return { id: question_id, question_id, stem: `Question ${question_id}` };
  },
  async getOptionMeta(question_id, optionKey) {
    return {
      text: `Option ${optionKey}`,
      distractor_reason: 'sign_error',
      misconception: 'Signs flipped while splitting the middle term',
      remediation_hint: 'Revisit how signs come out of (x+a)(x+b)',
    };
  },
};

module.exports = { curriculumApi, qbankApi };

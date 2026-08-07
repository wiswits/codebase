'use strict';

/**
 * LOCKED tuning constants for the PL algorithms.
 * ⚠️ These encode AK Sir's pedagogy. Do not change without algorithm review.
 */

// ─── Weak Area Detector ───────────────────────────────────────
const RULES = Object.freeze({
  MIN_SAMPLE: 3, // 1 galat ≠ weak area
  RECENCY_DAYS: 90, // purana data stale
  MIN_CONFIDENCE: 0.4, // kam data = chup raho
  DECAY_DAYS: 60, // 60 din no retest = decayed
});

const SEVERITY_BANDS = Object.freeze({
  critical: [0, 30],
  weak: [30, 50],
  borderline: [50, 70],
  strong: [70, 85],
  mastered: [85, 101],
});

const SEVERITY_RANK = Object.freeze({
  critical: 0,
  weak: 1,
  borderline: 2,
  strong: 3,
  mastered: 4,
});

// ─── Behaviour Analysis (time ratios) ─────────────────────────
const T = Object.freeze({
  VERY_FAST: 0.35,
  FAST: 0.6,
  NORMAL_LO: 0.6,
  NORMAL_HI: 1.4,
  SLOW: 1.4,
  VERY_SLOW: 2.0,
});

// ─── Distractor / Misconception Analysis ──────────────────────
const D = Object.freeze({
  MIN_SAMPLE: 10,
  MISCONCEPTION_PCT: 30, // 30%+ one wrong option = pattern
  STRONG_MISCONCEPTION: 50, // 50%+ = whole class
  QUESTION_SUSPECT_ACC: 15, // <15% correct = question suspect
  KEY_ERROR_PCT: 60, // 60%+ one option = answer key wrong?
  AMBIGUOUS_ENTROPY: 0.85,
  DI_NON_DISCRIMINATING: 0.15,
});

// ─── Worksheet Generator ──────────────────────────────────────
const W = Object.freeze({
  MAX_TARGETS: 2, // >2 = focus toot jaata hai
  NO_REPEAT_DAYS: 30, // rote learning se bachna
  MAX_QUESTIONS: 15,
  MIN_QUESTIONS: 8,
});

// severity → difficulty ladder
const LADDERS = Object.freeze({
  critical: { easy: 6, medium: 3, hard: 1 }, // confidence pehle
  weak: { easy: 4, medium: 4, hard: 2 },
  borderline: { easy: 2, medium: 5, hard: 3 },
  revision: { easy: 2, medium: 4, hard: 4 },
  challenge: { easy: 1, medium: 4, hard: 5 }, // mastered ko stretch
});

// ─── Recovery Cycle ───────────────────────────────────────────
const C = Object.freeze({
  CLOSE_THRESHOLD: 70, // 70% = gap band
  IMPROVE_THRESHOLD: 15, // +15% = progress
  WORSEN_THRESHOLD: -5,
  MAX_CYCLES: 3, // 3 ke baad insaan chahiye
  ABANDON_DAYS: 45,
});

// ─── Distractor Reason Vocabulary (LOCKED) ────────────────────
const DISTRACTOR_REASONS = Object.freeze({
  conceptual: [
    'concept_confusion',
    'definition_error',
    'formula_confusion',
    'property_misapplication',
    'inverse_operation',
  ],
  procedural: [
    'incomplete_procedure',
    'step_skipped',
    'wrong_order',
    'sign_error',
    'unit_error',
  ],
  careless: [
    'arithmetic_slip',
    'transcription_error',
    'misread_question',
    'partial_read',
  ],
  reasoning: ['overgeneralization', 'assumption_error', 'logical_gap', 'reverse_logic'],
  design: ['plausible_distractor', 'common_misconception'],
});

const ALL_DISTRACTOR_REASONS = Object.freeze(
  Object.values(DISTRACTOR_REASONS).flat()
);

module.exports = {
  RULES,
  SEVERITY_BANDS,
  SEVERITY_RANK,
  T,
  D,
  W,
  LADDERS,
  C,
  DISTRACTOR_REASONS,
  ALL_DISTRACTOR_REASONS,
};

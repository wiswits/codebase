'use strict';

/**
 * Seed fixtures — a Class-10 Maths curriculum slice + deterministic name
 * generation. Names are generated (not read from client_users) so the seed
 * never writes to shared platform tables.
 */

// Class-10 Maths topics (wiswits_id → {chapter, name}). Prereq graph in
// mockAdapters.js references the same ids.
const TOPICS = [
  { id: 'MATH10C01T01', ch: 1, name: 'Euclid Division Lemma' },
  { id: 'MATH10C01T02', ch: 1, name: 'Real Numbers — HCF/LCM' },
  { id: 'MATH10C01T03', ch: 1, name: 'Irrational Numbers' },
  { id: 'MATH10C03T01', ch: 3, name: 'Polynomials — Zeroes' },
  { id: 'MATH10C03T02', ch: 3, name: 'Polynomial Division' },
  { id: 'MATH10C05T01', ch: 5, name: 'Triangles — Similarity' },
  { id: 'MATH10C05T02', ch: 5, name: 'Pythagoras Applications' },
  { id: 'MATH10C07T01', ch: 7, name: 'Quadratic Equations' },
];

const CHAPTER_NAME = {
  1: 'Real Numbers',
  3: 'Polynomials',
  5: 'Triangles',
  7: 'Quadratic Equations',
};

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const BLOOMS = ['remember', 'understand', 'apply', 'analyze'];
const DISTRACTORS = ['sign_error', 'arithmetic_slip', 'incomplete_procedure', 'concept_confusion', 'misread_question'];

const FIRST = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Kabir', 'Meera', 'Vivaan', 'Anaya', 'Arjun', 'Diya', 'Ishaan', 'Kiara', 'Reyansh', 'Aadhya', 'Vihaan', 'Saanvi', 'Krishna', 'Myra', 'Dhruv', 'Aarohi'];
const LAST = ['Sharma', 'Singh', 'Verma', 'Patel', 'Shah', 'Joshi', 'Gupta', 'Nair', 'Reddy', 'Iyer', 'Mehta', 'Rao', 'Das', 'Kapoor', 'Bose'];

/** Deterministic name from a student id (stable across runs). */
function nameFor(studentId) {
  const f = FIRST[studentId % FIRST.length];
  const l = LAST[Math.floor(studentId / FIRST.length) % LAST.length];
  return `${f} ${l}`;
}

// small seeded PRNG (mulberry32) — deterministic seeds, no Math.random in seed
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A real, fully-tagged MCQ bank (spec Part 1.2 tag contract) for the ONLINE
 * attempt demo — options + correct key + distractor_reason/misconception per
 * wrong option + a worked solution. Used by /tests/demo-online.
 */
const ONLINE_QUESTIONS = [
  {
    wiswits_id: 'MATH10C01T02', bloom: 'apply', difficulty: 'easy', est_time_sec: 60,
    stem: 'Find the HCF of 12 and 18 using Euclid’s division lemma.',
    options: [
      { key: 'A', text: 'HCF = 6', is_correct: true },
      { key: 'B', text: 'HCF = 12', is_correct: false, distractor_reason: 'concept_confusion', misconception: 'Student took LCM instead of HCF' },
      { key: 'C', text: 'HCF = 3', is_correct: false, distractor_reason: 'incomplete_procedure', misconception: 'Stopped the division algorithm one step early' },
      { key: 'D', text: 'HCF = 18', is_correct: false, distractor_reason: 'arithmetic_slip', misconception: 'Calculation error in division' },
    ],
    solution: 'Apply Euclid’s algorithm: 18 = 12×1 + 6, then 12 = 6×2 + 0. Remainder 0 → divisor 6 is the HCF.',
  },
  {
    wiswits_id: 'MATH10C01T03', bloom: 'understand', difficulty: 'medium', est_time_sec: 90,
    stem: 'Which of the following is an irrational number?',
    options: [
      { key: 'A', text: '√5', is_correct: true },
      { key: 'B', text: '√16', is_correct: false, distractor_reason: 'definition_error', misconception: 'Did not simplify the perfect square first' },
      { key: 'C', text: '22/7', is_correct: false, distractor_reason: 'concept_confusion', misconception: 'Confused a rational approximation of π with an irrational number' },
      { key: 'D', text: '0.75', is_correct: false, distractor_reason: 'definition_error', misconception: 'Thinks all decimals are irrational' },
    ],
    solution: '√5 cannot be written as p/q with q≠0 — it is irrational. √16 = 4 (rational), 22/7 and 0.75 are both rational.',
  },
  {
    wiswits_id: 'MATH10C03T01', bloom: 'apply', difficulty: 'medium', est_time_sec: 90,
    stem: 'Find the zeroes of the polynomial p(x) = x² − 3x − 4.',
    options: [
      { key: 'A', text: 'x = 4, −1', is_correct: true },
      { key: 'B', text: 'x = −4, 1', is_correct: false, distractor_reason: 'sign_error', misconception: 'Signs flipped while factoring' },
      { key: 'C', text: 'x = 4, 1', is_correct: false, distractor_reason: 'sign_error', misconception: 'One sign flipped while factoring' },
      { key: 'D', text: 'x = 3, 4', is_correct: false, distractor_reason: 'concept_confusion', misconception: 'Used the coefficients directly as the roots' },
    ],
    solution: 'x² − 3x − 4 = (x−4)(x+1) = 0 ⇒ x = 4 or x = −1.',
  },
  {
    wiswits_id: 'MATH10C03T02', bloom: 'analyze', difficulty: 'hard', est_time_sec: 150,
    stem: 'On dividing x³ − 3x² + x + 2 by a polynomial g(x), the quotient is x − 2 and remainder is −2x + 4. What is g(x)?',
    options: [
      { key: 'A', text: 'x² − x + 1', is_correct: true },
      { key: 'B', text: 'x² + x + 1', is_correct: false, distractor_reason: 'sign_error', misconception: 'Sign error while rearranging the division identity' },
      { key: 'C', text: 'x² − x − 1', is_correct: false, distractor_reason: 'sign_error', misconception: 'Sign error in the constant term' },
      { key: 'D', text: 'x − 1', is_correct: false, distractor_reason: 'incomplete_procedure', misconception: 'Forgot the division algorithm has degree(g) = degree(dividend) − degree(quotient)' },
    ],
    solution: 'Dividend = g(x)·Quotient + Remainder ⇒ g(x) = [(x³−3x²+x+2) − (−2x+4)] ÷ (x−2) = x²−x+1.',
  },
  {
    wiswits_id: 'MATH10C05T01', bloom: 'understand', difficulty: 'easy', est_time_sec: 60,
    stem: 'In similar triangles △ABC ~ △PQR, if AB/PQ = 2/3, what is the ratio of their areas?',
    options: [
      { key: 'A', text: '4 : 9', is_correct: true },
      { key: 'B', text: '2 : 3', is_correct: false, distractor_reason: 'property_misapplication', misconception: 'Used the side ratio directly instead of squaring it' },
      { key: 'C', text: '8 : 27', is_correct: false, distractor_reason: 'property_misapplication', misconception: 'Cubed the ratio instead of squaring' },
      { key: 'D', text: '3 : 2', is_correct: false, distractor_reason: 'inverse_operation', misconception: 'Inverted the ratio' },
    ],
    solution: 'For similar triangles, ratio of areas = (ratio of sides)² = (2/3)² = 4/9.',
  },
  {
    wiswits_id: 'MATH10C05T02', bloom: 'apply', difficulty: 'medium', est_time_sec: 90,
    stem: 'A ladder 10m long reaches a window 8m above the ground. How far is the foot of the ladder from the wall?',
    options: [
      { key: 'A', text: '6 m', is_correct: true },
      { key: 'B', text: '18 m', is_correct: false, distractor_reason: 'inverse_operation', misconception: 'Added the squares instead of subtracting' },
      { key: 'C', text: '2 m', is_correct: false, distractor_reason: 'arithmetic_slip', misconception: 'Arithmetic error while taking the square root' },
      { key: 'D', text: '√164 m', is_correct: false, distractor_reason: 'inverse_operation', misconception: 'Added 10² and 8² instead of subtracting' },
    ],
    solution: 'By Pythagoras: base² = 10² − 8² = 100 − 64 = 36 ⇒ base = 6 m.',
  },
  {
    wiswits_id: 'MATH10C07T01', bloom: 'apply', difficulty: 'hard', est_time_sec: 150,
    stem: 'Solve for x: x² − 2x − 15 = 0.',
    options: [
      { key: 'A', text: 'x = 5, −3', is_correct: true },
      { key: 'B', text: 'x = −5, 3', is_correct: false, distractor_reason: 'sign_error', misconception: 'Signs flipped while splitting the middle term' },
      { key: 'C', text: 'x = 5, 3', is_correct: false, distractor_reason: 'sign_error', misconception: 'One sign flipped while splitting the middle term' },
      { key: 'D', text: 'x = 15, −1', is_correct: false, distractor_reason: 'incomplete_procedure', misconception: 'Used the wrong factor pair for the middle term' },
    ],
    solution: 'x²−2x−15 = (x−5)(x+3) = 0 ⇒ x = 5 or x = −3.',
  },
  {
    wiswits_id: 'MATH10C07T01', bloom: 'analyze', difficulty: 'extreme', est_time_sec: 210,
    stem: 'For what value of k does the quadratic kx² + 2x + 1 = 0 have equal roots?',
    options: [
      { key: 'A', text: 'k = 1', is_correct: true },
      { key: 'B', text: 'k = −1', is_correct: false, distractor_reason: 'sign_error', misconception: 'Sign error while solving the discriminant equation' },
      { key: 'C', text: 'k = 4', is_correct: false, distractor_reason: 'formula_confusion', misconception: 'Forgot to divide by 4a in the discriminant formula' },
      { key: 'D', text: 'k = 2', is_correct: false, distractor_reason: 'arithmetic_slip', misconception: 'Arithmetic slip while solving for k' },
    ],
    solution: 'Equal roots ⇒ discriminant b²−4ac = 0 ⇒ 4 − 4k = 0 ⇒ k = 1.',
  },
  {
    wiswits_id: 'MATH10C01T01', bloom: 'remember', difficulty: 'easy', est_time_sec: 45,
    stem: 'Euclid’s division lemma states that for positive integers a and b, there exist unique integers q and r such that:',
    options: [
      { key: 'A', text: 'a = bq + r, 0 ≤ r < b', is_correct: true },
      { key: 'B', text: 'a = bq + r, 0 < r ≤ b', is_correct: false, distractor_reason: 'definition_error', misconception: 'Got the remainder range boundary wrong' },
      { key: 'C', text: 'a = qr + b, 0 ≤ r < b', is_correct: false, distractor_reason: 'definition_error', misconception: 'Mixed up which terms multiply' },
      { key: 'D', text: 'b = aq + r, 0 ≤ r < a', is_correct: false, distractor_reason: 'definition_error', misconception: 'Swapped the roles of a and b' },
    ],
    solution: 'Euclid’s division lemma: a = bq + r where 0 ≤ r < b, for positive integers a, b.',
  },
  {
    wiswits_id: 'MATH10C03T02', bloom: 'understand', difficulty: 'easy', est_time_sec: 60,
    stem: 'If one zero of the polynomial x² − 4x + k is 1, what is the value of k?',
    options: [
      { key: 'A', text: 'k = 3', is_correct: true },
      { key: 'B', text: 'k = −3', is_correct: false, distractor_reason: 'sign_error', misconception: 'Sign error while substituting x=1' },
      { key: 'C', text: 'k = 4', is_correct: false, distractor_reason: 'arithmetic_slip', misconception: 'Arithmetic slip while simplifying' },
      { key: 'D', text: 'k = 5', is_correct: false, distractor_reason: 'arithmetic_slip', misconception: 'Arithmetic slip while simplifying' },
    ],
    solution: 'Substitute x=1: 1 − 4 + k = 0 ⇒ k = 3.',
  },
];

module.exports = { TOPICS, CHAPTER_NAME, DIFFICULTIES, BLOOMS, DISTRACTORS, nameFor, rng, ONLINE_QUESTIONS };

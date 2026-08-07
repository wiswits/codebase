# ALGORITHMS.md — The Brain

All 8 cores live in `backend/src/algorithms/` as **pure functions** (no I/O). Data
is injected by services so every rule is unit-testable. ⚠️ AK Sir reviews each.

Tuning constants are frozen in [`constants.js`](../backend/src/algorithms/constants.js).

---

## 1. Weak Area Detector — `weakAreaDetector.js`
Four gates before any weak-area is asserted (one false positive = lost trust):

1. **Sample** — `attempted < 3` → skip.
2. **Recency** — last attempt > 90 days → mark `decayed`.
3. **Severity** — bands `critical<30, weak<50, borderline<70, strong<85, mastered`. Strong/mastered → close if open.
4. **Confidence** — `sample*0.45 + recency*0.35 + consistency*0.20`; `< 0.40` → stay silent.

`analyzeErrorPattern()` reduces wrong responses to a dominant `distractor_reason` + weakest Bloom.

## 2. Root Cause — `rootCause.js` ⭐⭐⭐
Walks the curriculum prerequisite graph. If a weak topic's prereqs are also weak,
it's a **symptom**; descend (into the lowest-accuracy weak prereq) to the **root**.
- **Cycle guard** (`visited` set) + **depth cap** (10) are mandatory.
- Output sorts **roots first**, then by severity.
- *Money example:* Ch07(28) → Ch03(34) → Ch01(41) ⇒ root = Ch01, depths 2/1/0.

## 3. Behaviour — `behaviour.js` ⭐⭐
`classifyResponse()` turns time + edits into a diagnosis: `silly_mistake`,
`concept_gap`, `confused`, `guess`, `rushed`, `overthinking`, `mastered`, `lucky_guess`…
`buildBehaviourProfile()` → archetype (`rusher/overthinker/gives_up/erratic/balanced`),
pace, error signature, and a Hindi **coaching note**.
> Two students, same wrong answer, opposite treatment — that's the magic.

## 4. Distractor / Misconception — `distractor.js` ⭐⭐⭐
Per question: distribution, top wrong option, and:
- **key_error** (`<15%` correct + `≥60%` one option),
- **ambiguous** (`<15%` + high entropy),
- **non_discriminating** (`DI < 0.15` mid-band),
- **misconception insight** (`<60%` acc + `≥30%` one wrong option; `≥50%` = class-wide).
`clusterMisconceptions()` flags the same reason across 2+ questions as systemic.

## 5. Worksheet Generator — `worksheet.js` ⭐⭐⭐
Plans (no I/O): strategy → **behaviour override** (rusher + silly>40% ⇒ coaching, not
worksheet) → **root-first target** selection (max 2) → **difficulty ladder** by severity
(`critical: 6/3/1`) → easy→hard ordering → generation reason.

## 6. Recovery Cycle — `recoveryCycle.js` ⭐⭐⭐ (the Loop's proof)
`classifyOutcome(before, after)` → `closed(≥70) / improved(+15) / no_change / worsened(≤-5)`.
`nextAction()` → close+recheck-dependents / next cycle / confidence_build / **escalate**.
`canStartCycle()` caps at **3 cycles**, then `needs_teacher`.

## 7. Benchmarking — `benchmark.js` ⭐⭐
`buildComparison()` — self-improvement first, class avg for context, **topper as a score
only**, percentile + band. **No `rank`, no `leaderboard`, never "bottom 25%"** (→ `needs_support`).

## 8. Spaced Repetition — `sm2.js`
Textbook SM-2 (`ease ≥ 1.3`, intervals 1/6/×ef; interval uses the **pre-update** ease
factor). `responseToQuality()` maps graded responses to 0–5; `nextDifficulty()` adapts.

---

### Tests
`backend/tests/` — 92 tests, ~88% statement coverage on `algorithms/`. Every DoD
algorithm checkbox (min-sample, recency, confidence, root chain, cycle guard, ladders,
behaviour override, misconception thresholds, no-rank) is asserted. Run `npm test`.

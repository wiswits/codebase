# TAG_CONTRACT.md — Question Bank Tag Contract

> Ye module utna hi smart hoga jitne tags QBank me hain.
> Bina tags: a calculator. Tags ke saath: a diagnostician.

The PL module **consumes** QBank questions over HTTP. A question is only usable
here if it carries the required tags. Coverage is scored, not assumed.

## Required tags (a question is unusable without ALL of these)
```
curriculum.wiswits_id          ⭐ THE ADDRESS (e.g. MATH10C01T02)
cognitive.bloom                remember|understand|apply|analyze|evaluate|create
cognitive.difficulty           easy|medium|hard|extreme
cognitive.est_time_sec         basis for all time analysis
competency.competency_code
```

## Required for "magic" (module works without them, just not magically)
```
prerequisites.requires         → root cause analysis
options[].distractor_reason    → misconception detection
options[].misconception        → reteach insight
```

## Distractor reason vocabulary (LOCKED — new reason ⇒ ask AK Sir)
Mirrored in [`constants.js`](../backend/src/algorithms/constants.js) `DISTRACTOR_REASONS`.

| Group | Reasons |
|---|---|
| **Conceptual** | concept_confusion, definition_error, formula_confusion, property_misapplication, inverse_operation |
| **Procedural** | incomplete_procedure, step_skipped, wrong_order, sign_error, unit_error |
| **Careless** | arithmetic_slip, transcription_error, misread_question, partial_read |
| **Reasoning** | overgeneralization, assumption_error, logical_gap, reverse_logic |
| **Trap/Design** | plausible_distractor, common_misconception |

## Coverage gate
```
basic  = present(required)      / len(required)     → usable  if basic  == 1
magic  = present(magic_tags)    / len(magic_tags)   → magical if magic  == 1
```
Surface this on the dashboard so Content team knows exactly which chapters to
tag next (e.g. "Ch01–Ch07 Maths ke 700 questions me prereq + distractor tag lagao").

## System writes back (the quality loop)
The PL nightly job feeds calibrated values back to QBank via
`emit('pl.question_stats', …)` and `emit('pl.question_flagged', …)`:
`p_value`, `discrimination_index`, `point_biserial`, `avg_time_sec`,
`distractor_distribution`, and quality `flag` (too_easy / too_hard / ambiguous /
bad_distractor / non_discriminating / key_error). Never blame the student for a
bad question — flag the question.

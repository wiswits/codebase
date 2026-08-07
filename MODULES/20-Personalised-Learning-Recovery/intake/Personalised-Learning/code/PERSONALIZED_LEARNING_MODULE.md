# 🎯 WISWITS APEX OS — PERSONALIZED LEARNING MODULE

## The Complete Specification

| | |
|---|---|
| **Module Key** | `pl` |
| **API Prefix** | `/api/pl` |
| **Codename** | The Loop Engine |
| **Team** | 3 interns + AK Sir (algorithm review) |
| **Duration** | 8 weeks |
| **Difficulty** | ⭐⭐⭐⭐⭐ (highest in the platform) |
| **Standalone Price** | ₹40k – 1.5L/yr |
| **Strategic Value** | 🏆 **THE MOAT** — 7 years of AK Sir's pedagogy in code |

> ⚠️ **Pehle `00_INJECTION_CONTRACT.md` padho.**
> ⚠️ Ye module ka har algorithm AK Sir review karenge. Guess mat karna — pucho.

---

# PART 0 — THE PHILOSOPHY

## 0.1 Ye Module Kyun Alag Hai

Baaki 19 modules **operations** solve karte hain — fee lena, bus track karna, attendance lagana. Zaroori hain, par har vendor deta hai.

**Ye module outcome solve karta hai.** Aur outcome hi wo cheez hai jiske liye parent 60,000 rupaye deta hai.

```
   Parent ka sawaal:  "Mera bachcha kaisa hai?"

   Aaj ka jawab:      "Theek hai." / "78% aaye hain."
                      ↑ ye jawab nahi hai. Ye number hai.

   Hamara jawab:      "Aarav ne 6 test me 61% se 81% tak safar kiya.
                       Uski 4 kamzoriyan thi — 2 theek ho gayi.
                       Teesri pe abhi kaam chal raha hai.
                       Wo jaanta hai, par jaldbaazi karta hai —
                       40% sawaalon me aadha time leta hai.
                       Speed nahi, accuracy pe kaam kar rahe hain.
                       Agla milestone: Ch01 ko 70% pe le jaana. 2 hafte."

   ↑ YE jawab hai. Aur ye jawab koi aur nahi de sakta.
```

## 0.2 The Three Beliefs

Ye module teen maanyataon pe khada hai. Inhe todoge to module bekaar ho jaayega.

```
BELIEF 1 — "Weak in Maths" ek diagnosis nahi hai. Ye ek shikayat hai.
────────────────────────────────────────────────────────────────────
   Doctor "pet dard" nahi likhta prescription me.
   Wo likhta hai "appendicitis".

   Hum bhi "Maths weak" nahi likhenge.
   Hum likhenge: "Ch01 T02 — Euclid's Division Lemma —
                  41% accuracy — 7 attempts — root cause —
                  confidence 0.82"


BELIEF 2 — Symptom pe ilaaj = waqt barbaad.
────────────────────────────────────────────────────────────────────
   Aarav Ch07 Quadratic me fail ho raha hai.
   Teacher Ch07 padhata hai. Phir fail. Phir padhata hai. Phir fail.

   Asli problem: Ch01 Real Numbers me factorization nahi aata.
   Ch01 theek karo → Ch03 apne aap sudhrega → Ch07 apne aap sudhrega.

   ⭐ Ye ek insight ₹1.5L/yr justify karta hai.


BELIEF 3 — Data nahi, decision chahiye.
────────────────────────────────────────────────────────────────────
   ❌ "Class average 61% hai"          → so what?
   ✅ "Q14 me 24 bachchon ne option B chuna. Sabko sign
       error ka bharam hai. Kal 10 minute factorization
       ke signs pe do."                → ye decision hai.

   Har screen pe ek ACTION button hona chahiye. Warna wo screen bekaar hai.
```

## 0.3 The WISWITS Loop — Codified

```
                    ╔═══════════════════════════════════════╗
                    ║        THE WISWITS LOOP               ║
                    ║   550 students · 61.3% → 81.33%       ║
                    ╚═══════════════════════════════════════╝

        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      │
   ╔═════════╗      ╔═════════╗      ╔═════════╗      ╔═════════╗
   ║  LEARN  ║ ───▶ ║  TEST   ║ ───▶ ║ ANALYZE ║ ───▶ ║ IMPROVE ║
   ╚═════════╝      ╚═════════╝      ╚═════════╝      ╚═════════╝
   Teacher          Teacher          SYSTEM           SYSTEM
   padhata          test banata      gap nikalta      worksheet banata
                    (online/paper)                    
        │                │                │                │
        │                │                │                │
   Content          QBank se        Topic-wise       Root-cause
   module           ya manual       Bloom-wise       targeted
                    ya OMR          Time-wise        Difficulty
                                    Distractor       ladder
                                    Root-cause       
                                         │                │
                                         │                ▼
                                         │           Student attempts
                                         │                │
                                         │                ▼
                                         │           ╔═════════╗
                                         └──────────▶║ RETEST  ║
                                                     ╚═════════╝
                                                          │
                                            ┌─────────────┴─────────────┐
                                            ▼                           ▼
                                     ✅ GAP CLOSED              🔄 CYCLE 2
                                     (accuracy ≥ 70%)           (max 3, phir
                                            │                    insaan chahiye)
                                            ▼
                                     ╔═══════════════╗
                                     ║   MASTERED    ║
                                     ║  📈 +23% avg  ║
                                     ╚═══════════════╝
```

**Har loop ek gap band karta hai. Poora module bas ye karta hai — baar baar, 500 students ke liye, automatically.**

---

# PART 1 — QUESTION BANK TAG CONTRACT

## 1.1 Kyun Ye Sabse Pehle

**Ye module utna hi smart hoga jitne tags QBank me hain.** Bina tags ke ye module ek calculator hai. Tags ke saath ye ek diagnostician hai.

```
   Tag nahi hai        →  "Aarav ko 28/40 aaye"           (bekaar)
   Topic tag hai       →  "Ch07 me weak hai"              (theek)
   + Bloom tag         →  "Application me weak hai"        (achha)
   + Difficulty tag    →  "Easy bhi galat kar raha hai"    (behtar)
   + Prereq tag        →  "Asli problem Ch01 me hai"       (⭐ magic)
   + Distractor tag    →  "Sign error ka bharam hai"       (⭐⭐ magic)
   + Misconception tag →  "Poori class ko yahi bharam hai" (⭐⭐⭐ magic)
```

## 1.2 The Mandatory Tag Schema

Har question me ye tags **mandatory** hain. Bina inke question QBank me accept nahi hoga.

```json
{
  "question_id": 4821,

  "curriculum": {
    "wiswits_id": "MATH10C01T02",          // ⭐ THE ADDRESS — sabse important
    "board": "cbse",
    "class_no": 10,
    "stream": "none",
    "subject_key": "MATH",
    "chapter_no": 1,
    "topic_no": 2
  },

  "cognitive": {
    "bloom": "apply",                       // ⭐ remember|understand|apply|analyze|evaluate|create
    "difficulty": "medium",                 // ⭐ easy|medium|hard|extreme
    "difficulty_calibrated": 0.58,          // ⭐ SYSTEM WRITES THIS BACK (actual p-value)
    "cognitive_load": "medium",             // low|medium|high
    "est_time_sec": 90,                     // ⭐ expected time — time analysis ka base
    "steps_required": 3                     // multi-step reasoning depth
  },

  "competency": {
    "competency_code": "M10.1.2",           // NEP competency
    "learning_outcome": "Applies Euclid's division lemma to find HCF",
    "ncf_code": "MA-S-1.2",
    "skill_tags": ["factorization", "division_algorithm", "hcf"]
  },

  "prerequisites": {                        // ⭐⭐ ROOT CAUSE KA FUEL
    "requires": ["MATH09C01T03", "MATH08C02T01"],
    "enables": ["MATH10C01T03", "MATH10C03T01"],
    "depth_from_root": 2
  },

  "type": "mcq_single",                     // mcq_single|mcq_multi|integer|
                                            // assertion_reason|match_column|subjective

  "options": [
    { "key": "A", "text": "HCF = 6",  "is_correct": true },
    { "key": "B", "text": "HCF = 12", "is_correct": false,
      "distractor_reason": "sign_error",           // ⭐⭐ THE MAGIC TAG
      "misconception": "Student took LCM instead of HCF",
      "remediation_hint": "Revisit HCF vs LCM definitions" },
    { "key": "C", "text": "HCF = 3",  "is_correct": false,
      "distractor_reason": "incomplete_factorization",
      "misconception": "Stopped division algorithm one step early",
      "remediation_hint": "Practice full Euclid steps" },
    { "key": "D", "text": "HCF = 18", "is_correct": false,
      "distractor_reason": "arithmetic_slip",
      "misconception": "Calculation error in division",
      "remediation_hint": "Check arithmetic" }
  ],

  "solution": {
    "steps": [
      { "step": 1, "text": "Apply Euclid: 12 = 6×2 + 0", "concept": "division_algorithm" },
      { "step": 2, "text": "Remainder 0 → divisor is HCF", "concept": "hcf_definition" }
    ],
    "final": "HCF = 6",
    "concept_links": ["MATH10C01T01", "MATH09C01T03"],
    "video_ref": "content://MATH10C01T02/video",
    "common_errors": ["Confusing HCF with LCM", "Stopping algorithm early"]
  },

  "provenance": {
    "source": "wiswits_original",           // wiswits_original|pyq|ncert|reference
    "pyq_year": null,
    "pyq_exam": null,                       // jee_main|jee_adv|neet|cbse_board|ntse
    "author_id": 42,
    "reviewed_by": 7,
    "version": 2
  },

  "language": {
    "en": { "stem": "...", "options": [...] },
    "hi": { "stem": "...", "options": [...] }
  },

  "stats": {                                // ⭐ SYSTEM WRITES THESE BACK
    "attempts": 1240,
    "correct": 719,
    "p_value": 0.58,                        // actual difficulty
    "discrimination_index": 0.42,           // top 27% vs bottom 27%
    "point_biserial": 0.38,
    "avg_time_sec": 104,
    "distractor_distribution": { "A": 719, "B": 312, "C": 141, "D": 68 },
    "flag": "none",                         // none|too_easy|too_hard|ambiguous|
                                            // bad_distractor|non_discriminating
    "last_calibrated": "2026-07-14T02:00:00Z"
  }
}
```

## 1.3 The Distractor Reason Vocabulary (LOCKED)

**Ye sabse valuable tag hai.** Ye batata hai ki bachche ne galti kyun ki, sirf ye nahi ki galti ki.

```
CONCEPTUAL ERRORS (samajh ki kami)
  concept_confusion          — do concepts mila diye (HCF vs LCM)
  definition_error           — definition hi galat yaad hai
  formula_confusion          — galat formula lagaya
  property_misapplication    — property galat jagah lagayi
  inverse_operation          — ulta operation kiya (× instead of ÷)

PROCEDURAL ERRORS (process ki kami)
  incomplete_procedure       — beech me chhod diya
  step_skipped               — ek step chhoda
  wrong_order                — steps ka order galat
  sign_error                 — +/− ki galti
  unit_error                 — unit conversion galat

CARELESS ERRORS (dhyan ki kami)
  arithmetic_slip            — hisaab ki chhoti galti
  transcription_error        — likhne me galti
  misread_question           — sawaal galat padha
  partial_read               — poora sawaal nahi padha

REASONING ERRORS (soch ki kami)
  overgeneralization         — special case ko general maan liya
  assumption_error           — galat maan liya
  logical_gap                — reasoning me chhed
  reverse_logic              — ulti soch

TRAP / DESIGN
  plausible_distractor       — jaanbujh ke aakarshak galat option
  common_misconception       — jaani-mani galat soch
```

**Ye vocabulary LOCKED hai.** Naya reason add karna hai? AK Sir se pucho.

## 1.4 Tag Coverage Gate

```js
// QBank se question tabhi PL me aayega jab ye sab ho:
const REQUIRED_TAGS = [
  'curriculum.wiswits_id',      // ⭐ bina iske kuch nahi
  'cognitive.bloom',
  'cognitive.difficulty',
  'cognitive.est_time_sec',
  'competency.competency_code',
];

const REQUIRED_FOR_MAGIC = [    // ye nahi honge to module "achha" rahega, "magic" nahi
  'prerequisites.requires',      // → root cause analysis
  'options[].distractor_reason', // → misconception detection
  'options[].misconception',     // → reteach insight
];

function tagCoverageScore(question) {
  const basic = REQUIRED_TAGS.filter(t => has(question, t)).length / REQUIRED_TAGS.length;
  const magic = REQUIRED_FOR_MAGIC.filter(t => has(question, t)).length / REQUIRED_FOR_MAGIC.length;
  return { basic, magic, usable: basic === 1, magical: magic === 1 };
}
```

**Dashboard pe dikhega:**
```
  QUESTION BANK TAG HEALTH

  Total questions:        1,200
  Usable in PL:           1,200  (100%) ✅
  Prerequisite tagged:      340  ( 28%) ⚠️  ← root cause sirf 28% pe chalega
  Distractor tagged:        180  ( 15%) 🚨  ← misconception sirf 15% pe chalega

  💡 Priority: Ch01-Ch07 Maths ke 700 questions me prereq + distractor tag lagao.
     Isse root cause 70% questions pe chal jaayega.
```

---

# PART 2 — DATA MODEL

## 2.1 The 24 Tables

```sql
-- ═══════════════════════════════════════════════════════════════
-- BLOCK A — ASSESSMENT CREATION
-- ═══════════════════════════════════════════════════════════════

client_pl_test
  id, org_id, title, description,
  subject_id, class_no, stream,
  type,                          -- diagnostic|practice|unit|chapter|revision|recovery|mock|remedial
  source,                        -- qbank|manual|blueprint|offline|omr|imported
  mode,                          -- online|offline|hybrid
  total_marks, total_questions, duration_min,
  negative_marking, negative_ratio,
  blueprint_id, blueprint_json,
  instructions_json,
  status,                        -- draft|ready|published|closed|archived
  is_template, template_of_id,
  created_by, +audit

client_pl_blueprint              -- ⭐ reusable test structure
  id, org_id, name, subject_id, class_no,
  chapter_weightage_json,        -- {"MATH10C01": 30, "MATH10C03": 40, ...}
  bloom_distribution_json,       -- {"remember":20,"understand":30,"apply":30,"analyze":20}
  difficulty_mix_json,           -- {"easy":30,"medium":50,"hard":20}
  type_mix_json,                 -- {"mcq_single":15,"integer":3,"subjective":2}
  total_marks, total_questions, duration_min,
  is_locked, +audit

client_pl_test_question
  id, org_id, test_id, seq,
  question_id,                   -- QBank reference
  wiswits_id,                    -- ⭐ denormalized for fast analytics
  bloom, difficulty, est_time_sec,  -- ⭐ denormalized snapshot
  marks, negative_marks,
  question_snapshot_json,        -- ⚠️⚠️ FROZEN at test creation
  section_name,                  -- "Section A", "Section B"
  is_optional, +audit

client_pl_question_map           -- ⭐ for OFFLINE tests
  id, org_id, test_id, paper_q_no,
  wiswits_id, bloom, difficulty, marks,
  question_id,                   -- optional, if mapped to QBank
  +audit

-- ═══════════════════════════════════════════════════════════════
-- BLOCK B — ASSIGNMENT & DELIVERY
-- ═══════════════════════════════════════════════════════════════

client_pl_assignment
  id, org_id, test_id,
  target_type,                   -- class|section|students|auto_group|batch
  target_json,                   -- {"class":10,"sections":["A","B"]} or {"student_ids":[...]}
  auto_group_rule_json,          -- ⭐ {"weak_in":"MATH10C03","severity":["critical","weak"]}
  opens_at, closes_at,
  attempts_allowed, time_limit_min,
  shuffle_questions, shuffle_options,
  show_solution,                 -- never|after_submit|after_close|always
  show_score,                    -- never|after_submit|after_close
  allow_review, allow_back,
  proctoring_json,               -- {"tab_switch_limit":3,"fullscreen":true}
  mode,                          -- test|practice
  status, +audit

client_pl_assignment_student     -- materialized target (fast queries)
  id, org_id, assignment_id, student_id,
  status,                        -- assigned|started|submitted|evaluated|absent|excused
  assigned_at, +audit

-- ═══════════════════════════════════════════════════════════════
-- BLOCK C — ATTEMPT & RESPONSE
-- ═══════════════════════════════════════════════════════════════

client_pl_attempt
  id, org_id, assignment_id, test_id, student_id, attempt_no,
  started_at, submitted_at, evaluated_at,
  score, max_score, percentage,
  correct_count, wrong_count, skipped_count,
  time_taken_sec, time_efficiency,        -- actual/expected
  status,                                  -- in_progress|submitted|auto_submitted|evaluated|absent
  submit_reason,                           -- manual|timeout|proctor|admin
  device_json, ip,
  tab_switches, fullscreen_exits,          -- proctoring
  is_offline_entry, entered_by,            -- ⭐ for paper tests
  +audit

client_pl_response               -- ⭐⭐ THE RICHEST TABLE
  id, org_id, attempt_id, test_question_id,
  question_id, wiswits_id,
  bloom, difficulty,             -- denormalized
  answer_json,                   -- {"selected":"B"} or {"value":42} or {"text":"..."}
  is_correct, marks_awarded, is_partial,
  time_sec,                      -- ⭐ time on this question
  time_ratio,                    -- ⭐ time_sec / est_time_sec
  visits,                        -- kitni baar aaya is question pe
  changed_count,                 -- ⭐ answer kitni baar badla
  first_answer, final_answer,    -- ⭐ pehla vs aakhri (doubt indicator)
  marked_review,
  answered_at, +audit

client_pl_attempt_event          -- ⭐ behaviour telemetry
  id, org_id, attempt_id, question_id,
  event,                         -- view|answer|change|review|skip|back|blur|focus
  at, meta_json

-- ═══════════════════════════════════════════════════════════════
-- BLOCK D — ANALYSIS LAYER
-- ═══════════════════════════════════════════════════════════════

client_pl_topic_score            -- ⭐ per student per topic
  id, org_id, student_id, wiswits_id, subject_id,
  attempted, correct, skipped,
  accuracy,                      -- correct/attempted × 100
  avg_time_sec, avg_time_ratio,
  easy_acc, medium_acc, hard_acc,   -- ⭐ difficulty-wise
  first_attempt_at, last_attempt_at,
  sample_size, trend,            -- improving|stable|declining
  updated_at

client_pl_bloom_score
  id, org_id, student_id, subject_id, bloom,
  attempted, correct, accuracy, avg_time_ratio,
  updated_at

client_pl_skill_score            -- ⭐ skill_tags se
  id, org_id, student_id, skill_tag,
  attempted, correct, accuracy, updated_at

client_pl_weak_area              -- ⭐⭐ THE CORE OUTPUT
  id, org_id, student_id, wiswits_id, subject_id,
  severity,                      -- critical|weak|borderline|strong|mastered
  accuracy, sample_size, confidence,
  is_root_cause,                 -- ⭐⭐
  root_wiswits_id,               -- ⭐⭐ agar symptom hai to root kaunsa
  depth_from_root,
  dominant_error_type,           -- ⭐ sabse common distractor_reason
  dominant_bloom_gap,            -- ⭐ kis Bloom level pe atka
  detected_at, status,           -- open|in_recovery|retesting|closed|decayed|overridden
  closed_at, override_by, override_reason,
  +audit

client_pl_profile                -- ⭐ learning profile
  id, org_id, student_id, subject_id,
  pace,                          -- fast|moderate|needs_time
  behaviour,                     -- rusher|overthinker|balanced|gives_up|erratic
  consistency_score,             -- variance across tests
  improvement_trend,             -- slope of last 5 tests
  preferred_difficulty,
  bloom_profile_json,            -- {"remember":82,"understand":71,"apply":48,...}
  strengths_json,                -- top 3 wiswits_ids
  gaps_json,                     -- top 3 weak
  error_signature_json,          -- ⭐ {"sign_error":34,"arithmetic_slip":22,...}
  silly_mistake_rate,            -- ⭐ easy+wrong+fast %
  concept_gap_rate,              -- ⭐ hard+wrong+slow %
  guess_rate,                    -- ⭐ very fast + wrong %
  revision_rate,                 -- changed_count / questions
  computed_at

-- ═══════════════════════════════════════════════════════════════
-- BLOCK E — RECOVERY LAYER
-- ═══════════════════════════════════════════════════════════════

client_pl_worksheet
  id, org_id, student_id,
  target_wiswits_ids_json,       -- ⭐ kya theek karna hai
  strategy,                      -- root_first|symptom|mixed|revision|challenge
  question_ids_json,
  difficulty_ladder_json,        -- {"easy":6,"medium":3,"hard":1}
  total_questions, est_time_min,
  pdf_path, pdf_with_solutions_path,
  generated_at, generated_by, generation_reason,
  assigned_at, attempted_at, attempt_id,
  score, status,                 -- generated|edited|assigned|attempted|reviewed|expired
  +audit

client_pl_recovery_cycle         -- ⭐⭐⭐ THE LOOP TABLE — THE PROOF
  id, org_id, student_id, weak_area_id, wiswits_id,
  cycle_no,
  detected_at, detected_accuracy,
  worksheet_id, worksheet_score, worksheet_attempted_at,
  retest_attempt_id, retest_accuracy, retest_at,
  delta,                         -- retest − detected
  outcome,                       -- improved|no_change|worsened|closed|abandoned
  days_to_close,
  closed_at, +audit

client_pl_practice_card          -- ⭐ SM-2 spaced repetition
  id, org_id, student_id, question_id, wiswits_id,
  ease_factor, interval_days, repetitions,
  due_at, last_result, last_reviewed_at,
  lapses, +audit

-- ═══════════════════════════════════════════════════════════════
-- BLOCK F — INSIGHTS LAYER
-- ═══════════════════════════════════════════════════════════════

client_pl_question_stat          -- ⭐ feeds back to QBank
  id, org_id, question_id, wiswits_id,
  attempts, correct,
  p_value,                       -- difficulty (0-1)
  discrimination_index,          -- top27% − bottom27%
  point_biserial,
  avg_time_sec, avg_time_ratio,
  distractor_json,               -- {"A":719,"B":312,"C":141,"D":68}
  distractor_efficiency_json,    -- kaunsa distractor kaam kar raha hai
  flag,                          -- none|too_easy|too_hard|ambiguous|
                                 -- bad_distractor|non_discriminating|key_error
  flag_reason, updated_at

client_pl_class_insight
  id, org_id, test_id, class_no, section,
  attempted_count, avg_score, median_score, std_dev,
  topper_score, lowest_score,
  weak_questions_json,           -- [{q_id, accuracy, misconception}]
  weak_topics_json,
  distractor_insights_json,      -- ⭐⭐ misconception clusters
  bloom_health_json,
  time_health_json,
  computed_at

client_pl_alert
  id, org_id, type, severity,
  target_role, target_id,
  subject_type, subject_id,      -- student|question|topic|class
  title, body, action_json,
  payload_json,
  status,                        -- new|read|actioned|dismissed
  created_at, read_at, actioned_at

client_pl_digest                 -- ⭐ parent weekly
  id, org_id, student_id, parent_id,
  period_start, period_end,
  payload_json,
  channel,                       -- email|whatsapp|app
  sent_at, opened_at, clicked_at

client_pl_benchmark              -- ⭐⭐ comparison data
  id, org_id, scope,             -- class|section|school|batch
  scope_id, wiswits_id, subject_id,
  test_id,
  avg_accuracy, median_accuracy,
  topper_accuracy, p90, p75, p50, p25,
  sample_size, computed_at
```

## 2.2 The Response Table — Why It's Everything

```sql
-- ⚠️ Ye table hi poore module ka fuel hai. Har column ka ek purpose hai.

client_pl_response
  is_correct        →  accuracy
  marks_awarded     →  score
  time_sec          →  ⭐ time analysis, silly mistake, guess detection
  time_ratio        →  ⭐ fast/slow relative to expected
  visits            →  ⭐ confusion indicator (5 baar aaya = confused)
  changed_count     →  ⭐ doubt indicator (3 baar badla = unsure)
  first_answer      →  ⭐⭐ instinct vs overthinking
  final_answer      →  ⭐⭐ agar first sahi tha aur final galat → overthinking!
  marked_review     →  self-awareness indicator
  answer_json       →  ⭐⭐ kaunsa distractor chuna → misconception
```

**Ek example jo ye table possible banata hai:**
```
Aarav · Q14 · Ch07 · Easy · est_time 60s

  time_sec:       22s        ← bahut tez
  visits:         1          ← ek baar dekha
  changed_count:  0          ← socha nahi
  first_answer:   B
  final_answer:   B
  is_correct:     false
  distractor:     sign_error

  → DIAGNOSIS: Silly mistake. Concept aata hai, jaldbaazi ki.
    Ilaaj: worksheet nahi. "Slow down" coaching chahiye.

──────────────────────────────────────────────────────────────

Priya · Q14 · same question

  time_sec:       180s       ← teen guna time
  visits:         4          ← baar baar aayi
  changed_count:  3          ← A → C → B → C
  first_answer:   A
  final_answer:   C
  is_correct:     false
  distractor:     concept_confusion

  → DIAGNOSIS: Concept gap. Mehnat ki, par aata nahi.
    Ilaaj: worksheet chahiye. Root cause dhundo.

──────────────────────────────────────────────────────────────

⭐ Do bachche, same question, same "galat" — par bilkul alag problem.
   Bina time_sec + changed_count ke, dono "wrong" dikhte.
   Ye difference hi ye module ka jaadu hai.
```

---

# PART 3 — THE ALGORITHMS

## 3.1 Algorithm 1 — Weak Area Detector

**Nightly, 2 AM, all orgs, all students, all subjects.**

```js
/**
 * WEAK AREA DETECTOR v1
 * The brain of the module. Get this wrong = module worthless.
 */

const RULES = Object.freeze({
  MIN_SAMPLE:        3,      // 1 galat ≠ weak area
  RECENCY_DAYS:      90,     // purana data stale
  MIN_CONFIDENCE:    0.40,   // kam data = chup raho
  DECAY_DAYS:        60,     // 60 din no retest = decayed
});

const SEVERITY_BANDS = Object.freeze({
  critical:   [0,  30],
  weak:       [30, 50],
  borderline: [50, 70],
  strong:     [70, 85],
  mastered:   [85, 101],
});

async function detectWeakAreas({ org_id, student_id }) {
  const topics = await getTopicScores({ org_id, student_id });
  const candidates = [];

  for (const t of topics) {

    // ─── GATE 1: Evidence threshold ───────────────────────────
    // Ek question galat = weak area nahi hai.
    // Teacher ka bharosa ek false positive me toot jaata hai.
    if (t.attempted < RULES.MIN_SAMPLE) continue;

    // ─── GATE 2: Recency ──────────────────────────────────────
    // 3 mahine purana data pe worksheet banana = insult
    if (daysSince(t.last_attempt_at) > RULES.RECENCY_DAYS) {
      await markDecayed(org_id, student_id, t.wiswits_id);
      continue;
    }

    // ─── GATE 3: Severity ─────────────────────────────────────
    const severity = classify(t.accuracy);
    if (severity === 'strong' || severity === 'mastered') {
      await closeIfOpen(org_id, student_id, t.wiswits_id, 'improved_naturally');
      continue;
    }

    // ─── GATE 4: Confidence ───────────────────────────────────
    // Kam data = kam confidence = chup raho
    const confidence = computeConfidence(t);
    if (confidence < RULES.MIN_CONFIDENCE) continue;

    // ─── ENRICHMENT: Error signature ──────────────────────────
    const errorProfile = await analyzeErrorPattern({
      org_id, student_id, wiswits_id: t.wiswits_id
    });

    candidates.push({
      wiswits_id:          t.wiswits_id,
      subject_id:          t.subject_id,
      severity,
      accuracy:            t.accuracy,
      sample_size:         t.attempted,
      confidence,
      dominant_error_type: errorProfile.dominantError,
      dominant_bloom_gap:  errorProfile.weakestBloom,
      easy_acc:            t.easy_acc,
      medium_acc:          t.medium_acc,
      hard_acc:            t.hard_acc,
    });
  }

  // ─── ROOT CAUSE PASS ────────────────────────────────────────
  const withRoots = await findRootCauses({ org_id, student_id, candidates });

  await upsertWeakAreas({ org_id, student_id, weakAreas: withRoots });

  for (const wa of withRoots) {
    events.weakDetected({
      org_id, student_id,
      wiswits_id:      wa.wiswits_id,
      severity:        wa.severity,
      is_root_cause:   wa.is_root_cause,
      root_wiswits_id: wa.root_wiswits_id,
      at: new Date(),
    });
  }

  return withRoots;
}

// ─────────────────────────────────────────────────────────────

function classify(accuracy) {
  for (const [sev, [lo, hi]] of Object.entries(SEVERITY_BANDS)) {
    if (accuracy >= lo && accuracy < hi) return sev;
  }
  return 'mastered';
}

function computeConfidence(t) {
  // Sample size: 10 questions = full confidence on this axis
  const sampleWeight = Math.min(t.attempted / 10, 1);

  // Recency: kitna taaza data hai
  const d = daysSince(t.last_attempt_at);
  const recencyWeight = d <= 7  ? 1.00
                      : d <= 30 ? 0.80
                      : d <= 60 ? 0.50
                      : 0.30;

  // Consistency: har baar galat, ya kabhi kabhi?
  // Consistent failure = high confidence. Random = low.
  const consistencyWeight = t.variance != null
    ? 1 - Math.min(t.variance / 40, 0.5)
    : 0.7;

  return sampleWeight * 0.45
       + recencyWeight * 0.35
       + consistencyWeight * 0.20;
}

// ─────────────────────────────────────────────────────────────

async function analyzeErrorPattern({ org_id, student_id, wiswits_id }) {
  const responses = await getWrongResponses({ org_id, student_id, wiswits_id });

  // Kaunsa distractor_reason sabse zyada?
  const errorCounts = {};
  for (const r of responses) {
    const reason = r.distractor_reason || 'unknown';
    errorCounts[reason] = (errorCounts[reason] || 0) + 1;
  }
  const dominantError = topKey(errorCounts);

  // Kis Bloom level pe sabse zyada atka?
  const bloomFails = {};
  for (const r of responses) {
    bloomFails[r.bloom] = (bloomFails[r.bloom] || 0) + 1;
  }
  const weakestBloom = topKey(bloomFails);

  return { dominantError, weakestBloom, errorCounts, bloomFails };
}
```

**Ye 4 gates hi module ko bharosemand banate hain.** Ek false positive = teacher wapas Excel pe chala jaayega.

---

## 3.2 Algorithm 2 — Root Cause Analysis ⭐⭐⭐

**Ye feature aapko duniya me alag banata hai. Koi Indian ed-tech ye nahi karta.**

```js
/**
 * ROOT CAUSE ANALYSIS
 * "Ch07 weak? Nahi. Ch01 weak hai. Ch07 to sirf lakshan hai."
 *
 * Ye algorithm curriculum module ke prerequisite graph pe chalta hai.
 * Bina us graph ke, ye module sirf "achha" hai. Us graph ke saath, ye "jaadu" hai.
 */

async function findRootCauses({ org_id, student_id, candidates }) {
  const graph = await curriculumApi.getPrerequisiteGraph();
  const weakSet = new Set(candidates.map(c => c.wiswits_id));
  const byId = Object.fromEntries(candidates.map(c => [c.wiswits_id, c]));

  for (const wa of candidates) {
    const prereqs = graph[wa.wiswits_id]?.requires || [];
    const weakPrereqs = prereqs.filter(p => weakSet.has(p));

    if (weakPrereqs.length === 0) {
      // ─── Koi prerequisite weak nahi → YE KHUD ROOT HAI ───
      wa.is_root_cause   = true;
      wa.root_wiswits_id = wa.wiswits_id;
      wa.depth_from_root = 0;
    } else {
      // ─── Prerequisite weak hai → YE SYMPTOM HAI ───
      const chain = traceToRoot(graph, weakSet, byId, wa.wiswits_id);
      wa.is_root_cause   = false;
      wa.root_wiswits_id = chain.root;
      wa.depth_from_root = chain.depth;
      wa.chain           = chain.path;    // full path for UI viz
    }
  }

  // ─── PRIORITY: root cause pehle, severity se sort ───
  candidates.sort((a, b) => {
    if (a.is_root_cause !== b.is_root_cause) return a.is_root_cause ? -1 : 1;
    return severityRank(a.severity) - severityRank(b.severity);
  });

  return candidates;
}

function traceToRoot(graph, weakSet, byId, start) {
  const path    = [start];
  const visited = new Set([start]);
  let current   = start;
  let depth     = 0;

  while (true) {
    const prereqs = graph[current]?.requires || [];

    // Weak prerequisites me se sabse kharab wala pick karo
    const weakPrereqs = prereqs
      .filter(p => weakSet.has(p) && !visited.has(p))
      .sort((a, b) => byId[a].accuracy - byId[b].accuracy);

    if (weakPrereqs.length === 0) break;   // yahi root hai

    current = weakPrereqs[0];
    visited.add(current);                   // ⚠️ cycle guard — MANDATORY
    path.push(current);
    depth++;

    if (depth > 10) break;                  // ⚠️ safety valve
  }

  return { root: current, depth, path: path.reverse() };
}
```

### The Money Example

```
   Aarav · Class 10 · Mathematics

   Detected weak areas:
     MATH10C07T01  Quadratic Equations     28%
     MATH10C03T02  Polynomials             34%
     MATH10C01T02  Real Numbers            41%

   Prerequisite graph:
     MATH10C07T01  requires  MATH10C03T02
     MATH10C03T02  requires  MATH10C01T02
     MATH10C01T02  requires  MATH09C01T03   ← ye weak NAHI hai (78%)

   Trace from MATH10C07T01:
     C07 → weak prereq C03 found → go deeper
     C03 → weak prereq C01 found → go deeper
     C01 → prereq MATH09C01T03 is NOT weak → STOP

   ROOT = MATH10C01T02  (Real Numbers, 41%)
   depth from root: C07=2, C03=1, C01=0

   ┌──────────────────────────────────────────────────────────┐
   │  SYSTEM SAYS:                                             │
   │                                                           │
   │  ❌ Ch07 pe worksheet mat banao.                          │
   │  ✅ Ch01 se shuru karo.                                   │
   │                                                           │
   │  Ch01 ko 70% pe le jao →                                 │
   │     Ch03 apne aap sudhrega (prerequisite fix) →          │
   │        Ch07 apne aap sudhrega                            │
   │                                                           │
   │  Estimated: 2 weeks vs 8 weeks (symptom-chasing)         │
   └──────────────────────────────────────────────────────────┘
```

**Koi teacher 500 students ke liye ye manually nahi nikal sakta. Yahi ₹1.5L/yr hai.**

---

## 3.3 Algorithm 3 — Behaviour Analysis (Silly vs Concept) ⭐⭐

**Do bachche, same "wrong". Bilkul alag ilaaj chahiye.**

```js
/**
 * BEHAVIOUR ANALYSIS
 * "Galat" ek jawab hai. "Kyun galat" ek diagnosis hai.
 */

const T = Object.freeze({
  VERY_FAST:  0.35,   // < 35% of expected time
  FAST:       0.60,
  NORMAL_LO:  0.60,
  NORMAL_HI:  1.40,
  SLOW:       1.40,
  VERY_SLOW:  2.00,   // > 200% of expected time
});

function classifyResponse(r) {
  const ratio = r.time_sec / r.est_time_sec;
  const easy  = r.difficulty === 'easy';
  const hard  = r.difficulty === 'hard' || r.difficulty === 'extreme';

  // ─── CORRECT ANSWERS ────────────────────────────────────────
  if (r.is_correct) {
    if (ratio < T.VERY_FAST && hard)  return 'lucky_guess';      // ⚠️ hard + very fast + right
    if (ratio < T.FAST)               return 'mastered';         // fast + right = solid
    if (ratio > T.VERY_SLOW)          return 'laboured';         // right but struggling
    return 'solid';
  }

  // ─── WRONG ANSWERS — yahan asli diagnosis hai ───────────────

  if (ratio < T.VERY_FAST) {
    if (r.changed_count === 0 && r.visits === 1) return 'guess';         // socha hi nahi
    return 'rushed';                                                      // jaldbaazi
  }

  if (easy && ratio < T.NORMAL_HI) {
    return 'silly_mistake';           // ⭐ aata hai, dhyan nahi diya
  }

  if (ratio > T.VERY_SLOW && r.changed_count >= 2) {
    return 'confused';                // ⭐ mehnat ki, par bharam hai
  }

  if (ratio > T.SLOW) {
    return 'concept_gap';             // ⭐ mehnat ki, par aata nahi
  }

  if (r.first_answer && r.final_answer &&
      r.first_answer !== r.final_answer && r.first_correct) {
    return 'overthinking';            // ⭐⭐ pehla sahi tha, badal ke galat kar diya!
  }

  return 'concept_gap';
}

// ─────────────────────────────────────────────────────────────

async function buildBehaviourProfile({ org_id, student_id, subject_id }) {
  const responses = await getRecentResponses({ org_id, student_id, subject_id, days: 90 });

  const tally = {};
  for (const r of responses) tally[classifyResponse(r)] = (tally[classifyResponse(r)] || 0) + 1;

  const total = responses.length;
  const wrong = responses.filter(r => !r.is_correct).length;

  const sillyRate      = pct(tally.silly_mistake, wrong);
  const conceptRate    = pct(tally.concept_gap + tally.confused, wrong);
  const guessRate      = pct(tally.guess, total);
  const overthinkRate  = pct(tally.overthinking, wrong);
  const rushRate       = pct(tally.rushed, wrong);

  // ─── BEHAVIOUR ARCHETYPE ────────────────────────────────────
  let behaviour;
  if (sillyRate > 40 || rushRate > 35)        behaviour = 'rusher';
  else if (overthinkRate > 25)                behaviour = 'overthinker';
  else if (guessRate > 25)                    behaviour = 'gives_up';
  else if (variance(responses) > 35)          behaviour = 'erratic';
  else                                        behaviour = 'balanced';

  // ─── PACE ───────────────────────────────────────────────────
  const avgRatio = mean(responses.map(r => r.time_sec / r.est_time_sec));
  const pace = avgRatio < 0.7 ? 'fast' : avgRatio > 1.3 ? 'needs_time' : 'moderate';

  return {
    behaviour, pace,
    silly_mistake_rate: sillyRate,
    concept_gap_rate:   conceptRate,
    guess_rate:         guessRate,
    overthink_rate:     overthinkRate,
    revision_rate:      pct(sum(responses.map(r => r.changed_count)), total),
    error_signature:    await errorSignature(responses),
    coaching_note:      coachingNote(behaviour, sillyRate, conceptRate),
  };
}

function coachingNote(behaviour, silly, concept) {
  const notes = {
    rusher:      `${silly}% galtiyan sirf jaldbaazi ki hain. Concept aata hai. Speed nahi, accuracy pe kaam karao. Har question ke baad 5 second ruk ke check karne ki aadat daalo.`,
    overthinker: `Pehla jawab aksar sahi hota hai, phir badal ke galat kar deta hai. Apne instinct pe bharosa karna sikhao. "Change only if you find a definite error" rule lagao.`,
    gives_up:    `${concept}% questions me try hi nahi kar raha — guess maar raha hai. Ye confidence ka issue hai, gyaan ka nahi. Easy questions se shuru karo, jeet ka ehsaas do.`,
    erratic:     `Performance bahut oopar-neeche hai. Kabhi 80%, kabhi 30%. Ye focus ya routine ka issue ho sakta hai. Teacher se baat karo.`,
    balanced:    `Achhi aadatein hain. Jo galtiyan hain wo asli concept gaps hain — un pe seedha kaam kar sakte hain.`,
  };
  return notes[behaviour];
}
```

### The Two Students

```
╔══════════════════════════════════════════════════════════════════╗
║  AARAV                         │  PRIYA                          ║
║  Q14 · Ch07 · Easy · est 60s   │  Q14 · same question            ║
╠════════════════════════════════╪═════════════════════════════════╣
║  time_sec:       22s  (0.37×)  │  time_sec:      180s  (3.0×)    ║
║  visits:         1             │  visits:         4              ║
║  changed_count:  0             │  changed_count:  3              ║
║  first → final:  B → B         │  first → final:  A → C → B → C  ║
║  is_correct:     ❌            │  is_correct:     ❌             ║
║  distractor:     sign_error    │  distractor:     concept_confusion║
╠════════════════════════════════╪═════════════════════════════════╣
║  CLASS: silly_mistake          │  CLASS: confused                ║
║                                │                                 ║
║  DIAGNOSIS:                    │  DIAGNOSIS:                     ║
║  Concept aata hai.             │  Concept nahi aata.             ║
║  Jaldbaazi ki.                 │  Mehnat ki, par bharam hai.     ║
║                                │                                 ║
║  TREATMENT:                    │  TREATMENT:                     ║
║  ❌ Worksheet mat do           │  ✅ Worksheet do                ║
║  ✅ "Slow down" coaching       │  ✅ Root cause dhundo           ║
║  ✅ Check-your-work drill      │  ✅ Concept video dobara        ║
╚══════════════════════════════════════════════════════════════════╝

⭐ Dono ko same worksheet dena = dono ka waqt barbaad.
   Ye distinction hi ye module ka jaadu hai.
```

---

## 3.4 Algorithm 4 — Distractor / Misconception Analysis ⭐⭐⭐

**Ye teacher ka favourite feature banega. Guaranteed.**

```js
/**
 * DISTRACTOR ANALYSIS
 * "24 bachchon ne option B chuna" ek number hai.
 * "24 bachchon ko sign error ka bharam hai" ek insight hai.
 */

const D = Object.freeze({
  MIN_SAMPLE:            10,
  MISCONCEPTION_PCT:     30,   // 30%+ ek hi galat option = pattern
  STRONG_MISCONCEPTION:  50,   // 50%+ = poori class
  QUESTION_SUSPECT_ACC:  15,   // <15% correct = question suspect
  KEY_ERROR_PCT:         60,   // 60%+ ek option pe = answer key galat?
});

async function analyzeDistractors({ org_id, test_id }) {
  const questions = await getTestQuestions({ org_id, test_id });
  const insights  = [];
  const flags     = [];

  for (const q of questions) {
    const responses = await getResponses({ org_id, test_question_id: q.id });
    const total = responses.length;
    if (total < D.MIN_SAMPLE) continue;

    const correct  = responses.filter(r => r.is_correct).length;
    const accuracy = (correct / total) * 100;

    // ─── Distribution ────────────────────────────────────────
    const dist = {};
    for (const r of responses) {
      const opt = r.answer_json?.selected ?? 'skipped';
      dist[opt] = (dist[opt] || 0) + 1;
    }

    // ─── Wrong option ranking ────────────────────────────────
    const wrongDist = Object.entries(dist)
      .filter(([opt]) => opt !== q.correct_option && opt !== 'skipped')
      .sort((a, b) => b[1] - a[1]);

    if (wrongDist.length === 0) continue;
    const [topWrong, count] = wrongDist[0];
    const pct = (count / total) * 100;

    // ─── FLAG 1: Answer key error? ───────────────────────────
    if (accuracy < D.QUESTION_SUSPECT_ACC && pct >= D.KEY_ERROR_PCT) {
      flags.push({
        question_id: q.question_id,
        flag: 'key_error',
        reason: `Only ${accuracy.toFixed(0)}% chose the marked-correct option, but ${pct.toFixed(0)}% chose "${topWrong}". Verify the answer key.`,
        severity: 'critical',
      });
      events.questionFlagged({ org_id, question_id: q.question_id,
                               reason: 'key_error', accuracy, at: new Date() });
      continue;
    }

    // ─── FLAG 2: Ambiguous? ──────────────────────────────────
    if (accuracy < D.QUESTION_SUSPECT_ACC) {
      const spread = entropy(Object.values(dist));
      if (spread > 0.85) {
        flags.push({
          question_id: q.question_id,
          flag: 'ambiguous',
          reason: `${accuracy.toFixed(0)}% correct with answers spread evenly across all options. Question wording may be unclear.`,
          severity: 'high',
        });
      }
    }

    // ─── FLAG 3: Non-discriminating? ─────────────────────────
    const di = await discriminationIndex({ org_id, test_id, question_id: q.question_id });
    if (di < 0.15 && accuracy > 30 && accuracy < 80) {
      flags.push({
        question_id: q.question_id,
        flag: 'non_discriminating',
        reason: `Toppers and strugglers perform equally (DI=${di.toFixed(2)}). This question isn't measuring anything.`,
        severity: 'medium',
      });
    }

    // ─── THE INSIGHT ─────────────────────────────────────────
    if (accuracy < 60 && pct >= D.MISCONCEPTION_PCT) {
      const meta = await qbankApi.getOptionMeta(q.question_id, topWrong);

      insights.push({
        question_id:  q.question_id,
        wiswits_id:   q.wiswits_id,
        seq:          q.seq,
        accuracy,
        distribution: dist,
        misconception: {
          option:            topWrong,
          option_text:       meta.text,
          count,
          pct,
          reason:            meta.distractor_reason,      // "sign_error"
          explanation:       meta.misconception,          // "Student took LCM instead of HCF"
          remediation_hint:  meta.remediation_hint,
        },
        strength: pct >= D.STRONG_MISCONCEPTION ? 'class_wide' : 'significant',
        headline: pct >= D.STRONG_MISCONCEPTION
          ? `🚨 Poori class ek hi bharam me hai`
          : `⚠️ ${count} bachchon me common misconception`,
        action: {
          reteach:      `${count} students chose "${meta.text}" — ${meta.misconception}. ${meta.remediation_hint}`,
          worksheet:    `/api/pl/worksheets/generate-class?wiswits_id=${q.wiswits_id}&test_id=${test_id}`,
          content_link: `content://${q.wiswits_id}`,
          affected_students: responses.filter(r => r.answer_json?.selected === topWrong)
                                      .map(r => r.student_id),
        },
      });
    }
  }

  // ─── CLUSTER: same misconception across questions? ─────────
  const clusters = clusterMisconceptions(insights);

  await saveClassInsight({ org_id, test_id, insights, flags, clusters });
  for (const i of insights.filter(x => x.strength === 'class_wide')) {
    events.reteachAlert({ org_id, test_id, question_id: i.question_id,
                          wrong_pct: 100 - i.accuracy,
                          misconception: i.misconception.reason, at: new Date() });
  }

  return { insights, flags, clusters };
}

// ─── Discrimination Index: top 27% vs bottom 27% ─────────────
async function discriminationIndex({ org_id, test_id, question_id }) {
  const attempts = await getAttemptsSorted({ org_id, test_id });   // by total score desc
  const n = Math.floor(attempts.length * 0.27);
  if (n < 3) return null;

  const top    = attempts.slice(0, n);
  const bottom = attempts.slice(-n);

  const topCorrect    = await countCorrect(top.map(a => a.id), question_id);
  const bottomCorrect = await countCorrect(bottom.map(a => a.id), question_id);

  return (topCorrect - bottomCorrect) / n;
}

// ─── CLUSTER: "3 questions, same misconception" ──────────────
function clusterMisconceptions(insights) {
  const byReason = {};
  for (const i of insights) {
    const r = i.misconception.reason;
    (byReason[r] ||= []).push(i);
  }

  return Object.entries(byReason)
    .filter(([, list]) => list.length >= 2)
    .map(([reason, list]) => ({
      reason,
      question_count: list.length,
      questions: list.map(i => i.seq),
      avg_pct: mean(list.map(i => i.misconception.pct)),
      headline: `${list.length} questions me wahi galti — "${reason}". Ye ek systemic gap hai, random nahi.`,
    }));
}
```

### What The Teacher Sees

```
╔═══════════════════════════════════════════════════════════════════╗
║  🚨 RETEACH ALERTS · Unit Test 2 · Class 10-A                     ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Q14 · Ch07 Quadratic Equations · 22% correct                     ║
║  ──────────────────────────────────────────────────────────       ║
║   A  ██                          7   (22%)  ✓ correct             ║
║   B  ████████████████████████   24   (75%)  ← 🚨                  ║
║   C  █                           1   ( 3%)                        ║
║   D                              0   ( 0%)                        ║
║                                                                    ║
║  🚨 Poori class ek hi bharam me hai                               ║
║                                                                    ║
║  24 bachchon ne "x = -3, 5" chuna.                                ║
║  Reason: sign_error in factorization                              ║
║  Misconception: Signs flipped while splitting the middle term      ║
║                                                                    ║
║  💡 Ye random galti nahi hai. Ye systematic hai.                  ║
║     Kal 10 minute do: (x+a)(x+b) me signs kaise aate hain.        ║
║                                                                    ║
║  [ 📖 Reteach kit ]  [ 📝 Class worksheet ]  [ 👥 24 students ]   ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║  🔗 MISCONCEPTION CLUSTER                                          ║
║                                                                    ║
║  Q14, Q17, Q19 — teenon me wahi "sign_error"                      ║
║  Ye systemic gap hai, teen alag galtiyan nahi.                    ║
║  Ek reteach session teenon fix kar dega.                          ║
║                                                                    ║
║  [ 📖 Combined reteach kit ]                                       ║
╠═══════════════════════════════════════════════════════════════════╣
║  ⚠️ QUESTION QUALITY FLAGS                                         ║
║                                                                    ║
║  Q11 — 🚩 KEY ERROR SUSPECT                                        ║
║        8% chose marked-correct, 68% chose option C.                ║
║        Answer key verify karo.                    [ Review ]       ║
║                                                                    ║
║  Q08 — 🚩 NON-DISCRIMINATING (DI = 0.08)                          ║
║        Toppers aur strugglers barabar. Ye question kuch            ║
║        naap hi nahi raha.                         [ Replace ]      ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 3.5 Algorithm 5 — Worksheet Generator ⭐⭐⭐

```js
/**
 * ADAPTIVE WORKSHEET GENERATOR
 * "Ek worksheet jo sirf is bachche ke liye bani hai."
 */

const W = Object.freeze({
  MAX_TARGETS:         2,      // 2 se zyada = focus toot jaata hai
  NO_REPEAT_DAYS:      30,     // rote learning se bachna
  MAX_QUESTIONS:       15,     // 15 se zyada = quit
  MIN_QUESTIONS:       8,
});

// ⭐ DIFFICULTY LADDERS — severity ke hisaab se
const LADDERS = Object.freeze({
  critical:   { easy: 6, medium: 3, hard: 1 },   // confidence pehle
  weak:       { easy: 4, medium: 4, hard: 2 },
  borderline: { easy: 2, medium: 5, hard: 3 },
  revision:   { easy: 2, medium: 4, hard: 4 },
  challenge:  { easy: 1, medium: 4, hard: 5 },   // mastered ko stretch
});

async function generateWorksheet({ org_id, student_id, opts = {} }) {
  const weakAreas = await getOpenWeakAreas({ org_id, student_id });
  if (weakAreas.length === 0) return null;

  // ─── STRATEGY SELECTION ─────────────────────────────────────
  const profile  = await getProfile({ org_id, student_id });
  const strategy = opts.strategy || pickStrategy(weakAreas, profile);

  // ─── TARGET SELECTION ───────────────────────────────────────
  // ⭐⭐ RULE: ROOT CAUSE FIRST. Symptom pe practice = waqt barbaad.
  let targets;
  const roots = weakAreas.filter(w => w.is_root_cause);

  if (strategy === 'root_first' && roots.length > 0) {
    targets = roots.sort(bySeverityThenConfidence).slice(0, W.MAX_TARGETS);
  } else {
    targets = weakAreas.sort(bySeverityThenConfidence).slice(0, W.MAX_TARGETS);
  }

  // ⚠️ BEHAVIOUR OVERRIDE
  // Agar bachcha "rusher" hai aur silly_mistake_rate > 40% —
  // usko worksheet nahi, coaching chahiye. Concept aata hai!
  if (profile.behaviour === 'rusher' && profile.silly_mistake_rate > 40) {
    return {
      type: 'coaching_note',
      skip_worksheet: true,
      message: profile.coaching_note,
      suggested_action: 'accuracy_drill',   // alag tarah ka worksheet
    };
  }

  // ─── QUESTION SELECTION ─────────────────────────────────────
  const excludeIds = await getRecentQuestionIds({
    org_id, student_id, days: W.NO_REPEAT_DAYS
  });

  const questions = [];

  for (const target of targets) {
    const ladder = LADDERS[strategy === 'revision' ? 'revision' : target.severity]
                 || LADDERS.weak;

    for (const [difficulty, count] of Object.entries(ladder)) {
      // ⭐ Bloom targeting — jis Bloom pe atka hai, wahi zyada
      const bloomFilter = target.dominant_bloom_gap
        ? { bloom: target.dominant_bloom_gap, weight: 0.6 }
        : null;

      const picked = await qbankApi.pick({
        wiswits_id: target.wiswits_id,
        difficulty,
        count,
        exclude: excludeIds,
        bloom_preference: bloomFilter,
        require_solution: true,          // ⭐ solution ke bina worksheet bekaar
      });

      // Agar QBank me kam questions hain
      if (picked.length < count) {
        const fallback = await qbankApi.pick({
          wiswits_id: target.root_wiswits_id || target.wiswits_id,
          difficulty,
          count: count - picked.length,
          exclude: [...excludeIds, ...picked.map(p => p.id)],
          allow_adjacent_topic: true,     // padosi topic se le lo
        });
        picked.push(...fallback);
      }

      questions.push(...picked.map(q => ({ ...q, ladder_step: difficulty })));
    }
  }

  if (questions.length < W.MIN_QUESTIONS) {
    events.qbankShortage({ org_id, wiswits_ids: targets.map(t => t.wiswits_id),
                           needed: W.MIN_QUESTIONS, got: questions.length, at: new Date() });
  }

  // ─── ORDERING: easy → medium → hard (confidence curve) ─────
  const ordered = orderByLadder(questions);

  // ─── SAVE + RENDER ──────────────────────────────────────────
  const ws = await saveWorksheet({
    org_id, student_id,
    target_wiswits_ids: targets.map(t => t.wiswits_id),
    strategy,
    question_ids: ordered.map(q => q.id),
    difficulty_ladder: countByDifficulty(ordered),
    total_questions: ordered.length,
    est_time_min: Math.ceil(sum(ordered.map(q => q.est_time_sec)) / 60),
    generation_reason: buildReason(targets, strategy, profile),
  });

  ws.pdf_path               = await renderPdf(ws, { solutions: false });
  ws.pdf_with_solutions_path = await renderPdf(ws, { solutions: true });

  await markInRecovery(org_id, targets.map(t => t.id));

  events.worksheetGenerated({
    org_id, student_id, worksheet_id: ws.id,
    targets: targets.map(t => t.wiswits_id),
    strategy, at: new Date(),
  });

  return ws;
}

// ─────────────────────────────────────────────────────────────

function pickStrategy(weakAreas, profile) {
  const hasRoots   = weakAreas.some(w => w.is_root_cause);
  const allMastered = weakAreas.every(w => w.severity === 'mastered');

  if (allMastered)                       return 'challenge';
  if (hasRoots)                          return 'root_first';
  if (profile.behaviour === 'gives_up')  return 'confidence_build';
  return 'mixed';
}

function buildReason(targets, strategy, profile) {
  const t = targets[0];
  if (strategy === 'root_first' && t.is_root_cause) {
    return `Root cause targeted: ${t.wiswits_id} (${t.accuracy.toFixed(0)}%). ` +
           `Fixing this should also improve dependent topics.`;
  }
  return `Targeting ${targets.map(x => x.wiswits_id).join(', ')} ` +
         `based on ${t.sample_size} attempts at ${t.accuracy.toFixed(0)}% accuracy.`;
}

function orderByLadder(questions) {
  const rank = { easy: 0, medium: 1, hard: 2, extreme: 3 };
  return questions.sort((a, b) => {
    const d = rank[a.difficulty] - rank[b.difficulty];
    return d !== 0 ? d : Math.random() - 0.5;
  });
}
```

### The Worksheet PDF

```
┌─────────────────────────────────────────────────────────────┐
│  [School Logo]                                               │
│                                                              │
│  RECOVERY WORKSHEET                                          │
│  Aarav Sharma · Class 10-A · Mathematics                     │
│  Generated: 16 July 2026 · Est. time: 25 min                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🎯 Focus: Ch01 · Real Numbers                          │ │
│  │                                                         │ │
│  │ Ye tumhara root cause hai. Ch03 aur Ch07 me jo dikkat  │ │
│  │ aa rahi hai, wo yahin se shuru hoti hai.               │ │
│  │                                                         │ │
│  │ Isse theek karoge → baaki apne aap theek honge.        │ │
│  │                                                         │ │
│  │ Abhi: 41%  →  Target: 70%                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─── Warm Up (easy) ──────────────────────────────────────   │
│                                                              │
│  1.  Find the HCF of 12 and 18 using Euclid's lemma.        │
│                                                              │
│      ________________________________________________        │
│                                                              │
│  ... 5 more easy ...                                         │
│                                                              │
│  ─── Build Up (medium) ───────────────────────────────────   │
│                                                              │
│  7.  Prove that √5 is irrational.                            │
│                                                              │
│  ... 2 more medium ...                                       │
│                                                              │
│  ─── Challenge (hard) ────────────────────────────────────   │
│                                                              │
│  10. Show that any positive odd integer is of the form       │
│      6q+1, 6q+3, or 6q+5.                                    │
│                                                              │
│  ═══════════════════════════════════════════════════════    │
│                                                              │
│  📱 Online attempt: [QR CODE]                                │
│  💡 Solutions: worksheet ke baad wale page pe                │
│                                                              │
│  Made for Aarav · WISWITS APEX OS                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.6 Algorithm 6 — Recovery Cycle (The Loop) ⭐⭐⭐

```js
/**
 * RECOVERY CYCLE
 * Ye table hi WISWITS Loop ka PROOF hai.
 * Iske bina hum "hum madad karte hain" bolenge.
 * Iske saath hum "892 gaps band kiye, +23% average" bolenge.
 */

const C = Object.freeze({
  CLOSE_THRESHOLD:    70,    // 70% = gap band
  IMPROVE_THRESHOLD:  15,    // +15% = progress ho raha hai
  WORSEN_THRESHOLD:   -5,
  MAX_CYCLES:         3,     // 3 ke baad insaan chahiye
  ABANDON_DAYS:       45,    // 45 din kuch nahi hua = abandon
});

// ─── CYCLE START ────────────────────────────────────────────
async function startCycle({ org_id, student_id, weak_area_id }) {
  const wa = await getWeakArea({ org_id, id: weak_area_id });

  const existing = await getOpenCycle({ org_id, weak_area_id });
  if (existing) return existing;                    // idempotent

  const cycleNo = (await countCycles({ org_id, weak_area_id })) + 1;

  if (cycleNo > C.MAX_CYCLES) {
    // ⚠️ System haar maan raha hai. Chupchap fail hone se behtar hai bolna.
    events.needsTeacher({
      org_id, student_id, wiswits_id: wa.wiswits_id,
      cycles: cycleNo - 1,
      history: await getCycleHistory({ org_id, weak_area_id }),
      at: new Date(),
    });
    await createAlert({
      org_id, type: 'needs_teacher', severity: 'high',
      target_role: 'teacher',
      title: `${await studentName(student_id)} needs personal attention`,
      body: `3 recovery cycles on ${wa.wiswits_id}, still at ${wa.accuracy.toFixed(0)}%. Automation isn't working here.`,
    });
    return null;
  }

  const cycle = await createCycle({
    org_id, student_id, weak_area_id,
    wiswits_id: wa.wiswits_id,
    cycle_no: cycleNo,
    detected_at: wa.detected_at,
    detected_accuracy: wa.accuracy,
  });

  const ws = await generateWorksheet({
    org_id, student_id,
    opts: { targets: [wa], strategy: cycleNo === 1 ? 'root_first' : 'mixed' },
  });

  if (ws?.skip_worksheet) {
    // Behaviour issue hai, concept nahi
    await updateCycle(cycle.id, { outcome: 'coaching_instead', closed_at: new Date() });
    return cycle;
  }

  await updateCycle(cycle.id, { worksheet_id: ws.id });
  await setWeakAreaStatus(weak_area_id, 'in_recovery');

  return cycle;
}

// ─── CYCLE EVALUATE (retest ke baad) ────────────────────────
async function evaluateCycle({ org_id, weak_area_id, retest_attempt_id }) {
  const cycle = await getOpenCycle({ org_id, weak_area_id });
  if (!cycle) return null;

  const before = cycle.detected_accuracy;
  const after  = await getTopicAccuracyFromAttempt({
    org_id, wiswits_id: cycle.wiswits_id, attempt_id: retest_attempt_id
  });
  const delta = after - before;

  // ─── OUTCOME ─────────────────────────────────────────────
  let outcome;
  if (after >= C.CLOSE_THRESHOLD)          outcome = 'closed';
  else if (delta >= C.IMPROVE_THRESHOLD)   outcome = 'improved';
  else if (delta > C.WORSEN_THRESHOLD)     outcome = 'no_change';
  else                                     outcome = 'worsened';

  await updateCycle(cycle.id, {
    retest_attempt_id, retest_accuracy: after, retest_at: new Date(),
    delta, outcome,
    days_to_close: daysBetween(cycle.detected_at, new Date()),
    closed_at: new Date(),
  });

  // ─── BRANCH ──────────────────────────────────────────────
  switch (outcome) {

    case 'closed':
      await setWeakAreaStatus(weak_area_id, 'closed');
      events.gapClosed({
        org_id, student_id: cycle.student_id, wiswits_id: cycle.wiswits_id,
        before, after, delta, cycles: cycle.cycle_no,
        days: daysBetween(cycle.detected_at, new Date()),
        at: new Date(),
      });
      await createAlert({
        org_id, type: 'gap_closed', severity: 'info',
        target_role: 'student', target_id: cycle.student_id,
        title: `🎉 ${cycle.wiswits_id} — gap band ho gaya!`,
        body: `${before.toFixed(0)}% se ${after.toFixed(0)}% — ${cycle.cycle_no} cycle me. Shabaash!`,
      });
      // ⭐ Root cause band hua → dependent topics recheck karo
      if (cycle.is_root_cause) {
        await recheckDependents({ org_id, student_id: cycle.student_id,
                                  root: cycle.wiswits_id });
      }
      break;

    case 'improved':
      // Progress ho raha hai, ek aur cycle
      await startCycle({ org_id, student_id: cycle.student_id, weak_area_id });
      break;

    case 'no_change':
      // Approach kaam nahi kar raha. Strategy badlo.
      await startCycle({ org_id, student_id: cycle.student_id, weak_area_id,
                         opts: { strategy: 'confidence_build' } });
      break;

    case 'worsened':
      // 🚨 Kharab ho raha hai. Insaan chahiye. Abhi.
      events.needsTeacher({
        org_id, student_id: cycle.student_id, wiswits_id: cycle.wiswits_id,
        cycles: cycle.cycle_no, reason: 'worsened',
        before, after, at: new Date(),
      });
      await setWeakAreaStatus(weak_area_id, 'escalated');
      break;
  }

  return outcome;
}

// ⭐⭐ Root band hua → dependents apne aap theek hue kya?
async function recheckDependents({ org_id, student_id, root }) {
  const graph = await curriculumApi.getPrerequisiteGraph();
  const dependents = graph[root]?.enables || [];

  for (const dep of dependents) {
    const wa = await getWeakArea({ org_id, student_id, wiswits_id: dep });
    if (!wa || wa.status !== 'open') continue;

    // Root fix ho gaya. Ab dependent ko retest karo — shayad apne aap theek ho gaya.
    await createAlert({
      org_id, type: 'recheck_suggested', severity: 'info',
      target_role: 'teacher',
      title: `Retest suggested: ${dep}`,
      body: `Root cause ${root} is now fixed. ${dep} may have improved automatically. Quick retest to confirm.`,
      action_json: { retest_wiswits_id: dep, student_id },
    });
  }
}
```

### The Stats Query — Your Sales Pitch

```sql
-- ⭐⭐⭐ Ye query principal ko dikhao. Sale ho jaayegi.

SELECT
  COUNT(*)                                        AS gaps_detected,
  SUM(outcome = 'closed')                         AS gaps_closed,
  ROUND(SUM(outcome = 'closed') / COUNT(*) * 100) AS close_rate,
  ROUND(AVG(CASE WHEN outcome = 'closed' THEN delta END))     AS avg_gain,
  ROUND(AVG(CASE WHEN outcome = 'closed' THEN cycle_no END),1) AS avg_cycles,
  ROUND(AVG(CASE WHEN outcome = 'closed' THEN days_to_close END)) AS avg_days,
  SUM(outcome = 'worsened')                       AS needs_teacher
FROM client_pl_recovery_cycle
WHERE org_id = ? AND detected_at >= ?;

-- Result:
-- gaps_detected: 1240 · gaps_closed: 892 · close_rate: 72%
-- avg_gain: +23 · avg_cycles: 1.8 · avg_days: 14 · needs_teacher: 47
```

---

## 3.7 Algorithm 7 — Benchmarking & Comparison ⭐⭐

```js
/**
 * BENCHMARKING
 * "78% aaye" bekaar hai.
 * "78% aaye, class avg 61%, topper 94%, tumhara pichla 64% tha" — ye kaam ka hai.
 */

async function buildComparison({ org_id, student_id, test_id, wiswits_id = null }) {
  const my = await getMyScore({ org_id, student_id, test_id, wiswits_id });

  // ─── PEER BENCHMARKS ─────────────────────────────────────
  const section = await getBenchmark({ org_id, scope: 'section',
                                       scope_id: my.section_id, test_id, wiswits_id });
  const classB  = await getBenchmark({ org_id, scope: 'class',
                                       scope_id: my.class_no, test_id, wiswits_id });
  const school  = await getBenchmark({ org_id, scope: 'school',
                                       scope_id: org_id, test_id, wiswits_id });

  // ─── SELF BENCHMARKS ─────────────────────────────────────
  const history = await getMyHistory({ org_id, student_id, wiswits_id, limit: 5 });
  const previous = history[1] || null;
  const best     = history.length ? maxBy(history, 'accuracy') : null;

  // ─── TOPPER ──────────────────────────────────────────────
  // ⚠️ Topper ka NAAM kabhi nahi. Sirf score. Comparison, competition nahi.
  const topper = { accuracy: classB.topper_accuracy };

  // ─── PERCENTILE (rank nahi!) ─────────────────────────────
  const percentile = await computePercentile({ org_id, student_id, test_id, wiswits_id });

  // ─── THE NARRATIVE ───────────────────────────────────────
  const narrative = buildNarrative({ my, classB, previous, best, topper, percentile });

  return {
    my: {
      accuracy:   my.accuracy,
      score:      my.score,
      max:        my.max_score,
      time_ratio: my.time_ratio,
    },
    peers: {
      section_avg:  section.avg_accuracy,
      class_avg:    classB.avg_accuracy,
      class_median: classB.median_accuracy,
      school_avg:   school.avg_accuracy,
      topper:       topper.accuracy,
      p90:          classB.p90,
      p75:          classB.p75,
      p50:          classB.p50,
      p25:          classB.p25,
    },
    self: {
      previous:    previous?.accuracy ?? null,
      best:        best?.accuracy ?? null,
      trend:       computeTrend(history),
      history:     history.map(h => ({ test: h.test_title, date: h.date, acc: h.accuracy })),
    },
    position: {
      percentile,                          // ✅ percentile
      band: percentileBand(percentile),    // "top 25%" / "middle 50%" / "needs support"
      // ⚠️ rank: NEVER. Ye API me exist hi nahi karta.
    },
    gaps: {
      to_class_avg: my.accuracy - classB.avg_accuracy,
      to_topper:    my.accuracy - topper.accuracy,
      to_previous:  previous ? my.accuracy - previous.accuracy : null,
      to_best:      best ? my.accuracy - best.accuracy : null,
    },
    narrative,
  };
}

function buildNarrative({ my, classB, previous, best, topper, percentile }) {
  const lines = [];

  // Self-improvement PEHLE. Ye sabse important hai.
  if (previous) {
    const d = my.accuracy - previous.accuracy;
    if (d >= 10)      lines.push(`📈 Pichli baar se ${d.toFixed(0)}% behtar. Shaandaar improvement!`);
    else if (d >= 3)  lines.push(`📈 Pichli baar se ${d.toFixed(0)}% behtar. Aage badh rahe ho.`);
    else if (d > -3)  lines.push(`➡️ Pichli baar jaisa hi. Sthir ho.`);
    else              lines.push(`📉 Pichli baar se ${Math.abs(d).toFixed(0)}% kam. Dekhte hain kya hua.`);
  }

  if (best && my.accuracy > best.accuracy) {
    lines.push(`🏆 Ye tumhara ab tak ka best hai!`);
  }

  // Peer comparison BAAD me, aur narm shabdon me
  const vsClass = my.accuracy - classB.avg_accuracy;
  if (vsClass >= 15)      lines.push(`Class average se kaafi aage (${classB.avg_accuracy.toFixed(0)}%).`);
  else if (vsClass >= 5)  lines.push(`Class average se aage (${classB.avg_accuracy.toFixed(0)}%).`);
  else if (vsClass >= -5) lines.push(`Class average ke aas-paas (${classB.avg_accuracy.toFixed(0)}%).`);
  else                    lines.push(`Class average ${classB.avg_accuracy.toFixed(0)}% hai. Thoda kaam chahiye.`);

  // Topper — sirf gap, naam nahi, shaming nahi
  const toTopper = topper.accuracy - my.accuracy;
  if (toTopper > 0 && toTopper <= 15) {
    lines.push(`Topper se sirf ${toTopper.toFixed(0)}% peeche. Bahut kareeb ho.`);
  }

  return lines;
}

function percentileBand(p) {
  if (p >= 90) return 'top_10';
  if (p >= 75) return 'top_25';
  if (p >= 25) return 'middle_50';
  return 'needs_support';    // "bottom 25%" nahi. Shabdon se farq padta hai.
}
```

**⚠️ Ye rules non-negotiable hain:**
```
❌ Rank              → kabhi nahi. API me exist nahi karta.
❌ Leaderboard       → kabhi nahi.
❌ Topper ka naam    → kabhi nahi. Sirf score.
❌ "Bottom 25%"      → "Needs support" bolo.
✅ Percentile        → theek hai.
✅ Self-comparison   → sabse pehle. Ye sabse important hai.
✅ Class average     → theek hai, context ke liye.
```

---

## 3.8 Algorithm 8 — Adaptive Practice (SM-2)

```js
/**
 * SPACED REPETITION — SM-2 algorithm
 * "Mastered topic bhi bhool jaata hai. Sahi waqt pe yaad dilao."
 */

function sm2({ ease_factor, interval_days, repetitions }, quality) {
  // quality: 0-5 (0 = blackout, 5 = perfect)

  let ef = ease_factor, iv = interval_days, rep = repetitions;

  if (quality < 3) {
    // Galat → phir se shuru
    rep = 0;
    iv  = 1;
  } else {
    rep += 1;
    if (rep === 1)      iv = 1;
    else if (rep === 2) iv = 6;
    else                iv = Math.round(iv * ef);
  }

  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef);

  return { ease_factor: ef, interval_days: iv, repetitions: rep,
           due_at: addDays(new Date(), iv) };
}

function responseToQuality(r) {
  if (!r.is_correct) {
    return r.time_ratio > 1.5 ? 1 : 0;      // socha par galat = 1, guess = 0
  }
  if (r.time_ratio < 0.6)  return 5;         // fast + right = perfect
  if (r.time_ratio < 1.0)  return 4;
  if (r.time_ratio < 1.5)  return 3;
  return 3;                                   // slow but right
}

// ─── ADAPTIVE NEXT QUESTION ─────────────────────────────────
async function nextPracticeQuestion({ org_id, student_id, subject_id }) {
  // 1. Due cards pehle (spaced repetition)
  const due = await getDueCards({ org_id, student_id, subject_id, limit: 1 });
  if (due.length) return { question: await qbankApi.get(due[0].question_id),
                           reason: 'spaced_repetition' };

  // 2. Weak areas se
  const weak = await getOpenWeakAreas({ org_id, student_id, subject_id });
  if (weak.length) {
    const target  = weak.find(w => w.is_root_cause) || weak[0];
    const lastAcc = await getRecentAccuracy({ org_id, student_id,
                                              wiswits_id: target.wiswits_id, last: 5 });

    // ⭐ Difficulty auto-adjust
    const difficulty = lastAcc >= 80 ? 'hard'
                     : lastAcc >= 50 ? 'medium'
                     : 'easy';

    const q = await qbankApi.pickOne({
      wiswits_id: target.wiswits_id, difficulty,
      exclude: await getRecentQuestionIds({ org_id, student_id, days: 7 }),
    });
    return { question: q, reason: 'weak_area', target: target.wiswits_id };
  }

  // 3. Kuch weak nahi → challenge do
  const q = await qbankApi.pickOne({
    subject_id, difficulty: 'hard',
    exclude: await getRecentQuestionIds({ org_id, student_id, days: 30 }),
  });
  return { question: q, reason: 'challenge' };
}
```

---

# PART 4 — API SURFACE (68 Endpoints)

```
╔═══ TEST BUILDER ══════════════════════════════════════════════╗
GET    /tests                        ?subject=&class=&status=&type=&mine=
POST   /tests                        create shell
POST   /tests/from-qbank             ⭐ filters → pick → test
POST   /tests/from-blueprint         ⭐ weightage → auto-pick
POST   /tests/manual                 type inline
POST   /tests/:id/questions          add/remove/reorder
PATCH  /tests/:id
POST   /tests/:id/clone
POST   /tests/:id/publish
DELETE /tests/:id                    soft
GET    /tests/:id/preview
GET    /tests/:id/print              → PDF (A4, with/without answers)
GET    /tests/:id/validate           ⭐ blueprint match? Bloom balance? gaps?

╔═══ BLUEPRINT ═════════════════════════════════════════════════╗
GET/POST/PATCH  /blueprints
POST   /blueprints/:id/simulate      ⭐ "is blueprint se kya banega" preview
GET    /blueprints/:id/coverage      ⭐ QBank me itne questions hain?

╔═══ OFFLINE TEST ⭐⭐ ═════════════════════════════════════════╗
POST   /tests/offline                ⭐ paper test create
POST   /tests/:id/question-map       ⭐ Q1→Ch01T02, Q2→... (reusable)
GET    /tests/:id/question-map
POST   /tests/:id/marks-entry        ⭐⭐ question-wise bulk (THE screen)
POST   /tests/:id/marks-csv          CSV import
GET    /tests/:id/marks-template     → CSV template download
POST   /tests/:id/omr-upload         scan → parse
GET    /tests/:id/omr-template       → printable OMR sheet
POST   /tests/:id/omr-verify         manual correction of ambiguous bubbles

╔═══ ASSIGNMENT ════════════════════════════════════════════════╗
GET    /assignments                  ?test=&class=&status=
POST   /assignments
POST   /assignments/auto-group       ⭐ {"weak_in":"MATH10C03","severity":["critical"]}
POST   /assignments/preview-group    ⭐ kaun-kaun aayega, pehle dekho
PATCH  /assignments/:id
POST   /assignments/:id/close
POST   /assignments/:id/extend
GET    /assignments/:id/status       ⭐ who done / pending / absent

╔═══ ATTEMPT ═══════════════════════════════════════════════════╗
GET    /my/tests                     student: pending + done
GET    /my/tests/:id                 test detail before start
POST   /attempts/start
GET    /attempts/:id                 questions (shuffled per config)
POST   /attempts/:id/response        ⭐ auto-save, time tracked
POST   /attempts/:id/event           ⭐ telemetry (view/blur/focus)
POST   /attempts/:id/review/:qid
POST   /attempts/:id/submit          ⭐⭐ score + analyze + events
POST   /attempts/sync                ⭐ offline queue
GET    /attempts/:id/result          ⭐ score + solutions + full analysis

╔═══ ANALYTICS — ATTEMPT ═══════════════════════════════════════╗
GET    /analytics/attempt/:id                  ⭐ full breakdown
GET    /analytics/attempt/:id/questions        Q-by-Q
GET    /analytics/attempt/:id/topics           topic-wise
GET    /analytics/attempt/:id/bloom            Bloom-wise
GET    /analytics/attempt/:id/difficulty       difficulty-wise
GET    /analytics/attempt/:id/time             ⭐ time analysis
GET    /analytics/attempt/:id/behaviour        ⭐ silly vs concept
GET    /analytics/attempt/:id/comparison       ⭐⭐ vs class/topper/self

╔═══ ANALYTICS — TEST/CLASS ════════════════════════════════════╗
GET    /analytics/test/:id                     class summary
GET    /analytics/test/:id/questions           ⭐ question-wise (78% wrong)
GET    /analytics/test/:id/distractors         ⭐⭐ misconceptions
GET    /analytics/test/:id/clusters            ⭐⭐ misconception clusters
GET    /analytics/test/:id/quality             ⭐ bad question flags
GET    /analytics/test/:id/distribution        histogram
GET    /analytics/test/:id/toppers             ⭐ score only, NO names in list API
GET    /analytics/test/:id/needs-attention     bottom performers (private)

╔═══ ANALYTICS — STUDENT ═══════════════════════════════════════╗
GET    /analytics/student/:id                  ⭐ full profile
GET    /analytics/student/:id/progress         over time
GET    /analytics/student/:id/topics           topic mastery map
GET    /analytics/student/:id/bloom            Bloom radar
GET    /analytics/student/:id/behaviour        ⭐ behaviour profile
GET    /analytics/student/:id/errors           ⭐ error signature
GET    /analytics/student/:id/comparison       ⭐⭐ vs class/topper/self
GET    /analytics/student/:id/report           ⭐⭐⭐ FULL PROGRESS REPORT

╔═══ ANALYTICS — CLASS/SCHOOL ══════════════════════════════════╗
GET    /analytics/class/:id                    class health
GET    /analytics/class/:id/heatmap            ⭐ topic × student
GET    /analytics/class/:id/trend              over tests
GET    /analytics/school                       school-wide
GET    /analytics/school/subjects              subject health

╔═══ WEAK AREAS ════════════════════════════════════════════════╗
GET    /weak-areas                   ?student=&class=&severity=&status=&subject=
GET    /weak-areas/student/:id
GET    /weak-areas/student/:id/roots ⭐⭐ root cause chain + viz data
GET    /weak-areas/heatmap           ?scope=student|class|school
POST   /weak-areas/recompute         manual trigger
PATCH  /weak-areas/:id/status        teacher override (reason mandatory)
GET    /weak-areas/:id/evidence      ⭐ "kyun weak bola?" — proof

╔═══ WORKSHEETS ════════════════════════════════════════════════╗
POST   /worksheets/generate          ⭐⭐ auto from weak areas
POST   /worksheets/generate-bulk     ⭐ whole class, one click
POST   /worksheets/generate-class    ⭐ class-wide misconception
GET    /worksheets                   ?student=&status=
GET    /worksheets/:id
PATCH  /worksheets/:id               teacher edits before assign
POST   /worksheets/:id/regenerate    different questions, same target
GET    /worksheets/:id/pdf           ?solutions=true|false
POST   /worksheets/:id/assign
POST   /worksheets/:id/attempt

╔═══ RECOVERY CYCLE ⭐⭐ ═══════════════════════════════════════╗
GET    /cycles                       ?student=&outcome=&status=
GET    /cycles/student/:id
POST   /cycles/start
POST   /cycles/:id/retest            link retest attempt
GET    /cycles/stats                 ⭐⭐⭐ THE SALES NUMBER
GET    /cycles/timeline/:student_id  ⭐ mastery journey

╔═══ PROFILE ═══════════════════════════════════════════════════╗
GET    /profile/student/:id          ⭐ learning profile
POST   /profile/recompute

╔═══ INSIGHTS & ALERTS ═════════════════════════════════════════╗
GET    /alerts                       ?role=&status=&severity=
POST   /alerts/:id/read
POST   /alerts/:id/action
GET    /insights/reteach             ⭐ teacher's action list
GET    /insights/attention           students needing help
GET    /insights/question-quality    ⭐ bad questions → QBank
GET    /insights/qbank-gaps          ⭐ "Ch07 me questions kam hain"

╔═══ PARENT DIGEST ═════════════════════════════════════════════╗
GET    /digest/student/:id           preview
POST   /digest/send                  cron
GET    /digest/history/:student_id

╔═══ ADAPTIVE PRACTICE ═════════════════════════════════════════╗
GET    /practice/next                ⭐ adaptive next question
POST   /practice/response
GET    /practice/due                 spaced repetition due
GET    /practice/streak
GET    /practice/stats

╔═══ WIDGETS ═══════════════════════════════════════════════════╗
GET /widgets/my-weak-areas           student
GET /widgets/my-progress             student
GET /widgets/practice-streak         student
GET /widgets/next-worksheet          student
GET /widgets/reteach-alerts          teacher ⭐
GET /widgets/class-health            teacher
GET /widgets/attention-needed        teacher
GET /widgets/pending-evaluation      teacher
GET /widgets/child-progress          parent
GET /widgets/recovery-stats          principal ⭐⭐
GET /widgets/subject-health          principal
```

---

# PART 5 — BUSINESS RULES (25 Rules)

```
╔═══ DATA INTEGRITY ════════════════════════════════════════════╗

 1. ⚠️⚠️ QUESTION SNAPSHOT
    Test create pe question ka poora text/options/answer freeze karo.
    QBank me question edit hua → purane attempts wahi rahenge.
    Bina iske result reproduce nahi hoga. Legal issue bhi ban sakta hai.

 2. ⚠️ TIME TRACKING MANDATORY
    Har response me time_sec, visits, changed_count.
    Bina iske: silly-mistake detection ❌, behaviour profile ❌,
               guess detection ❌, overthinking detection ❌
    Ye module ka aadha jaadu isi data se hai.

 3. ⚠️ FIRST vs FINAL ANSWER
    changed_count > 0 hai to first_answer bhi store karo.
    "Pehla sahi tha, badal ke galat kar diya" — ye insight gold hai.

╔═══ DETECTION ═════════════════════════════════════════════════╗

 4. ⚠️ MIN SAMPLE = 3
    1 question galat ≠ weak area.
    Ek false positive = teacher ka bharosa gaya = module dead.

 5. ⚠️ RECENCY = 90 DAYS
    90 din purana data stale. Ignore + mark decayed.

 6. ⚠️ MIN CONFIDENCE = 0.40
    Kam data = chup raho. Shor mat machao.

 7. ⭐⭐ ROOT CAUSE FIRST
    Symptom pe worksheet = waqt barbaad.
    Root fix → dependents apne aap sudhrenge.

 8. ⭐ EVIDENCE ON DEMAND
    "Kyun weak bola?" → proof dikhao: kaunse questions, kab, kya galat.
    Black box = bharosa nahi.

╔═══ RECOVERY ══════════════════════════════════════════════════╗

 9. ⭐ DIFFICULTY LADDER
    Critical (< 30%) student ko hard question = quit.
    6 easy → 3 medium → 1 hard. Confidence pehle.

10. ⭐ NO REPEAT 30 DAYS
    Wahi question dobara = rote learning, samajh nahi.

11. ⭐ MAX 2 TARGETS
    2 se zyada target = focus toot jaata hai.

12. ⭐ BEHAVIOUR OVERRIDE
    Rusher + silly_rate > 40% → worksheet NAHI. Coaching chahiye.
    Concept aata hai! Worksheet dena insult hai.

13. ⭐ 3 CYCLES MAX
    3 me gap band nahi hua → insaan chahiye.
    System haar maan le. Chupchap fail hone se behtar hai bolna.

14. ⭐ WORSENED = IMMEDIATE ESCALATION
    Kharab ho raha hai → turant teacher. Agla cycle mat chalao.

15. ⭐⭐ ROOT CLOSED → RECHECK DEPENDENTS
    Root fix hua? Dependent topics shayad apne aap theek ho gaye.
    Retest suggest karo. Ye loop ka sabse smart part hai.

╔═══ DIGNITY ═══════════════════════════════════════════════════╗

16. ⭐⭐ NO RANK. EVER.
    Rank API exist hi nahi karta. Percentile theek hai.
    Weak student ko public me expose karna = damage.

17. ⭐⭐ NO LEADERBOARD.
    Streak theek hai (self vs self). Comparison nahi.

18. ⭐ TOPPER = SCORE ONLY, NO NAME
    "Topper 94%" theek hai. "Priya 94%" nahi.

19. ⭐ "NEEDS SUPPORT", NOT "BOTTOM 25%"
    Shabdon se farq padta hai. Bachcha padhta hai.

20. ⭐⭐ NEVER JOIN WITH WELL-BEING
    PL data mood data se kabhi join nahi.
    Academic pressure ≠ mental health crisis.
    Ye code me hardcoded rule hai.

21. ⭐ PARENT DIGEST = ENCOURAGING
    "Aarav ne 34% → 78% improve kiya 🎉"  ✅
    "Aarav 28th out of 32"                ❌

╔═══ QUALITY LOOP ══════════════════════════════════════════════╗

22. ⭐ QUESTION QUALITY FLAGS
    accuracy < 15% + 60% ek option → key_error suspect
    accuracy < 15% + high entropy → ambiguous
    DI < 0.15 → non-discriminating
    → emit to QBank. Student ko blame mat karo.

23. ⭐ DIFFICULTY CALIBRATION
    Tagged "easy" par p_value 0.3 → tag galat hai.
    QBank ko wapas batao. Har raat.

24. ⭐ QBANK SHORTAGE ALERT
    Worksheet ke liye 10 questions chahiye, 4 mile
    → emit `pl.qbank_shortage` → Content team ko roadmap mila.

╔═══ PRODUCT ═══════════════════════════════════════════════════╗

25. ⭐⭐⭐ OFFLINE TEST = FIRST CLASS CITIZEN
    India me 80% test paper pe hote hain.
    Question-wise marks entry itna hi aasan ho jitna online attempt.
    Agar ye screen slow hai, teacher module use hi nahi karega.
    → 32 students × 20 questions in < 5 minutes, keyboard only.

    ⚠️ Ye is module ka sabse important product decision hai.
       Isko afterthought samjha to poora module fail.
```

---

# PART 6 — EVENTS

```js
// ═══ EMIT ═══════════════════════════════════════════════════

emit('pl.test_created',        { org_id, test_id, source, mode, class_no, subject_id, at })
emit('pl.test_published',      { org_id, test_id, question_count, at })
emit('pl.assigned',            { org_id, assignment_id, test_id, student_ids, at })

emit('pl.attempted',           { org_id, student_id, attempt_id, test_id,
                                 score, percentage,
                                 wrong_question_ids, wrong_wiswits_ids,
                                 behaviour_flags, at })                    ⭐

emit('pl.weak_detected',       { org_id, student_id, wiswits_id, severity,
                                 accuracy, confidence,
                                 is_root_cause, root_wiswits_id,
                                 dominant_error_type, at })                ⭐⭐

emit('pl.worksheet_generated', { org_id, student_id, worksheet_id,
                                 targets, strategy, at })

emit('pl.gap_closed',          { org_id, student_id, wiswits_id,
                                 before, after, delta, cycles, days, at }) ⭐⭐⭐

emit('pl.needs_teacher',       { org_id, student_id, wiswits_id,
                                 cycles, reason, history, at })            ⭐⭐

emit('pl.reteach_alert',       { org_id, test_id, question_id, wiswits_id,
                                 wrong_pct, misconception,
                                 affected_students, at })                  ⭐⭐

emit('pl.question_flagged',    { org_id, question_id, reason,
                                 accuracy, distribution, at })             ⭐

emit('pl.question_stats',      { org_id, question_id, attempts, p_value,
                                 discrimination_index, avg_time_sec,
                                 distractor_distribution, at })            ⭐

emit('pl.qbank_shortage',      { org_id, wiswits_ids, needed, got, at })   ⭐

emit('pl.profile_updated',     { org_id, student_id, behaviour, pace, at })

// ═══ SUBSCRIBE ══════════════════════════════════════════════

on('assessment.published',  → import as offline test, feed topic scores)
on('exam.published',        → feed topic scores)
on('dpp.attempted',         → feed topic scores, update practice cards)
on('curriculum.imported',   → rebuild prerequisite graph cache)
on('qbank.question_updated',→ do NOT touch existing snapshots)
```

**⭐⭐⭐ `pl.gap_closed` sabse important event hai.** Ye WISWITS Loop ka proof hai. Ye event jitni baar fire hoga, utna hi strong sales pitch banega.

---

# PART 7 — FRONTEND (26 Pages)

```
╔═══ TEACHER ═══════════════════════════════════════════════════╗
/teacher/pl                          dashboard + reteach alerts ⭐
/teacher/pl/tests                    test list
/teacher/pl/tests/create             ⭐⭐ test builder
/teacher/pl/tests/:id                detail + questions
/teacher/pl/tests/:id/marks          ⭐⭐⭐ OFFLINE MARKS ENTRY (hero)
/teacher/pl/tests/:id/analytics      ⭐⭐ class analysis (hero)
/teacher/pl/tests/:id/distractors    ⭐⭐ misconceptions
/teacher/pl/blueprints               blueprint manager
/teacher/pl/assignments              assignment tracker
/teacher/pl/weak-areas               ⭐ class heatmap
/teacher/pl/students/:id             ⭐⭐ student deep-dive
/teacher/pl/worksheets               generate + assign
/teacher/pl/insights                 reteach + attention + quality

╔═══ STUDENT ═══════════════════════════════════════════════════╗
/student/pl                          my dashboard
/student/pl/tests                    pending + done
/student/pl/attempt/:id              ⭐⭐ attempt UI (offline)
/student/pl/result/:id               ⭐⭐ result + analysis
/student/pl/weak-areas               ⭐⭐ my gaps + root cause
/student/pl/worksheets               my worksheets
/student/pl/practice                 ⭐ adaptive practice
/student/pl/progress                 ⭐⭐ my journey

╔═══ PARENT ════════════════════════════════════════════════════╗
/parent/pl                           child overview
/parent/pl/progress                  ⭐⭐ progress report
/parent/pl/report                    ⭐⭐⭐ FULL PROGRESS REPORT

╔═══ PRINCIPAL ═════════════════════════════════════════════════╗
/principal/pl                        ⭐⭐⭐ recovery stats (SALES screen)
/principal/pl/subjects               subject health
```

---

# PART 8 — HERO SCREENS

## 8.1 ⭐⭐⭐ Offline Marks Entry — THE Adoption Screen

**India me 80% test paper pe hote hain. Ye screen module ki adoption decide karegi.**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  Unit Test 2 · Class 10-A · Mathematics · 20 Q · 40 Marks                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  QUESTION MAP                                    [ Load from QBank ] [Save]║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ Q1  → MATH10C01T02 · Easy   · 2m    Q11 → MATH10C05T01 · Med  · 2m  │ ║
║  │ Q2  → MATH10C01T03 · Med    · 2m    Q12 → MATH10C05T02 · Med  · 2m  │ ║
║  │ Q3  → MATH10C03T01 · Hard   · 2m    Q13 → MATH10C07T01 · Hard · 2m  │ ║
║  │ ...                                  ...                              │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║  ✅ Map saved · reusable for future tests                                  ║
║                                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  MARKS ENTRY                        [⌨️ Keyboard] [📄 CSV] [📷 OMR]        ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────┐   ║
║  │ Roll  Name              Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 ... Q20   Total   │   ║
║  ├────────────────────────────────────────────────────────────────────┤   ║
║  │ 1042  Aarav Sharma       2  2  0  2  1  2  0  2  ...  2     28    │   ║
║  │ 1043  Priya Singh        2  1  2  2  2  2  2  1  ...  2     34    │   ║
║  │ 1044  Rohan Verma        0  0  0  1  0  1  0  0  ...  1     12    │   ║
║  │ 1045  Sneha Patel        2  █                                       │   ║
║  │                             ↑ cursor                                │   ║
║  │ 1046  Kabir Shah         ─  ─  ─  ─  ─  ─  ─  ─  ...  ─     AB    │   ║
║  └────────────────────────────────────────────────────────────────────┘   ║
║                                                                            ║
║  ⌨️  Tab → next Q   Enter → next student   0/1/2 → marks   A → absent      ║
║      Shift+Tab → prev Q   ↑↓ → move student   Esc → save draft            ║
║                                                                            ║
║  Progress: ████████████░░░░░░░░  12 / 32 students                          ║
║  ⏱ Elapsed: 2:14 · Est. remaining: 3:20                                   ║
║                                                                            ║
║              [ Save Draft ]        [ Submit → Analyze ⚡ ]                 ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Requirements — non-negotiable:**
- ⌨️ **Keyboard-only** — mouse chhuye bina 640 entries
- Auto-advance on keypress (no Enter needed for marks)
- Auto-save every 10 seconds
- Question map reusable across tests
- CSV import as fallback
- **Target: 32 students × 20 Q in under 5 minutes**
- Submit → analysis **turant** ready (< 3 seconds)

**Agar ye screen slow hai, teacher module use nahi karega. Poora module fail.**

---

## 8.2 ⭐⭐ Test Analytics — The Insight Screen

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  Unit Test 2 · Class 10-A · Mathematics        32 attempted · avg 61%     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌── SCORE DISTRIBUTION ────────────────────────────────────────────────┐ ║
║  │  12 ┤                    ███                                         │ ║
║  │  10 ┤                 ██ ███ ██                                      │ ║
║  │   8 ┤              ██ ██ ███ ██ ██                                   │ ║
║  │   6 ┤           ██ ██ ██ ███ ██ ██                                   │ ║
║  │   4 ┤        ██ ██ ██ ██ ███ ██ ██ ██                                │ ║
║  │   2 ┤     ██ ██ ██ ██ ██ ███ ██ ██ ██ ██                             │ ║
║  │     └──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──                            │ ║
║  │        0 10 20 30 40 50 60 70 80 90 100                             │ ║
║  │                          ▲avg 61   ▲topper 94                       │ ║
║  │  median 63 · std dev 18 · range 12–94                               │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌── TOPIC HEALTH ──────────────────────────────────────────────────────┐ ║
║  │  Ch01 Real Numbers          ████████████████░░░░   78%  ✅          │ ║
║  │  Ch02 Polynomials           ██████████████░░░░░░   68%  ✅          │ ║
║  │  Ch03 Linear Equations      ████████░░░░░░░░░░░░   41%  ⚠️          │ ║
║  │  Ch05 Triangles             ███████████░░░░░░░░░   56%  ⚠️          │ ║
║  │  Ch07 Quadratic Equations   ████░░░░░░░░░░░░░░░░   22%  🚨          │ ║
║  │                                          [ Generate class worksheets ]│ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌── 🚨 RETEACH ALERTS ─────────────────────────────────────────────────┐ ║
║  │                                                                       │ ║
║  │  Q14 · Ch07 Quadratic · 22% correct                                  │ ║
║  │  ────────────────────────────────────────────────                    │ ║
║  │   A ██                          7  (22%)  ✓                          │ ║
║  │   B ████████████████████████   24  (75%)  ← 🚨                       │ ║
║  │   C █                           1  ( 3%)                             │ ║
║  │   D                             0  ( 0%)                             │ ║
║  │                                                                       │ ║
║  │  🚨 Poori class ek hi bharam me hai                                  │ ║
║  │  24 bachchon ne "x = -3, 5" chuna → sign_error in factorization      │ ║
║  │  💡 Kal 10 min do: (x+a)(x+b) me signs kaise aate hain               │ ║
║  │                                                                       │ ║
║  │  [📖 Reteach kit] [📝 Class worksheet] [👥 24 students] [🚩 Flag Q]  │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌── 🔗 MISCONCEPTION CLUSTER ──────────────────────────────────────────┐ ║
║  │  Q14, Q17, Q19 — teenon me wahi "sign_error"                        │ ║
║  │  Ye systemic gap hai, teen alag galtiyan nahi.                      │ ║
║  │  Ek reteach session teenon fix kar dega.       [📖 Combined kit]     │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  ┌── 🧠 BLOOM RADAR ──────┐  ┌── ⏱ TIME ANALYSIS ────────────────────┐  ║
║  │                         │  │                                        │  ║
║  │      Remember           │  │  Rushed (fast + wrong):      4  ⚠️    │  ║
║  │         ●82             │  │  Silly mistakes:             9  🚨    │  ║
║  │        ╱ ╲              │  │  Concept gaps:              12  🚨    │  ║
║  │  Create   Understand    │  │  Struggled (slow + wrong):   7  ⚠️    │  ║
║  │   ●24      ●71          │  │  Overthinking (right→wrong): 3  ⚠️    │  ║
║  │     │       │           │  │                                        │  ║
║  │  Evaluate  Apply        │  │  💡 9 silly mistakes = 18 marks lost   │  ║
║  │   ●28      ●48 ⚠️       │  │     Ye concept ki problem nahi hai.    │  ║
║  │        ╲ ╱              │  │     "Check your work" drill karao.     │  ║
║  │      Analyze            │  └────────────────────────────────────────┘  ║
║  │       ●31 🚨            │                                              ║
║  │                         │  ┌── 👤 NEEDS ATTENTION ─────────────────┐  ║
║  │ 💡 Recall achha hai,    │  │  Rohan Verma      12/40  🚨            │  ║
║  │    application weak.    │  │  Kabir Shah       16/40  🚨            │  ║
║  │    Word problems do.    │  │  Meera Joshi      18/40  ⚠️            │  ║
║  └─────────────────────────┘  │      [ Generate their worksheets ]     │  ║
║                                └────────────────────────────────────────┘  ║
║                                                                            ║
║  ┌── ⚠️ QUESTION QUALITY ───────────────────────────────────────────────┐ ║
║  │  Q11 🚩 KEY ERROR SUSPECT — 8% chose correct, 68% chose C  [Review]  │ ║
║  │  Q08 🚩 NON-DISCRIMINATING (DI 0.08) — measures nothing   [Replace]  │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 8.3 ⭐⭐⭐ Student Progress Report — The Complete Picture

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              AARAV SHARMA · Class 10-A · Mathematics                      ║
║              Progress Report · April – July 2026                          ║
║                                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────┬────────────┬────────────┬────────────┬────────────┐      ║
║  │    67%     │   +19%     │     4      │     2      │    78th    │      ║
║  │  Current   │  Since T1  │   Gaps     │  Closed    │ Percentile │      ║
║  │  average   │            │   found    │            │            │      ║
║  └────────────┴────────────┴────────────┴────────────┴────────────┘      ║
║                                                                            ║
╠═══ 📈 THE JOURNEY ═════════════════════════════════════════════════════════╣
║                                                                            ║
║   100 ┤                                                                    ║
║       │                                            ╭─── topper 94         ║
║    90 ┤                                       ╭────╯                      ║
║       │                                                                    ║
║    80 ┤                                              ╭──● YOU 67          ║
║       │                                    ╭─────────╯                    ║
║    70 ┤                          ╭─────────╯                              ║
║       │                    ╭─────╯    ╭────────────── class avg 61        ║
║    60 ┤          ╭─────────╯     ╭────╯                                   ║
║       │    ●─────╯          ╭────╯                                        ║
║    50 ┤   48            ╭───╯                                             ║
║       │                                                                    ║
║    40 ┤                                                                    ║
║       └────┬──────┬──────┬──────┬──────┬──────┬─────                     ║
║           T1     T2     T3     T4     T5     T6                          ║
║           48     52     61     58     64     67                          ║
║                                                                            ║
║   ── YOU   ── Class Avg   ── Topper                                       ║
║                                                                            ║
║   💬 "6 test me 48% se 67% — 19 point ka safar. T4 me thoda dip           ║
║       aaya tha, par wapas track pe ho. Class average se ab 6 point        ║
║       aage ho. Topper se 27 point peeche — par 3 mahine pehle 40         ║
║       point peeche the."                                                  ║
║                                                                            ║
╠═══ 🎯 ROOT CAUSE ANALYSIS ═════════════════════════════════════════════════╣
║                                                                            ║
║        🚨 START HERE                                                       ║
║        ┌──────────────────────────────────────────┐                       ║
║        │  Ch01 · Real Numbers            41%      │  ROOT CAUSE           ║
║        │  7 attempts · confidence 0.82            │                       ║
║        │  Error pattern: incomplete_factorization │                       ║
║        └──────────────────┬───────────────────────┘                       ║
║                           │ enables                                        ║
║                           ▼                                                ║
║        ┌──────────────────────────────────────────┐                       ║
║        │  Ch03 · Polynomials             34%      │  symptom (depth 1)    ║
║        └──────────────────┬───────────────────────┘                       ║
║                           │ enables                                        ║
║                           ▼                                                ║
║        ┌──────────────────────────────────────────┐                       ║
║        │  Ch07 · Quadratic Equations     28%      │  symptom (depth 2)    ║
║        └──────────────────────────────────────────┘                       ║
║                                                                            ║
║   💡 Ch07 pe practice mat karo. Ch01 se shuru karo.                       ║
║      Ch01 ko 70% pe le jao → Ch03 aur Ch07 apne aap sudhrenge.            ║
║      Estimated: 2 weeks (vs 8 weeks agar Ch07 chase karte rahe)           ║
║                                                                            ║
║                    [ 📝 Generate Ch01 Worksheet → ]                        ║
║                                                                            ║
╠═══ 🔄 RECOVERY HISTORY ════════════════════════════════════════════════════╣
║                                                                            ║
║   Ch02 Polynomials       34% ──▶ 78%   ✅ CLOSED    2 cycles · 18 days    ║
║   Ch05 Triangles         42% ──▶ 71%   ✅ CLOSED    1 cycle  · 9 days     ║
║   Ch01 Real Numbers      41% ──▶  ?    🔄 IN RECOVERY (cycle 1, day 4)    ║
║   Ch07 Quadratic         28% ──▶  ?    ⏸ WAITING (root cause pehle)      ║
║                                                                            ║
║   4 gaps found · 2 closed (50%) · avg gain +36% · avg 1.5 cycles          ║
║                                                                            ║
╠═══ 🧠 LEARNING PROFILE ════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌── BLOOM RADAR ──────────┐   ┌── ERROR SIGNATURE ──────────────────┐   ║
║  │      Remember           │   │  sign_error            ████████ 34%  │   ║
║  │         ●88             │   │  arithmetic_slip       █████    22%  │   ║
║  │        ╱ ╲              │   │  incomplete_procedure  ████     18%  │   ║
║  │  Create   Understand    │   │  concept_confusion     ███      14%  │   ║
║  │   ●31      ●76          │   │  misread_question      ██       12%  │   ║
║  │     │       │           │   └──────────────────────────────────────┘   ║
║  │  Evaluate  Apply        │                                              ║
║  │   ●38      ●54 ⚠️       │   ┌── BEHAVIOUR ────────────────────────┐   ║
║  │        ╲ ╱              │   │  Pace:        Fast                   │   ║
║  │      Analyze            │   │  Archetype:   🏃 Rusher              │   ║
║  │       ●42               │   │                                       │   ║
║  │                         │   │  Silly mistakes:      42%  🚨        │   ║
║  │ Recall bahut achha.     │   │  Concept gaps:        31%            │   ║
║  │ Application weak.       │   │  Guessing:             8%            │   ║
║  └─────────────────────────┘   │  Overthinking:        11%            │   ║
║                                 │  Avg time ratio:     0.58× ⚡        │   ║
║  ┌── STRENGTHS ────────────┐   └───────────────────────────────────────┘   ║
║  │  🏆 Geometry      88%   │                                              ║
║  │  🏆 Mensuration   84%   │   💬 "Aarav ko aata hai, par wo jaldbaazi   ║
║  │  🏆 Statistics    81%   │      karta hai. 42% galtiyan sirf careless- ║
║  └─────────────────────────┘      ness ki hain — 8 marks har test me     ║
║                                    yun hi ja rahe hain.                   ║
║                                                                            ║
║                                    Ilaaj worksheet nahi hai. Concept       ║
║                                    aata hai. 'Check your work' ki aadat    ║
║                                    daalni hai. Har question ke baad 5      ║
║                                    second ruk ke re-check karo."           ║
║                                                                            ║
╠═══ 📊 COMPARISON ══════════════════════════════════════════════════════════╣
║                                                                            ║
║                      YOU    SECTION   CLASS   SCHOOL   TOPPER              ║
║   Overall            67%      64%      61%      59%      94%              ║
║   Ch01 Real Num      41%      68%      71%      69%      98%   🚨         ║
║   Ch02 Polynomials   78%      66%      68%      65%      96%   ✅         ║
║   Ch03 Linear Eq     34%      58%      61%      60%      92%   🚨         ║
║   Ch05 Triangles     71%      62%      56%      58%      90%   ✅         ║
║   Ch07 Quadratic     28%      45%      22%      31%      85%   ⚠️         ║
║                                                                            ║
║   ┌─────────────────────────────────────────────────────────────────┐    ║
║   │  Percentile: 78th  ·  Band: Top 25%                             │    ║
║   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░               │    ║
║   │  0                                    78                    100  │    ║
║   └─────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║   💬 "Ch07 me tum 28% ho, par class bhi sirf 22% pe hai — ye poori       ║
║       class ka problem hai, sirf tumhara nahi. Ch01 aur Ch03 me           ║
║       class se peeche ho — yahan kaam chahiye."                           ║
║                                                                            ║
╠═══ 🎯 NEXT STEPS ══════════════════════════════════════════════════════════╣
║                                                                            ║
║   1. 📝 Ch01 Real Numbers worksheet — 25 min · [ Start ]                  ║
║      Root cause hai. Isse Ch03 aur Ch07 dono sudhrenge.                   ║
║                                                                            ║
║   2. ⏱ Accuracy drill — 15 min · [ Start ]                               ║
║      Har question ke baad 5 second check. 42% galtiyan yahi hain.         ║
║                                                                            ║
║   3. 🧠 Application practice — Ch02, Ch05 ke word problems                ║
║      Recall strong hai. Application pe kaam karo.                         ║
║                                                                            ║
║   📅 Next milestone: Ch01 → 70% by 30 July                                ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 8.4 ⭐⭐⭐ Principal Recovery Stats — THE Sales Screen

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LEARNING RECOVERY · 2026-27                    [Class ▾] [Subject ▾] [⬇] ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐     ║
║  │  1,240   │   892    │   72%    │  +23%    │   1.8    │    14    │     ║
║  │  Gaps    │  Closed  │  Close   │   Avg    │   Avg    │   Avg    │     ║
║  │  found   │          │  rate    │   gain   │  cycles  │   days   │     ║
║  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘     ║
║                                                                            ║
╠═══ CLASS IMPROVEMENT · THE PROOF ══════════════════════════════════════════╣
║                                                                            ║
║    85% ┤                                                  ╭──● 81.3%      ║
║        │                                             ╭────╯               ║
║    80% ┤                                        ╭────╯                    ║
║        │                                   ╭────╯                         ║
║    75% ┤                              ╭────╯                              ║
║        │                         ╭────╯                                   ║
║    70% ┤                    ╭────╯                                        ║
║        │               ╭────╯                                             ║
║    65% ┤          ╭────╯                                                  ║
║        │     ╭────╯                                                       ║
║    60% ┤ ●───╯                                                            ║
║        │ 61.3%                                                            ║
║        └────┬────┬────┬────┬────┬────┬────┬────                          ║
║            T1   T2   T3   T4   T5   T6                                    ║
║                                                                            ║
║   Class 10 · Mathematics · 550 students · 6 tests · 4 months              ║
║   📈 +20 percentage points                                                ║
║                                                                            ║
║   ┌────────────────────────────────────────────────────────────────┐     ║
║   │  Ye WISWITS Loop hai.                                          │     ║
║   │  1,240 gaps detect hue. 892 band hue. Har ek automatically.    │     ║
║   │  Teacher ne sirf padhaya. System ne baaki sab kiya.            │     ║
║   └────────────────────────────────────────────────────────────────┘     ║
║                                                                            ║
╠═══ SUBJECT HEALTH ═════════════════════════════════════════════════════════╣
║                                                                            ║
║   Maths      ████████████████░░░░  78%   142 gaps ·  98 closed (69%) ✅   ║
║   Science    ██████████████░░░░░░  68%   198 gaps · 121 closed (61%) ✅   ║
║   English    ████████████████████  82%    64 gaps ·  58 closed (91%) ✅   ║
║   SST        ██████████░░░░░░░░░░  54%   287 gaps · 112 closed (39%) ⚠️   ║
║   Hindi      ████████████████░░░░  76%    89 gaps ·  71 closed (80%) ✅   ║
║                                                                            ║
║   ⚠️ SST me 287 gaps, sirf 39% band hue. Sabse zyada dhyan yahan chahiye. ║
║                                                                            ║
╠═══ CLASS-WISE ═════════════════════════════════════════════════════════════╣
║                                                                            ║
║   Class   Students   Gaps   Closed   Rate   Avg Gain   Trend              ║
║   ─────────────────────────────────────────────────────────────           ║
║   10-A       32       98      74      76%     +26%     📈                 ║
║   10-B       34      112      81      72%     +23%     📈                 ║
║   10-C       31      134      67      50%     +18%     ➡️ ⚠️              ║
║    9-A       36       89      71      80%     +29%     📈                 ║
║    9-B       35      104      78      75%     +24%     📈                 ║
║                                                                            ║
║   ⚠️ 10-C me close rate sirf 50%. Baaki classes 72-80% pe hain.           ║
║      [ Investigate ]                                                       ║
║                                                                            ║
╠═══ 🚨 NEEDS HUMAN ATTENTION ═══════════════════════════════════════════════╣
║                                                                            ║
║   47 students · 3 recovery cycles ho gaye · gap band nahi hua             ║
║                                                                            ║
║   System ne apna kaam kar liya. Ab teacher chahiye.                       ║
║                                                                            ║
║   Rohan Verma    10-C   Ch03   3 cycles   28% → 31%   [ Assign teacher ]  ║
║   Kabir Shah     10-A   Ch07   3 cycles   22% → 19%   [ Assign teacher ]  ║
║   Meera Joshi     9-B   Ch05   3 cycles   34% → 36%   [ Assign teacher ]  ║
║   ... 44 more                                          [ View all ]        ║
║                                                                            ║
╠═══ 📚 CONTENT GAPS ════════════════════════════════════════════════════════╣
║                                                                            ║
║   Worksheet generate karne me question kam pade:                          ║
║                                                                            ║
║   MATH10C07  Quadratic Equations     needed 240 · have  84  🚨            ║
║   SCI10C09   Heredity                needed 180 · have  62  🚨            ║
║   SST10C04   Nationalism             needed 210 · have  40  🚨            ║
║                                                                            ║
║   💡 Content team ko bhejo. Ye hi roadmap hai.        [ Send to HQ ]      ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Ye screen principal ko dikha do. Pen nikal aayega.**

---

## 8.5 ⭐⭐ Student Attempt UI (Mobile-First, Offline)

```
┌─────────────────────────────────┐
│  Unit Test 2 · Maths            │
│  ⏱ 42:18        🔋 Offline ✓    │
├─────────────────────────────────┤
│                                 │
│  Q 7 of 20            2 marks   │
│  ●●●●●●○○○○○○○○○○○○○○           │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Find the HCF of 12 and 18      │
│  using Euclid's division        │
│  lemma.                         │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  A    HCF = 6             │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  B    HCF = 12         ✓  │  │  ← selected
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  C    HCF = 3             │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  D    HCF = 18            │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │   🔖 Mark for review      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │   ✏️  Rough work           │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌────────┐      ┌──────────┐  │
│  │ ← Prev │      │  Next →  │  │
│  └────────┘      └──────────┘  │
│                                 │
│  ▓▓▓▓▓▓▓░░░░░░░░░░░░  Saved ✓  │
├─────────────────────────────────┤
│  [ ☰ Navigator ]  [ Submit ]    │
└─────────────────────────────────┘

Navigator (tap ☰):
┌─────────────────────────────────┐
│  ✅ Answered   🔖 Review        │
│  ⬜ Not visited  ⭕ Skipped     │
│                                 │
│  ✅ ✅ ✅ ⭕ ✅ ✅ ✅ 🔖 ⬜ ⬜   │
│   1  2  3  4  5  6  7  8  9 10 │
│  ⬜ ⬜ ⬜ ⬜ ⬜ ⬜ ⬜ ⬜ ⬜ ⬜   │
│  11 12 13 14 15 16 17 18 19 20 │
│                                 │
│  Answered: 6 · Review: 1        │
│  Remaining: 13                  │
└─────────────────────────────────┘
```

**Requirements:**
- One question per screen (mobile)
- Auto-save every answer (localStorage + server)
- **Offline capable** — network gaya to queue, wapas aaya to sync
- Time per question tracked silently
- Changed count tracked
- 44×44px touch targets
- Rough work pad (canvas)
- Auto-submit on timeout

---

# PART 9 — CHART LIBRARY (Every Visualization)

```
╔═══ STUDENT-FACING ════════════════════════════════════════════╗

1.  Progress Line          — score over tests, with class avg + topper bands
2.  Bloom Radar            — 6-axis spider (remember → create)
3.  Topic Mastery Bar      — horizontal bars, colour by severity
4.  Root Cause Tree        — ⭐⭐ node graph, root highlighted
5.  Recovery Timeline      — gap detected → worksheet → retest → closed
6.  Error Signature Donut  — distractor_reason distribution
7.  Time Scatter           — x=time_ratio, y=correctness, quadrants
8.  Streak Calendar        — GitHub-style, practice consistency
9.  Comparison Bar Group   — you vs section vs class vs school vs topper
10. Percentile Gauge       — semi-circle, band coloured

╔═══ TEACHER-FACING ════════════════════════════════════════════╗

11. Score Histogram        — distribution with avg/median/topper markers
12. Question Difficulty    — p-value bar chart, sorted
13. Distractor Bars        — ⭐⭐ per question, option distribution
14. Class Heatmap          — ⭐ students × topics, colour = accuracy
15. Topic Health Bars      — class-level topic accuracy
16. Bloom Distribution     — planned vs actual (blueprint compliance)
17. Time Health Stacked    — rushed/silly/concept/struggled counts
18. Discrimination Scatter — x=p-value, y=DI, quadrants (good/bad questions)
19. Progress Slope Chart   — every student's T1→T6, spot decliners
20. Misconception Cluster  — ⭐⭐ network graph, connected questions

╔═══ PRINCIPAL-FACING ══════════════════════════════════════════╗

21. Class Improvement      — ⭐⭐⭐ the 61.3% → 81.33% curve
22. Subject Health Bars    — with gap counts
23. Recovery Funnel        — detected → in-recovery → retested → closed
24. Class Comparison Grid  — close rate by class
25. Gap Aging              — how long gaps stay open
26. Content Gap Bars       — ⭐ QBank shortage by topic
27. Cycle Distribution     — how many close in 1/2/3 cycles

╔═══ PARENT-FACING ═════════════════════════════════════════════╗

28. Simple Progress Line   — no class comparison, just self
29. Gap Closed Counter     — big number, celebratory
30. Milestone Timeline     — what's next
```

**Library:** Recharts (already in stack). Custom for root-cause tree + heatmap.

---

# PART 10 — WEEK-BY-WEEK (8 weeks, 3 interns)

```
╔═══ WEEK 1 — Foundation ═══════════════════════════════════════╗
A: 24 tables + migration + seed (500 students, 20 tests, 200k responses)
B: Test CRUD + from-qbank + blueprint + ⚠️ question snapshot
C: Assignment + auto-group + preview-group
→ PR 1

╔═══ WEEK 2 — Attempt & Offline ════════════════════════════════╗
A: ⭐⭐⭐ Offline test + question-map + marks-entry API
B: OMR template + upload + parse + verify
C: ⭐ Attempt engine + time tracking + telemetry + offline sync
→ PR 2

╔═══ WEEK 3 — Analysis Engine ══════════════════════════════════╗
A: Topic score + Bloom score + skill score + difficulty-wise
B: ⭐⭐ Distractor analysis + DI + question quality flags
C: ⭐⭐ Behaviour classifier (silly/concept/guess/overthink)
→ PR 3  ⚠️ AK Sir reviews all algorithms

╔═══ WEEK 4 — Weak Areas & Root Cause ══════════════════════════╗
A: ⭐⭐ Weak detector + 4 gates + confidence
B: ⭐⭐⭐ Root cause + prerequisite chain + cycle guard
C: ⭐ Learning profile + error signature + coaching notes
→ PR 4  ⚠️ AK Sir reviews root cause algorithm

╔═══ WEEK 5 — Recovery & Benchmarks ════════════════════════════╗
A: ⭐⭐ Worksheet generator + ladder + no-repeat + PDF
B: ⭐⭐⭐ Recovery cycle + gap closed + recheck dependents
C: ⭐⭐ Benchmarking + comparison + narrative builder
→ PR 5

╔═══ WEEK 6 — Frontend I ═══════════════════════════════════════╗
A: ⭐⭐ Test builder + ⭐⭐⭐ Offline marks entry (keyboard!)
B: ⭐⭐ Test analytics + reteach + distractors + clusters
C: ⭐⭐ Attempt UI (mobile, offline) + result page
→ PR 6

╔═══ WEEK 7 — Frontend II ══════════════════════════════════════╗
A: ⭐⭐ Student weak areas + root cause tree viz + profile
B: ⭐⭐⭐ Progress report + all comparison charts
C: ⭐⭐⭐ Principal recovery stats + heatmaps + parent digest
→ PR 7

╔═══ WEEK 8 — Adaptive & Polish ════════════════════════════════╗
A: Adaptive practice + SM-2 + streak
B: Alerts + insights + QBank feedback loop
C: Performance tuning + precompute + caching
All: docs, tests, demo
→ PR 8
```

---

# PART 11 — DEFINITION OF DONE

```
╔═══ ALGORITHMS (AK Sir reviews each) ══════════════════════════╗
[ ] ⭐⭐ Weak detector: min 3 sample (1-2 attempts → no flag)
[ ] ⭐⭐ Weak detector: 90-day recency → decayed
[ ] ⭐⭐ Weak detector: confidence < 0.4 → silent
[ ] ⭐⭐⭐ Root cause: Ch07+Ch03+Ch01 weak → Ch01 = root
[ ] ⭐⭐⭐ Root cause: circular prereq → no infinite loop
[ ] ⭐⭐⭐ Root cause: depth > 10 → safety break
[ ] ⭐⭐ Worksheet: root targeted, NOT symptom
[ ] ⭐⭐ Worksheet: critical → 6 easy/3 med/1 hard
[ ] ⭐⭐ Worksheet: no repeat within 30 days
[ ] ⭐⭐ Worksheet: rusher + silly>40% → coaching, NOT worksheet
[ ] ⭐⭐ Distractor: 30%+ same wrong → misconception
[ ] ⭐⭐ Distractor: 50%+ → class_wide alert
[ ] ⭐⭐ Cluster: 2+ questions same reason → systemic flag
[ ] ⭐ Quality: <15% + 60% one option → key_error
[ ] ⭐ Quality: DI < 0.15 → non_discriminating
[ ] ⭐⭐ Behaviour: easy+wrong+fast → silly_mistake
[ ] ⭐⭐ Behaviour: hard+wrong+slow → concept_gap
[ ] ⭐⭐ Behaviour: first correct → final wrong → overthinking
[ ] ⭐⭐⭐ Cycle: gap → worksheet → retest → closed, full loop
[ ] ⭐⭐ Cycle: 3 cycles → pl.needs_teacher
[ ] ⭐⭐ Cycle: worsened → immediate escalation
[ ] ⭐⭐⭐ Cycle: root closed → recheck dependents

╔═══ CRITICAL PRODUCT ══════════════════════════════════════════╗
[ ] ⭐⭐⭐ Offline marks: 32 students × 20 Q < 5 min, KEYBOARD ONLY
[ ] ⭐⭐⭐ Submit → analysis ready < 3 seconds
[ ] ⭐⭐ Question snapshot: QBank edit → old attempts unchanged
[ ] ⭐⭐ Attempt works offline (airplane mode) → syncs clean
[ ] ⭐⭐ time_sec + visits + changed_count on EVERY response
[ ] ⭐⭐ first_answer stored when changed_count > 0

╔═══ DIGNITY (hard rules) ══════════════════════════════════════╗
[ ] ⭐⭐ NO rank API exists anywhere (grep: "rank" → only percentile)
[ ] ⭐⭐ NO leaderboard API exists
[ ] ⭐⭐ Topper name never returned in any comparison API
[ ] ⭐⭐ "needs_support" not "bottom_25"
[ ] ⭐⭐ ZERO joins with wb_* tables (grep proof)
[ ] ⭐ Parent digest: progress language, not position

╔═══ FUNCTIONAL ════════════════════════════════════════════════╗
[ ] Test from QBank: filter → pick → assign < 2 min
[ ] Auto-group: "weak in Ch03" → correct list
[ ] Preview-group shows before assign
[ ] Blueprint simulate works
[ ] Bulk worksheet: 32 students, one click
[ ] Root cause tree renders correctly
[ ] All 30 charts render
[ ] Recovery stats screen shows real numbers
[ ] Evidence API: "why weak?" → proof

╔═══ CONTRACT ══════════════════════════════════════════════════╗
[ ] All 12 events firing
[ ] Zero cross-module require() (QBank/curriculum via API!)
[ ] Zero query without org_id
[ ] Zero hardcoded hex
[ ] Every route has requirePermission

╔═══ PERFORMANCE ═══════════════════════════════════════════════╗
[ ] 500 students × 20 tests × 20 Q = 200k responses
[ ] All analytics pages < 2s
[ ] Nightly detect: 500 students < 5 min
[ ] Class heatmap (32 × 40 topics) < 1s
[ ] Progress report < 2s

╔═══ DELIVERY ══════════════════════════════════════════════════╗
[ ] 8 PRs
[ ] Tests 75%+ on algorithms (higher bar — ye dimaag hai)
[ ] docs/README.md + ALGORITHMS.md + TAG_CONTRACT.md
[ ] Postman collection
[ ] Screenshots desktop + 380px
[ ] Demo video 10 min
```

---

# PART 12 — TRAPS

| # | Trap | Fix |
|---|---|---|
| 1 | ⭐⭐⭐ Offline entry ko afterthought samajhna | 80% tests paper pe. Ye HERO hai. |
| 2 | ⭐⭐⭐ Symptom pe worksheet | Root cause first. Ch01, not Ch07. |
| 3 | ⭐⭐ 1 galat = weak area | Min 3. False positive = bharosa gaya. |
| 4 | ⭐⭐ Question snapshot nahi | QBank edit → purane result badal jaayenge |
| 5 | ⭐⭐ time_sec skip | Aadha module ka jaadu khatam |
| 6 | ⭐⭐ first_answer skip | Overthinking detection impossible |
| 7 | ⭐⭐ Rank/leaderboard | Weak student expose = damage |
| 8 | ⭐⭐ PL + wellbeing join | ❌ NEVER. Hardcoded rule. |
| 9 | ⭐ Rusher ko worksheet | Concept aata hai! Coaching chahiye. |
| 10 | ⭐ Critical ko hard questions | Quit kar dega |
| 11 | ⭐ Question repeat | Rote learning, samajh nahi |
| 12 | ⭐ 3+ cycles chupchap | System haar maane, bole |
| 13 | ⭐ Distractor analysis skip | Teacher ka favourite feature |
| 14 | ⭐ Cycle guard bhoolna | Infinite loop in prereq chain |
| 15 | Analytics on-demand compute | Precompute nightly |
| 16 | `require('../qbank/...')` | API call karo |
| 17 | Parent digest me rank | Progress, not position |
| 18 | Evidence API skip | Black box = no trust |
| 19 | QBank shortage silent | Content team ko roadmap chahiye |
| 20 | Confidence score skip | Kam data pe shor = false alarms |

---

# PART 13 — SUCCESS = DEMO DAY

**7 cheezein. Ye chal gaye to module world-class hai.**

```
1. ⏱ OFFLINE ENTRY
   Stopwatch on. 32 students × 20 questions. Keyboard only.
   Target: under 5 minutes. Submit. Analysis ready in 3 seconds.

2. 🚨 DISTRACTOR INSIGHT
   Analytics kholo. "Q14: 24 bachchon ne option B chuna →
   sign error in factorization. Ye systemic hai."
   → Teacher ka jaw drop.

3. 🎯 ROOT CAUSE
   Aarav ka Ch07 weak. System bole: "Ch07 pe kaam mat karo.
   Ch01 se shuru karo." Tree visualization dikhao.
   → "Ye kaise pata chala?" → Evidence dikhao.

4. 📝 BULK WORKSHEET
   One click. 32 personalized PDFs. Har ek alag.
   Har ek root-targeted. Har ek difficulty-laddered.
   → Print karke dikhao.

5. 🔄 THE LOOP
   Gap detected → worksheet → attempt → retest → CLOSED.
   Timeline dikhao. "18 din me 34% se 78%."

6. 📊 PROGRESS REPORT
   Aarav ka full report. 30 charts. Comparison. Behaviour.
   Coaching note. Next steps.
   → Parent ko dikhao. Wo ro dega ya paisa dega. Dono theek.

7. 💰 RECOVERY STATS
   Principal screen. "1,240 gaps · 892 closed · +23% avg · 1.8 cycles."
   61.3% → 81.33% curve.
   → Pen nikal aayega.
```

---

# PART 14 — WHY THIS IS THE MOAT

```
╔═══════════════════════════════════════════════════════════════╗
║  Copy karne ke liye 4 cheezein chahiye:                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. CURRICULUM PREREQUISITE MAP                               ║
║     Root cause analysis iske bina namumkin hai.               ║
║     Hamare paas: 12 Master Index files, 500+ concepts.        ║
║     Banane me: 2 saal + subject experts.                      ║
║                                                                ║
║  2. DEEPLY TAGGED QUESTION BANK                               ║
║     distractor_reason + misconception tags ke bina            ║
║     "24 students ko sign error ka bharam hai" impossible.     ║
║     Hamare paas: 1,200 questions, badh rahe hain.             ║
║     Banane me: 3-5 saal.                                      ║
║                                                                ║
║  3. THE PEDAGOGY                                              ║
║     Kaunsa gate? Kitna sample? Kaunsi ladder?                 ║
║     Root pehle ya symptom? Rusher ko worksheet ya coaching?   ║
║     Ye 7 saal ka classroom experience hai.                    ║
║     Banane me: ek zindagi.                                    ║
║                                                                ║
║  4. THE LOOP DATA                                             ║
║     Har gap jo band hota hai, system ko sikhata hai.          ║
║     Kaunsi ladder kaam karti hai? Kitne cycles lagte hain?    ║
║     Jitne schools, utna smart. Network effect.                ║
║     Banane me: waqt. Sirf waqt. Aur wo copy nahi hota.        ║
║                                                                ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║   Chaaron mile bina ye module nahi banta.                     ║
║   Chaaron hamare paas hain.                                   ║
║                                                                ║
║   Isliye ye moat hai.                                         ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

# PART 15 — THE ONE-PARAGRAPH PITCH

> **Har school test leta hai. Koi nahi jaanta ki uske baad kya karna hai.**
>
> WISWITS Personalized Learning har test ko ek diagnosis banata hai —
> sirf "61% aaye" nahi, balki "Ch01 me root cause hai, Ch07 to sirf lakshan hai;
> 24 bachchon ko sign error ka bharam hai; Aarav ko aata hai par jaldbaazi karta hai."
>
> Phir wo diagnosis se ilaaj banata hai — automatically. Har bachche ke liye alag
> worksheet, root cause pe targeted, difficulty ladder ke saath. Retest. Gap band.
> Agla gap.
>
> 550 students pe test kiya: **61.3% → 81.33%.**
>
> Ye software nahi hai. Ye ek teacher ka 7 saal ka tajurba hai, jo ab
> 500 bachchon ke saath ek saath kaam kar sakta hai.

---

**Ye module WISWITS ki aatma hai.**
**Baaki 19 modules school chalate hain. Ye module bachche ko badalta hai.**

**Isko perfect banao. 🎯**

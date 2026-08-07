# 🌱 WISWITS APEX OS — STUDENT WELL-BEING & COUNSELLING

## The Complete Specification

| | |
|---|---|
| **Module Key** | `wellbeing` |
| **API Prefix** | `/api/wb` |
| **Codename** | The Care Layer |
| **Team** | 2 interns + AK Sir (every review) + 1 licensed counsellor (advisory) |
| **Duration** | 10 weeks |
| **Difficulty** | ⭐⭐⭐⭐⭐ |
| **Standalone Price** | ₹30k – 80k/yr |
| **Strategic Value** | 🏆 **THE SOUL** — koi Indian school ERP me ye nahi hai |

---

## ⚠️ BEFORE YOU READ FURTHER

**Ye module baaki 19 se alag hai.**

Baaki modules me bug = kaam ruk jaata hai.
**Is module me bug = ek bachche ko nuksaan.**

Agar aap is module pe kaam kar rahe ho, aap sirf developer nahi ho. Aap ek aise system ke custodian ho jo kisi bachche ki sabse kamzor jaankari sambhalega.

Teen cheezein pehle:

```
1. Ye module ka maqsad hai: koi bachcha akela na rahe.
   Feature ginna nahi. Bachcha bachana.

2. Har rule ka ek reason hai. Reason samajh na aaye to pucho.
   Rule tod ke "optimize" mat karna. Har rule kisi ki galti se seekha gaya hai.

3. Agar kabhi confusion ho — "ye feature theek hai ya nahi?" —
   ek sawaal pucho:
   👉 "Agar ye mere chhote bhai/behen ka data hota, tab bhi theek lagta?"
   Jawab "nahi" hai to feature mat banao.
```

---

# PART 0 — THE PHILOSOPHY

## 0.1 Ye Module Kyun Exist Karta Hai

```
   Har saal India me 13,000+ students suicide se marte hain.
   Har ghante ek.

   Har ek ke peeche mahine bhar ke signals the.
   Attendance girti gayi. Marks gire. Doston se door hua.
   Chup ho gaya. Kisi ne dekha nahi.

   Kisi ne dekha nahi — isliye nahi ki kisi ko farq nahi padta.
   Isliye ki kisi ke paas dekhne ka tarika nahi tha.

   ┌────────────────────────────────────────────────────────┐
   │  Ye module wo tarika hai.                              │
   │                                                        │
   │  Ye bachche ko theek nahi karta.                       │
   │  Ye sirf itna karta hai ki ek insaan ko pata chal jaye │
   │  ki kisi ko zaroorat hai.                              │
   │                                                        │
   │  Baaki kaam insaan karega.                             │
   └────────────────────────────────────────────────────────┘
```

## 0.2 The Prime Directive

```
╔═══════════════════════════════════════════════════════════════╗
║                                                                ║
║        YE SURVEILLANCE TOOL NAHI HAI.                          ║
║        YE CARE TOOL HAI.                                       ║
║                                                                ║
║  Har design decision is ek sawaal se guzarna chahiye:          ║
║                                                                ║
║      "Kya isse bachche ko madad milegi,                        ║
║       ya bachche pe nazar rakhi jaayegi?"                      ║
║                                                                ║
║  Agar jawab "nazar" hai — feature mat banao.                   ║
║  Chahe kitna bhi useful lage.                                  ║
║  Chahe school kitna bhi maange.                                ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

**Do systems, ek jaisi tech, bilkul ulta natija:**

| Surveillance System | Care System |
|---|---|
| "Aarav 3 din se udaas hai" → principal ko | "Aarav 3 din se udaas hai" → **sirf counsellor ko** |
| Mood + marks jodo → "udaas bachche fail hote hain" | Mood aur marks **kabhi nahi** jodo |
| Sabse zyada stressed students ki list | Aisi list **exist hi nahi karti** |
| Parent ko roz mood report | Parent ko tab jab **counsellor sahi samjhe** |
| Data hamesha rakho | 365 din, phir **anonymize** |
| Opt-out se attendance pe asar | Opt-out se **kuch nahi hota** |
| "Bachcha depressed hai" | "Bachche ko baat karne ki zaroorat lag rahi hai" |

**Farq tech me nahi hai. Farq niyat me hai. Aur niyat code me likhni padti hai.**

## 0.3 The Five Promises

Ye paanch waade har bachche se hain. Ye code me constants hain, config me nahi. Koi school inhe off nahi kar sakta.

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ WAADA 1 — TUMHARA MOOD TUMHARE MARKS SE KABHI NAHI JUDEGA│
│                                                              │
│  Kyun: Jis din "udaas bachche fail hote hain" wali report    │
│  ban gayi, us din bachche jhoot bolna shuru kar denge.       │
│  Aur jhoota data se bura kuch nahi.                          │
│                                                              │
│  Code: wb_* tables ka client_exam_result/client_fees ke      │
│  saath JOIN — DB level pe blocked. Test suite me check.      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚠️ WAADA 2 — TUMHARA TEACHER TUMHARA MOOD NAHI DEKHEGA      │
│                                                              │
│  Kyun: Teacher achha insaan ho sakta hai. Par jis din        │
│  bachche ko lagega ki uska mood teacher tak jaata hai,       │
│  us din wo sach nahi bolega.                                 │
│                                                              │
│  Code: Teacher API sirf aggregate deta hai, min 5 students,  │
│  koi naam nahi, koi individual nahi. Ever.                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚠️ WAADA 3 — TUMHARI DIARY SIRF TUMHARI HAI                 │
│                                                              │
│  Kyun: Ek jagah honi chahiye jahan bachcha bina dar ke       │
│  likh sake. Wo jagah ye hai.                                 │
│                                                              │
│  Code: AES-256-GCM, per-student key. Counsellor bhi nahi     │
│  padh sakta bina explicit consent ke. DBA bhi nahi.          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚠️ WAADA 4 — YE KABHI SAZA NAHI BANEGA                      │
│                                                              │
│  Kyun: Jis din mood data se discipline chala, us din ye      │
│  module ek hathiyaar ban gaya. Phir ye nahi bachata,         │
│  ye nuksaan karta hai.                                       │
│                                                              │
│  Code: Discipline module se koi FK nahi. Koi API nahi.       │
│  Koi export nahi. Architectural separation.                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚠️ WAADA 5 — TUM KABHI BHI NA KEH SAKTE HO                  │
│                                                              │
│  Kyun: Consent tabhi asli hai jab "na" kehna aasan ho.       │
│  Warna wo majboori hai.                                      │
│                                                              │
│  Code: Opt-out one tap. Data anonymize. Zero penalty.        │
│  Teacher ko pata bhi nahi chalega. Koi reminder nahi.        │
└─────────────────────────────────────────────────────────────┘
```

## 0.4 What This Module Is NOT

```
❌ Ye diagnosis nahi karta.
   Hum "depression" nahi likhenge. Hum "baat karne ki zaroorat" likhenge.
   Diagnosis licensed professional karega. Software nahi.

❌ Ye ilaaj nahi karta.
   Breathing exercise therapy nahi hai. Journal therapy nahi hai.
   Ye pul hai — bachche se insaan tak. Ilaaj insaan karega.

❌ Ye emergency service nahi hai.
   Agar koi khatre me hai, ye system kaafi nahi. Insaan chahiye. Abhi.
   Har screen pe crisis number hona chahiye.

❌ Ye counsellor ki jagah nahi leta.
   Ye counsellor ki aankh hai. Wo 800 bachchon ko ek saath nahi dekh sakta.
   Ye dekh sakta hai, aur bata sakta hai kis pe dhyan chahiye.

❌ Ye bhavishyavani nahi karta.
   "Ye bachcha 3 mahine me depressed hoga" — aisa kabhi nahi.
   Ye sirf batata hai: "abhi kuch alag lag raha hai. dekh lo."
```

## 0.5 The Ethical Compass

Jab bhi koi decision unclear ho, ye order follow karo:

```
1. BACHCHE KI SURAKSHA        ← sabse upar, hamesha
2. BACHCHE KA VISHWAS         ← iske bina suraksha bhi nahi
3. BACHCHE KI NIJTA           ← vishwas ki neev
4. COUNSELLOR KI KSHAMTA      ← usko sahi info, sahi waqt
5. SCHOOL KI ZIMMEDARI        ← unhe jo chahiye, par upar walon ke baad
6. FEATURE COMPLETENESS       ← sabse neeche. Hamesha.
```

**Agar feature 5 ke liye 3 tootta hai — feature mat banao.**

---

# PART 1 — HARDCODED GUARDRAILS

## 1.1 The Constants File

Ye file **kabhi config me nahi jaayegi**. Kabhi environment variable nahi banegi. Kabhi DB se nahi aayegi.

```js
// apps/backend/src/modules/wellbeing/wellbeing.guardrails.js
//
// ⚠️⚠️⚠️ READ THIS BEFORE TOUCHING ANYTHING ⚠️⚠️⚠️
//
// Ye constants nahi hain. Ye waade hain.
//
// Har ek kisi ki galti se seekha gaya hai — kahin, kisi school me,
// kisi bachche ke saath. Hum wo galti dobara nahi karenge.
//
// Ye file me kuch bhi badalna hai to:
//   1. AK Sir ki likhit approval
//   2. Licensed counsellor ki review
//   3. Reason document me likha jaaye
//
// "Client maang raha hai" reason nahi hai.
// "Zyada useful hoga" reason nahi hai.
// "Sirf ek exception" reason nahi hai.
//

const WB_GUARDRAILS = Object.freeze({

  // ═══ PRIVACY ═══════════════════════════════════════════════

  MIN_AGGREGATE_SIZE: 5,
  // 5 se kam students → koi aggregate nahi.
  // Kyun: 3 students ki class me "67% udaas hain" = 2 naam pata chal gaye.
  // Ye privacy ka math hai, opinion nahi.

  NEVER_JOIN_TABLES: Object.freeze([
    'client_exam_result',
    'client_pl_attempt',
    'client_pl_response',
    'client_pl_topic_score',
    'client_pl_weak_area',
    'client_fees',
    'client_fee_ledger',
    'client_discipline',
    'client_hostel_incident',
  ]),
  // Ye tables wb_* ke saath kabhi JOIN nahi honge.
  // Kyun: Mood aur marks jodne se "sad students fail" narrative banta hai.
  // Wo narrative bachche ko blame karta hai, madad nahi.
  // Enforced: DB user grants + query linter + test suite.

  RED_FLAG_VISIBLE_TO: Object.freeze(['counsellor']),
  // Sirf counsellor. Principal bhi nahi. Teacher bhi nahi. Parent bhi nahi.
  // Kyun: Red flag ka matlab hai "koi struggle kar raha hai".
  // Wo information insaan ke haath me honi chahiye jo madad kar sake,
  // us insaan ke haath me nahi jo report maange.

  JOURNAL_VISIBLE_TO: Object.freeze(['student_self']),
  // Sirf likhne wala. Counsellor bhi nahi bina explicit consent ke.
  // Kyun: Ek jagah honi chahiye jahan bachcha bina dar ke sach likh sake.

  PARENT_SEES_INDIVIDUAL_BY_DEFAULT: false,
  // Parent ko individual mood data nahi.
  // Kyun: Kabhi kabhi ghar hi problem hai. Parent ko batana = khatra.
  // Counsellor decide karega, case-by-case, reason likh ke.

  // ═══ RETENTION ═════════════════════════════════════════════

  MOOD_RETENTION_DAYS: 365,
  // 1 saal, phir anonymize.
  // Kyun: Class 8 ka bura daur Class 12 me nahi chipakna chahiye.
  // Bachche badalte hain. Data ko bhi bhoolna chahiye.

  JOURNAL_RETENTION_DAYS: 730,
  // 2 saal. Student khud jab chahe delete kar sakta hai.

  CASE_RETENTION_DAYS: 2555,   // 7 years
  // Legal requirement. Par encrypted + counsellor-only.

  AUDIT_RETENTION_DAYS: 2555,  // 7 years
  // Audit log kabhi delete nahi. Ye accountability hai.

  // ═══ ANTI-HARM ═════════════════════════════════════════════

  NO_RANKING: true,
  // Koi leaderboard nahi. Koi "sabse stressed students" list nahi.
  // Koi comparison nahi. Aisi API exist hi nahi karegi.
  // Kyun: Well-being competition nahi hai.

  NO_PUNISHMENT_LINK: true,
  // Discipline module se koi FK nahi. Koi API nahi. Koi export nahi.
  // Kyun: Jis din mood se saza mili, us din bachcha jhoot bolega.

  NO_PREDICTION: true,
  // Hum "ye bachcha depressed hoga" predict nahi karte.
  // Hum sirf "abhi kuch alag lag raha hai" observe karte hain.
  // Kyun: Prediction labels banata hai. Labels chipak jaate hain.

  NO_DIAGNOSIS: true,
  // Hum kabhi "depression", "anxiety", "ADHD" nahi likhenge.
  // Hum likhenge "baat karne ki zaroorat lag rahi hai".
  // Kyun: Diagnosis licensed professional ka kaam hai. Software ka nahi.
  // Aur ek galat label bachche ke saath saalon chipakta hai.

  // ═══ SIGNAL SAFETY ═════════════════════════════════════════

  ACADEMIC_SIGNAL_MAX_WEIGHT: 15,
  ATTENDANCE_SIGNAL_MAX_WEIGHT: 25,
  ACADEMIC_ALONE_CANNOT_RED: true,
  // Marks girne se akela red flag nahi ban sakta.
  // Max: 25 + 15 = 40 = amber. Red ke liye 60 chahiye.
  // Kyun: Exam ke baad sab ke marks girte hain. Wo crisis nahi hai.
  // Academic pressure ≠ mental health crisis.

  SELF_RAISE_ALWAYS_RED: true,
  // Bachcha khud bole "baat karni hai" → hamesha red, hamesha 24h SLA.
  // Baaki koi signal matter nahi karta.
  // Kyun: Jab bachcha himmat karke bolta hai, wo sabse bada signal hai.

  // ═══ ACCOUNTABILITY ════════════════════════════════════════

  AUDIT_EVERY_READ: true,
  // Har individual data read → audit log. Counsellor bhi. AK Sir bhi.
  // Reason field mandatory.
  // Kyun: Jo bhi dekh sakta hai, uska record hona chahiye.

  RED_FLAG_SLA_HOURS: 24,
  // Red flag → 24 ghante me counsellor contact.
  // Miss hua → escalate.
  // Kyun: "Baad me dekh lenge" is module me nahi chalega.

  MAX_CASELOAD_PER_COUNSELLOR: 40,
  // 40 se zyada open cases → warning.
  // Kyun: Overloaded counsellor = koi counsellor nahi.

  // ═══ CONSENT ═══════════════════════════════════════════════

  OPT_OUT_ALWAYS_AVAILABLE: true,
  OPT_OUT_ZERO_PENALTY: true,
  OPT_OUT_INVISIBLE_TO_STAFF: true,
  // Opt-out kabhi bhi. Ek tap. Koi penalty nahi. Koi ko pata nahi.
  // Kyun: Consent tabhi asli hai jab "na" kehna aasan ho.

  ASSENT_AGE: 13,
  // 13+ → apna assent de sakta hai (mood, journal)
  // 13 se kam → parent consent + child assent dono

  INDEPENDENT_CONSENT_AGE: 16,
  // 16+ → apni marzi, parent ko default nahi bataya jaayega
  // (safety exception ke alawa)

  // ═══ CRISIS ════════════════════════════════════════════════

  CRISIS_KEYWORDS_TRIGGER_IMMEDIATE: true,
  // Kuch shabd = turant. Koi weight nahi. Koi score nahi. Turant.

  CRISIS_ALWAYS_SHOWS_HELPLINE: true,
  // Har screen pe. Hamesha. Chhupa hua nahi.

  CRISIS_OVERRIDES_CONSENT: true,
  // Jaan ka khatra = consent overridden.
  // Ye ek exception hai. Ye legally aur ethically zaroori hai.
  // Par ye log hoga, aur reason likha jaayega.
});

// ═══════════════════════════════════════════════════════════════
// ENFORCEMENT — ye sirf documentation nahi hai
// ═══════════════════════════════════════════════════════════════

// 1. Query linter — har wb_* query check karo
function assertNoBannedJoin(sql) {
  const lower = sql.toLowerCase();
  if (!lower.includes('wb_')) return;

  for (const banned of WB_GUARDRAILS.NEVER_JOIN_TABLES) {
    if (lower.includes(banned.toLowerCase())) {
      throw new GuardrailViolation(
        `FATAL: Attempted to join wb_* with ${banned}.\n` +
        `This violates Waada 1 — mood data never touches academic/financial data.\n` +
        `If you believe this is needed, stop and talk to AK Sir.`
      );
    }
  }
}

// 2. Aggregate guard
function assertAggregateSize(count, context) {
  if (count < WB_GUARDRAILS.MIN_AGGREGATE_SIZE) {
    return { insufficient_data: true, min_required: WB_GUARDRAILS.MIN_AGGREGATE_SIZE };
  }
  return null;
}

// 3. Role guard
function assertCanSeeIndividual(role, actorId, subjectId, reason) {
  if (!WB_GUARDRAILS.RED_FLAG_VISIBLE_TO.includes(role)) {
    throw new Forbidden(
      `Role "${role}" cannot access individual well-being data. ` +
      `Only ${WB_GUARDRAILS.RED_FLAG_VISIBLE_TO.join(', ')} can.`
    );
  }
  if (!reason || reason.trim().length < 10) {
    throw new BadRequest('A reason (min 10 chars) is required to view individual data.');
  }
  // ⚠️ Har read audit hoga
  auditRead({ actorId, subjectId, reason, at: new Date() });
}

// 4. Boot-time self-check — server start nahi hoga agar guardrails toote hain
async function verifyGuardrailsAtBoot() {
  const checks = [
    await verifyNoRankingEndpoints(),
    await verifyNoDisciplineFKs(),
    await verifyDbGrantsExcludeAcademicTables(),
    await verifyJournalEncryptionKeyPresent(),
    await verifyCrisisKeywordListLoaded(),
    await verifyAuditTableWritable(),
  ];

  const failed = checks.filter(c => !c.ok);
  if (failed.length) {
    console.error('╔══════════════════════════════════════════════════╗');
    console.error('║  WELL-BEING GUARDRAIL VIOLATION — REFUSING BOOT  ║');
    console.error('╚══════════════════════════════════════════════════╝');
    failed.forEach(f => console.error(`  ❌ ${f.name}: ${f.reason}`));
    process.exit(1);
  }
}

module.exports = { WB_GUARDRAILS, assertNoBannedJoin, assertAggregateSize,
                   assertCanSeeIndividual, verifyGuardrailsAtBoot };
```

## 1.2 Database-Level Enforcement

Code me guard kaafi nahi. DB level pe bhi lock karo.

```sql
-- ═══ SEPARATE DB USER FOR WELL-BEING ═══════════════════════════
-- Ye user academic/financial tables ko DEKH bhi nahi sakta.
-- Agar koi galti se JOIN likh de, DB error dega. Code ki galti DB pakdegi.

CREATE USER 'wiswits_wb'@'%' IDENTIFIED BY '<strong-secret>';

-- wb_* pe full access
GRANT SELECT, INSERT, UPDATE ON wiswits.wb_% TO 'wiswits_wb'@'%';

-- students table pe sirf minimum columns (view ke through)
CREATE VIEW wb_student_view AS
SELECT id, org_id, class_no, section, gender, dob, admission_date
FROM client_students
WHERE deleted_at IS NULL;
-- ⚠️ NO name in this view for aggregate queries
-- ⚠️ NO marks, NO fees, NO discipline

GRANT SELECT ON wiswits.wb_student_view TO 'wiswits_wb'@'%';

-- ⚠️ EXPLICITLY DENY — ye tables exist hi nahi karte is user ke liye
REVOKE ALL ON wiswits.client_exam_result FROM 'wiswits_wb'@'%';
REVOKE ALL ON wiswits.client_pl_attempt FROM 'wiswits_wb'@'%';
REVOKE ALL ON wiswits.client_pl_response FROM 'wiswits_wb'@'%';
REVOKE ALL ON wiswits.client_fees FROM 'wiswits_wb'@'%';
REVOKE ALL ON wiswits.client_discipline FROM 'wiswits_wb'@'%';

-- ═══ AUDIT TABLE IS APPEND-ONLY ════════════════════════════════

DELIMITER $$
CREATE TRIGGER wb_audit_no_update
BEFORE UPDATE ON wb_access_audit
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'wb_access_audit is append-only. Updates are forbidden.';
END$$

CREATE TRIGGER wb_audit_no_delete
BEFORE DELETE ON wb_access_audit
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
  SET MESSAGE_TEXT = 'wb_access_audit is append-only. Deletes are forbidden.';
END$$
DELIMITER ;
```

## 1.3 The Test That Must Never Pass

```js
// tests/guardrails.critical.test.js
//
// ⚠️ Ye tests fail hone chahiye. Agar pass ho gaye, kuch bahut galat hai.

describe('🚨 GUARDRAILS — these MUST throw', () => {

  it('cannot join wb_pulse with exam results', async () => {
    await expect(
      db.query(`SELECT p.mood, e.marks
                FROM wb_pulse p
                JOIN client_exam_result e ON e.student_id = p.student_id`)
    ).rejects.toThrow(/GuardrailViolation|access denied/i);
  });

  it('cannot join wb_flag with fees', async () => {
    await expect(
      db.query(`SELECT f.severity, fe.amount
                FROM wb_flag f
                JOIN client_fees fe ON fe.student_id = f.student_id`)
    ).rejects.toThrow(/GuardrailViolation|access denied/i);
  });

  it('teacher cannot read individual pulse', async () => {
    const res = await api.get('/api/wb/students/42/context')
                         .set('Authorization', teacherToken);
    expect(res.status).toBe(403);
  });

  it('principal cannot read individual pulse', async () => {
    const res = await api.get('/api/wb/students/42/context')
                         .set('Authorization', principalToken);
    expect(res.status).toBe(403);
  });

  it('parent cannot read child pulse without counsellor share', async () => {
    const res = await api.get('/api/wb/students/42/pulse')
                         .set('Authorization', parentToken);
    expect(res.status).toBe(403);
  });

  it('aggregate with 4 students returns insufficient_data', async () => {
    const res = await api.get('/api/wb/class/tiny-class/pulse-trend')
                         .set('Authorization', teacherToken);
    expect(res.body.data.insufficient_data).toBe(true);
    expect(res.body.data.mood_distribution).toBeUndefined();
  });

  it('no ranking endpoint exists', async () => {
    for (const path of ['/api/wb/rank', '/api/wb/leaderboard',
                        '/api/wb/students/sorted', '/api/wb/most-stressed']) {
      const res = await api.get(path).set('Authorization', counsellorToken);
      expect(res.status).toBe(404);
    }
  });

  it('counsellor read without reason is rejected', async () => {
    const res = await api.get('/api/wb/students/42/context')
                         .set('Authorization', counsellorToken);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reason/i);
  });

  it('counsellor read WITH reason creates audit row', async () => {
    const before = await countAuditRows();
    await api.get('/api/wb/students/42/context?reason=Reviewing red flag from 15 Jul')
             .set('Authorization', counsellorToken);
    const after = await countAuditRows();
    expect(after).toBe(before + 1);
  });

  it('journal is encrypted at rest', async () => {
    await api.post('/api/wb/journal')
             .set('Authorization', studentToken)
             .send({ body: 'UNIQUE_SECRET_STRING_12345' });

    const [row] = await rawDb.query('SELECT body_encrypted FROM wb_journal ORDER BY id DESC LIMIT 1');
    expect(row.body_encrypted).not.toContain('UNIQUE_SECRET_STRING_12345');
    expect(row.body_encrypted).not.toMatch(/UNIQUE/i);
  });

  it('academic signal alone cannot produce red', async () => {
    const score = signalEngine.compute({
      score_drop_20pct: true,
      attendance_absent_3: true,
      // aur kuch nahi
    });
    expect(score.total).toBeLessThan(60);
    expect(score.severity).not.toBe('red');
  });

  it('self-raise always produces red', async () => {
    const score = signalEngine.compute({ self_raise: true });
    expect(score.severity).toBe('red');
  });

  it('audit log cannot be updated', async () => {
    await expect(
      rawDb.query('UPDATE wb_access_audit SET reason = "changed" WHERE id = 1')
    ).rejects.toThrow(/append-only/i);
  });

  it('audit log cannot be deleted', async () => {
    await expect(
      rawDb.query('DELETE FROM wb_access_audit WHERE id = 1')
    ).rejects.toThrow(/append-only/i);
  });

  it('opted-out student produces no data', async () => {
    await api.put('/api/wb/consent').set('Authorization', studentToken)
             .send({ participate: false });
    await api.post('/api/wb/pulse').set('Authorization', studentToken)
             .send({ mood: 'low' });

    const rows = await rawDb.query('SELECT * FROM wb_pulse WHERE student_id = ?', [studentId]);
    expect(rows.length).toBe(0);
  });
});
```

---

# PART 2 — CONSENT & AGE

## 2.1 The Consent Ladder

```
╔═══════════════════════════════════════════════════════════════╗
║  AGE < 13                                                      ║
║  ─────────────────────────────────────────────────────────    ║
║  Parent consent    : REQUIRED                                  ║
║  Child assent      : REQUIRED (simple language)                ║
║  Journal           : ❌ disabled (too young for private space) ║
║  Pulse             : ✅ simple emoji only, no text note        ║
║  Self-raise        : ✅ always available                       ║
║  Parent sees       : counsellor decides, case-by-case          ║
║  Data retention    : 180 days (shorter for young children)     ║
╠═══════════════════════════════════════════════════════════════╣
║  AGE 13–15                                                     ║
║  ─────────────────────────────────────────────────────────    ║
║  Parent consent    : REQUIRED (informed, can withdraw)         ║
║  Child assent      : REQUIRED (can withdraw independently)     ║
║  Journal           : ✅ encrypted, student-only                ║
║  Pulse             : ✅ full, with optional note               ║
║  Self-raise        : ✅ always                                 ║
║  Parent sees       : counsellor decides + logs reason          ║
║  Data retention    : 365 days                                  ║
╠═══════════════════════════════════════════════════════════════╣
║  AGE 16–17                                                     ║
║  ─────────────────────────────────────────────────────────    ║
║  Parent consent    : NOTIFIED, not required                    ║
║  Student consent   : REQUIRED, independent                     ║
║  Journal           : ✅ encrypted, student-only                ║
║  Pulse             : ✅ full                                   ║
║  Self-raise        : ✅ always                                 ║
║  Parent sees       : ⚠️ only with student consent OR safety    ║
║  Data retention    : 365 days                                  ║
╠═══════════════════════════════════════════════════════════════╣
║  AGE 18+                                                       ║
║  ─────────────────────────────────────────────────────────    ║
║  Student consent   : REQUIRED, fully independent               ║
║  Parent sees       : ❌ never, without explicit consent        ║
║                       (safety exception only)                  ║
╠═══════════════════════════════════════════════════════════════╣
║  ⚠️ ALL AGES — SAFETY EXCEPTION                                ║
║  ─────────────────────────────────────────────────────────    ║
║  Jaan ka khatra → consent overridden.                          ║
║  Ye legal + ethical requirement hai.                           ║
║  Par: logged, reason recorded, counsellor decides.             ║
║  Aur bachche ko bataya jaata hai (agar safe ho).               ║
╚═══════════════════════════════════════════════════════════════╝
```

## 2.2 What Consent Actually Says

Ye screen bachche ko dikhega. Ye legal jargon nahi, sach hai.

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│              🌱  Ek Choti Si Baat                        │
│                                                          │
│   Humein pata hai school ka time mushkil ho sakta hai.  │
│   Kabhi achha lagta hai, kabhi nahi.                     │
│                                                          │
│   Hum bas ye chahte hain ki agar kabhi tumhe kisi se    │
│   baat karne ka mann ho, to koi ho.                      │
│                                                          │
│   ─────────────────────────────────────────────────     │
│                                                          │
│   🔒 Ye promise hai — hum tod nahi sakte:               │
│                                                          │
│   ✓ Tumhara mood tumhare marks se KABHI nahi judega     │
│   ✓ Tumhare teacher ko tumhara mood NAHI dikhega        │
│   ✓ Tumhari diary sirf TUMHARI hai — koi nahi padh sakta│
│   ✓ Ye kabhi saza ka zariya NAHI banega                 │
│   ✓ Tum kabhi bhi 'na' keh sakte ho — kuch nahi hoga    │
│                                                          │
│   ─────────────────────────────────────────────────     │
│                                                          │
│   Kaun dekh sakta hai?                                   │
│                                                          │
│   👩‍⚕️ Sirf school counsellor — aur wo bhi tabhi jab    │
│      lage ki tumhe kisi se baat karni chahiye.           │
│      Har baar jab wo dekhega, uska record banega.        │
│                                                          │
│   👨‍🏫 Teacher ko sirf itna: "poori class ka mood kaisa  │
│      hai" — kisi ek ka nahi. Naam kabhi nahi.            │
│                                                          │
│   👨‍👩‍👧 Ghar walon ko tabhi, jab counsellor ko lage ki  │
│      unki madad chahiye. Aur wo pehle tumse poochega.    │
│                                                          │
│   ─────────────────────────────────────────────────     │
│                                                          │
│   ⚠️ Ek exception, aur sirf ek:                          │
│                                                          │
│   Agar kabhi lage ki tum khatre me ho — tab hum          │
│   madad bulayenge. Chahe tum mana karo.                  │
│                                                          │
│   Kyunki tum zaroori ho. Rules se zyada.                 │
│                                                          │
│   ─────────────────────────────────────────────────     │
│                                                          │
│         ┌──────────────┐    ┌──────────────┐            │
│         │  Theek hai   │    │  Abhi nahi   │            │
│         └──────────────┘    └──────────────┘            │
│                                                          │
│    "Abhi nahi" bilkul theek hai. Kabhi bhi badal sakte ho.│
│    Aur kisi ko pata bhi nahi chalega.                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**"Abhi nahi" button utna hi prominent hai jitna "Theek hai". Ye jaanbujh ke hai.**

---

# PART 3 — DATA MODEL

## 3.1 The 18 Tables

```sql
-- ═══════════════════════════════════════════════════════════════
-- ⚠️ SEPARATE SCHEMA. SEPARATE DB USER. SEPARATE GRANTS.
-- Ye tables client_* se architecturally alag hain.
-- ═══════════════════════════════════════════════════════════════

-- ─── CONSENT ────────────────────────────────────────────────────
wb_consent
  id, org_id, student_id,
  participates,                    -- master switch
  age_band,                        -- under_13 | 13_15 | 16_17 | 18_plus
  parent_consent_at, parent_consent_by, parent_consent_token,
  student_assent_at,
  journal_enabled,
  parent_can_see_individual,       -- default FALSE, always
  counsellor_can_read_journal,     -- default FALSE, always
  opted_out_at, opt_out_reason,    -- reason optional, never required
  updated_at

-- ─── DAILY PULSE ────────────────────────────────────────────────
wb_pulse
  id, org_id, student_id,
  date,
  mood,                            -- great | good | okay | low | struggling
  energy_1_5,
  note,                            -- optional, max 200 chars
  context_tags_json,               -- ["exam","friends","home","health","sleep"]
  submitted_at, source             -- app | web | kiosk
  -- ⚠️ TTL 365 days → anonymize (student_id → NULL, keep aggregate)

wb_pulse_aggregate                 -- post-anonymization
  id, org_id, class_no, section, date,
  mood_distribution_json, avg_energy, sample_size, computed_at

-- ─── JOURNAL ────────────────────────────────────────────────────
wb_journal
  id, org_id, student_id,
  body_encrypted,                  -- ⚠️ AES-256-GCM, per-student key
  iv, auth_tag,
  mood_tag,
  shared_with_counsellor,          -- default FALSE
  shared_at, shared_case_id,
  word_count,                      -- for engagement metric only
  created_at, updated_at, deleted_at
  -- ⚠️ Student can delete anytime. Hard delete allowed HERE only.
  -- Kyun: "Meri diary meri hai" ka matlab hai delete bhi kar sakta hoon.

wb_journal_key
  student_id, key_encrypted,       -- wrapped with master KMS key
  created_at, rotated_at

-- ─── ACTIVITIES ─────────────────────────────────────────────────
wb_activity
  id, org_id, content_id,
  type,                            -- breathe | meditate | journal_prompt |
                                   -- gratitude | movement | grounding |
                                   -- sleep | focus | reframe
  title_json, description_json,
  duration_min, age_band, difficulty,
  audio_path, script_json,
  evidence_base,                   -- CBT | mindfulness | DBT | positive_psych
  is_active, +audit

wb_activity_log
  id, org_id, student_id, activity_id,
  started_at, completed_at, helpful_rating,   -- 1-5, optional
  -- ⚠️ Ye data sirf activity improve karne ke liye. Student judge karne ke liye nahi.

-- ─── SIGNALS & FLAGS ────────────────────────────────────────────
wb_signal                          -- raw signals, before scoring
  id, org_id, student_id,
  source,                          -- self_raise | pulse_trend | attendance |
                                   -- academic | teacher_concern | warden_concern |
                                   -- peer_report | counsellor_note | system
  signal_type, weight, detail_json,
  detected_at, expires_at

wb_flag                            -- scored outcome
  id, org_id, student_id,
  severity,                        -- green | amber | red
  score, signals_json,
  primary_driver,                  -- kaunsa signal sabse bhaari tha
  status,                          -- open | acknowledged | in_case | resolved | expired
  opened_at, acknowledged_at, acknowledged_by,
  closed_at, close_reason
  -- ⚠️ RED visible ONLY to counsellor role

-- ─── CASES ──────────────────────────────────────────────────────
wb_case
  id, org_id, student_id, flag_id,
  counsellor_id,
  status,                          -- new | contacted | in_progress | monitoring |
                                   -- referred | closed | escalated
  priority,                        -- routine | soon | urgent | crisis
  opened_at, first_contact_at, sla_due_at, sla_met,
  closed_at, outcome,              -- resolved_internal | referred_external |
                                   -- ongoing_support | no_action_needed |
                                   -- transferred | student_left
  followup_at, followup_done_at,
  parent_looped_in_at, parent_loop_reason,
  +audit

wb_session_note
  id, org_id, case_id,
  body_encrypted, iv, auth_tag,    -- ⚠️ AES-256-GCM, counsellor key
  session_type,                    -- in_person | call | chat | observation | note
  duration_min,
  counsellor_id, at
  -- ⚠️ COUNSELLOR ONLY. Principal nahi. AK Sir nahi. DBA nahi.

wb_referral
  id, org_id, case_id, student_id,
  referred_to,                     -- school_psych | external_therapist |
                                   -- psychiatrist | helpline | ngo | medical
  provider_name, provider_contact,
  reason_encrypted,
  parent_informed_at, parent_consent_at,
  referred_at, outcome, +audit

-- ─── ANONYMOUS REPORTING ────────────────────────────────────────
wb_bullying_report
  id, org_id,
  reporter_hash,                   -- ⚠️ HMAC(student_id + daily_salt) — NOT reversible
  reporter_class_hint,             -- optional, coarse: "Class 9" not "9-A"
  target_hint,                     -- optional, free text
  description_encrypted, iv, auth_tag,
  incident_type,                   -- verbal | physical | social_exclusion |
                                   -- cyber | extortion | discrimination | other
  location_hint, frequency,
  status,                          -- new | reviewing | investigating |
                                   -- action_taken | closed | insufficient_info
  assigned_to, reviewed_at, action_summary,
  created_at
  -- ⚠️ NO IP. NO user_agent. NO device_id. NO session link.
  -- Ye jaanbujh ke hai. Anonymous ka matlab anonymous.

-- ─── STAFF WELL-BEING ───────────────────────────────────────────
wb_staff_check
  id, org_id, staff_id,
  week_start,
  workload_score,                  -- from HRMS event, not direct read
  self_rating_1_5,
  burnout_flag, burnout_signals_json,
  acknowledged_at,
  -- ⚠️ Staff data staff ka hai. Principal ko aggregate only.

-- ─── AUDIT ──────────────────────────────────────────────────────
wb_access_audit                    -- ⚠️ APPEND-ONLY, DB trigger enforced
  id, org_id,
  actor_id, actor_role,
  subject_type,                    -- student | case | journal | flag | report
  subject_id,
  action,                          -- view | list | export | share | note | close
  table_name, reason,              -- ⚠️ MANDATORY, min 10 chars
  ip_hash, at
  -- 7 year retention. Never deleted. Ever.

wb_guardrail_violation             -- ⚠️ agar koi guard toota
  id, org_id, actor_id,
  guardrail, attempted_action,
  query_hash, blocked_at
  -- → immediate alert to AK Sir

-- ─── CRISIS ─────────────────────────────────────────────────────
wb_crisis_event
  id, org_id, student_id,
  trigger,                         -- keyword | self_report | teacher_report |
                                   -- peer_report | counsellor_assessment
  trigger_detail_encrypted,
  severity,                        -- concern | urgent | emergency
  responded_at, responded_by,
  actions_taken_json,
  consent_overridden, override_reason,
  resolved_at, outcome,
  +audit
  -- ⚠️ Ye table sabse sensitive hai. Counsellor + AK Sir only.
```

## 3.2 Journal Encryption — Real Implementation

```js
// wellbeing.crypto.js
//
// ⚠️ Journal = bachche ka sabse private space.
// Agar ye leak hua, module ka bharosa khatam.
// Aur bharosa gaya to bachche jhoot bolenge.
// Aur jhoota data se koi bachcha nahi bachta.

const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

// ─── Per-student key, wrapped with KMS master ───────────────────
async function getStudentKey(student_id) {
  let row = await db.queryOne(
    'SELECT key_encrypted FROM wb_journal_key WHERE student_id = ?', [student_id]
  );

  if (!row) {
    const dek = crypto.randomBytes(32);                    // data encryption key
    const wrapped = await kms.encrypt(dek);                // wrap with master
    await db.query(
      'INSERT INTO wb_journal_key (student_id, key_encrypted, created_at) VALUES (?,?,NOW())',
      [student_id, wrapped]
    );
    return dek;
  }

  return kms.decrypt(row.key_encrypted);
}

async function encryptJournal({ student_id, plaintext }) {
  const key = await getStudentKey(student_id);
  const iv  = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  key.fill(0);   // ⚠️ zero the key in memory

  return { body_encrypted: ct, iv, auth_tag: tag };
}

async function decryptJournal({ student_id, row, actor_id, actor_role, reason }) {
  // ⚠️⚠️ GUARD 1: sirf student khud
  if (actor_role !== 'student' || actor_id !== student_id) {

    // ⚠️ GUARD 2: counsellor tabhi jab student ne EXPLICITLY share kiya
    if (actor_role === 'counsellor' && row.shared_with_counsellor) {
      if (!reason || reason.length < 10) {
        throw new BadRequest('Reason required to read shared journal entry.');
      }
      await auditRead({
        org_id: row.org_id, actor_id, actor_role,
        subject_type: 'journal', subject_id: row.id,
        action: 'view', reason, at: new Date(),
      });
    } else {
      throw new Forbidden(
        'Journal entries are private to the student. ' +
        'Only the student can read them, unless they have explicitly shared with a counsellor.'
      );
    }
  }

  const key = await getStudentKey(student_id);
  const decipher = crypto.createDecipheriv(ALGO, key, row.iv);
  decipher.setAuthTag(row.auth_tag);
  const pt = Buffer.concat([decipher.update(row.body_encrypted), decipher.final()]);

  key.fill(0);

  return pt.toString('utf8');
}

// ─── Anonymous reporter hash ────────────────────────────────────
// ⚠️ Daily rotating salt = same student, different hash each day.
// Ye jaanbujh ke hai. Hum reporter ko trace NAHI kar sakte.
// Ye ek feature hai, bug nahi.
function reporterHash(student_id, org_id) {
  const dailySalt = crypto
    .createHash('sha256')
    .update(`${process.env.WB_REPORT_SALT}:${new Date().toISOString().slice(0,10)}:${org_id}`)
    .digest();

  return crypto.createHmac('sha256', dailySalt)
               .update(String(student_id))
               .digest('hex');
}
```

---

# PART 4 — THE SIGNAL ENGINE

## 4.1 The Design Philosophy

```
╔═══════════════════════════════════════════════════════════════╗
║                                                                ║
║   Ye engine DIAGNOSIS nahi karta.                              ║
║   Ye engine PREDICT nahi karta.                                ║
║   Ye engine DECIDE nahi karta.                                 ║
║                                                                ║
║   Ye engine sirf itna karta hai:                               ║
║                                                                ║
║       "Kuch alag lag raha hai. Ek insaan dekh le."             ║
║                                                                ║
║   Baaki sab insaan karega.                                     ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

**Do galtiyan possible hain:**

```
FALSE POSITIVE  — counsellor ne poocha "sab theek?", bachcha bola "haan"
                  → Cost: 10 minute. Bachche ko laga koi dhyan deta hai.
                  → Ye acceptable hai.

FALSE NEGATIVE  — koi struggle kar raha tha, system ne nahi dekha
                  → Cost: aisi cheez jo hum theek nahi kar sakte.
                  → Ye acceptable NAHI hai.

⭐ Isliye: thresholds sensitive rakho, specific nahi.
   Zyada amber theek hai. Ek miss nahi.
```

## 4.2 The Weights

```js
// wellbeing.signals.js
//
// ⚠️ Ye weights AK Sir + licensed counsellor ne set kiye hain.
// Inhe "tune" mat karo bina unke.
// Har number ke peeche ek reason hai.

const SIGNAL_WEIGHTS = Object.freeze({

  // ═══ TIER 1 — STUDENT'S OWN VOICE ══════════════════════════
  // Jab bachcha khud bolta hai, wo sabse bada signal hai.
  // Isse zyada koi signal nahi ho sakta.

  self_raise: 100,
  // "Mujhe baat karni hai" → hamesha red. Turant.
  // Kyun: Bachche ko himmat lagi hoti hai bolne me.
  //       Us himmat ka jawab intezaar nahi ho sakta.

  crisis_keyword: 100,
  // Kuch shabd = turant. Koi score nahi. Koi weight nahi. Turant.

  journal_concern_flag: 90,
  // Bachcha khud apni journal entry ko "share with counsellor" kare
  // → wo bhi bolna hai, bas alag tarike se.

  // ═══ TIER 2 — HUMAN OBSERVATION ════════════════════════════
  // Insaan ne kuch dekha. Insaan algorithm se behtar hai.

  teacher_concern: 40,
  warden_concern: 40,
  counsellor_observation: 45,
  peer_report: 35,
  // Kyun 40: Ek teacher ka "mujhe ye bachcha alag lag raha hai"
  //          kisi bhi data se zyada valuable hai.
  //          Par akela red nahi banata — insaan bhi galat ho sakta hai.

  // ═══ TIER 3 — PATTERN SIGNALS ══════════════════════════════
  // Mood ka pattern. Ek din nahi, kai din.

  pulse_struggling_1day:  15,
  pulse_low_3days:        30,
  pulse_low_5days:        45,
  pulse_struggling_2days: 50,
  pulse_sudden_drop:      25,   // great/good → low/struggling in 1 day
  pulse_stopped:          20,   // 7 din se check-in nahi kiya (par pehle karta tha)
  // Kyun: Ek din bura sabka hota hai. Pattern matter karta hai.

  // ═══ TIER 4 — BEHAVIOURAL SIGNALS ══════════════════════════
  // ⚠️ Ye hamesha halke rahenge. Hamesha.

  attendance_absent_3:    25,   // ⚠️ MAX 25, hard cap
  attendance_absent_5:    25,   // wahi cap. Isse zyada nahi.
  attendance_pattern_change: 15,
  // Kyun 25: Bachcha bimar ho sakta hai. Bus miss kar sakta hai.
  //          Absence crisis nahi hai. Ye sirf ek clue hai.

  score_drop_20pct:       15,   // ⚠️ MAX 15, hard cap
  score_drop_sustained:   15,   // wahi cap
  // Kyun 15: Exam ke baad sab ke marks girte hain.
  //          Marks girna normal hai. Crisis nahi.
  //          ⚠️ Ye sabse important cap hai. Isse mat badhao.

  // ═══ TIER 5 — WEAK SIGNALS ═════════════════════════════════
  // Context ke liye. Akele bekaar.

  library_pattern_change:  5,
  bus_pattern_change:      5,
  activity_stopped:        8,   // pehle wellness activities karta tha, ab nahi
  social_withdrawal:      10,   // group activities me participation gira
  // Kyun 5-10: Ye sirf tab matter karte hain jab aur signals ho.
});

// ═══ THRESHOLDS ═══════════════════════════════════════════════

const THRESHOLDS = Object.freeze({
  GREEN:  { min: 0,  max: 29,  action: 'none' },
  AMBER:  { min: 30, max: 59,  action: 'gentle_nudge_to_student_only' },
  RED:    { min: 60, max: 999, action: 'counsellor_queue_24h_sla' },
});

// ═══ HARD CAPS ════════════════════════════════════════════════

const CAPS = Object.freeze({
  // ⚠️⚠️ Ye sabse important rule hai poore module me.
  //
  // Attendance (25) + Academics (15) = 40 = AMBER.
  // Red ke liye 60 chahiye.
  //
  // Matlab: sirf attendance aur marks se KABHI red nahi ban sakta.
  //
  // Kyun: Kyunki attendance aur marks se "crisis" declare karna
  //       ek academic surveillance system banata hai, care system nahi.
  //       Aur wo system bachche ko dara dega, bachayega nahi.

  BEHAVIOURAL_MAX_COMBINED: 40,
  ACADEMIC_ALONE_CANNOT_RED: true,
  WEAK_SIGNALS_MAX_COMBINED: 20,
});
```

## 4.3 The Engine

```js
async function computeSignals({ org_id, student_id }) {

  // ─── GATE 0: Consent ────────────────────────────────────────
  const consent = await getConsent({ org_id, student_id });
  if (!consent?.participates) return null;    // opted out = invisible, period

  const signals = [];

  // ═══ TIER 1 — STUDENT'S VOICE ═════════════════════════════

  const selfRaise = await getRecentSelfRaise({ org_id, student_id, days: 7 });
  if (selfRaise) {
    signals.push({ source: 'self_raise', weight: SIGNAL_WEIGHTS.self_raise,
                   detail: { raised_at: selfRaise.at, message: selfRaise.message } });
  }

  const journalFlag = await getSharedJournalFlag({ org_id, student_id, days: 7 });
  if (journalFlag) {
    signals.push({ source: 'journal_concern_flag',
                   weight: SIGNAL_WEIGHTS.journal_concern_flag,
                   detail: { shared_at: journalFlag.at } });
  }

  // ═══ TIER 2 — HUMAN OBSERVATION ═══════════════════════════

  const concerns = await getHumanConcerns({ org_id, student_id, days: 14 });
  for (const c of concerns) {
    signals.push({ source: c.source, weight: SIGNAL_WEIGHTS[c.source] || 30,
                   detail: { by_role: c.role, note: c.note, at: c.at } });
  }

  // ═══ TIER 3 — PULSE PATTERNS ══════════════════════════════

  const pulses = await getRecentPulses({ org_id, student_id, days: 14 });
  const pattern = analyzePulsePattern(pulses);

  if (pattern.struggling_streak >= 2) {
    signals.push({ source: 'pulse_struggling_2days',
                   weight: SIGNAL_WEIGHTS.pulse_struggling_2days,
                   detail: pattern });
  } else if (pattern.low_streak >= 5) {
    signals.push({ source: 'pulse_low_5days',
                   weight: SIGNAL_WEIGHTS.pulse_low_5days, detail: pattern });
  } else if (pattern.low_streak >= 3) {
    signals.push({ source: 'pulse_low_3days',
                   weight: SIGNAL_WEIGHTS.pulse_low_3days, detail: pattern });
  }

  if (pattern.sudden_drop) {
    signals.push({ source: 'pulse_sudden_drop',
                   weight: SIGNAL_WEIGHTS.pulse_sudden_drop, detail: pattern });
  }

  // ⭐ Chup ho jaana bhi ek signal hai
  if (pattern.stopped_checking_in && pattern.was_regular) {
    signals.push({ source: 'pulse_stopped',
                   weight: SIGNAL_WEIGHTS.pulse_stopped,
                   detail: { last_checkin: pattern.last_checkin } });
  }

  // ═══ TIER 4 — BEHAVIOURAL (capped) ════════════════════════

  let behaviouralScore = 0;

  // ⚠️ Attendance event se aata hai, DB read se nahi
  const attendanceSignal = await getAttendanceSignal({ org_id, student_id });
  if (attendanceSignal?.unexplained_absent_days >= 3) {
    const w = Math.min(SIGNAL_WEIGHTS.attendance_absent_3,
                       SIGNAL_WEIGHTS.attendance_absent_3);   // hard cap
    behaviouralScore += w;
    signals.push({ source: 'attendance', weight: w,
                   detail: { days: attendanceSignal.unexplained_absent_days } });
  }

  // ⚠️ Academic event se aata hai, PL DB se nahi. Ye Waada 1 hai.
  const academicSignal = await getAcademicSignal({ org_id, student_id });
  if (academicSignal?.sudden_drop) {
    const w = Math.min(SIGNAL_WEIGHTS.score_drop_20pct,
                       WB_GUARDRAILS.ACADEMIC_SIGNAL_MAX_WEIGHT);
    behaviouralScore += w;
    signals.push({ source: 'academic', weight: w,
                   detail: { note: 'Recent performance change noted' } });
    // ⚠️ Detail me marks NAHI. "performance change" bas.
    //    Counsellor ko marks nahi chahiye. Context chahiye.
  }

  // ⚠️⚠️ THE MOST IMPORTANT CAP IN THIS MODULE
  if (behaviouralScore > CAPS.BEHAVIOURAL_MAX_COMBINED) {
    behaviouralScore = CAPS.BEHAVIOURAL_MAX_COMBINED;
  }

  // ═══ TIER 5 — WEAK (capped) ═══════════════════════════════

  let weakScore = 0;
  const weakSignals = await getWeakSignals({ org_id, student_id });
  for (const w of weakSignals) {
    weakScore += SIGNAL_WEIGHTS[w.type] || 5;
    signals.push({ source: w.type, weight: SIGNAL_WEIGHTS[w.type] || 5, detail: w });
  }
  weakScore = Math.min(weakScore, CAPS.WEAK_SIGNALS_MAX_COMBINED);

  // ═══ SCORE ════════════════════════════════════════════════

  const tier12Score = signals
    .filter(s => ['self_raise','crisis_keyword','journal_concern_flag',
                  'teacher_concern','warden_concern','counsellor_observation',
                  'peer_report'].includes(s.source))
    .reduce((a, s) => a + s.weight, 0);

  const tier3Score = signals
    .filter(s => s.source.startsWith('pulse_'))
    .reduce((a, s) => a + s.weight, 0);

  const total = tier12Score + tier3Score + behaviouralScore + weakScore;

  // ═══ SEVERITY ═════════════════════════════════════════════

  let severity;
  if (signals.some(s => s.source === 'self_raise' || s.source === 'crisis_keyword')) {
    severity = 'red';                         // ⭐ always, no exceptions
  } else if (total >= THRESHOLDS.RED.min) {
    // ⚠️ FINAL SAFETY CHECK
    // Kya ye red sirf behavioural+weak se ban raha hai?
    const nonBehavioural = tier12Score + tier3Score;
    if (nonBehavioural === 0 && CAPS.ACADEMIC_ALONE_CANNOT_RED) {
      severity = 'amber';                     // downgrade — academic alone never red
    } else {
      severity = 'red';
    }
  } else if (total >= THRESHOLDS.AMBER.min) {
    severity = 'amber';
  } else {
    severity = 'green';
  }

  const primaryDriver = signals.length
    ? signals.sort((a,b) => b.weight - a.weight)[0].source
    : null;

  return { total, severity, signals, primary_driver: primaryDriver,
           computed_at: new Date() };
}

// ─── Pattern analysis ───────────────────────────────────────────
function analyzePulsePattern(pulses) {
  const sorted = pulses.sort((a,b) => new Date(b.date) - new Date(a.date));
  const rank = { great: 5, good: 4, okay: 3, low: 2, struggling: 1 };

  let lowStreak = 0, strugglingStreak = 0;
  for (const p of sorted) {
    if (p.mood === 'struggling') { strugglingStreak++; lowStreak++; }
    else if (p.mood === 'low')   { strugglingStreak = 0; lowStreak++; }
    else break;
  }

  const suddenDrop = sorted.length >= 2 &&
                     rank[sorted[1].mood] >= 4 && rank[sorted[0].mood] <= 2;

  const lastCheckin  = sorted[0]?.date;
  const daysSince    = lastCheckin ? daysBetween(lastCheckin, new Date()) : 999;
  const wasRegular   = pulses.length >= 5;   // pehle regularly karta tha

  return {
    low_streak: lowStreak,
    struggling_streak: strugglingStreak,
    sudden_drop: suddenDrop,
    stopped_checking_in: daysSince >= 7,
    was_regular: wasRegular,
    last_checkin: lastCheckin,
    avg_energy: mean(pulses.map(p => p.energy_1_5)),
  };
}
```

## 4.4 The Crisis Path — Bypasses Everything

```js
// wellbeing.crisis.js
//
// ⚠️⚠️⚠️ Ye code ka sabse important hissa hai.
// Ye kisi ki jaan bacha sakta hai.
// Isko simple rakho. Isko fast rakho. Isko fail-safe rakho.
//
// Agar doubt ho — ZYADA respond karo, kam nahi.

const CRISIS_KEYWORDS = Object.freeze({
  // ⚠️ Ye list licensed counsellor ne banayi hai.
  // Isme kuch add/remove karna hai to unse pucho.
  // Regex nahi. Exact phrase match + fuzzy. False positive theek hai.

  immediate: [
    // English
    'kill myself', 'end my life', 'want to die', 'suicide',
    'not worth living', 'better off dead', 'end it all',
    'no reason to live', 'cant go on', "can't go on",
    'goodbye forever', 'last message',
    // Hindi
    'मरना चाहता', 'मरना चाहती', 'खुदकुशी', 'आत्महत्या',
    'जीना नहीं चाहता', 'जीना नहीं चाहती', 'खत्म कर दूं',
    // Hinglish
    'marna chahta', 'marna chahti', 'khudkushi', 'jeena nahi chahta',
    'khatam kar du', 'jeene ka mann nahi',
  ],

  urgent: [
    'hurt myself', 'cut myself', 'self harm', 'cutting',
    'starve myself', 'not eating', 'stopped eating',
    'nobody cares', 'no one would notice', 'everyone hates me',
    'cant take it', "can't take it", 'too much pain',
    'खुद को नुकसान', 'खुद को चोट', 'कोई परवाह नहीं',
    'khud ko nuksan', 'koi parwah nahi', 'bardaasht nahi',
  ],

  concern: [
    'hopeless', 'worthless', 'burden', 'trapped', 'empty',
    'alone', 'nobody understands', 'tired of everything',
    'निराश', 'बेकार', 'बोझ', 'अकेला', 'अकेली', 'थक गया',
    'nirash', 'bekaar', 'bojh', 'akela', 'thak gaya',
  ],
});

async function scanForCrisis({ org_id, student_id, text, source }) {
  if (!text) return null;

  const lower = text.toLowerCase().trim();

  // ⚠️ Order matters. Check immediate first.
  for (const [level, phrases] of [['immediate', CRISIS_KEYWORDS.immediate],
                                  ['urgent',    CRISIS_KEYWORDS.urgent],
                                  ['concern',   CRISIS_KEYWORDS.concern]]) {
    for (const phrase of phrases) {
      if (lower.includes(phrase.toLowerCase())) {
        return triggerCrisis({ org_id, student_id, level, phrase, source, text });
      }
    }
  }
  return null;
}

async function triggerCrisis({ org_id, student_id, level, phrase, source, text }) {

  // ═══ 1. LOG IT (encrypted) ════════════════════════════════
  const event = await createCrisisEvent({
    org_id, student_id,
    trigger: 'keyword', trigger_detail: text,
    severity: level === 'immediate' ? 'emergency'
            : level === 'urgent'    ? 'urgent'
            : 'concern',
    matched_phrase: phrase, source,
  });

  // ═══ 2. IMMEDIATE FLAG (bypass scoring entirely) ═══════════
  await createFlag({
    org_id, student_id, severity: 'red', score: 100,
    signals_json: [{ source: 'crisis_keyword', weight: 100, level }],
    primary_driver: 'crisis_keyword',
  });

  // ═══ 3. CASE (highest priority) ═══════════════════════════
  const caseRow = await createCase({
    org_id, student_id, flag_id: event.flag_id,
    priority: level === 'immediate' ? 'crisis' : 'urgent',
    sla_due_at: level === 'immediate' ? addMinutes(new Date(), 15)
              : level === 'urgent'    ? addHours(new Date(), 2)
              : addHours(new Date(), 24),
  });

  // ═══ 4. ALERT (all channels, immediately) ═════════════════
  if (level === 'immediate') {
    // ⚠️⚠️ Ye ek insaan ko turant chahiye. Sab channel pe.
    await alertCounsellor({ org_id, case_id: caseRow.id,
                            channels: ['push','sms','call','email'],
                            priority: 'CRISIS' });

    // Counsellor 5 min me respond nahi kiya → principal
    await scheduleEscalation({ case_id: caseRow.id, after_min: 5,
                               to: 'principal' });

    // Principal 10 min me respond nahi kiya → AK Sir + emergency contact
    await scheduleEscalation({ case_id: caseRow.id, after_min: 10,
                               to: 'platform_owner' });

  } else if (level === 'urgent') {
    await alertCounsellor({ org_id, case_id: caseRow.id,
                            channels: ['push','sms'], priority: 'URGENT' });
    await scheduleEscalation({ case_id: caseRow.id, after_min: 120, to: 'principal' });

  } else {
    await alertCounsellor({ org_id, case_id: caseRow.id,
                            channels: ['push'], priority: 'HIGH' });
  }

  // ═══ 5. THE STUDENT SEES SOMETHING — IMMEDIATELY ══════════
  // ⚠️ Ye sabse important hai.
  // Bachche ne abhi abhi kuch bahut mushkil likha hai.
  // Usko turant kuch dikhna chahiye jo kahe: "tum akele nahi ho".
  // Wo screen kabhi khali nahi honi chahiye.

  return {
    show_support_screen: true,
    level,
    helplines: await getHelplines(org_id),
    message: crisisMessage(level),
    counsellor_notified: true,
  };
}

function crisisMessage(level) {
  if (level === 'immediate') {
    return {
      title: 'Ruko. Ek minute.',
      body: 'Jo tumne likha, wo humne padha. Aur hum yahin hain.\n\n' +
            'Abhi is waqt tum akele nahi ho. School ki counsellor ko pata chal gaya hai, ' +
            'wo tumse baat karengi.\n\n' +
            'Agar abhi is waqt bahut mushkil lag raha hai, neeche wale number pe call karo. ' +
            'Koi 24 ghante hai. Bas sunne ke liye.\n\n' +
            'Tum zaroori ho. Ye baat sach hai, chahe abhi aisa na lage.',
      show_helpline: true,
      show_breathe: true,
      cta: 'Kisi se abhi baat karo',
    };
  }
  if (level === 'urgent') {
    return {
      title: 'Hum yahan hain',
      body: 'Lagta hai kuch bahut bhaari chal raha hai.\n\n' +
            'School ki counsellor se baat kar lo? Wo sunengi, judge nahi karengi. ' +
            'Aur kisi ko nahi bataayengi bina tumse poochhe.\n\n' +
            'Ya abhi kisi se baat karni hai to neeche number hai.',
      show_helpline: true,
      cta: 'Counsellor se milna hai',
    };
  }
  return {
    title: 'Sab theek hai?',
    body: 'Agar kabhi baat karne ka mann ho, hum yahan hain.\n' +
          'Koi jaldi nahi. Jab chaho.',
    show_helpline: true,
    cta: 'Baat karni hai',
  };
}
```

---

# PART 5 — WHAT THE STUDENT SEES

## 5.1 ⭐⭐ The Daily Pulse — 10 Seconds

**Ye screen module ka chehra hai. Agar ye clinical laga, koi use nahi karega.**

```
┌───────────────────────────────────────────┐
│                                            │
│                                            │
│           आज कैसा लग रहा है?               │
│         How are you feeling today?         │
│                                            │
│                                            │
│    😄       🙂       😐       😔       😰  │
│                                            │
│   Great    Good     Okay     Low   Struggling│
│  मस्त      ठीक     चलता है  उदास   मुश्किल  │
│                                            │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  Kuch kehna hai? (zaroori nahi)  │    │
│   │                                   │    │
│   └──────────────────────────────────┘    │
│                                            │
│                                            │
│         ┌──────────────────┐               │
│         │      Submit      │               │
│         └──────────────────┘               │
│                                            │
│              Skip today →                  │
│                                            │
│  ─────────────────────────────────────    │
│                                            │
│  🔒 Ye sirf tumhare liye hai.              │
│     Koi teacher nahi dekhega.              │
│                                            │
└───────────────────────────────────────────┘
```

**Design rules — non-negotiable:**

```
✅ 10 second. Zyada nahi. Ek tap = done.
✅ Bilingual, dono barabar. Hindi chhoti nahi.
✅ "Skip today" prominent. Guilt zero.
✅ Note optional. Placeholder me "zaroori nahi" likha hai.
✅ Privacy note har baar. Har baar. Bhoolne mat do.
✅ Warm colours. Clinical nahi.
✅ 44×44px touch targets minimum.

❌ No streak counter yahan. (Guilt banata hai)
❌ No "you missed 3 days" reminder. (Shaming)
❌ No emoji ke saath number/score.
❌ No "how are you REALLY feeling" (pressure)
❌ No mandatory note.
❌ No progress bar ("2 of 5 questions") — ye survey nahi hai.
```

**Agar "struggling" chuna:**

```
┌───────────────────────────────────────────┐
│                                            │
│              😰  Samajh sakte hain         │
│                                            │
│    Mushkil din hote hain. Ye normal hai.   │
│                                            │
│    Kuch madad chahiye?                     │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  🫁  2 minute saans lete hain     │    │
│   └──────────────────────────────────┘    │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  💬  Counsellor se baat karni hai │    │
│   └──────────────────────────────────┘    │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  📔  Diary me likhna hai          │    │
│   └──────────────────────────────────┘    │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  Bas aaj ke liye itna hi          │    │
│   └──────────────────────────────────┘    │
│                                            │
│  ─────────────────────────────────────    │
│  Agar abhi bahut mushkil hai:              │
│  📞 Tele-MANAS · 14416 · 24×7 · free       │
│                                            │
└───────────────────────────────────────────┘
```

**"Bas aaj ke liye itna hi" — ye option hona chahiye.** Har bachcha madad nahi maangna chahta. Aur wo bhi theek hai.

## 5.2 ⭐⭐ The Journal — Sacred Space

```
┌───────────────────────────────────────────┐
│  📔  Meri Diary               🔒 Private  │
├───────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │                                       │ │
│  │  Aaj ka din...                        │ │
│  │                                       │ │
│  │                                       │ │
│  │                                       │ │
│  │                                       │ │
│  │                                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  💡 Kuch likhne ka mann nahi? Try:         │
│  ┌──────────────────────────────────────┐ │
│  │ Aaj ki ek achhi baat kya thi?        │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │ Kya cheez bhaari lag rahi hai?       │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │ Kis baat ke liye shukriya kehna hai? │ │
│  └──────────────────────────────────────┘ │
│                                            │
│         ┌──────────────────┐               │
│         │      Save        │               │
│         └──────────────────┘               │
│                                            │
│  ─────────────────────────────────────    │
│                                            │
│  🔒 Ye sirf tumhari hai.                   │
│     Koi teacher nahi padh sakta.           │
│     Counsellor bhi nahi.                   │
│     Hum bhi nahi.                          │
│                                            │
│  Agar kabhi chaho, tum counsellor ke saath │
│  koi entry share kar sakte ho. Par wo      │
│  tumhara faisla hoga. Sirf tumhara.        │
│                                            │
│  [ 🗑 Delete this entry ]                   │
│                                            │
└───────────────────────────────────────────┘
```

**"Hum bhi nahi" — ye sach hai. AES-256, per-student key. Hum literally nahi padh sakte.**

**Delete button prominent hai.** Kyunki "meri diary" ka matlab hai delete bhi kar sakta hoon. Ye module ki ek jagah hai jahan hard delete allowed hai.

## 5.3 ⭐⭐⭐ "I Want To Talk" — The Bravest Button

```
┌───────────────────────────────────────────┐
│                                            │
│                                            │
│              💬                            │
│                                            │
│         Kisi se baat karni hai?            │
│                                            │
│   Koi wajah batane ki zaroorat nahi.       │
│   Bas itna kaafi hai ki tum yahan aaye.    │
│                                            │
│  ─────────────────────────────────────    │
│                                            │
│   Kya likhna hai? (bilkul optional)        │
│  ┌──────────────────────────────────────┐ │
│  │                                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│   Kab milna chahoge?                       │
│   ○ Jaldi se jaldi                         │
│   ○ Is hafte kabhi bhi                     │
│   ○ Pata nahi, bas baat karni hai          │
│                                            │
│   Kaise?                                   │
│   ○ Milke                                  │
│   ○ Phone pe                               │
│   ○ Chat pe                                │
│                                            │
│         ┌──────────────────┐               │
│         │   Bhej do        │               │
│         └──────────────────┘               │
│                                            │
│  ─────────────────────────────────────    │
│                                            │
│  Kya hoga:                                 │
│  · Counsellor ko pata chalega              │
│  · 24 ghante me wo tumse contact karengi   │
│  · Kisi aur ko nahi bataya jaayega         │
│  · Tum kabhi bhi cancel kar sakte ho       │
│                                            │
│  📞 Abhi bahut mushkil hai?                │
│     Tele-MANAS · 14416 · free · 24×7       │
│                                            │
└───────────────────────────────────────────┘
```

**Submit ke baad:**

```
┌───────────────────────────────────────────┐
│                                            │
│                  ✓                         │
│                                            │
│           Mil gaya. Shukriya.              │
│                                            │
│   Yahan aana himmat ka kaam hai.           │
│                                            │
│   Counsellor ko pata chal gaya hai.        │
│   Wo 24 ghante me tumse baat karengi.      │
│                                            │
│   Tab tak, agar kuch chahiye:              │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  🫁  Saans lene ka exercise       │    │
│   └──────────────────────────────────┘    │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │  📞  Abhi kisi se baat karo       │    │
│   └──────────────────────────────────┘    │
│                                            │
│  ─────────────────────────────────────    │
│                                            │
│   Mann badal gaya? [ Cancel request ]      │
│                                            │
└───────────────────────────────────────────┘
```

**"Yahan aana himmat ka kaam hai." — ye line matter karti hai.** Bachche ko lagna chahiye ki usne kuch sahi kiya, kamzori nahi dikhayi.

## 5.4 The Activities Library

```
┌───────────────────────────────────────────┐
│  🌱  Kuch Aasan Cheezein                   │
├───────────────────────────────────────────┤
│                                            │
│  Abhi kaisa lag raha hai?                  │
│  ┌────────┬────────┬────────┬────────┐    │
│  │ 😰     │ 😔     │ 😤     │ 😴     │    │
│  │Ghabrahat│ Udaasi │ Gussa  │ Thakan │    │
│  └────────┴────────┴────────┴────────┘    │
│                                            │
│  ─────────────────────────────────────    │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  🫁  4-7-8 Saans                 2min│ │
│  │  Ghabrahat kam karne ke liye          │ │
│  │  ★★★★☆ 1,240 baar use hua            │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  🌍  5-4-3-2-1 Grounding          3min│ │
│  │  Jab dimaag bhaag raha ho              │ │
│  │  ★★★★★ 890 baar use hua               │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  🙏  3 Shukriya                   2min│ │
│  │  Din ke ant me                         │ │
│  │  ★★★★☆ 2,100 baar use hua             │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  💭  Soch Badlo                   5min│ │
│  │  Jab ek hi baat dimaag me ghoome       │ │
│  │  ★★★★☆ 560 baar use hua               │ │
│  └──────────────────────────────────────┘ │
│                                            │
└───────────────────────────────────────────┘
```

**Ye ratings sirf activities improve karne ke liye hain. Student ko judge karne ke liye nahi.**

---

# PART 6 — WHAT THE TEACHER SEES

## 6.1 The Rule

```
╔═══════════════════════════════════════════════════════════════╗
║                                                                ║
║   TEACHER KABHI KISI EK BACHCHE KA MOOD NAHI DEKHEGA.          ║
║                                                                ║
║   Kabhi. Ek baar bhi. Kisi bhi haal me.                        ║
║                                                                ║
║   Kyun:                                                        ║
║   Teacher achha insaan ho sakta hai. Zyadatar hote hain.       ║
║   Par jis din bachche ko lagega ki uska mood teacher tak       ║
║   jaata hai — us din wo sach nahi bolega.                      ║
║                                                                ║
║   Aur jhoote data se koi bachcha nahi bachta.                  ║
║                                                                ║
║   Teacher ko chahiye: "meri class kaisi hai"                   ║
║   Teacher ko NAHI chahiye: "Aarav udaas hai"                   ║
║                                                                ║
║   Agar Aarav ko madad chahiye, wo counsellor ka kaam hai.      ║
║   Teacher ka kaam hai class ka mahaul theek rakhna.            ║
║   Dono zaroori hain. Dono alag hain.                           ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

## 6.2 Class Mood Board — Aggregate Only

```
┌─────────────────────────────────────────────────────────────┐
│  Class 10-A · Mood This Week                                 │
│  32 students · 28 checked in (88%)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   😄 Great        ████████              8                    │
│   🙂 Good         ████████████         12                    │
│   😐 Okay         ██████                6                    │
│   😔 Low          ██                    2                    │
│   😰 Struggling   ░                     —                    │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│   Trend (last 4 weeks)                                       │
│                                                              │
│    Good ┤ ●───●                                              │
│         │      ╲                                             │
│    Okay ┤       ●───●                                        │
│         │                                                    │
│     Low ┤                                                    │
│         └───┬───┬───┬───┬                                    │
│            W1  W2  W3  W4                                    │
│                                                              │
│   💡 Class ka mood pichle 2 hafte se thoda neeche hai.       │
│      Ho sakta hai exam ka pressure ho.                       │
│                                                              │
│      Ek circle time session help kar sakta hai?              │
│                                                              │
│      [ 📖 Circle Time Kits dekho ]                           │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔒 Ye poori class ka data hai.                              │
│     Kisi ek bachche ka mood aapko nahi dikhega —             │
│     ye jaanbujh ke hai.                                      │
│                                                              │
│     Agar kisi bachche ki chinta hai, aap counsellor ko       │
│     bata sakte hain. Wo dekh lenge.                          │
│                                                              │
│     [ 💬 Counsellor ko batao ]                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Agar class me 5 se kam students hain:**

```
┌─────────────────────────────────────────────────────────────┐
│  Class 12-C · Mood This Week                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    🔒                                        │
│                                                              │
│         Is class me sirf 4 students hain.                     │
│                                                              │
│    Itni chhoti class me aggregate dikhane se                 │
│    kisi ek bachche ka mood pata chal sakta hai.              │
│                                                              │
│    Isliye hum ye data nahi dikhate.                          │
│                                                              │
│    Ye unki privacy hai. Ye zaroori hai.                       │
│                                                              │
│    Agar kisi bachche ki chinta hai:                          │
│    [ 💬 Counsellor ko batao ]                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Ye screen bhi ek message deti hai — teacher ko dikh raha hai ki system serious hai privacy ke baare me.**

## 6.3 ⭐ Raise a Concern

**Teacher ka sabse valuable contribution — algorithm se behtar.**

```
┌─────────────────────────────────────────────────────────────┐
│  💬  Counsellor ko batao                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Aap roz bachchon ko dekhte hain. Aapki nazar               │
│  kisi bhi algorithm se behtar hai.                           │
│                                                              │
│  Agar kuch alag laga — bata dijiye. Chhoti si baat bhi.      │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Kis bachche ke baare me?                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🔍 Aarav Sharma · 10-A                          ✓  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Kya dekha? (jo bhi laga, likh dijiye)                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Pichle 2 hafte se class me bilkul chup hai.        │     │
│  │ Pehle bahut participate karta tha. Lunch me bhi     │     │
│  │ akela baithta hai. Kal aankhein laal thi.           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Kitni jaldi lagta hai?                                      │
│  ○ Bas dhyan rakhne layak                                    │
│  ● Is hafte dekh lein                                        │
│  ○ Jaldi dekhna chahiye                                      │
│  ○ 🚨 Abhi — mujhe darr lag raha hai                         │
│                                                              │
│         ┌──────────────────┐                                 │
│         │    Bhej do       │                                 │
│         └──────────────────┘                                 │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔒 Kya hoga:                                                │
│  · Sirf counsellor ko jaayega                                │
│  · Bachche ko nahi pata chalega ki aapne bataya              │
│  · Ye discipline record nahi hai                             │
│  · Aapko outcome nahi bataya jaayega (privacy)               │
│                                                              │
│  💚 Shukriya. Aapka dhyan dena hi bahut hai.                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**"Aapko outcome nahi bataya jaayega" — ye jaanbujh ke hai.** Teacher ko pata nahi chalega ki us bachche ka kya hua. Wo bachche ki privacy hai. Teacher ka kaam tha batana — wo ho gaya.

## 6.4 Circle Time Kits

```
┌─────────────────────────────────────────────────────────────┐
│  📖  Circle Time Kits                                        │
│  Class ke saath 20 minute · Koi training nahi chahiye        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  😰  Exam Se Pehle                          20 min │     │
│  │  Pressure ke baare me baat karna                    │     │
│  │  Class 8-12 · 1,200 schools ne use kiya            │     │
│  │  ★★★★★                                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  🤝  Dosti Aur Ladai                        20 min │     │
│  │  Rishte, jhagde, sulah                              │     │
│  │  Class 6-10                                         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  📱  Phone Aur Neend                        20 min │     │
│  │  Screen time, sleep, dimaag                         │     │
│  │  Class 8-12                                         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  💪  Naakaamyabi                            20 min │     │
│  │  Fail hona, phir uthna                              │     │
│  │  Class 9-12                                         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Ek kit ka andar:**

```
┌─────────────────────────────────────────────────────────────┐
│  😰  EXAM SE PEHLE · 20 minute                               │
│                                                              │
│  ⚠️ Pehle padh lein:                                         │
│  Aap counsellor nahi hain. Aur banne ki zaroorat bhi nahi.   │
│  Aapka kaam sirf ek safe jagah banana hai jahan bachche      │
│  bol sakein. Bas.                                            │
│                                                              │
│  Agar kuch aisa aaye jo bhaari lage — sunein, judge na       │
│  karein, aur baad me counsellor ko bata dein.                │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ⏱ 0-2 min · Shuruaat                                        │
│  Circle me baitho. Phone side me.                            │
│  Bolo: "Aaj marks ki baat nahi karenge. Sirf feelings ki."   │
│                                                              │
│  ⏱ 2-5 min · Warm up                                         │
│  "Ek shabd me batao — exam ka naam sunte hi kya feel hota?"  │
│  Har bachcha ek shabd. Pass bhi kar sakte hain.              │
│  ⚠️ Aap bhi apna shabd bolein. Pehle. Isse safe lagta hai.   │
│                                                              │
│  ⏱ 5-12 min · Asli baat                                      │
│  Puchein (koi pressure nahi, jo bolna chahe bole):           │
│  · "Exam se pehle sabse mushkil kya lagta hai?"              │
│  · "Kaun kehta hai ki 'relax karo'? Kaam karta hai?"         │
│  · "Kisi ne kabhi aisa mehsoos kiya ki sab handle kar rahe   │
│     hain, sirf main nahi?"                                   │
│                                                              │
│  ⚠️ Jab koi bole — sirf sunein. "Aisa mat socho" mat kahein. │
│     "Samajh sakta hoon" kaafi hai.                           │
│                                                              │
│  ⏱ 12-17 min · Ek cheez jo kaam karti hai                    │
│  Sabko sikhao: 4-7-8 saans                                   │
│  · 4 second saans andar                                      │
│  · 7 second roko                                             │
│  · 8 second bahar                                            │
│  · 3 baar                                                    │
│  Bolo: "Exam hall me bhi kar sakte ho. Koi dekhega nahi."    │
│                                                              │
│  ⏱ 17-20 min · Band karna                                    │
│  Bolo: "Ghabrana normal hai. Iska matlab tumhe farq padta    │
│  hai. Aur agar kabhi zyada ho jaye — counsellor hain. Ya     │
│  mujhse bhi bol sakte ho."                                   │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🚩 Agar ye dikhe, counsellor ko batayein:                   │
│  · Koi bole ki "mann karta hai sab khatam ho jaye"           │
│  · Koi ro pade aur ruk na paye                               │
│  · Koi kahe ki ghar pe bahut pressure hai                    │
│  · Koi bilkul chup rahe jab sab bol rahe hon                 │
│                                                              │
│  [ 💬 Counsellor ko batao ]                                  │
│                                                              │
│  ❌ Ye MAT karna:                                            │
│  · Kisi ko bolne pe majboor mat karo                         │
│  · "Ye to kuch bhi nahi" mat bolo                            │
│  · Apni story se compare mat karo                            │
│  · Advice mat do — sirf suno                                 │
│  · Baad me kisi ki baat class me mat uthao                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# PART 7 — THE COUNSELLOR DESK

## 7.1 The Queue

```
╔═══════════════════════════════════════════════════════════════════════╗
║  👩‍⚕️  Counsellor Desk · Priya Sharma                                  ║
║  Open cases: 23 / 40  ·  SLA met: 96%  ·  This week: 8 closed         ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  🚨 CRISIS · RESPOND NOW                                               ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │  Student #4821 · Class 10-A                          ⏱ 4 min ago │ ║
║  │  🚨 Crisis keyword detected in journal                            │ ║
║  │  SLA: 15 minutes · 11 min remaining                                │ ║
║  │                                                                    │ ║
║  │  [ 📞 Call now ]  [ 🏃 Find student ]  [ 👀 View context ]        │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  🔴 RED · 24-hour SLA                                                  ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │  Student #3392 · Class 9-B                          ⏱ 6 hrs ago  │ ║
║  │  💬 Self-raised: "baat karni hai"                                 │ ║
║  │  Wants: this week · Prefers: in person                             │ ║
║  │  SLA: 18 hrs remaining                                             │ ║
║  │  [ Acknowledge ]  [ Schedule ]  [ View context ]                   │ ║
║  ├──────────────────────────────────────────────────────────────────┤ ║
║  │  Student #2810 · Class 11-A                         ⏱ 1 day ago  │ ║
║  │  👨‍🏫 Teacher concern + 📊 5-day low mood streak                   │ ║
║  │  ⚠️ SLA breached by 2 hrs                                          │ ║
║  │  [ Acknowledge ]  [ View context ]                                 │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  🟡 AMBER · Monitor                                                    ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │  Student #1204 · Class 8-C · 3-day low streak      [ Watch ]      │ ║
║  │  Student #5501 · Class 10-B · Stopped check-ins    [ Watch ]      │ ║
║  │  Student #3390 · Class 9-A · Sudden mood drop      [ Watch ]      │ ║
║  │  ... 9 more                                        [ View all ]   │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  📅 FOLLOW-UPS DUE                                                     ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │  Student #2201 · closed 30 days ago · check-in due  [ Reach out ] │ ║
║  │  Student #4410 · closed 28 days ago · due in 2 days               │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  🕊 ANONYMOUS REPORTS                                                  ║
║  ┌──────────────────────────────────────────────────────────────────┐ ║
║  │  Bullying · Class 9 area · 2 days ago              [ Review ]     │ ║
║  │  Social exclusion · Class 7 · 5 days ago           [ Review ]     │ ║
║  └──────────────────────────────────────────────────────────────────┘ ║
║                                                                        ║
║  ⚠️ Caseload: 23/40 · Healthy                                          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## 7.2 ⭐⭐ The Context View — Reason Required

**Har baar. Counsellor bhi. Koi exception nahi.**

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              🔒  Ek Minute                                   │
│                                                              │
│   Aap ek bachche ka personal data dekhne ja rahi hain.       │
│                                                              │
│   Ye access log hoga. Hamesha ke liye.                       │
│   Ye theek hai — ye accountability hai.                      │
│                                                              │
│   Bas ek line likh dijiye — kyun dekh rahi hain?             │
│                                                              │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Red flag raised 15 Jul, preparing for first        │    │
│   │ contact                                            │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
│         ┌──────────────┐    ┌──────────────┐                │
│         │   Cancel     │    │   Continue   │                │
│         └──────────────┘    └──────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Ye friction jaanbujh ke hai.** Ek second ka pause. Ek line ki soch. Isse access casual nahi rehta.

```
╔═══════════════════════════════════════════════════════════════════════╗
║  👤  Aarav Sharma · Class 10-A · Age 15                               ║
║  🔒 Viewing logged · Reason: "Red flag 15 Jul, first contact prep"    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ┌── 🔴 CURRENT FLAG ─────────────────────────────────────────────┐   ║
║  │  Severity: RED · Score: 72 · Opened: 15 Jul, 6 hrs ago         │   ║
║  │  Primary driver: pulse_low_5days                                │   ║
║  │                                                                 │   ║
║  │  Signals:                                                       │   ║
║  │  · 5-day low mood streak              45                        │   ║
║  │  · Teacher concern (15 Jul)           40  ← read note below     │   ║
║  │  · Attendance: 3 unexplained days     25  (capped)              │   ║
║  │  · Recent performance change          15  (capped)              │   ║
║  │  ─────────────────────────────────────────                      │   ║
║  │  Total (after caps)                   72                        │   ║
║  │                                                                 │   ║
║  │  ⚠️ Note: attendance + academics contributed 40 of 72.          │   ║
║  │     Per system rules, these alone cannot produce a red flag.    │   ║
║  │     The mood streak and teacher concern are the real drivers.   │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌── 📊 MOOD (last 14 days) ──────────────────────────────────────┐   ║
║  │                                                                 │   ║
║  │  Great  ┤ ●─●                                                  │   ║
║  │  Good   ┤     ●─●─●                                            │   ║
║  │  Okay   ┤           ●─●                                        │   ║
║  │  Low    ┤               ●─●─●─●─●                              │   ║
║  │  Strug  ┤                                                      │   ║
║  │         └──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──            │   ║
║  │            1  2  3  4  5  6  7  8  9 10 11 12 13 14           │   ║
║  │                                                                 │   ║
║  │  💬 Notes he left:                                              │   ║
║  │  Day 10: "thoda thak gaya hoon"                                │   ║
║  │  Day 12: "kuch theek nahi lag raha"                            │   ║
║  │  Day 14: (no note)                                             │   ║
║  │                                                                 │   ║
║  │  Context tags he selected: home (×3), sleep (×2)               │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌── 👨‍🏫 TEACHER CONCERN · 15 Jul ────────────────────────────────┐   ║
║  │  From: Mrs. Verma (Class Teacher) · Urgency: this week         │   ║
║  │                                                                 │   ║
║  │  "Pichle 2 hafte se class me bilkul chup hai. Pehle bahut      │   ║
║  │   participate karta tha. Lunch me bhi akela baithta hai.        │   ║
║  │   Kal aankhein laal thi."                                       │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌── 📔 JOURNAL ───────────────────────────────────────────────────┐   ║
║  │                                                                 │   ║
║  │                        🔒                                       │   ║
║  │                                                                 │   ║
║  │        Aarav has 8 journal entries.                             │   ║
║  │        None shared with you.                                    │   ║
║  │                                                                 │   ║
║  │        You cannot read them. This is by design.                 │   ║
║  │        If he chooses to share, you'll see it here.             │   ║
║  │                                                                 │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌── 🌱 ACTIVITIES ────────────────────────────────────────────────┐   ║
║  │  Was using breathing exercises regularly until Day 9.          │   ║
║  │  Stopped since then.                                            │   ║
║  │  ⚠️ Stopping self-care is often meaningful.                     │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌── 📋 HISTORY ───────────────────────────────────────────────────┐   ║
║  │  Nov 2025 · Case opened (exam stress) · Closed after 2 sessions │   ║
║  │              Outcome: resolved_internal                          │   ║
║  │  Feb 2026 · 30-day follow-up · No concerns                      │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌── ⚠️ WHAT YOU CANNOT SEE ──────────────────────────────────────┐   ║
║  │  · His marks or exam results                                    │   ║
║  │  · His fee status                                               │   ║
║  │  · Any discipline record                                        │   ║
║  │  · His journal (unless he shares)                               │   ║
║  │                                                                 │   ║
║  │  This is intentional. You're here for him, not his file.       │   ║
║  └─────────────────────────────────────────────────────────────────┘   ║
║                                                                        ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │  [ 💬 Reach out ]  [ 📝 Add note ]  [ 📅 Schedule ]             │  ║
║  │  [ 👨‍👩‍👧 Loop in parent ]  [ 🏥 Refer ]  [ ✓ Close case ]        │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**"You're here for him, not his file." — ye line poore module ka summary hai.**

## 7.3 ⭐⭐ Looping In Parent — The Hardest Decision

```
┌─────────────────────────────────────────────────────────────┐
│  👨‍👩‍👧  Ghar Walon Ko Batana Hai?                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚠️ Ruk jaiye. Ye sabse bada faisla hai.                     │
│                                                              │
│  Zyadatar parents madad karna chahte hain.                   │
│  Par kabhi kabhi ghar hi wo jagah hai jahan se dard aa       │
│  raha hai.                                                    │
│                                                              │
│  Batane se pehle ye sochiye:                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  [ ] Maine bachche se poocha hai                   │     │
│  │  [ ] Bachcha maan gaya hai   / [ ] Nahi maana      │     │
│  │  [ ] Mujhe koi wajah nahi dikhti ki ghar unsafe ho │     │
│  │  [ ] Ye batana bachche ki madad karega,            │     │
│  │      school ki zimmedari nahi                       │     │
│  │  [ ] Agar bachcha mana kar raha hai, mere paas     │     │
│  │      safety ki thos wajah hai                       │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Bachcha kya kehta hai?                                      │
│  ○ Maan gaya, khush hai                                      │
│  ○ Maan gaya, par jhijhak raha hai                           │
│  ○ Mana kar raha hai                                         │
│  ○ Poocha nahi (kyun?)                                       │
│                                                              │
│  Kyun batana zaroori hai? (likhna zaroori hai)               │
│  ┌────────────────────────────────────────────────────┐     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ⚠️ Agar bachcha mana kar raha hai:                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Safety ki wajah kya hai? (thos, specific)         │     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Kya batayenge?                                              │
│  ○ Sirf itna: "school se baat karni hai"                     │
│  ○ Aam si baat: "kuch dhyan dene layak laga"                 │
│  ○ Detail me (sirf agar bachcha maan gaya ho)                │
│                                                              │
│  ⚠️ Bachche ka mood data, journal, ya session notes          │
│     kabhi share nahi honge. Chahe kuch bhi ho.               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Ye faisla log hoga. Aapka naam, wajah, aur bachche ka       │
│  jawab — sab record me jaayega.                              │
│                                                              │
│         ┌──────────────┐    ┌──────────────────┐            │
│         │  Abhi nahi   │    │  Ghar walon ko   │            │
│         │              │    │  batao           │            │
│         └──────────────┘    └──────────────────┘            │
│                                                              │
│  💡 Confused hain? Kisi senior se baat kar lein.             │
│     Jaldi karne ki koi wajah nahi (jab tak safety issue      │
│     na ho).                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Ye friction jaanbujh ke hai.** Ye faisla aasan nahi hona chahiye. Ek bachche ka bharosa iske peeche hai.

## 7.4 Session Notes — Encrypted, Counsellor-Only

```
┌─────────────────────────────────────────────────────────────┐
│  📝  Session Note · Aarav Sharma · 16 Jul, 3:30 PM           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session type:  ● In person  ○ Call  ○ Chat  ○ Observation   │
│  Duration:      [ 35 ] minutes                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │                                                     │     │
│  │                                                     │     │
│  │                                                     │     │
│  │                                                     │     │
│  │                                                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Next step:                                                  │
│  ○ Follow up in 1 week                                       │
│  ○ Follow up in 2 weeks                                      │
│  ○ Refer to external professional                            │
│  ○ Loop in parent                                            │
│  ○ Monitor only                                              │
│  ○ Close case                                                │
│                                                              │
│         ┌──────────────────┐                                 │
│         │      Save        │                                 │
│         └──────────────────┘                                 │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🔒 Ye note:                                                 │
│  · AES-256 encrypted                                         │
│  · Sirf counsellor role padh sakta hai                       │
│  · Principal nahi padh sakta                                 │
│  · Platform owner nahi padh sakta                            │
│  · DBA nahi padh sakta                                       │
│  · 7 saal rakha jaayega (legal requirement)                  │
│                                                              │
│  💡 Note likhte waqt:                                        │
│  · Diagnosis mat likhiye ("depression") — observation        │
│    likhiye ("uska kehna hai ki neend nahi aati")             │
│  · Jo bachche ne bola, wahi likhiye — apni raay nahi         │
│  · Aisa likhiye jaise bachcha khud padh sakta ho             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**"Aisa likhiye jaise bachcha khud padh sakta ho" — ye ek purana counselling principle hai.** Isse notes respectful rehte hain.

---

# PART 8 — WHAT THE PRINCIPAL SEES

## 8.1 The Rule

```
╔═══════════════════════════════════════════════════════════════╗
║                                                                ║
║   PRINCIPAL KO NUMBERS DIKHTE HAIN. NAAM NAHI.                 ║
║                                                                ║
║   Principal ko chahiye: "Mera school kaisa hai?"               ║
║   Principal ko NAHI chahiye: "Kaun struggle kar raha hai?"      ║
║                                                                ║
║   Kyun: Principal ka kaam system banana hai. Kisi ek bachche   ║
║   ka ilaaj nahi. Wo counsellor ka kaam hai.                    ║
║                                                                ║
║   Aur agar principal ko naam dikhne lage, to ek din            ║
║   wo naam kisi report me chala jaayega. Kisi meeting me        ║
║   bola jaayega. Aur bachche ka bharosa toot jaayega.           ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

## 8.2 The Wellness Board

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🌱  School Wellness · July 2026                     [Class ▾] [Term ▾]║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ┌──────────┬──────────┬──────────┬──────────┬──────────┐            ║
║  │   84%    │    12    │   96%    │    18    │   2.3    │            ║
║  │  Check-in│   Open   │   SLA    │  Closed  │   Avg    │            ║
║  │   rate   │  cases   │   met    │ this mo. │ sessions │            ║
║  └──────────┴──────────┴──────────┴──────────┴──────────┘            ║
║                                                                        ║
╠═══ SCHOOL MOOD TREND ══════════════════════════════════════════════════╣
║                                                                        ║
║   Good  ┤ ●───●───●                    ╭───●───●                      ║
║         │            ╲                ╱                                ║
║   Okay  ┤             ●───●───●───●──╯                                ║
║         │                                                              ║
║   Low   ┤                                                              ║
║         └──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬              ║
║           W1  W2  W3  W4  W5  W6  W7  W8  W9 W10 W11 W12             ║
║                    ▲                    ▲                             ║
║                 Half-yearly          Results out                       ║
║                                                                        ║
║   💡 Exam ke aas-paas mood girta hai. Ye normal hai — par             ║
║      predictable bhi. Agli baar pehle se circle time schedule         ║
║      kar sakte hain.                                                   ║
║                                                                        ║
╠═══ BY CLASS (aggregate only) ══════════════════════════════════════════╣
║                                                                        ║
║   Class    Students   Check-in   Mood      Trend    Open cases         ║
║   ────────────────────────────────────────────────────────────        ║
║   6         120        91%       Good      ➡️         1               ║
║   7         118        88%       Good      ➡️         0               ║
║   8         122        86%       Okay      📉 ⚠️      2               ║
║   9         115        82%       Okay      📉 ⚠️      3               ║
║   10        110        79%       Okay      ➡️         3               ║
║   11         95        74% ⚠️    Low  ⚠️   📉 🚨      2               ║
║   12         88        68% 🚨    Low  ⚠️   📉 🚨      1               ║
║                                                                        ║
║   ⚠️ Class 11 aur 12 me check-in rate gir raha hai, aur mood bhi.     ║
║      Board exam ka pressure ho sakta hai.                              ║
║                                                                        ║
║      💡 Suggestion: Class 11-12 ke liye ek dedicated session?         ║
║         [ Circle time kits dekho ]                                     ║
║                                                                        ║
╠═══ CASE FLOW ══════════════════════════════════════════════════════════╣
║                                                                        ║
║   Opened this month      ████████████████████  24                     ║
║   Closed this month      ███████████████       18                     ║
║   Still open             ██████████            12                     ║
║   Referred external      ██                     2                     ║
║                                                                        ║
║   How they came:                                                       ║
║   · Student self-raised    ████████████  12  (50%) ⭐                 ║
║   · Teacher concern        ██████         6  (25%)                    ║
║   · Mood pattern           ████           4  (17%)                    ║
║   · Peer report            ██             2  ( 8%)                    ║
║                                                                        ║
║   💡 50% cases bachche khud laaye. Ye bahut achha signal hai —        ║
║      matlab wo system pe bharosa karte hain.                          ║
║                                                                        ║
╠═══ COUNSELLOR HEALTH ══════════════════════════════════════════════════╣
║                                                                        ║
║   Priya Sharma      23 / 40 cases    SLA 96%    ✅ Healthy            ║
║                                                                        ║
║   ⚠️ 800 students, 1 counsellor.                                       ║
║      CBSE norm: 1 per 500. You need 2.                                ║
║      [ Read CBSE circular ]                                            ║
║                                                                        ║
╠═══ 🕊 ANONYMOUS REPORTS ═══════════════════════════════════════════════╣
║                                                                        ║
║   This month: 4 reports  ·  3 actioned  ·  1 under review             ║
║                                                                        ║
║   By type:  Verbal 2 · Social exclusion 1 · Cyber 1                   ║
║   By area:  Class 9 zone (2) · Bus (1) · Online (1)                   ║
║                                                                        ║
║   ⚠️ Class 9 zone me 2 reports. Ek pattern ho sakta hai.              ║
║      Counsellor dekh rahi hain.                                        ║
║                                                                        ║
╠═══ ⚠️ WHAT YOU CANNOT SEE ═════════════════════════════════════════════╣
║                                                                        ║
║   · Kisi bachche ka naam                                               ║
║   · Kisi bachche ka mood                                               ║
║   · Kisi case ki detail                                                ║
║   · Kisi journal ka content                                            ║
║   · Kisi session note                                                  ║
║                                                                        ║
║   Ye jaanbujh ke hai. Aapka kaam system banana hai.                   ║
║   Bachchon ka ilaaj counsellor ka kaam hai.                            ║
║                                                                        ║
║   Agar aapko lage ki kisi bachche ki chinta hai —                     ║
║   counsellor ko bata dijiye. Wo dekh lengi.                            ║
║                                                                        ║
║   [ 💬 Counsellor ko batao ]                                           ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

# PART 9 — API SURFACE

```
╔═══ STUDENT (self only) ═══════════════════════════════════════╗
POST   /pulse                        10-sec check-in
GET    /pulse/my                     my trend (last 30 days)
GET/POST /journal                    encrypted, self only
DELETE /journal/:id                  ⚠️ hard delete allowed HERE
POST   /journal/:id/share            explicit share with counsellor
POST   /flag/self-raise              ⭐ "baat karni hai" → always red
DELETE /flag/self-raise/:id          cancel request
GET    /activities                   ?mood=&duration=
POST   /activities/:id/complete
GET/PUT /consent                     my privacy controls
POST   /consent/opt-out              ⚠️ one tap, zero friction
GET    /helplines                    🌐 always available
GET    /my/case                      my open case status (if any)

╔═══ TEACHER (aggregate ONLY) ══════════════════════════════════╗
GET    /class/:id/mood               ⚠️ min 5 students, no names
GET    /class/:id/trend              ⚠️ aggregate only
GET    /circle-time                  kit library
GET    /circle-time/:id
POST   /concern                      ⭐ raise concern about a student
GET    /my/concerns                  concerns I raised (status only)

╔═══ COUNSELLOR (only role with individual access) ═════════════╗
GET    /flags                        queue
GET    /flags/:id
POST   /flags/:id/acknowledge
GET    /cases                        ?status=&priority=
POST   /cases
GET    /cases/:id
PATCH  /cases/:id
POST   /cases/:id/note               ⚠️ encrypted
GET    /cases/:id/notes              ⚠️ counsellor only
POST   /cases/:id/share-with-parent  ⚠️ explicit, logged, reason mandatory
POST   /cases/:id/refer
POST   /cases/:id/close
POST   /cases/:id/followup
GET    /students/:id/context         ⚠️ reason mandatory, audited
GET    /students/:id/pulse           ⚠️ reason mandatory, audited
GET    /students/:id/journal         ⚠️ only if shared, reason mandatory
GET    /reports                      anonymous bullying queue
PATCH  /reports/:id
GET    /my/caseload                  workload check

╔═══ PRINCIPAL (counts only) ═══════════════════════════════════╗
GET    /wellness-board               ⚠️ aggregate only
GET    /wellness-board/classes       ⚠️ aggregate only
GET    /case-stats                   ⚠️ counts, no names
GET    /counsellor-health            caseload + SLA
GET    /reports/stats                ⚠️ counts only
POST   /concern                      can also raise concern

╔═══ ANONYMOUS (no auth) ═══════════════════════════════════════╗
POST   /report/bullying              🌐 ⚠️ no IP, no device, no session
GET    /report/status/:token         🌐 optional follow-up

╔═══ STAFF ═════════════════════════════════════════════════════╗
GET/POST /staff-check                self only
GET    /staff/aggregate              ⚠️ HR/principal, min 5

╔═══ CRISIS ════════════════════════════════════════════════════╗
POST   /crisis/scan                  internal — text scanning
GET    /crisis/events                ⚠️ counsellor + platform_owner only
POST   /crisis/:id/respond

╔═══ AUDIT ═════════════════════════════════════════════════════╗
GET    /audit                        ⚠️ platform_owner only
GET    /audit/student/:id            ⚠️ who saw this student's data
GET    /audit/actor/:id              ⚠️ what did this person access
GET    /guardrail-violations         ⚠️ platform_owner only

╔═══ WIDGETS ═══════════════════════════════════════════════════╗
GET /widgets/my-pulse                student
GET /widgets/my-streak               student (gentle, no guilt)
GET /widgets/class-mood              teacher (aggregate)
GET /widgets/case-queue              counsellor
GET /widgets/sla-status              counsellor
GET /widgets/wellness-board          principal (aggregate)

╔═══ ⚠️ ENDPOINTS THAT WILL NEVER EXIST ════════════════════════╗
❌ GET /rank
❌ GET /leaderboard
❌ GET /students/sorted-by-mood
❌ GET /most-stressed
❌ GET /mood-vs-marks
❌ GET /export/all-moods
❌ GET /predict/at-risk
```

---

# PART 10 — EVENTS

```js
// ═══ EMIT ═══════════════════════════════════════════════════

emit('wb.pulse_submitted',    { org_id, student_id, at })
                              // ⚠️ mood NAHI. Sirf "submitted".

emit('wb.flag_raised',        { org_id, student_id, severity, primary_driver, at })
                              // ⚠️ Subscribers: SIRF counsellor notification service.
                              //    Koi aur nahi. Ye event bus pe restricted hai.

emit('wb.self_raised',        { org_id, student_id, urgency, at })   ⭐

emit('wb.case_opened',        { org_id, case_id, priority, at })
                              // ⚠️ student_id NAHI

emit('wb.case_closed',        { org_id, case_id, outcome, days_open, at })

emit('wb.crisis_detected',    { org_id, student_id, severity, at })  ⭐⭐
                              // ⚠️ Highest priority. All channels.

emit('wb.sla_breached',       { org_id, case_id, hours_overdue, at })

emit('wb.counsellor_overloaded', { org_id, counsellor_id, caseload, at })

emit('wb.class_trend_down',   { org_id, class_no, section, weeks, at })
                              // ⚠️ aggregate only

emit('wb.report_filed',       { org_id, report_type, at })
                              // ⚠️ NO reporter info. Ever.

emit('wb.guardrail_violated', { org_id, actor_id, guardrail, at })   ⚠️
                              // → immediate AK Sir alert

// ═══ SUBSCRIBE ══════════════════════════════════════════════

on('attendance.absent_3day',    → signal (weight 25, capped))
on('attendance.pattern_change', → signal (weight 15))
on('pl.score_dropped',          → signal (weight 15, capped)) ⚠️ event only, no DB
on('hostel.rollcall.absent',    → signal (weight 20))
on('hostel.incident.critical',  → signal (weight 40))
on('hostel.health.logged',      → signal (weight 10))
on('hrms.overtime_pattern',     → staff burnout signal)
on('student.transferred',       → close cases, archive data)
on('exam.upcoming',             → proactive circle-time suggestion)

// ⚠️⚠️ CRITICAL:
// Ye module KISI academic/financial table ko DIRECTLY read nahi karta.
// Sab kuch event ke through. Payload me sirf "signal" aata hai, data nahi.
//
// Example — sahi:
//   on('pl.score_dropped', ({ org_id, student_id }) => {
//     addSignal({ source: 'academic', weight: 15,
//                 detail: { note: 'Recent performance change' } });
//   })
//
// Example — GALAT (instant reject):
//   const marks = await db.query('SELECT * FROM client_exam_result WHERE ...');
```

---

# PART 11 — CRISIS RESOURCES

```js
// wellbeing.helplines.js
//
// ⚠️ Ye numbers har screen pe available hone chahiye.
// Chhupe nahi. Footer me nahi. Dikhte hue.
//
// Ye numbers verify karo. Har 6 mahine. Aur agar koi band ho gaya,
// to turant hatao. Ek band number = ek toota bharosa.

const HELPLINES_INDIA = Object.freeze([
  {
    name: 'Tele-MANAS',
    number: '14416',
    alt: '1800-891-4416',
    hours: '24×7',
    languages: ['Hindi','English','+18 regional'],
    free: true,
    org: 'Government of India · Ministry of Health',
    note: 'Trained counsellors. Free. Confidential.',
    priority: 1,
  },
  {
    name: 'KIRAN',
    number: '1800-599-0019',
    hours: '24×7',
    languages: ['Hindi','English','+11 regional'],
    free: true,
    org: 'Ministry of Social Justice',
    priority: 2,
  },
  {
    name: 'Childline',
    number: '1098',
    hours: '24×7',
    languages: ['Hindi','English','regional'],
    free: true,
    org: 'Childline India Foundation',
    note: 'For anyone under 18. Any problem.',
    priority: 3,
  },
  {
    name: 'AASRA',
    number: '9820466726',
    hours: '24×7',
    languages: ['Hindi','English'],
    free: true,
    priority: 4,
  },
  {
    name: 'Vandrevala Foundation',
    number: '9999666555',
    hours: '24×7',
    languages: ['Hindi','English','+8 regional'],
    free: true,
    whatsapp: true,
    priority: 5,
  },
  {
    name: 'iCall',
    number: '9152987821',
    hours: 'Mon-Sat 10am-8pm',
    languages: ['Hindi','English'],
    free: true,
    org: 'TISS',
    priority: 6,
  },
  {
    name: 'Sneha India',
    number: '044-24640050',
    hours: '24×7',
    languages: ['Tamil','English'],
    free: true,
    priority: 7,
  },
]);

// School apne local resources add kar sakta hai
async function getHelplines(org_id) {
  const local = await getLocalResources(org_id);
  return [...HELPLINES_INDIA, ...local].sort((a,b) => a.priority - b.priority);
}
```

## 11.1 The Crisis Screen

```
┌───────────────────────────────────────────┐
│                                            │
│                                            │
│              Ruko. Ek minute.              │
│                                            │
│                                            │
│    Jo tumne likha, wo humne padha.         │
│    Aur hum yahin hain.                     │
│                                            │
│    Abhi is waqt tum akele nahi ho.         │
│                                            │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │                                       │ │
│  │        📞  Tele-MANAS                 │ │
│  │           14416                       │ │
│  │                                       │ │
│  │     24 ghante · muft · confidential   │ │
│  │                                       │ │
│  │        [ Call karo ]                  │ │
│  │                                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  📞  Childline · 1098                 │ │
│  │      18 se kam umar ke liye           │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  💬  School counsellor ko bata diya   │ │
│  │      hai. Wo tumse baat karengi.      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  🫁  Abhi saath saans lete hain       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ─────────────────────────────────────    │
│                                            │
│    Tum zaroori ho.                         │
│    Ye baat sach hai, chahe abhi aisa       │
│    na lage.                                │
│                                            │
│    Ye waqt guzar jaayega. Sach me.         │
│                                            │
└───────────────────────────────────────────┘
```

**Ye screen chhupayi nahi ja sakti.** Koi "later" button nahi. Koi "X" nahi. Bachche ko kuch action lena hoga — call, breathe, ya "main theek hoon". Aur agar wo "main theek hoon" bhi dabaye, counsellor ko already pata chal chuka hai.

---

# PART 12 — WEEK-BY-WEEK (10 weeks)

```
╔═══ WEEK 1 — Guardrails First ═════════════════════════════════╗
⚠️ Feature nahi. Pehle guard.
A: guardrails.js constants + query linter + boot verification
B: DB schema + separate user + grants + audit triggers
C: ⭐ Crisis guardrail tests (must FAIL to pass)
→ PR 1  ⚠️ AK Sir reviews before ANY feature work

╔═══ WEEK 2 — Consent & Crypto ═════════════════════════════════╗
A: Consent ladder + age bands + parent token flow
B: ⭐ Journal encryption (AES-256-GCM, per-student key, KMS)
C: Anonymous reporter hash + daily salt rotation
→ PR 2  ⚠️ Encryption reviewed by AK Sir

╔═══ WEEK 3 — Crisis Path ══════════════════════════════════════╗
⚠️ Ye pehle. Baaki sab baad me.
A: ⭐⭐ Crisis keyword scanner (EN/HI/Hinglish)
B: ⭐⭐ Crisis trigger + escalation ladder + all-channel alert
C: ⭐⭐ Crisis screen (student-facing) + helpline registry
→ PR 3  ⚠️ Counsellor advisor reviews keyword list

╔═══ WEEK 4 — Pulse & Journal ══════════════════════════════════╗
A: Pulse API + pattern analysis + TTL/anonymization cron
B: Journal API + share flow + hard delete
C: Activities library + logs
→ PR 4

╔═══ WEEK 5 — Signal Engine ════════════════════════════════════╗
A: ⭐⭐ Signal engine + weights + caps
B: ⭐⭐ Flag creation + severity + primary driver
C: ⭐ Event subscribers (attendance/academic/hostel — event ONLY)
→ PR 5  ⚠️ AK Sir reviews every weight and cap

╔═══ WEEK 6 — Counsellor Desk ══════════════════════════════════╗
A: Case CRUD + SLA + priority + escalation
B: ⭐ Session notes (encrypted) + referral
C: ⭐⭐ Context view API + reason gate + audit
→ PR 6

╔═══ WEEK 7 — Frontend: Student ════════════════════════════════╗
A: ⭐⭐ Pulse check-in (10 sec, warm, bilingual)
B: ⭐⭐ Journal (private, delete prominent)
C: ⭐⭐ Self-raise + activities + crisis screen
→ PR 7

╔═══ WEEK 8 — Frontend: Teacher + Counsellor ═══════════════════╗
A: Class mood board (min-5 guard visible) + circle time kits
B: ⭐⭐ Counsellor queue + context view + reason modal
C: ⭐⭐ Parent loop-in flow (with all the friction)
→ PR 8

╔═══ WEEK 9 — Frontend: Principal + Anonymous ══════════════════╗
A: Wellness board (aggregate only) + "what you cannot see"
B: 🌐 Anonymous bullying report + review queue
C: Staff well-being + HRMS event integration
→ PR 9

╔═══ WEEK 10 — Audit, Test, Harden ═════════════════════════════╗
A: Audit log + access reports + violation alerts
B: ⭐⭐ Full guardrail test suite (all must pass)
C: Retention crons + anonymization + performance
All: docs, counsellor training material, demo
→ PR 10
```

---

# PART 13 — DEFINITION OF DONE

```
╔═══ GUARDRAILS (must ALL pass — no exceptions) ════════════════╗
[ ] ⚠️ wb_* × exam_result JOIN → throws
[ ] ⚠️ wb_* × fees JOIN → throws
[ ] ⚠️ wb_* × discipline JOIN → throws
[ ] ⚠️ DB user cannot SELECT from academic tables (grant test)
[ ] ⚠️ Aggregate < 5 → insufficient_data, no numbers
[ ] ⚠️ Teacher GET /students/:id/context → 403
[ ] ⚠️ Principal GET /students/:id/context → 403
[ ] ⚠️ Parent GET /students/:id/pulse → 403
[ ] ⚠️ Counsellor without reason → 400
[ ] ⚠️ Counsellor with reason → audit row created
[ ] ⚠️ No /rank, /leaderboard, /sorted endpoints (404)
[ ] ⚠️ Journal encrypted (raw DB has no plaintext — PROVE IT)
[ ] ⚠️ Counsellor cannot read unshared journal → 403
[ ] ⚠️ Audit UPDATE → DB error
[ ] ⚠️ Audit DELETE → DB error
[ ] ⚠️ Academic signal alone → max amber, never red
[ ] ⚠️ Attendance + academic capped at 40 combined
[ ] ⚠️ Self-raise → always red, regardless of other signals
[ ] ⚠️ Opted-out student → zero rows created
[ ] ⚠️ Opted-out student invisible to all staff
[ ] ⚠️ Boot fails if any guardrail broken

╔═══ CRISIS PATH ═══════════════════════════════════════════════╗
[ ] ⭐⭐ Crisis keyword (EN) → immediate red + all-channel alert
[ ] ⭐⭐ Crisis keyword (Hindi) → same
[ ] ⭐⭐ Crisis keyword (Hinglish) → same
[ ] ⭐⭐ Crisis → student sees support screen IMMEDIATELY
[ ] ⭐⭐ Crisis screen cannot be dismissed without action
[ ] ⭐⭐ Immediate: 15-min SLA, escalate at 5 min
[ ] ⭐⭐ Escalation: counsellor → principal → platform owner
[ ] ⭐ Helplines on EVERY screen, always
[ ] ⭐ All helpline numbers verified working
[ ] ⭐ Crisis overrides consent (logged with reason)

╔═══ CONSENT ═══════════════════════════════════════════════════╗
[ ] Age < 13: parent consent + child assent both required
[ ] Age < 13: journal disabled
[ ] Age 16+: independent consent, parent not required
[ ] Opt-out: one tap, no confirmation dialog nagging
[ ] Opt-out: data anonymized within 24h
[ ] Opt-out: zero visibility to any staff
[ ] Consent screen: "Abhi nahi" as prominent as "Theek hai"

╔═══ FUNCTIONAL ════════════════════════════════════════════════╗
[ ] Pulse check-in ≤ 10 seconds, one tap
[ ] Pulse works at 380px
[ ] Pulse skip button prominent
[ ] Journal: student can delete (hard delete works)
[ ] Journal: share flow explicit and reversible
[ ] Self-raise → red flag + 24h SLA timer
[ ] Teacher concern → counsellor queue
[ ] Class mood: min 5 enforced with explanation screen
[ ] Circle time kits: 4+ kits, with red flags section
[ ] Counsellor queue: priority sorted, SLA visible
[ ] Context view: reason modal before every access
[ ] Parent loop-in: checklist + reason mandatory
[ ] Anonymous report: no IP, no device, no session stored
[ ] Wellness board: aggregate only, "what you cannot see" section
[ ] Retention: 365-day anonymization cron works

╔═══ CONTRACT ══════════════════════════════════════════════════╗
[ ] All 11 events firing
[ ] Zero cross-module require()
[ ] Zero direct reads of academic/financial tables (grep proof)
[ ] Zero query without org_id
[ ] Zero hardcoded hex
[ ] Every route has requirePermission

╔═══ HUMAN REVIEW (not optional) ═══════════════════════════════╗
[ ] ⚠️ Licensed counsellor reviewed crisis keyword list
[ ] ⚠️ Licensed counsellor reviewed signal weights
[ ] ⚠️ Licensed counsellor reviewed all student-facing copy
[ ] ⚠️ Licensed counsellor reviewed circle time kits
[ ] ⚠️ AK Sir reviewed every guardrail
[ ] ⚠️ AK Sir reviewed encryption implementation
[ ] ⚠️ Legal review of consent flow
[ ] ⚠️ Counsellor training material written

╔═══ DELIVERY ══════════════════════════════════════════════════╗
[ ] 10 PRs
[ ] Tests 85%+ (highest bar in platform — this is why)
[ ] docs/README.md
[ ] docs/GUARDRAILS.md ⭐
[ ] docs/COUNSELLOR_GUIDE.md ⭐
[ ] docs/CRISIS_PROTOCOL.md ⭐
[ ] Screenshots + 380px
[ ] Demo video (15 min, including crisis path)
```

---

# PART 14 — TRAPS

| # | Trap | Why it's dangerous | Fix |
|---|---|---|---|
| 1 | ⚠️⚠️ "Mood + marks correlate karke insight nikalte hain" | Ye "sad students fail" narrative banata hai. Bachcha blame hota hai. | ❌ NEVER. Waada 1. |
| 2 | ⚠️⚠️ "Teacher ko dikha dete hain, wo madad karega" | Bachcha jhoot bolna shuru kar dega. Data bekaar. | Aggregate only, min 5. |
| 3 | ⚠️⚠️ "Principal ko list chahiye" | Ek din wo list meeting me jaayegi. Bharosa khatam. | Counts only, no names. |
| 4 | ⚠️⚠️ "Parent ko roz update" | Kabhi kabhi ghar hi problem hai. | Counsellor decides, logs reason. |
| 5 | ⚠️⚠️ Crisis path ko baad me banana | Ye pehla feature hona chahiye. Week 3. | Crisis first. |
| 6 | ⚠️ "Attendance gir gayi = red flag" | Bachcha bimar bhi ho sakta hai. | Cap 25. Never red alone. |
| 7 | ⚠️ Streak counter with guilt | "You missed 3 days" = shaming | Gentle or nothing. |
| 8 | ⚠️ Journal ko counsellor readable | "Meri diary" ka matlab MERI. | Encrypted, share-only. |
| 9 | ⚠️ Anonymous report me IP store | Anonymous ka matlab anonymous. | No IP, no device, no session. |
| 10 | ⚠️ Reason field optional | Access casual ho jaayega. | Mandatory, min 10 chars. |
| 11 | ⚠️ Audit log editable | Accountability khatam. | DB trigger, append-only. |
| 12 | ⚠️ Diagnosis language ("depressed") | Label chipak jaata hai. Software diagnose nahi karta. | "Needs to talk". |
| 13 | ⚠️ Prediction ("will be at risk") | Prediction = label = self-fulfilling. | Observe, don't predict. |
| 14 | ⚠️ Opt-out se attendance pe asar | Consent majboori ban gayi. | Zero penalty, invisible. |
| 15 | ⚠️ Clinical UI | Bachcha dar jaayega. | Warm, simple, human. |
| 16 | ⚠️ Sirf English | 70% bachche Hindi me sochte hain. | Bilingual, equal weight. |
| 17 | ⚠️ Helpline footer me chhupa | Crisis me scroll nahi karta koi. | Every screen, prominent. |
| 18 | ⚠️ Direct DB read of PL/exam tables | Waada 1 tootega. | Event only. |
| 19 | ⚠️ Counsellor caseload unlimited | Overloaded counsellor = no counsellor. | Cap 40, warn. |
| 20 | ⚠️ 5-student rule ko "configurable" banana | School 2 kar dega. Privacy khatam. | Hardcoded. Constant. |
| 21 | ⚠️ "Ek exception bana dete hain" | Exception se guardrail toota. | No exceptions. Ever. |
| 22 | ⚠️ Parent loop-in aasan banana | Ye faisla mushkil hona chahiye. | Checklist + reason. |
| 23 | ⚠️ SLA miss silent | Bachcha wait kar raha hai. | Escalate loudly. |
| 24 | ⚠️ Crisis screen dismissible | Bachche ne abhi kuch mushkil likha. | Must take an action. |
| 25 | ⚠️ Guardrails ko config me daalna | Ek din koi off kar dega. | Code me. Frozen. |

---

# PART 15 — DEMO DAY

**8 cheezein. In sab me se ek bhi fail = module ready nahi.**

```
1. 🔒 GUARDRAIL PROOF
   Live SQL console. Try: mood × marks JOIN.
   → Error. Loud. Clear.
   "Ye database level pe blocked hai. Code ki galti bhi nahi chalegi."

2. ⏱ THE 10-SECOND PULSE
   Phone. Open. Tap. Done.
   Stopwatch: under 10 seconds.
   "Skip today" button dikhao — utna hi bada.

3. 🔐 THE JOURNAL
   Kuch likho: "UNIQUE_SECRET_12345"
   Raw DB query chalao. → Encrypted blob.
   "Hum literally nahi padh sakte."

4. 🚨 THE CRISIS PATH
   ⚠️ Ye sabse important demo hai.
   Journal me likho: "mann karta hai sab khatam ho jaye"
   → Screen turant badalti hai. Helpline. Warmth.
   → Counsellor phone bajta hai. SMS. Push.
   → 5 min timer start. Principal escalation ready.
   Total time: under 2 seconds.

5. 👨‍🏫 THE TEACHER WALL
   Teacher login. Try /students/42/context → 403.
   Class mood dikhao — aggregate, no names.
   4-student class kholo → "insufficient data" screen.

6. 👩‍⚕️ THE REASON GATE
   Counsellor login. Context kholo.
   → Reason modal. Skip nahi kar sakte.
   Reason bharo. → Audit log me row dikhao. Live.

7. 👨‍👩‍👧 THE PARENT DECISION
   Parent loop-in kholo. → Checklist. Reason mandatory.
   "Ye friction jaanbujh ke hai. Ye faisla aasan nahi hona chahiye."

8. 🚪 THE EXIT
   Student opt-out. Ek tap.
   → Pulse submit karo → koi row nahi banti.
   → Counsellor queue me nahi dikhta.
   → Teacher ko pata bhi nahi chalta.
   "Ye asli consent hai."
```

---

# PART 16 — WHY THIS MATTERS

```
╔═══════════════════════════════════════════════════════════════╗
║                                                                ║
║   Baaki 19 modules school ko chalate hain.                     ║
║   Ye module ek bachche ko bachata hai.                         ║
║                                                                ║
║   ─────────────────────────────────────────────────────────   ║
║                                                                ║
║   Ek din, kisi school me, koi bachcha kuch likhega.            ║
║   Aur ek counsellor ka phone bajega.                           ║
║   Aur wo counsellor us bachche ko dhundh legi.                 ║
║   Aur wo baat karengi.                                         ║
║                                                                ║
║   Aur wo bachcha kal school aayega.                            ║
║                                                                ║
║   ─────────────────────────────────────────────────────────   ║
║                                                                ║
║   Us din, ye saara code — har guardrail, har encryption,       ║
║   har audit log, har "reason required" modal —                 ║
║   sab worth it hoga.                                           ║
║                                                                ║
║   Us ek din ke liye.                                           ║
║   Us ek bachche ke liye.                                       ║
║                                                                ║
║   ─────────────────────────────────────────────────────────   ║
║                                                                ║
║   Isliye:                                                      ║
║                                                                ║
║   · Koi shortcut nahi.                                         ║
║   · Koi "abhi ke liye theek hai" nahi.                         ║
║   · Koi "client maang raha hai" nahi.                          ║
║   · Koi "sirf ek exception" nahi.                              ║
║                                                                ║
║   Har guardrail. Har waqt. Bina samjhaute ke.                  ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

# PART 17 — THE PITCH

> **Har school ke paas 800 bachche hain aur 1 counsellor.**
> **Wo counsellor 800 bachchon ko ek saath nahi dekh sakti.**
>
> WISWITS Well-being uski aankh banta hai — bina kisi bachche ki jasoosi kiye.
>
> Bachcha roz 10 second me batata hai ki kaisa lag raha hai. Uski diary encrypted hai —
> hum bhi nahi padh sakte. Uska mood uske marks se kabhi nahi judta. Uska teacher
> uska mood kabhi nahi dekhta. Aur jab bachcha khud kahe "baat karni hai" —
> counsellor ko 24 ghante me pata chal jaata hai.
>
> Aur agar kabhi koi aisa kuch likhe jo darr paida kare — 2 second me
> counsellor ka phone baj jaata hai. Aur bachche ki screen pe ek number aa jaata hai,
> aur ek line: **"Tum zaroori ho."**
>
> **Ye surveillance nahi hai. Ye care hai.**
> **Aur ye farq code me likha hua hai — 21 guardrails, jo koi off nahi kar sakta.**
>
> Ek bhi bachcha akela na rahe. Bas itna.

---

**Ye module WISWITS ki aatma hai.**
**Isko utne pyaar se banao jitne pyaar se koi apne bachche ki hifazat karta hai.**

**🌱**

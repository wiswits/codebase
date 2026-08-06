// wellbeing.crisis.keywords.js
//
// ⚠️ Ye list licensed counsellor ne banayi hai. Isme kuch add/remove karna hai
//    to unse pucho. This list is owned by the licensed counsellor advisor.
//    To add/remove a phrase, get their review — do not edit it casually.
//
// Matching is exact-phrase substring (case-insensitive), across English, Hindi
// (Devanagari), and Hinglish. Not regex. False positives are acceptable; a
// missed cry for help is not.
//
// ⚠️ HUMAN REVIEW REQUIRED before production (PRD Part 13):
//    "Licensed counsellor reviewed crisis keyword list" — [ ] pending.

const CRISIS_KEYWORDS = Object.freeze({
  // Immediate — emergency. 15-minute SLA, all channels, escalation.
  immediate: Object.freeze([
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
  ]),

  // Urgent — 2-hour SLA.
  urgent: Object.freeze([
    'hurt myself', 'cut myself', 'self harm', 'cutting',
    'starve myself', 'not eating', 'stopped eating',
    'nobody cares', 'no one would notice', 'everyone hates me',
    'cant take it', "can't take it", 'too much pain',
    'खुद को नुकसान', 'खुद को चोट', 'कोई परवाह नहीं',
    'khud ko nuksan', 'koi parwah nahi', 'bardaasht nahi',
  ]),

  // Concern — 24-hour SLA, gentle outreach.
  concern: Object.freeze([
    'hopeless', 'worthless', 'burden', 'trapped', 'empty',
    'alone', 'nobody understands', 'tired of everything',
    'निराश', 'बेकार', 'बोझ', 'अकेला', 'अकेली', 'थक गया',
    'nirash', 'bekaar', 'bojh', 'akela', 'thak gaya',
  ]),
});

module.exports = { CRISIS_KEYWORDS };

// wellbeing.helplines.js
//
// ⚠️ These numbers must be available on EVERY screen. Not hidden. Not in a
//    footer. Visible.
//
// ⚠️ Verify these numbers every 6 months. If one stops working, remove it
//    immediately — a dead number is a broken trust.
//    Last verified: 2026-07 (update this date on each review).

const HELPLINES_INDIA = Object.freeze([
  {
    name: 'Tele-MANAS',
    number: '14416',
    alt: '1800-891-4416',
    hours: '24×7',
    languages: ['Hindi', 'English', '+18 regional'],
    free: true,
    org: 'Government of India · Ministry of Health',
    note: 'Trained counsellors. Free. Confidential.',
    priority: 1,
  },
  {
    name: 'KIRAN',
    number: '1800-599-0019',
    hours: '24×7',
    languages: ['Hindi', 'English', '+11 regional'],
    free: true,
    org: 'Ministry of Social Justice',
    priority: 2,
  },
  {
    name: 'Childline',
    number: '1098',
    hours: '24×7',
    languages: ['Hindi', 'English', 'regional'],
    free: true,
    org: 'Childline India Foundation',
    note: 'For anyone under 18. Any problem.',
    priority: 3,
  },
  {
    name: 'AASRA',
    number: '9820466726',
    hours: '24×7',
    languages: ['Hindi', 'English'],
    free: true,
    priority: 4,
  },
  {
    name: 'Vandrevala Foundation',
    number: '9999666555',
    hours: '24×7',
    languages: ['Hindi', 'English', '+8 regional'],
    free: true,
    whatsapp: true,
    priority: 5,
  },
  {
    name: 'iCall',
    number: '9152987821',
    hours: 'Mon-Sat 10am-8pm',
    languages: ['Hindi', 'English'],
    free: true,
    org: 'TISS',
    priority: 6,
  },
  {
    name: 'Sneha India',
    number: '044-24640050',
    hours: '24×7',
    languages: ['Tamil', 'English'],
    free: true,
    priority: 7,
  },
]);

// A school may add its own local resources. `getLocalResources` is injected so
// this stays testable without a DB; defaults to none.
async function getHelplines(org_id, getLocalResources = async () => []) {
  const local = (await getLocalResources(org_id)) || [];
  return [...HELPLINES_INDIA, ...local].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

module.exports = { HELPLINES_INDIA, getHelplines };

/**
 * Seeds the database with demo data so the app is immediately usable after setup:
 * - One login per role (admin, admission_officer, counselor, panelist)
 * - Document checklists per class
 * - Quota pools per class/category (RTE 25% etc., per PRD)
 * - A handful of enquiries across every Kanban stage
 * - A handful of submitted applications across the funnel (for dashboard/analytics to show data)
 *
 * Run with: npm run seed  (from /server, after configuring .env)
 * Safe to re-run: it wipes and recreates collections listed in COLLECTIONS_TO_RESET.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const Application = require('../models/Application');
const ApplicationDocument = require('../models/ApplicationDocument');
const DocumentChecklist = require('../models/DocumentChecklist');
const Quota = require('../models/Quota');
const Counter = require('../models/Counter');
const EntranceTest = require('../models/EntranceTest');
const TestResult = require('../models/TestResult');
const SourceCost = require('../models/SourceCost');

const { ROLES, DOC_CHECKLIST_DEFAULT } = require('../config/constants');
const { getNextApplicationNumber } = require('../services/numberingService');

const FY = process.env.CURRENT_FY || '2026-27';
const CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
const SOURCES = ['Walk-in', 'Website', 'Referral', 'Facebook Ads', 'Agent', 'Other'];

async function run() {
  await connectDB();
  console.log('[Seed] Connected. Wiping existing demo collections...');

  await Promise.all([
    User.deleteMany({}),
    Enquiry.deleteMany({}),
    Application.deleteMany({}),
    ApplicationDocument.deleteMany({}),
    DocumentChecklist.deleteMany({}),
    Quota.deleteMany({}),
    Counter.deleteMany({}),
    EntranceTest.deleteMany({}),
    TestResult.deleteMany({}),
    SourceCost.deleteMany({}),
  ]);

  console.log('[Seed] Creating users (password for all: Password@123)...');
  const users = await User.create([
    { name: 'Admin Administrator', email: 'admin@wiswits.test', password: 'Password@123', role: ROLES.ADMIN },
    { name: 'Priya Sharma', email: 'officer@wiswits.test', password: 'Password@123', role: ROLES.ADMISSION_OFFICER },
    { name: 'Rahul Verma', email: 'counselor@wiswits.test', password: 'Password@123', role: ROLES.COUNSELOR },
    { name: 'Dr. Anjali Nair', email: 'panelist1@wiswits.test', password: 'Password@123', role: ROLES.PANELIST },
    { name: 'S. Verma', email: 'panelist2@wiswits.test', password: 'Password@123', role: ROLES.PANELIST },
  ]);
  const [admin, officer, counselor, panelist1, panelist2] = users;

  console.log('[Seed] Creating document checklists (FR10)...');
  await DocumentChecklist.create(
    CLASSES.map((c) => ({ classApplied: c, board: 'Any', requiredDocs: DOC_CHECKLIST_DEFAULT }))
  );

  console.log('[Seed] Creating quota pools (FR25-FR28)...');
  const quotaDefs = [
    { category: 'RTE', statutoryPercent: 25 },
    { category: 'EWS', statutoryPercent: 10 },
    { category: 'Sibling', statutoryPercent: 10 },
    { category: 'Staff', statutoryPercent: 5 },
    { category: 'Sports', statutoryPercent: 10 },
    { category: 'Management', statutoryPercent: 10 },
    { category: 'General', statutoryPercent: 30 },
  ];
  const quotaDocs = [];
  for (const cls of CLASSES) {
    const totalSeatsForClass = 120;
    for (const q of quotaDefs) {
      const totalSeats = Math.round((q.statutoryPercent / 100) * totalSeatsForClass);
      quotaDocs.push({
        classApplied: cls,
        fy: FY,
        category: q.category,
        totalSeats,
        statutoryPercent: q.statutoryPercent,
        filled: 0,
        eligibilityRule:
          q.category === 'RTE'
            ? 'Family annual income below statutory ceiling; income certificate mandatory (FR26)'
            : q.category === 'Sibling'
            ? 'An elder sibling already enrolled in the school'
            : q.category === 'Staff'
            ? 'Child of a currently employed staff member'
            : undefined,
      });
    }
  }
  await Quota.insertMany(quotaDocs);

  console.log('[Seed] Creating enquiries across Kanban stages (FR4-FR9)...');
  const stages = ['New', 'Contacted', 'Follow-up', 'Interested', 'Application Started', 'Converted', 'Lost'];
  const names = [
    'Aarav Singh', 'Diya Patel', 'Karan Mehta', 'Ishita Das', 'Myra Sharma', 'Aditya Nair',
    'Vivaan Roy', 'Rehan Mehta', 'Sana Khan', 'Kabir Malhotra', 'Anaya Joshi', 'Rohan Gupta', 'Arjun Patel',
  ];
  let n = 0;
  for (const stage of stages) {
    for (let i = 0; i < 3; i++) {
      const name = names[n % names.length];
      n++;
      await Enquiry.create({
        studentName: name,
        parentName: `${name.split(' ')[0]}'s Parent`,
        phone: `9${String(800000000 + n).slice(0, 9)}`,
        email: `${name.toLowerCase().replace(' ', '.')}${n}@example.com`,
        classAppliedFor: CLASSES[n % CLASSES.length],
        stage,
        source: SOURCES[n % SOURCES.length],
        sourceDetail: stage === 'Lost' ? 'Campaign A' : undefined,
        counselor: counselor._id,
        fy: FY,
        lostReason: stage === 'Lost' ? 'Chose another school' : undefined,
        contactLog: stage !== 'New' ? [{ note: 'Initial contact made', by: counselor._id }] : [],
      });
    }
  }

  console.log('[Seed] Creating submitted applications across the funnel...');
  const funnelStatuses = [
    'Submitted', 'Documents Pending', 'Documents Verified', 'Test Qualified',
    'Interview Scheduled', 'Offer Sent', 'Accepted', 'Admitted', 'Rejected',
  ];
  const applications = [];
  for (let i = 0; i < 45; i++) {
    const applicationNo = await getNextApplicationNumber(FY);
    const name = names[i % names.length];
    const cls = CLASSES[i % CLASSES.length];
    const status = funnelStatuses[i % funnelStatuses.length];
    const app = await Application.create({
      applicationNo,
      fy: FY,
      isDraft: false,
      status,
      student: { name, dob: new Date(2019, i % 12, (i % 27) + 1), gender: i % 2 ? 'Male' : 'Female', classAppliedFor: cls },
      parent: {
        fatherName: `${name.split(' ')[0]}'s Father`,
        motherName: `${name.split(' ')[0]}'s Mother`,
        phone: `9${String(700000000 + i).slice(0, 9)}`,
        email: `${name.toLowerCase().replace(' ', '.')}${i}@example.com`,
        address: 'New Delhi, Delhi',
      },
      source: SOURCES[i % SOURCES.length],
      sourceLocked: true,
      quotaCategory: ['General', 'RTE', 'EWS', 'Sibling', 'Sports'][i % 5],
      counselor: counselor._id,
      submittedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    });

    const checklist = DOC_CHECKLIST_DEFAULT;
    await Promise.all(
      checklist.map((docType, idx) =>
        ApplicationDocument.create({
          application: app._id,
          docType,
          status: status === 'Documents Pending' && idx === 0 ? 'Pending' : 'Verified',
          verifiedBy: officer._id,
          verifiedOn: new Date(),
        })
      )
    );

    if (['Admitted', 'Accepted'].includes(status)) {
      await Quota.findOneAndUpdate(
        { classApplied: cls, fy: FY, category: app.quotaCategory },
        { $inc: { filled: 1 } }
      );
    }

    applications.push(app);
  }

  console.log('[Seed] Creating an entrance test with bulk results (FR14-FR17)...');
  const test = await EntranceTest.create({
    name: 'Class 5 Scholarship Test',
    classApplied: 'Class 5',
    subjects: ['English', 'Math', 'GK'],
    maxMarks: 100,
    date: new Date('2026-07-10'),
    venue: 'Main Block, Room 4',
    cutoff: 40,
    fy: FY,
  });

  const class5Apps = applications.filter((a) => a.student.classAppliedFor === 'Class 5').slice(0, 5);
  let rank = 1;
  for (const app of class5Apps) {
    const marks = 88 - rank * 3;
    await TestResult.create({
      test: test._id,
      application: app._id,
      rollNo: String(500 + rank),
      marksObtained: marks,
      maxMarks: 100,
      percentile: Math.round((1 - rank / class5Apps.length) * 1000) / 10,
      rankOverall: rank,
      rankInCategory: rank,
      belowCutoff: marks < 40,
    });
    rank++;
  }

  console.log('[Seed] Creating source cost entries (FR32)...');
  await SourceCost.insertMany(
    SOURCES.map((s) => ({ source: s, campaign: 'Default', fy: FY, cost: Math.round(Math.random() * 50000) }))
  );

  console.log('\n[Seed] Done! Demo logins (password: Password@123):');
  console.log('  Admin:              admin@wiswits.test');
  console.log('  Admission Officer:  officer@wiswits.test');
  console.log('  Counselor:          counselor@wiswits.test');
  console.log('  Panelist:           panelist1@wiswits.test / panelist2@wiswits.test');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});

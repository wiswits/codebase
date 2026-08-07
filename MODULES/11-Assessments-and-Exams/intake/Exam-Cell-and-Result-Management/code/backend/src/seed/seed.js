import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Blueprint from '../models/Blueprint.js';
import Mark from '../models/Mark.js';
import Result from '../models/Result.js';
import Paper from '../models/Paper.js';
import SeatingPlan from '../models/SeatingPlan.js';
import Invigilation from '../models/Invigilation.js';
import HallTicket from '../models/HallTicket.js';
import OMRSheet from '../models/OMRSheet.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Ananya', 'Aditya', 'Diya', 'Ishaan', 'Saanvi', 'Arjun', 'Myra', 'Kabir',
  'Riya', 'Reyansh', 'Anika', 'Vihaan', 'Kavya', 'Aryan', 'Prisha', 'Sai', 'Aadhya', 'Krishna',
  'Ira', 'Dhruv', 'Navya', 'Yuvraj', 'Siya', 'Rudra', 'Anvi', 'Atharv', 'Pari', 'Advik',
  'Zara', 'Shaurya', 'Amyra', 'Devansh', 'Meera', 'Ayaan', 'Tara', 'Rohan', 'Nitya', 'Veer',
  'Aisha', 'Kian', 'Avni', 'Reyaan', 'Ishita', 'Yash', 'Kiara', 'Vivan', 'Sara', 'Om',
];

const LAST_NAMES = ['Sharma', 'Verma', 'Singh', 'Patel', 'Gupta', 'Kumar', 'Reddy', 'Rao', 'Joshi', 'Mehta', 'Nair', 'Iyer', 'Chauhan', 'Malhotra', 'Kapoor'];

const gradeFor = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
};

// Deterministic pseudo-random marks generator so seeded results look realistic
// (a spread of grades, a handful of fails) without being different every run.
const seededMarks = (index, max) => {
  const wave = Math.sin(index * 12.9898) * 43758.5453;
  const frac = wave - Math.floor(wave);
  const base = 28 + Math.floor(frac * 68); // roughly 28-95
  return Math.min(max, base);
};

// Generates `count` unique student User docs assigned to a class, starting at rollStart.
const createStudents = async (count, classDoc, rollStart, offset) => {
  const docs = [];
  for (let i = 0; i < count; i += 1) {
    const first = FIRST_NAMES[(offset + i) % FIRST_NAMES.length];
    const last = LAST_NAMES[(offset + i) % LAST_NAMES.length];
    docs.push({
      name: `${first} ${last}`,
      email: `student${offset + i + 1}@ecrms.edu`,
      password: 'password123',
      role: 'student',
      rollNo: String(rollStart + i),
      classAssigned: classDoc._id,
      phone: `98765${String(20000 + offset + i)}`,
    });
  }
  const created = [];
  for (const doc of docs) {
    created.push(await User.create(doc));
  }
  return created;
};

const run = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany(),
    Class.deleteMany(),
    Subject.deleteMany(),
    Exam.deleteMany(),
    Question.deleteMany(),
    Blueprint.deleteMany(),
    Mark.deleteMany(),
    Result.deleteMany(),
    Paper.deleteMany(),
    SeatingPlan.deleteMany(),
    Invigilation.deleteMany(),
    HallTicket.deleteMany(),
    OMRSheet.deleteMany(),
    Notification.deleteMany(),
    AuditLog.deleteMany(),
  ]);

  console.log('Seeding staff users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@ecrms.edu',
    password: 'password123',
    role: 'admin',
    phone: '9876500001',
  });

  const examController = await User.create({
    name: 'Priya Nair',
    email: 'controller@ecrms.edu',
    password: 'password123',
    role: 'exam_controller',
    phone: '9876500002',
  });

  const teacher1 = await User.create({
    name: 'Mr. Sharma',
    email: 'sharma@ecrms.edu',
    password: 'password123',
    role: 'teacher',
    phone: '9876500003',
  });

  const teacher2 = await User.create({
    name: 'Ms. Verma',
    email: 'verma@ecrms.edu',
    password: 'password123',
    role: 'teacher',
    phone: '9876500004',
  });

  const invigilator1 = await User.create({
    name: 'Mr. Patel',
    email: 'patel@ecrms.edu',
    password: 'password123',
    role: 'invigilator',
    phone: '9876500005',
  });

  const invigilator2 = await User.create({
    name: 'Mrs. Iyer',
    email: 'iyer@ecrms.edu',
    password: 'password123',
    role: 'invigilator',
    phone: '9876500006',
  });

  const principal = await User.create({
    name: 'Dr. Anjali Rao',
    email: 'principal@ecrms.edu',
    password: 'password123',
    role: 'principal',
    phone: '9876500007',
  });

  console.log('Seeding classes...');
  const class10A = await Class.create({ name: 'Class 10', section: 'A', academicYear: '2025-26', classTeacher: teacher1._id, studentCount: 22 });
  const class10B = await Class.create({ name: 'Class 10', section: 'B', academicYear: '2025-26', classTeacher: teacher2._id, studentCount: 20 });
  const class9A = await Class.create({ name: 'Class 9', section: 'A', academicYear: '2025-26', classTeacher: teacher1._id, studentCount: 16 });

  console.log('Seeding students (this creates 58 student accounts)...');
  const students10A = await createStudents(22, class10A, 101, 0);
  const students10B = await createStudents(20, class10B, 201, 22);
  const students9A = await createStudents(16, class9A, 301, 42);
  await Class.findByIdAndUpdate(class10A._id, { studentCount: students10A.length });
  await Class.findByIdAndUpdate(class10B._id, { studentCount: students10B.length });
  await Class.findByIdAndUpdate(class9A._id, { studentCount: students9A.length });

  console.log('Seeding subjects...');
  const mathematics = await Subject.create({ name: 'Mathematics', code: 'MATH10', class: class10A._id, maxMarks: 100, passingMarks: 33 });
  const science = await Subject.create({ name: 'Science', code: 'SCI10', class: class10A._id, maxMarks: 100, passingMarks: 33 });
  const english = await Subject.create({ name: 'English', code: 'ENG10', class: class10A._id, maxMarks: 100, passingMarks: 33 });
  const socialScience = await Subject.create({ name: 'Social Science', code: 'SOC10', class: class10A._id, maxMarks: 100, passingMarks: 33 });
  const physics10B = await Subject.create({ name: 'Physics', code: 'PHY10B', class: class10B._id, maxMarks: 100, passingMarks: 33 });
  const biology10B = await Subject.create({ name: 'Biology', code: 'BIO10B', class: class10B._id, maxMarks: 100, passingMarks: 33 });
  const english9A = await Subject.create({ name: 'English', code: 'ENG9A', class: class9A._id, maxMarks: 100, passingMarks: 33 });

  console.log('Seeding exams...');
  const midTermMaths = await Exam.create({ name: 'Mid Term Examination', examType: 'mid_term', class: class10A._id, subject: mathematics._id, date: new Date('2026-08-20'), startTime: '09:00', endTime: '12:00', duration: 180, room: 'Room 101', totalMarks: 100, passingMarks: 33, studentsAppearing: students10A.length, createdBy: examController._id });
  const unitTestScience = await Exam.create({ name: 'Unit Test - I', examType: 'unit_test', class: class10A._id, subject: science._id, date: new Date('2026-08-25'), startTime: '09:00', endTime: '10:30', duration: 90, room: 'Room 203', totalMarks: 100, passingMarks: 33, studentsAppearing: students10A.length, createdBy: examController._id });
  await Exam.create({ name: 'Semester End Exam', examType: 'semester_end', class: class10A._id, subject: english._id, date: new Date('2026-09-10'), startTime: '09:00', endTime: '12:00', duration: 180, room: 'Room 105', totalMarks: 100, passingMarks: 33, studentsAppearing: students10A.length, createdBy: examController._id });
  const physicsExam = await Exam.create({ name: 'Physics - Class 10B', examType: 'unit_test', class: class10B._id, subject: physics10B._id, date: new Date('2026-08-04'), startTime: '10:00', endTime: '11:30', duration: 90, room: 'Room 203', totalMarks: 100, passingMarks: 33, studentsAppearing: students10B.length, createdBy: examController._id });
  await Exam.create({ name: 'Biology - Class 10B', examType: 'unit_test', class: class10B._id, subject: biology10B._id, date: new Date('2026-08-11'), startTime: '09:00', endTime: '10:30', duration: 90, room: 'Room 101', totalMarks: 100, passingMarks: 33, studentsAppearing: students10B.length, createdBy: examController._id });
  await Exam.create({ name: 'English - Class 9A', examType: 'unit_test', class: class9A._id, subject: english9A._id, date: new Date('2026-08-13'), startTime: '11:00', endTime: '12:30', duration: 90, room: 'Room 301', totalMarks: 100, passingMarks: 33, studentsAppearing: students9A.length, createdBy: examController._id });
  await Exam.create({ name: 'Computer - Class 10A', examType: 'unit_test', class: class10A._id, subject: socialScience._id, date: new Date('2026-08-14'), startTime: '09:00', endTime: '10:00', duration: 60, room: 'Room 201', totalMarks: 100, passingMarks: 33, studentsAppearing: students10A.length, createdBy: examController._id });

  console.log('Seeding blueprint...');
  await Blueprint.create({
    subject: mathematics._id,
    class: class10A._id,
    totalMarks: 100,
    status: 'saved',
    createdBy: examController._id,
    chapters: [
      { chapter: 'Real Numbers', weightagePercent: 10, totalMarks: 10, bloomLevels: { remember: 40, understand: 30, apply: 20, analyze: 10, evaluate: 0, create: 0 }, difficulty: { easy: 40, medium: 40, hard: 20 } },
      { chapter: 'Polynomials', weightagePercent: 12, totalMarks: 12, bloomLevels: { remember: 30, understand: 30, apply: 25, analyze: 15, evaluate: 0, create: 0 }, difficulty: { easy: 35, medium: 45, hard: 20 } },
      { chapter: 'Pair of Linear Equations', weightagePercent: 15, totalMarks: 15, bloomLevels: { remember: 20, understand: 30, apply: 30, analyze: 20, evaluate: 0, create: 0 }, difficulty: { easy: 30, medium: 45, hard: 25 } },
      { chapter: 'Quadratic Equations', weightagePercent: 15, totalMarks: 15, bloomLevels: { remember: 20, understand: 25, apply: 30, analyze: 25, evaluate: 0, create: 0 }, difficulty: { easy: 25, medium: 45, hard: 30 } },
      { chapter: 'Arithmetic Progressions', weightagePercent: 13, totalMarks: 13, bloomLevels: { remember: 25, understand: 30, apply: 25, analyze: 20, evaluate: 0, create: 0 }, difficulty: { easy: 30, medium: 40, hard: 30 } },
      { chapter: 'Trigonometry', weightagePercent: 15, totalMarks: 15, bloomLevels: { remember: 20, understand: 25, apply: 30, analyze: 25, evaluate: 0, create: 0 }, difficulty: { easy: 25, medium: 45, hard: 30 } },
    ],
  });

  console.log('Seeding question bank...');
  const questionsData = [
    { questionText: 'Euclid\u2019s division lemma states that for any two positive integers a and b, there exist unique integers q and r such that a = bq + r, where r satisfies:', subject: mathematics._id, chapter: 'Real Numbers', questionType: 'mcq', options: ['0 < r < b', '0 \u2264 r < b', '0 < r \u2264 b', '0 \u2264 r \u2264 b'], correctAnswer: '0 \u2264 r < b', marks: 1, bloomLevel: 'remember', difficulty: 'easy', createdBy: admin._id },
    { questionText: 'Solve for x: 2x + 3 = 11', subject: mathematics._id, chapter: 'Pair of Linear Equations', questionType: 'short_answer', marks: 2, bloomLevel: 'apply', difficulty: 'easy', createdBy: admin._id },
    { questionText: 'Factorise: x\u00b2 \u2212 5x + 6', subject: mathematics._id, chapter: 'Polynomials', questionType: 'short_answer', marks: 2, bloomLevel: 'apply', difficulty: 'medium', createdBy: admin._id },
    { questionText: 'Derive the quadratic formula from the standard form ax\u00b2 + bx + c = 0 and use it to justify the nature of roots.', subject: mathematics._id, chapter: 'Quadratic Equations', questionType: 'long_answer', marks: 5, bloomLevel: 'analyze', difficulty: 'hard', createdBy: admin._id },
    { questionText: 'Prove that sin\u00b2\u03b8 + cos\u00b2\u03b8 = 1 using a right-angled triangle, and apply it to simplify a given trigonometric expression.', subject: mathematics._id, chapter: 'Trigonometry', questionType: 'case_study', marks: 4, bloomLevel: 'evaluate', difficulty: 'hard', createdBy: admin._id },
    { questionText: 'What is the SI unit of electric current?', subject: science._id, chapter: 'Electricity', questionType: 'mcq', options: ['Volt', 'Ampere', 'Ohm', 'Watt'], correctAnswer: 'Ampere', marks: 1, bloomLevel: 'remember', difficulty: 'easy', createdBy: teacher1._id },
    { questionText: 'Explain the process of photosynthesis with a labeled diagram.', subject: science._id, chapter: 'Life Processes', questionType: 'long_answer', marks: 5, bloomLevel: 'understand', difficulty: 'medium', createdBy: teacher1._id },
    { questionText: 'Identify the figure of speech used in: "The wind whispered through the trees."', subject: english._id, chapter: 'Poetry', questionType: 'short_answer', marks: 2, bloomLevel: 'analyze', difficulty: 'medium', createdBy: teacher2._id },
    { questionText: 'Newton\u2019s First Law of Motion is also known as the Law of:', subject: physics10B._id, chapter: 'Laws of Motion', questionType: 'mcq', options: ['Inertia', 'Gravitation', 'Conservation', 'Momentum'], correctAnswer: 'Inertia', marks: 1, bloomLevel: 'remember', difficulty: 'easy', createdBy: teacher2._id },
    { questionText: 'Describe the structure and function of a human heart.', subject: biology10B._id, chapter: 'Circulatory System', questionType: 'long_answer', marks: 5, bloomLevel: 'understand', difficulty: 'medium', createdBy: teacher2._id },
  ];
  await Question.insertMany(questionsData);

  console.log('Seeding marks and published results for Mid Term Examination (Mathematics, Class 10A)...');
  const midTermMarks = [];
  for (let i = 0; i < students10A.length; i += 1) {
    const marksObtained = seededMarks(i, midTermMaths.totalMarks);
    midTermMarks.push({
      exam: midTermMaths._id,
      student: students10A[i]._id,
      subject: mathematics._id,
      maxMarks: midTermMaths.totalMarks,
      marksObtained,
      enteredBy: teacher1._id,
    });
  }
  await Mark.insertMany(midTermMarks);

  const scored = midTermMarks
    .map((m) => ({ ...m, percentage: Number(((m.marksObtained / m.maxMarks) * 100).toFixed(2)) }))
    .sort((a, b) => b.percentage - a.percentage);

  const midTermResults = [];
  let rank = 0;
  let prevPercentage = null;
  for (let i = 0; i < scored.length; i += 1) {
    const s = scored[i];
    if (s.percentage !== prevPercentage) {
      rank = i + 1;
      prevPercentage = s.percentage;
    }
    midTermResults.push({
      exam: midTermMaths._id,
      student: s.student,
      class: class10A._id,
      totalMarks: s.maxMarks,
      marksObtained: s.marksObtained,
      percentage: s.percentage,
      grade: gradeFor(s.percentage),
      rank,
      result: s.percentage >= 33 ? 'pass' : 'fail',
      status: 'published',
      publishedAt: new Date(),
    });
  }
  await Result.insertMany(midTermResults);

  console.log('Seeding marks and results for Unit Test - I (Science, Class 10A, draft status)...');
  const unitTestMarks = [];
  for (let i = 0; i < students10A.length; i += 1) {
    const marksObtained = seededMarks(i + 7, unitTestScience.totalMarks);
    unitTestMarks.push({
      exam: unitTestScience._id,
      student: students10A[i]._id,
      subject: science._id,
      maxMarks: unitTestScience.totalMarks,
      marksObtained,
      enteredBy: teacher1._id,
    });
  }
  await Mark.insertMany(unitTestMarks);

  console.log('Seeding marks for Physics - Class 10B (unprocessed, for OMR/Result Entry demo)...');
  const physicsMarks = [];
  for (let i = 0; i < students10B.length; i += 1) {
    const marksObtained = seededMarks(i + 15, physicsExam.totalMarks);
    physicsMarks.push({
      exam: physicsExam._id,
      student: students10B[i]._id,
      subject: physics10B._id,
      maxMarks: physicsExam.totalMarks,
      marksObtained,
      enteredBy: teacher2._id,
    });
  }
  await Mark.insertMany(physicsMarks);

  const totalStudents = students10A.length + students10B.length + students9A.length;
  const passCount = midTermResults.filter((r) => r.result === 'pass').length;

  console.log('\nSeed complete!');
  console.log('----------------------------------------');
  console.log(`Students seeded: ${totalStudents} (Class 10A: ${students10A.length}, Class 10B: ${students10B.length}, Class 9A: ${students9A.length})`);
  console.log(`Mid Term Examination (Mathematics): ${midTermResults.length} published results, ${passCount} pass / ${midTermResults.length - passCount} fail`);
  console.log('Unit Test - I (Science) and Physics - Class 10B: marks entered, NOT yet processed (try Result Processing / Moderation on these)');
  console.log('----------------------------------------');
  console.log('Login credentials (all use password: password123)');
  console.log('Admin:            admin@ecrms.edu');
  console.log('Exam Controller:  controller@ecrms.edu');
  console.log('Teacher:          sharma@ecrms.edu');
  console.log('Invigilator:      patel@ecrms.edu');
  console.log('Principal:        principal@ecrms.edu');
  console.log('Student (10A):    student1@ecrms.edu   (roll 101, has a published Mid Term result)');
  console.log('Student (10B):    student23@ecrms.edu  (roll 201)');
  console.log('Student (9A):     student43@ecrms.edu  (roll 301)');
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

import asyncHandler from 'express-async-handler';
import SeatingPlan from '../models/SeatingPlan.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildSeats = (students, rows, cols, arrangement) => {
  const seats = [];
  const pool = arrangement === 'shuffled' ? shuffle(students) : students;
  let idx = 0;

  for (let r = 0; r < rows; r += 1) {
    // Zigzag: alternate the fill direction every row so adjacent students
    // (left-right and front-back) are less likely to share the same source class order.
    const colOrder = arrangement === 'zigzag' && r % 2 === 1 ? [...Array(cols).keys()].reverse() : [...Array(cols).keys()];
    for (const c of colOrder) {
      const student = pool[idx];
      idx += 1;
      seats.push({
        seatNo: `S${r + 1}${c + 1}`,
        student: student ? student._id : undefined,
        rollNo: student ? student.rollNo : undefined,
        row: r + 1,
        col: c + 1,
        isEmpty: !student,
      });
    }
  }
  // sort by row then col for predictable grid rendering
  return seats.sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row));
};

// @desc    Auto-generate a seating plan for an exam/room
// @route   POST /api/seating/generate
// @access  Private (Admin, Exam Controller, Invigilator)
export const generateSeatingPlan = asyncHandler(async (req, res) => {
  const { examId, room, rows = 6, cols = 6, arrangement = 'zigzag' } = req.body;

  const exam = await Exam.findById(examId).populate('class');
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const students = await User.find({ role: 'student', classAssigned: exam.class._id, status: 'active' }).sort({ rollNo: 1 });

  const seats = buildSeats(students, Number(rows), Number(cols), arrangement);

  let plan = await SeatingPlan.findOne({ exam: examId, room });
  if (plan) {
    plan.seats = seats;
    plan.arrangement = arrangement;
    await plan.save();
  } else {
    plan = await SeatingPlan.create({ exam: examId, room, seats, arrangement, createdBy: req.user._id });
  }

  const populated = await plan.populate('exam seats.student');
  res.status(201).json({ success: true, data: populated });
});

// @desc    Get seating plans (optionally filter by exam)
// @route   GET /api/seating
// @access  Private
export const getSeatingPlans = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.exam) query.exam = req.query.exam;

  const plans = await SeatingPlan.find(query)
    .populate({ path: 'exam', populate: 'class' })
    .populate('seats.student', 'name rollNo')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: plans });
});

// @desc    Update seat assignments (manual drag-and-drop edits)
// @route   PUT /api/seating/:id
// @access  Private (Admin, Exam Controller, Invigilator)
export const updateSeatingPlan = asyncHandler(async (req, res) => {
  const plan = await SeatingPlan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Seating plan not found');
  }
  if (req.body.seats) plan.seats = req.body.seats;
  await plan.save();
  const populated = await plan.populate('exam seats.student');
  res.json({ success: true, data: populated });
});

// @desc    Delete a seating plan
// @route   DELETE /api/seating/:id
// @access  Private (Admin, Exam Controller)
export const deleteSeatingPlan = asyncHandler(async (req, res) => {
  const plan = await SeatingPlan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Seating plan not found');
  }
  await plan.deleteOne();
  res.json({ success: true, message: 'Seating plan deleted successfully' });
});

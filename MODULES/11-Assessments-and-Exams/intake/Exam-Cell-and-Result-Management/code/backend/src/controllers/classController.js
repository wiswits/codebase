import asyncHandler from 'express-async-handler';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find().populate('classTeacher', 'name').sort({ name: 1, section: 1 });
  res.json({ success: true, data: classes });
});

// @desc    Get all subjects (optionally filter by class)
// @route   GET /api/classes/subjects
// @access  Private
export const getSubjects = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.class) query.class = req.query.class;
  const subjects = await Subject.find(query).populate('class', 'name section').sort({ name: 1 });
  res.json({ success: true, data: subjects });
});

// @desc    Get students belonging to a class
// @route   GET /api/classes/:id/students
// @access  Private
export const getStudentsByClass = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student', classAssigned: req.params.id, status: 'active' })
    .select('name email rollNo classAssigned')
    .sort({ rollNo: 1 });
  res.json({ success: true, data: students });
});

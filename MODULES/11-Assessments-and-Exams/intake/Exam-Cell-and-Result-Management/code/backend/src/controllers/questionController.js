import asyncHandler from 'express-async-handler';
import Question from '../models/Question.js';

// @desc    Get all questions (filter, search, pagination, sorting)
// @route   GET /api/questions
// @access  Private
export const getQuestions = asyncHandler(async (req, res) => {
  const {
    search,
    subject,
    chapter,
    difficulty,
    questionType,
    bloomLevel,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  const query = {};
  if (subject) query.subject = subject;
  if (chapter) query.chapter = chapter;
  if (difficulty) query.difficulty = difficulty;
  if (questionType) query.questionType = questionType;
  if (bloomLevel) query.bloomLevel = bloomLevel;
  if (search) query.questionText = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('subject', 'name code')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    Question.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: questions,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) },
  });
});

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
export const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).populate('subject');
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  res.json({ success: true, data: question });
});

// @desc    Create question
// @route   POST /api/questions
// @access  Private (Admin, Teacher, Exam Controller)
export const createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create({ ...req.body, createdBy: req.user._id });
  const populated = await question.populate('subject', 'name code');
  res.status(201).json({ success: true, data: populated });
});

// @desc    Bulk create questions (CSV/Excel import)
// @route   POST /api/questions/bulk
// @access  Private (Admin, Teacher, Exam Controller)
export const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    res.status(400);
    throw new Error('No questions provided for import');
  }
  const docs = questions.map((q) => ({ ...q, createdBy: req.user._id }));
  const created = await Question.insertMany(docs, { ordered: false });
  res.status(201).json({ success: true, count: created.length, data: created });
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Admin, Teacher, Exam Controller)
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  Object.assign(question, req.body);
  await question.save();
  const populated = await question.populate('subject', 'name code');
  res.json({ success: true, data: populated });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Admin, Teacher, Exam Controller)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  await question.deleteOne();
  res.json({ success: true, message: 'Question deleted successfully' });
});

// @desc    Get distinct chapters for a subject
// @route   GET /api/questions/chapters/:subjectId
// @access  Private
export const getChaptersForSubject = asyncHandler(async (req, res) => {
  const chapters = await Question.distinct('chapter', { subject: req.params.subjectId });
  res.json({ success: true, data: chapters });
});

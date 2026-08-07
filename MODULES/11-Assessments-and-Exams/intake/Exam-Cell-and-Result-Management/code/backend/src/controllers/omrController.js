import asyncHandler from 'express-async-handler';
import OMRSheet from '../models/OMRSheet.js';

// @desc    Upload OMR sheet(s) for an exam
// @route   POST /api/omr/upload
// @access  Private (Admin, Teacher, Invigilator)
export const uploadOMRSheet = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  if (!examId) {
    res.status(400);
    throw new Error('examId is required');
  }
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  const sheets = await Promise.all(
    req.files.map((file) =>
      OMRSheet.create({
        exam: examId,
        fileName: file.originalname,
        filePath: `/uploads/omr/${file.filename}`,
        uploadedBy: req.user._id,
        status: 'pending',
      })
    )
  );

  res.status(201).json({ success: true, count: sheets.length, data: sheets });
});

// @desc    Get OMR sheets (filter by exam / status)
// @route   GET /api/omr
// @access  Private
export const getOMRSheets = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.exam) query.exam = req.query.exam;
  if (req.query.status) query.status = req.query.status;

  const sheets = await OMRSheet.find(query)
    .populate({ path: 'exam', populate: 'subject class' })
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: sheets });
});

// @desc    Simulate evaluation of a pending OMR sheet (auto-scoring engine result)
// @route   POST /api/omr/:id/evaluate
// @access  Private (Admin, Teacher)
export const evaluateOMRSheet = asyncHandler(async (req, res) => {
  const sheet = await OMRSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error('OMR sheet not found');
  }

  sheet.status = 'processing';
  await sheet.save();

  // Simulated scanner accuracy + marks — in production this is where an
  // actual OMR recognition pipeline would run against the answer key.
  const accuracy = Number((94 + Math.random() * 5.5).toFixed(2));
  const marksAwarded = Math.floor(60 + Math.random() * 35);

  sheet.status = 'completed';
  sheet.accuracy = accuracy;
  sheet.marksAwarded = marksAwarded;
  await sheet.save();

  res.json({ success: true, data: sheet });
});

// @desc    Delete an OMR sheet
// @route   DELETE /api/omr/:id
// @access  Private (Admin, Teacher)
export const deleteOMRSheet = asyncHandler(async (req, res) => {
  const sheet = await OMRSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error('OMR sheet not found');
  }
  await sheet.deleteOne();
  res.json({ success: true, message: 'OMR sheet deleted' });
});

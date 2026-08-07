import asyncHandler from 'express-async-handler';
import Blueprint from '../models/Blueprint.js';

// @desc    Get all blueprints
// @route   GET /api/blueprints
// @access  Private
export const getBlueprints = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.subject) query.subject = req.query.subject;
  if (req.query.class) query.class = req.query.class;
  const blueprints = await Blueprint.find(query).populate('subject class createdBy', 'name section code').sort({ createdAt: -1 });
  res.json({ success: true, data: blueprints });
});

// @desc    Create blueprint
// @route   POST /api/blueprints
// @access  Private (Admin, Exam Controller, Teacher)
export const createBlueprint = asyncHandler(async (req, res) => {
  const blueprint = await Blueprint.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: blueprint });
});

// @desc    Update blueprint
// @route   PUT /api/blueprints/:id
// @access  Private (Admin, Exam Controller, Teacher)
export const updateBlueprint = asyncHandler(async (req, res) => {
  const blueprint = await Blueprint.findById(req.params.id);
  if (!blueprint) {
    res.status(404);
    throw new Error('Blueprint not found');
  }
  Object.assign(blueprint, req.body);
  await blueprint.save();
  res.json({ success: true, data: blueprint });
});

// @desc    Delete blueprint
// @route   DELETE /api/blueprints/:id
// @access  Private (Admin, Exam Controller)
export const deleteBlueprint = asyncHandler(async (req, res) => {
  const blueprint = await Blueprint.findById(req.params.id);
  if (!blueprint) {
    res.status(404);
    throw new Error('Blueprint not found');
  }
  await blueprint.deleteOne();
  res.json({ success: true, message: 'Blueprint deleted successfully' });
});

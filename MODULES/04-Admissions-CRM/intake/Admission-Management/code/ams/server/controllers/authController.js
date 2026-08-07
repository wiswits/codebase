const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const token = signToken(user);
  res.json(new ApiResponse(200, { token, user: user.toSafeObject() }, 'Login successful'));
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, { user: req.user.toSafeObject() }));
});

// POST /api/auth/register (admin only - creates staff accounts)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'A user with this email already exists');

  const user = await User.create({ name, email, password, role, phone });
  res.status(201).json(new ApiResponse(201, { user: user.toSafeObject() }, 'User created'));
});

// GET /api/auth/users (admin - list staff for assignment dropdowns)
const listUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const users = await User.find(filter).select('name email role isActive');
  res.json(new ApiResponse(200, { users }));
});

module.exports = { login, getMe, register, listUsers };

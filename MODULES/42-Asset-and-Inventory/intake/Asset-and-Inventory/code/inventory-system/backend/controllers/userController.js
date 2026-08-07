const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
    : {};
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }
  const user = await User.create({ name, email, password, role, phone });
  res.status(201).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isSelf = req.user._id.toString() === user._id.toString();
  if (!isSelf && req.user.role !== "Admin") {
    res.status(403);
    throw new Error("Not authorized to update this user");
  }

  user.name = req.body.name ?? user.name;
  user.phone = req.body.phone ?? user.phone;
  if (req.body.password) user.password = req.body.password;

  // Only Admins may change email, role or active status
  if (req.user.role === "Admin") {
    user.email = req.body.email ?? user.email;
    user.role = req.body.role ?? user.role;
    user.isActive = req.body.isActive ?? user.isActive;
  }

  const updated = await user.save();
  res.json(updated);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  await user.deleteOne();
  res.json({ message: "User removed" });
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };

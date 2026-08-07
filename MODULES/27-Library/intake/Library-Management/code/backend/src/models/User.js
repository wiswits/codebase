const mongoose = require("mongoose");

// NOTE: Per PRD section 11/12, real authentication is not yet built.
// This collection stores demo users so the dev-only role switcher
// (frontend) can simulate admin/teacher/student/parent sessions.
// In production this would be replaced by WisWits's shared core
// organization/user data — this module would just reference userId + orgId.

const userSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, default: "demo-school" },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      required: true,
    },
    studentCode: { type: String }, // e.g. STU-1001, only for students
    linkedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // for parents
    email: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

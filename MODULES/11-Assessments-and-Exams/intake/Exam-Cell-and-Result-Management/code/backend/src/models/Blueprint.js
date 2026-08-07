import mongoose from 'mongoose';

const chapterRowSchema = new mongoose.Schema(
  {
    chapter: { type: String, required: true, trim: true },
    weightagePercent: { type: Number, required: true, min: 0, max: 100 },
    totalMarks: { type: Number, required: true, min: 0 },
    bloomLevels: {
      remember: { type: Number, default: 0 },
      understand: { type: Number, default: 0 },
      apply: { type: Number, default: 0 },
      analyze: { type: Number, default: 0 },
      evaluate: { type: Number, default: 0 },
      create: { type: Number, default: 0 },
    },
    difficulty: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const blueprintSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    totalMarks: { type: Number, required: true, default: 100 },
    chapters: [chapterRowSchema],
    status: { type: String, enum: ['draft', 'saved', 'validated'], default: 'draft' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Blueprint', blueprintSchema);

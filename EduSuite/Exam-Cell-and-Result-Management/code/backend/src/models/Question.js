import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: [true, 'Question text is required'], trim: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    chapter: { type: String, required: true, trim: true },
    questionType: {
      type: String,
      enum: ['mcq', 'short_answer', 'long_answer', 'case_study', 'true_false', 'fill_blank'],
      required: true,
    },
    options: [{ type: String }],
    correctAnswer: { type: String },
    marks: { type: Number, required: true, min: 1 },
    bloomLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      required: true,
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: [{ type: String, trim: true }],
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

questionSchema.index({ subject: 1, chapter: 1, difficulty: 1 });
questionSchema.index({ questionText: 'text' });

export default mongoose.model('Question', questionSchema);

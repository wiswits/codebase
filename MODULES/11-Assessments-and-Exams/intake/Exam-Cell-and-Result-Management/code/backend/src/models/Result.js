import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    totalMarks: { type: Number, required: true },
    marksObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    isAbsent: { type: Boolean, default: false },
    grade: { type: String },
    rank: { type: Number },
    result: { type: String, enum: ['pass', 'fail'], required: true },
    status: { type: String, enum: ['draft', 'reviewed', 'approved', 'published'], default: 'draft' },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.model('Result', resultSchema);

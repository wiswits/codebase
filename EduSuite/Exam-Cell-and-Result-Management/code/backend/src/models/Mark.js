import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    maxMarks: { type: Number, required: true },
    marksObtained: { type: Number, required: true },
    isAbsent: { type: Boolean, default: false },
    remarks: { type: String },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moderated: { type: Boolean, default: false },
    moderatedMarks: { type: Number },
    moderationReason: { type: String },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

markSchema.index({ exam: 1, student: 1, subject: 1 }, { unique: true });

export default mongoose.model('Mark', markSchema);

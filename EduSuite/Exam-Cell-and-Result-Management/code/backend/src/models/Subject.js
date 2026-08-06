import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    maxMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 33 },
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);

import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true },
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('Class', classSchema);

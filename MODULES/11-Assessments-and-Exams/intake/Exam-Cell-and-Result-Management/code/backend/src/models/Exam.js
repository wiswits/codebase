import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Exam name is required'], trim: true },
    examType: {
      type: String,
      enum: ['unit_test', 'mid_term', 'semester_end', 'annual', 'other'],
      default: 'unit_test',
    },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: [true, 'Exam date is required'] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    room: { type: String, trim: true },
    totalMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 33 },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    studentsAppearing: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

examSchema.index({ date: 1, class: 1 });

export default mongoose.model('Exam', examSchema);

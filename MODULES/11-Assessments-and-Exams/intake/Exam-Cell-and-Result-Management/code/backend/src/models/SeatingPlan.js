import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema(
  {
    seatNo: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rollNo: { type: String },
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    isEmpty: { type: Boolean, default: false },
  },
  { _id: false }
);

const seatingPlanSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    room: { type: String, required: true },
    seats: [seatSchema],
    arrangement: { type: String, enum: ['linear', 'zigzag', 'shuffled'], default: 'zigzag' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('SeatingPlan', seatingPlanSchema);

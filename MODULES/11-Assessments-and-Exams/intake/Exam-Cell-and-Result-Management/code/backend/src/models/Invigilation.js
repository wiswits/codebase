import mongoose from 'mongoose';

const invigilationSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    room: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    invigilators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    status: { type: String, enum: ['assigned', 'confirmed', 'completed'], default: 'assigned' },
  },
  { timestamps: true }
);

export default mongoose.model('Invigilation', invigilationSchema);

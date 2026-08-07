import mongoose from 'mongoose';

const omrSheetSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'error'], default: 'pending' },
    accuracy: { type: Number },
    marksAwarded: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model('OMRSheet', omrSheetSchema);

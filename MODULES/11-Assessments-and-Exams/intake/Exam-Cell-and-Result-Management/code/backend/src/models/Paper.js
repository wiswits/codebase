import mongoose from 'mongoose';

const paperSectionSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    marksPerQuestion: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
  },
  { _id: false }
);

const paperSchema = new mongoose.Schema(
  {
    blueprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Blueprint', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
    setLabel: { type: String, required: true },
    sections: [paperSectionSchema],
    totalMarks: { type: Number, required: true },
    duration: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'generated', 'finalized'], default: 'generated' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Paper', paperSchema);

import mongoose from 'mongoose';

const hallTicketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    room: { type: String },
    qrCodeData: { type: String },
    issuedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['generated', 'downloaded', 'printed'], default: 'generated' },
  },
  { timestamps: true }
);

export default mongoose.model('HallTicket', hallTicketSchema);

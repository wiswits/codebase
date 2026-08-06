import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    institutionName: { type: String, default: 'Greenfield Public School' },
    academicYear: { type: String, default: '2025-26' },
    timeZone: { type: String, default: '(GMT+05:30) India Standard Time' },
    dateFormat: { type: String, default: 'DD-MM-YYYY' },
    currency: { type: String, default: 'INR - Indian Rupee' },
    defaultLanguage: { type: String, default: 'English' },
    gradingScale: [
      {
        grade: String,
        minPercent: Number,
        maxPercent: Number,
      },
    ],
    passingPercent: { type: Number, default: 33 },
    showRank: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);

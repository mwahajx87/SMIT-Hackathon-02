import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true
    },
    timezone: {
      type: String,
      default: 'Asia/Karachi'
    },
    officeStart: {
      type: String,
      default: '09:00'
    },
    graceMinutes: {
      type: Number,
      default: 15
    },
    halfDayHours: {
      type: Number,
      default: 5
    },
    weekendDays: {
      type: [Number],
      default: [0, 6] // 0: Sunday, 6: Saturday
    },
    officeLat: {
      type: Number,
      default: null
    },
    officeLng: {
      type: Number,
      default: null
    },
    officeRadiusM: {
      type: Number,
      default: 150
    },
    hraPct: {
      type: Number,
      default: 40
    },
    medicalPct: {
      type: Number,
      default: 10
    },
    setupComplete: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);

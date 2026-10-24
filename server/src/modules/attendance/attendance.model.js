import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    checkInAt: {
      type: Date,
      required: true
    },
    checkOutAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['present', 'late', 'half_day', 'missing_checkout', 'on_leave', 'absent'],
      default: 'present'
    },
    workedMinutes: {
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: ['web', 'camera', 'correction'],
      default: 'web'
    },
    isWorkingDay: {
      type: Boolean,
      default: true
    },
    ruleSnapshot: {
      officeStart: { type: String, default: '09:00' },
      graceMinutes: { type: Number, default: 15 },
      halfDayHours: { type: Number, default: 5 }
    },
    correctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceCorrection',
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// One attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);

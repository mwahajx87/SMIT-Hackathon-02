import mongoose from 'mongoose';

const correctionSchema = new mongoose.Schema(
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
    requestedCheckIn: {
      type: String, // HH:mm
      default: null
    },
    requestedCheckOut: {
      type: String, // HH:mm
      default: null
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionComment: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const AttendanceCorrection = mongoose.model('AttendanceCorrection', correctionSchema);

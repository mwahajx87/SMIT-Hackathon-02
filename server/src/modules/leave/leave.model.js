import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    leaveType: {
      type: String,
      required: true,
      enum: ['annual', 'sick', 'casual', 'unpaid']
    },
    startDate: {
      type: String, // YYYY-MM-DD
      required: true
    },
    endDate: {
      type: String, // YYYY-MM-DD
      required: true
    },
    workingDays: {
      type: Number,
      required: true,
      min: 1
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionComment: {
      type: String,
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

// Compound index for overlap queries
leaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

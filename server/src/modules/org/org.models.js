import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    }
  },
  { timestamps: true, versionKey: false }
);

export const Department = mongoose.model('Department', departmentSchema);

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  { timestamps: true, versionKey: false }
);

export const Designation = mongoose.model('Designation', designationSchema);

const leaveTypeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['annual', 'sick', 'casual', 'unpaid'],
      trim: true
    },
    name: {
      type: String,
      required: true
    },
    yearlyQuota: {
      type: Number,
      default: null // null indicates unlimited
    },
    isPaid: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, versionKey: false }
);

export const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    }
  },
  { timestamps: true, versionKey: false }
);

export const Holiday = mongoose.model('Holiday', holidaySchema);

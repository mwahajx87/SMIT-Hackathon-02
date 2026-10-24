import mongoose from 'mongoose';

const payrollItemSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    departmentName: { type: String, default: '-' },
    designationTitle: { type: String, default: '-' },
    basicSalary: { type: Number, required: true },
    hra: { type: Number, required: true },
    medical: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    workingDaysInMonth: { type: Number, required: true },
    perDayRate: { type: Number, required: true },
    absentDays: { type: Number, default: 0 },
    unpaidLeaveDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    outsideEmploymentDays: { type: Number, default: 0 },
    deductionDays: { type: Number, default: 0 },
    deductionAmount: { type: Number, default: 0 },
    annualTax: { type: Number, default: 0 },
    monthlyTax: { type: Number, default: 0 },
    netSalary: { type: Number, required: true }
  },
  { _id: true, versionKey: false }
);

const payrollRunSchema = new mongoose.Schema(
  {
    month: {
      type: String, // YYYY-MM
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'finalized'],
      default: 'draft',
      index: true
    },
    totalEmployees: { type: Number, default: 0 },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    items: [payrollItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    finalizedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true, versionKey: false }
);

export const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);

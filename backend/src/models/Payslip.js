import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0
    },
    allowances: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Paid'
    }
  },
  { timestamps: true }
);

// Prevent duplicate pay runs for same employee, month, and year
payslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payslip = mongoose.model('Payslip', payslipSchema);
export default Payslip;

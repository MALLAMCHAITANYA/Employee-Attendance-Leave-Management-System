import mongoose from 'mongoose';

const LEAVE_TYPES = ['Sick', 'Casual', 'Optional'];

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    leaveType: {
      type: String,
      enum: LEAVE_TYPES,
      default: 'Casual'
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    managerComment: { type: String }
  },
  { timestamps: true }
);

leaveSchema.statics.LEAVE_TYPES = LEAVE_TYPES;

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;


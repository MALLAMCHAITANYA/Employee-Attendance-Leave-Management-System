import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    loginTime: { type: Date, required: true },
    logoutTime: { type: Date },
    hours: { type: Number }, // in hours
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Pending'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;


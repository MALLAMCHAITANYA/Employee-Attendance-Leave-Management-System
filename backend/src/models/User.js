import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_VALUES, ROLES } from '../utils/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dob: { type: Date },
    age: { type: Number },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.EMPLOYEE
    },
    notificationPreferences: {
      leaveApprovals: { type: Boolean, default: true },
      attendanceAlerts: { type: Boolean, default: true },
      feedbackReminders: { type: Boolean, default: false }
    },
    /** Annual leave quota (days per year). If not set, default is used (e.g. 20). */
    annualLeaveDays: { type: Number, default: null }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;


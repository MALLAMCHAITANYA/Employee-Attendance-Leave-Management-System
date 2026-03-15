import User from '../models/User.js';

export const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, dob, age, email, notificationPreferences, annualLeaveDays } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (dob !== undefined) user.dob = dob;
    if (age !== undefined) user.age = age;
    if (email !== undefined) user.email = email;
    if (annualLeaveDays !== undefined) {
      const n = Number(annualLeaveDays);
      user.annualLeaveDays = Number.isFinite(n) && n >= 0 ? n : null;
    }
    if (notificationPreferences !== undefined && typeof notificationPreferences === 'object') {
      user.notificationPreferences = user.notificationPreferences || {};
      if (typeof notificationPreferences.leaveApprovals === 'boolean') {
        user.notificationPreferences.leaveApprovals = notificationPreferences.leaveApprovals;
      }
      if (typeof notificationPreferences.attendanceAlerts === 'boolean') {
        user.notificationPreferences.attendanceAlerts = notificationPreferences.attendanceAlerts;
      }
      if (typeof notificationPreferences.feedbackReminders === 'boolean') {
        user.notificationPreferences.feedbackReminders = notificationPreferences.feedbackReminders;
      }
    }

    await user.save();

    const u = user.toObject();
    delete u.password;
    res.json(u);
  } catch (error) {
    next(error);
  }
};


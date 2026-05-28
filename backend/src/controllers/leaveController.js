import Leave from '../models/Leave.js';
import Notification from '../models/Notification.js';
import { LEAVE_LIMITS, TOTAL_LEAVE_DAYS } from '../config/leave.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import AuditLog from '../models/AuditLog.js';

const VALID_TYPES = Object.keys(LEAVE_LIMITS);

/** Count approved days in year for a leave type (or all). Overlapping days with year are counted. */
async function getUsedDaysInYear(employeeId, year, leaveType = null) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
  const filter = {
    employee: employeeId,
    status: 'Approved',
    $or: [
      { fromDate: { $gte: startOfYear, $lte: endOfYear } },
      { toDate: { $gte: startOfYear, $lte: endOfYear } }
    ]
  };
  if (leaveType) filter.leaveType = leaveType;
  const approved = await Leave.find(filter).lean();
  let total = 0;
  for (const l of approved) {
    const overlapStart = new Date(Math.max(l.fromDate.getTime(), startOfYear.getTime()));
    const overlapEnd = new Date(Math.min(l.toDate.getTime(), endOfYear.getTime()));
    const days = Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1);
    total += days;
  }
  return total;
}

export const createLeave = async (req, res, next) => {
  try {
    const { fromDate, toDate, reason, leaveType } = req.body;

    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    const type = leaveType && VALID_TYPES.includes(leaveType) ? leaveType : 'Casual';

    const year = from.getFullYear();
    const usedForType = await getUsedDaysInYear(req.user._id, year, type);
    const limitForType = LEAVE_LIMITS[type];
    if (usedForType + days > limitForType) {
      return res.status(400).json({
        message: `${type} leave limit is ${limitForType} days per year. You have already used ${usedForType} days. This request would exceed the limit.`
      });
    }

    const totalUsed = await getUsedDaysInYear(req.user._id, year);
    const limit = req.user.annualLeaveDays || TOTAL_LEAVE_DAYS;
    if (totalUsed + days > limit) {
      return res.status(400).json({
        message: `Total leave per year cannot exceed ${limit} days. You have used ${totalUsed} days so far.`
      });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType: type,
      fromDate: from,
      toDate: to,
      days,
      reason
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'LEAVE_SUBMIT',
      details: `Submitted ${type} leave request for ${days} days (from ${fromDate} to ${toDate})`,
      ipAddress: req.ip
    });

    res.status(201).json(leave);
  } catch (error) {
    next(error);
  }
};

export const getMyLeaves = async (req, res, next) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const filter = { employee: req.user._id };
    if (type && VALID_TYPES.includes(type)) {
      filter.leaveType = type;
    }
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      filter.status = status;
    }
    if (startDate || endDate) {
      filter.fromDate = {};
      if (startDate) filter.fromDate.$gte = new Date(startDate);
      if (endDate) filter.fromDate.$lte = new Date(endDate);
    }
    const leaves = await Leave.find(filter).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    next(error);
  }
};

/** Leave balance: per-type limit/used/remaining, total 15 days. */
export const getLeaveBalance = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const byType = {};
    let totalUsed = 0;
    for (const t of VALID_TYPES) {
      const used = await getUsedDaysInYear(req.user._id, year, t);
      const limit = LEAVE_LIMITS[t];
      totalUsed += used;
      byType[t] = { limit, used, remaining: Math.max(0, limit - used) };
    }

    const limit = req.user.annualLeaveDays || TOTAL_LEAVE_DAYS;
    res.json({
      year,
      total: limit,
      used: totalUsed,
      remaining: Math.max(0, limit - totalUsed),
      byType
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveTypes = (req, res) => {
  res.json(VALID_TYPES);
};

export const getPendingLeaves = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const filter = { status: 'Pending' };
    if (type && VALID_TYPES.includes(type)) {
      filter.leaveType = type;
    }
    if (startDate || endDate) {
      filter.fromDate = {};
      if (startDate) filter.fromDate.$gte = new Date(startDate);
      if (endDate) filter.fromDate.$lte = new Date(endDate);
    }

    // Filter by manager's department
    if (req.user.role === 'manager') {
      const userIds = await User.find({ department: req.user.department }).distinct('_id');
      filter.employee = { $in: userIds };
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'name email role department branch')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, managerComment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    leave.status = status;
    if (managerComment) leave.managerComment = managerComment;

    await leave.save();

    const employee = await User.findById(leave.employee);

    try {
      await Notification.create({
        recipient: leave.employee,
        message: `Your ${leave.leaveType} leave request from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} (${leave.days} days) has been ${status.toLowerCase()}.`,
        type: 'leave_approval'
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }

    // Send email alert if preference is set
    if (employee && employee.notificationPreferences && employee.notificationPreferences.leaveApprovals) {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b;">Leave Request Status Update</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Hello ${employee.name},
          </p>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Your request for <strong>${leave.leaveType}</strong> leave from <strong>${new Date(leave.fromDate).toLocaleDateString()}</strong> to <strong>${new Date(leave.toDate).toLocaleDateString()}</strong> (${leave.days} days) has been <strong>${status.toLowerCase()}</strong>.
          </p>
          ${managerComment ? `<p style="color: #475569; font-size: 14px; line-height: 1.6;"><strong>Manager Comment:</strong> ${managerComment}</p>` : ''}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px;">
            This is an automated notification. Please check your dashboard for details.
          </p>
        </div>
      `;
      try {
        await sendEmail({
          to: employee.email,
          subject: `Work Space - Leave Request ${status}`,
          html: emailContent,
          text: `Your ${leave.leaveType} leave request from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} has been ${status.toLowerCase()}.`
        });
      } catch (err) {
        console.error('Failed to send leave status email:', err);
      }
    }

    // Log the approval/rejection
    await AuditLog.create({
      user: req.user._id,
      action: `LEAVE_${status.toUpperCase()}`,
      details: `${status} leave ID ${leave._id} for user ${employee?.name || 'Unknown'}`,
      ipAddress: req.ip
    });

    res.json(leave);
  } catch (error) {
    next(error);
  }
};

export const cancelLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    // Check if the user owns the leave request
    if (leave.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this leave' });
    }

    if (leave.status === 'Rejected') {
      return res.status(400).json({ message: 'Cannot cancel a rejected leave request' });
    }

    leave.status = 'Cancelled';
    await leave.save();

    // Log the cancellation
    await AuditLog.create({
      user: req.user._id,
      action: 'LEAVE_CANCEL',
      details: `Cancelled ${leave.leaveType} leave request from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Leave request cancelled successfully', leave });
  } catch (error) {
    next(error);
  }
};

import Leave from '../models/Leave.js';
import { LEAVE_LIMITS, TOTAL_LEAVE_DAYS } from '../config/leave.js';

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
    if (totalUsed + days > TOTAL_LEAVE_DAYS) {
      return res.status(400).json({
        message: `Total leave per year cannot exceed ${TOTAL_LEAVE_DAYS} days. You have used ${totalUsed} days so far.`
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

    res.status(201).json(leave);
  } catch (error) {
    next(error);
  }
};

export const getMyLeaves = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { employee: req.user._id };
    if (type && VALID_TYPES.includes(type)) {
      filter.leaveType = type;
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

    res.json({
      year,
      total: TOTAL_LEAVE_DAYS,
      used: totalUsed,
      remaining: Math.max(0, TOTAL_LEAVE_DAYS - totalUsed),
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
    const { type } = req.query;
    const filter = { status: 'Pending' };
    if (type && VALID_TYPES.includes(type)) {
      filter.leaveType = type;
    }
    const leaves = await Leave.find(filter)
      .populate('employee', 'name email role')
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

    res.json(leave);
  } catch (error) {
    next(error);
  }
};

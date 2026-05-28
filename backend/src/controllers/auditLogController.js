import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const { action, startDate, endDate, search } = req.query;

    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Populate user to allow searching by user name or email
    let logs;
    let total;

    if (search) {
      // Find logs matching action search, details search
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

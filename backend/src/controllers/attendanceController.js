import Attendance from '../models/Attendance.js';
import { MIN_WORK_HOURS } from '../config/attendance.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const getDateOnly = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Group raw records by calendar date and compute first sign-in, last sign-out,
 * total hours, and status per day.
 * - No sign-out for the day → Absent
 * - Past day: totalHours >= minHours → Present, else → Absent
 * - Today: totalHours >= minHours → Present, else → Pending (day not completed)
 */
function aggregateByDate(records, minHours = MIN_WORK_HOURS) {
  const byDate = {};

  for (const r of records) {
    const dateKey = getDateOnly(r.date).getTime();
    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        date: getDateOnly(r.date),
        firstSignIn: r.loginTime,
        lastSignOut: r.logoutTime || null,
        totalHours: null,
        hasOpenSession: !r.logoutTime
      };
    } else {
      const agg = byDate[dateKey];
      if (r.loginTime < agg.firstSignIn) agg.firstSignIn = r.loginTime;
      if (r.logoutTime && (!agg.lastSignOut || r.logoutTime > agg.lastSignOut)) {
        agg.lastSignOut = r.logoutTime;
      }
      if (!r.logoutTime) agg.hasOpenSession = true;
    }
  }

  const today = getDateOnly(new Date());
  const result = [];

  for (const key of Object.keys(byDate)) {
    const agg = byDate[key];
    const date = agg.date;
    const totalHours = agg.lastSignOut
      ? (agg.lastSignOut - agg.firstSignIn) / (1000 * 60 * 60)
      : null;
    agg.totalHours = totalHours != null ? Number(totalHours.toFixed(2)) : null;

    let status;
    if (!agg.lastSignOut) {
      status = 'Absent'; // signed in but never signed out
    } else {
      const isToday = date.getTime() === today.getTime();
      if (totalHours >= minHours) {
        status = 'Present';
      } else if (isToday) {
        status = 'Pending'; // day not completed, may work more
      } else {
        status = 'Absent'; // past day, did not meet hours
      }
    }

    result.push({
      date: agg.date,
      firstSignIn: agg.firstSignIn,
      lastSignOut: agg.lastSignOut,
      totalHours: agg.totalHours,
      status
    });
  }

  result.sort((a, b) => b.date.getTime() - a.date.getTime());
  return result;
}

export const getMyAttendance = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : null;
    const month = req.query.month ? parseInt(req.query.month, 10) : null; // 1-12

    let rawRecords;
    if (year != null && month != null && month >= 1 && month <= 12) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      rawRecords = await Attendance.find({
        user: req.user._id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      })
        .sort({ date: 1, loginTime: 1 })
        .lean();
    } else {
      rawRecords = await Attendance.find({ user: req.user._id })
        .sort({ date: -1, loginTime: -1 })
        .limit(200)
        .lean();
    }

    const aggregated = aggregateByDate(rawRecords);
    const minHours = MIN_WORK_HOURS;

    // For month view, return list sorted by date ascending; otherwise first 60 descending
    const list = year != null && month != null
      ? aggregated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : aggregated.slice(0, 60);

    res.json({
      list,
      minWorkHours: minHours
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendanceSummary = async (req, res, next) => {
  try {
    const rawRecords = await Attendance.find({ user: req.user._id }).lean();
    const aggregated = aggregateByDate(rawRecords);

    const totalPresent = aggregated.filter((r) => r.status === 'Present').length;
    const totalAbsent = aggregated.filter((r) => r.status === 'Absent').length;
    const totalPending = aggregated.filter((r) => r.status === 'Pending').length;

    const today = getDateOnly(new Date());
    const todayAgg = aggregated.find(
      (a) => getDateOnly(a.date).getTime() === today.getTime()
    );

    // Open session = today has a record with no logoutTime
    const todayRawRecords = rawRecords.filter(
      (r) => getDateOnly(r.date).getTime() === today.getTime()
    );
    const openSession = todayRawRecords.find((r) => !r.logoutTime);
    const isClockedIn = !!openSession;
    const todayLoginTime = openSession?.loginTime || null;

    res.json({
      totalDays: aggregated.length,
      totalPresent,
      totalAbsent,
      totalPending,
      todayStatus: todayAgg?.status ?? 'N/A',
      hoursToday: todayAgg?.totalHours ?? 0,
      isClockedIn,
      todayLoginTime: todayLoginTime
        ? todayLoginTime.toISOString()
        : null,
      minWorkHours: MIN_WORK_HOURS
    });
  } catch (error) {
    next(error);
  }
};

/** Attendance Sign In – allowed multiple times per day. */
export const signIn = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const dateOnly = getDateOnly(now);

    const record = await Attendance.create({
      user: userId,
      date: dateOnly,
      loginTime: now,
      status: 'Pending'
    });

    await AuditLog.create({
      user: userId,
      action: 'ATTENDANCE_SIGN_IN',
      details: `Signed in for attendance at ${now.toLocaleTimeString()}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Attendance signed in',
      attendance: record
    });
  } catch (error) {
    next(error);
  }
};

/** Attendance Sign Out – closes the most recent open session for today. */
export const signOut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const dateOnly = getDateOnly(now);

    const record = await Attendance.findOne({
      user: userId,
      date: dateOnly,
      $or: [{ logoutTime: null }, { logoutTime: { $exists: false } }]
    })
      .sort({ loginTime: -1 })
      .exec();

    if (!record) {
      return res.status(400).json({
        message:
          'No active attendance session for today. Sign in first from the Attendance page.'
      });
    }

    record.logoutTime = now;
    const diffMs = record.logoutTime - record.loginTime;
    record.hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    await record.save();

    await AuditLog.create({
      user: userId,
      action: 'ATTENDANCE_SIGN_OUT',
      details: `Signed out from attendance. Worked for ${record.hours} hours`,
      ipAddress: req.ip
    });

    res.json({
      message: 'Attendance signed out',
      attendance: record
    });
  } catch (error) {
    next(error);
  }
};

export const exportAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = getDateOnly(new Date(startDate));
      if (endDate) filter.date.$lte = getDateOnly(new Date(endDate));
    }

    const rawRecords = await Attendance.find(filter)
      .sort({ date: -1, loginTime: -1 })
      .lean();

    const aggregated = aggregateByDate(rawRecords);

    const csvRows = ['Date,First Sign In,Last Sign Out,Total Hours,Status'];
    const formatTime = (isoString) => {
      if (!isoString) return 'N/A';
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    for (const r of aggregated) {
      const formattedDate = r.date.toISOString().split('T')[0];
      const firstIn = formatTime(r.firstSignIn);
      const lastOut = formatTime(r.lastSignOut);
      const hrs = r.totalHours != null ? r.totalHours : '0';
      csvRows.push(`"${formattedDate}","${firstIn}","${lastOut}","${hrs}","${r.status}"`);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_history.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    next(error);
  }
};

export const getTeamAttendance = async (req, res, next) => {
  try {
    const { date, department } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dateOnly = getDateOnly(targetDate);

    // Build user filter
    const userFilter = {};
    if (req.user.role === 'manager') {
      userFilter.department = req.user.department;
    } else if (department) {
      userFilter.department = department;
    }

    const teamUsers = await User.find(userFilter).select('name email role department branch').lean();
    const userIds = teamUsers.map(u => u._id);

    // Fetch attendance for these users on the target date
    const records = await Attendance.find({
      user: { $in: userIds },
      date: dateOnly
    }).lean();

    // Group records by user
    const userRecordsMap = {};
    for (const r of records) {
      const uId = r.user.toString();
      if (!userRecordsMap[uId]) {
        userRecordsMap[uId] = [];
      }
      userRecordsMap[uId].push(r);
    }

    const result = teamUsers.map(u => {
      const uRecords = userRecordsMap[u._id.toString()] || [];
      
      let status = 'Absent';
      let firstSignIn = null;
      let lastSignOut = null;
      let totalHours = 0;
      let hasOpenSession = false;

      if (uRecords.length > 0) {
        // Find earliest login time
        firstSignIn = uRecords[0].loginTime;
        for (const r of uRecords) {
          if (r.loginTime < firstSignIn) {
            firstSignIn = r.loginTime;
          }
          if (r.logoutTime) {
            if (!lastSignOut || r.logoutTime > lastSignOut) {
              lastSignOut = r.logoutTime;
            }
          } else {
            hasOpenSession = true;
          }
          totalHours += r.hours || 0;
        }

        totalHours = Number(totalHours.toFixed(2));

        // Determine status dynamically
        if (hasOpenSession && !lastSignOut) {
          status = 'Pending';
        } else if (!lastSignOut) {
          status = 'Absent';
        } else {
          const isToday = dateOnly.getTime() === getDateOnly(new Date()).getTime();
          if (totalHours >= MIN_WORK_HOURS) {
            status = 'Present';
          } else if (isToday) {
            status = 'Pending';
          } else {
            status = 'Absent';
          }
        }
      }

      return {
        user: u,
        status,
        firstSignIn,
        lastSignOut,
        hours: totalHours
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTeamAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const userFilter = {};
    if (req.user.role === 'manager') {
      userFilter.department = req.user.department;
    } else if (department) {
      userFilter.department = department;
    }

    const teamUsers = await User.find(userFilter).select('_id name department').lean();
    const userIds = teamUsers.map(u => u._id);

    // Fetch all attendance records in range
    const records = await Attendance.find({
      user: { $in: userIds },
      date: { $gte: getDateOnly(start), $lte: getDateOnly(end) }
    }).lean();

    // Aggregate stats per user
    const stats = teamUsers.map(u => {
      const userRecords = records.filter(r => r.user.toString() === u._id.toString());
      const aggregated = aggregateByDate(userRecords);
      
      const totalDays = aggregated.length;
      const presentDays = aggregated.filter(r => r.status === 'Present').length;
      const absentDays = aggregated.filter(r => r.status === 'Absent').length;
      const pendingDays = aggregated.filter(r => r.status === 'Pending').length;
      const totalHours = aggregated.reduce((sum, r) => sum + (r.totalHours || 0), 0);

      return {
        user: u,
        totalDays,
        presentDays,
        absentDays,
        pendingDays,
        totalHours: Number(totalHours.toFixed(2)),
        averageHours: totalDays > 0 ? Number((totalHours / totalDays).toFixed(2)) : 0,
        attendanceRate: totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0
      };
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

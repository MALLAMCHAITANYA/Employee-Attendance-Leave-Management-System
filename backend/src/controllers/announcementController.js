import Announcement from '../models/Announcement.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const getAnnouncements = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department || 'General';
    const userBranch = req.user.branch || 'HQ';

    const filter = {};

    // Managers/Admins can see all announcements they created or others created.
    // Employees see only announcements matching their department/branch or set to 'All'.
    if (userRole === 'employee') {
      filter.$and = [
        { targetDepartment: { $in: [userDept, 'All'] } },
        { targetBranch: { $in: [userBranch, 'All'] } }
      ];
    }

    const list = await Announcement.find(filter)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetDepartment, targetBranch } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const dept = targetDepartment || 'All';
    const branch = targetBranch || 'All';

    const announcement = await Announcement.create({
      title,
      content,
      author: req.user._id,
      targetDepartment: dept,
      targetBranch: branch
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'ANNOUNCEMENT_CREATE',
      details: `Created announcement: "${title}"`,
      ipAddress: req.ip
    });

    // Create notifications for all matching target users
    const userFilter = { _id: { $ne: req.user._id } };
    if (dept !== 'All') userFilter.department = dept;
    if (branch !== 'All') userFilter.branch = branch;

    const targetUsers = await User.find(userFilter).select('_id').lean();
    if (targetUsers.length > 0) {
      const notices = targetUsers.map(u => ({
        recipient: u._id,
        message: `New Announcement: ${title}`,
        type: 'info'
      }));
      await Notification.insertMany(notices);
    }

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Only creator or admin can delete
    if (announcement.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await announcement.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      action: 'ANNOUNCEMENT_DELETE',
      details: `Deleted announcement: "${announcement.title}"`,
      ipAddress: req.ip
    });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const markAnnouncementRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      await announcement.save();
    }

    res.json({ message: 'Announcement marked as read', announcement });
  } catch (error) {
    next(error);
  }
};

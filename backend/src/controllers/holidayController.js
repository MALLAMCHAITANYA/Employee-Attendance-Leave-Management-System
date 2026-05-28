import Holiday from '../models/Holiday.js';
import AuditLog from '../models/AuditLog.js';

// Pre-seeding template list
const INITIAL_HOLIDAYS = [
  { date: new Date('2026-01-01'), name: 'New Year Day', type: 'Public', description: 'New Year Celebration' },
  { date: new Date('2026-01-15'), name: 'Makara Sankranti / Pongal', type: 'Public', description: 'Harvest Festival' },
  { date: new Date('2026-01-26'), name: 'Republic Day', type: 'Public', description: 'National Holiday' },
  { date: new Date('2026-03-04'), name: 'Holi', type: 'Public', description: 'Festival of Colors' },
  { date: new Date('2026-03-08'), name: "International Women's Day", type: 'Company', description: 'Recognizing women achievements' },
  { date: new Date('2026-03-19'), name: 'Ugadi / Telugu New Year / Gudi Padwa', type: 'Public', description: 'Traditional New Year' },
  { date: new Date('2026-03-21'), name: 'Eid ul-Fitr', type: 'Public', description: 'End of Ramadan' },
  { date: new Date('2026-03-26'), name: 'Rama Navami', type: 'Public', description: 'Lord Rama Birth' },
  { date: new Date('2026-03-31'), name: 'Mahavir Jayanti', type: 'Public', description: 'Lord Mahavir Birth' },
  { date: new Date('2026-04-03'), name: 'Good Friday', type: 'Public', description: 'Christian Holiday' },
  { date: new Date('2026-05-01'), name: 'Labour Day', type: 'Public', description: 'May Day' },
  { date: new Date('2026-05-27'), name: 'Bakr Id / Eid ul-Adha', type: 'Public', description: 'Festival of Sacrifice' },
  { date: new Date('2026-08-15'), name: 'Independence Day', type: 'Public', description: 'National Holiday' },
  { date: new Date('2026-09-19'), name: 'Constitution Day', type: 'Public', description: 'National Day' },
  { date: new Date('2026-10-02'), name: 'Gandhi Jayanti', type: 'Public', description: 'Mahatma Gandhi Birth' },
  { date: new Date('2026-10-17'), name: 'Dashain (Day 1)', type: 'Public', description: 'Traditional Holiday' },
  { date: new Date('2026-10-22'), name: 'Dashain (Vijaya Dashami)', type: 'Public', description: 'Victory of Good over Evil' },
  { date: new Date('2026-11-09'), name: 'Diwali', type: 'Public', description: 'Festival of Lights' },
  { date: new Date('2026-11-24'), name: 'Guru Nanak Jayanti', type: 'Public', description: 'Guru Nanak Birth' },
  { date: new Date('2026-12-25'), name: 'Christmas Day', type: 'Public', description: 'Birth of Christ' },
  { date: new Date('2026-12-31'), name: "New Year's Eve", type: 'Company', description: 'Year End Celebration' }
];

export const seedHolidays = async () => {
  try {
    const count = await Holiday.countDocuments();
    if (count === 0) {
      console.log('Seeding initial company holidays into database...');
      await Holiday.insertMany(INITIAL_HOLIDAYS);
      console.log('Holidays seeded successfully!');
    }
  } catch (error) {
    console.error('Failed to seed holidays:', error);
  }
};

export const getHolidays = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const list = await Holiday.find({
      date: { $gte: startOfYear, $lte: endOfYear }
    }).sort({ date: 1 });

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createHoliday = async (req, res, next) => {
  try {
    const { name, date, type, description } = req.body;
    if (!name || !date) {
      return res.status(400).json({ message: 'Name and date are required' });
    }

    const exists = await Holiday.findOne({ date: new Date(date) });
    if (exists) {
      return res.status(400).json({ message: 'A holiday is already scheduled on this date' });
    }

    const holiday = await Holiday.create({ name, date, type, description });

    await AuditLog.create({
      user: req.user._id,
      action: 'HOLIDAY_CREATE',
      details: `Created holiday "${name}" on ${new Date(date).toLocaleDateString()}`,
      ipAddress: req.ip
    });

    res.status(201).json(holiday);
  } catch (error) {
    next(error);
  }
};

export const updateHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, date, type, description } = req.body;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    if (date) {
      const exists = await Holiday.findOne({ date: new Date(date), _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ message: 'A holiday is already scheduled on this date' });
      }
      holiday.date = date;
    }

    if (name) holiday.name = name;
    if (type) holiday.type = type;
    if (description !== undefined) holiday.description = description;

    await holiday.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'HOLIDAY_UPDATE',
      details: `Updated holiday "${holiday.name}"`,
      ipAddress: req.ip
    });

    res.json(holiday);
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    await holiday.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      action: 'HOLIDAY_DELETE',
      details: `Deleted holiday "${holiday.name}" on ${new Date(holiday.date).toLocaleDateString()}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    next(error);
  }
};

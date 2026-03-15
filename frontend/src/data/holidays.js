/**
 * Holidays by year (month-day and name). Year is applied when building the list.
 * Format: [ 'MM-DD', 'Holiday Name' ]
 */
const HOLIDAYS_TEMPLATE = [
  ['01-01', 'New Year Day'],
  ['01-15', 'Makara Sankranti / Pongal'],
  ['01-26', 'Republic Day'],
  ['03-04', 'Holi'],
  ['03-08', "International Women's Day"],
  ['03-19', 'Ugadi / Telugu New Year / Gudi Padwa'],
  ['03-21', 'Eid ul-Fitr'],
  ['03-26', 'Rama Navami'],
  ['03-31', 'Mahavir Jayanti'],
  ['04-03', 'Good Friday'],
  ['05-01', 'Labour Day'],
  ['05-27', 'Bakr Id / Eid ul-Adha'],
  ['08-15', 'Independence Day'],
  ['09-19', 'Constitution Day'],
  ['10-02', 'Gandhi Jayanti'],
  ['10-17', 'Dashain (Day 1)'],
  ['10-22', 'Dashain (Vijaya Dashami)'],
  ['11-09', 'Diwali'],
  ['11-24', 'Guru Nanak Jayanti'],
  ['12-25', 'Christmas Day'],
  ['12-31', "New Year's Eve"]
];

export function getHolidaysForYear(year) {
  const y = Number(year) || new Date().getFullYear();
  return HOLIDAYS_TEMPLATE.map(([mmdd, name]) => {
    const [m, d] = mmdd.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      date,
      dateStr: date.toISOString().slice(0, 10),
      name,
      dayName: dayNames[date.getDay()],
      month: date.toLocaleString('default', { month: 'long' }),
      monthShort: date.toLocaleString('default', { month: 'short' })
    };
  }).sort((a, b) => a.date - b.date);
}

export function getYears() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}

/** Next N upcoming holidays from today (current year only). */
export function getUpcomingHolidays(limit = 3) {
  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return getHolidaysForYear(year)
    .filter(h => {
      const d = new Date(h.date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    })
    .slice(0, limit);
}

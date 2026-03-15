import React, { useMemo } from 'react';
import { getHolidaysForYear } from '../data/holidays';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Holidays = () => {
  const currentYear = new Date().getFullYear();
  const holidays = useMemo(
    () => getHolidaysForYear(currentYear),
    [currentYear]
  );

  const byMonthIndex = useMemo(() => {
    const map = {};
    holidays.forEach(h => {
      const idx = h.date.getMonth();
      if (!map[idx]) map[idx] = [];
      map[idx].push(h);
    });
    return map;
  }, [holidays]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Holiday Calendar
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Company holidays for {currentYear}.
        </p>
      </div>

      {/* Grid of month cards: 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MONTHS.map((monthName, index) => {
          const monthShort = new Date(2000, index, 1)
            .toLocaleString('default', { month: 'short' })
            .toUpperCase();
          const label = `${monthShort} ${currentYear}`;
          const list = byMonthIndex[index] || [];

          return (
            <div
              key={label}
              className="hr-card overflow-hidden flex flex-col min-h-[140px]"
            >
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-700/50">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                  {label}
                </h3>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                {list.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center flex-1 flex items-center justify-center">
                    No Holidays
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {list.map((h, i) => (
                      <li
                        key={`${h.dateStr}-${i}`}
                        className="text-slate-700 dark:text-slate-300 leading-snug"
                      >
                        <span className="font-semibold text-slate-900 dark:text-slate-100 mr-1">
                          {String(h.date.getDate()).padStart(2, '0')}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 mr-1.5">
                          {h.dayName}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{h.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Holidays;

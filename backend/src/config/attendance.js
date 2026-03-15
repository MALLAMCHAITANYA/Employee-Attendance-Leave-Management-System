/**
 * Minimum work hours per day to count as Present.
 * Use env MIN_WORK_HOURS (number) or default 8.
 */
export const MIN_WORK_HOURS = Number(process.env.MIN_WORK_HOURS) || 8;

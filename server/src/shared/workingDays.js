import { parseISODate } from './dates.js';

/**
 * Calculates working days between two YYYY-MM-DD dates inclusive.
 * Excludes weekend days (0 = Sunday, 6 = Saturday) and public holidays.
 *
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {string} endDateStr - YYYY-MM-DD
 * @param {number[]} weekendDays - e.g. [0, 6] for Sunday & Saturday
 * @param {string[]} holidays - Array of YYYY-MM-DD strings
 * @returns {number} Count of working days
 */
export function calculateWorkingDays(startDateStr, endDateStr, weekendDays = [0, 6], holidays = []) {
  if (!startDateStr || !endDateStr) return 0;
  
  const start = parseISODate(startDateStr);
  const end = parseISODate(endDateStr);

  if (start > end) return 0;

  const holidaySet = new Set(holidays);
  const weekendSet = new Set(weekendDays);

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    const dateStr = current.toISOString().slice(0, 10);

    const isWeekend = weekendSet.has(dayOfWeek);
    const isHoliday = holidaySet.has(dateStr);

    if (!isWeekend && !isHoliday) {
      count++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

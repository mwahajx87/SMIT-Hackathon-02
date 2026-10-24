/**
 * Pure functions for date manipulation in company timezone.
 */

export function getCompanyDateString(date = new Date(), timezone = 'Asia/Karachi') {
  // Format as YYYY-MM-DD in the specified timezone
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
}

export function getCompanyTimeString(date = new Date(), timezone = 'Asia/Karachi') {
  // Format as HH:mm in the specified timezone
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(date));
}

export function parseISODate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

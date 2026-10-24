/**
 * Pure functions for attendance status determination.
 */

export function parseTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if a check-in is late based on office start and grace minutes.
 * Default: officeStart '09:00', grace 15 min -> late after 09:15:00.
 */
export function isCheckInLate(checkInDate, officeStart = '09:00', graceMinutes = 15, timezone = 'Asia/Karachi') {
  // Extract local hour, minute, second in company timezone
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(new Date(checkInDate));

  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const second = Number(parts.find((p) => p.type === 'second')?.value || 0);

  const checkInSeconds = hour * 3600 + minute * 60 + second;
  const [startHour, startMin] = officeStart.split(':').map(Number);
  const allowedSeconds = (startHour * 60 + startMin + graceMinutes) * 60;

  return checkInSeconds > allowedSeconds;
}

/**
 * Calculates worked minutes and determines if under half-day threshold.
 */
export function calculateAttendanceStatus({
  checkInAt,
  checkOutAt,
  officeStart = '09:00',
  graceMinutes = 15,
  halfDayHours = 5,
  timezone = 'Asia/Karachi'
}) {
  const late = isCheckInLate(checkInAt, officeStart, graceMinutes, timezone);

  if (!checkOutAt) {
    return {
      status: late ? 'late' : 'present',
      workedMinutes: 0
    };
  }

  const checkInMs = new Date(checkInAt).getTime();
  const checkOutMs = new Date(checkOutAt).getTime();
  const workedMinutes = Math.max(0, Math.floor((checkOutMs - checkInMs) / (1000 * 60)));

  const halfDayThresholdMinutes = halfDayHours * 60;
  if (workedMinutes < halfDayThresholdMinutes) {
    return {
      status: 'half_day',
      workedMinutes
    };
  }

  return {
    status: late ? 'late' : 'present',
    workedMinutes
  };
}

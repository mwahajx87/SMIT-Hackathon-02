import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateWorkingDays } from '../../src/shared/workingDays.js';

describe('Leave — Working Days Calculation', () => {
  it('skips weekends (Sat=6, Sun=0)', () => {
    // Mon 2025-01-06 to Fri 2025-01-10 = 5 working days
    const result = calculateWorkingDays('2025-01-06', '2025-01-10', [0, 6], []);
    expect(result).toBe(5);
  });

  it('skips weekends and holidays', () => {
    // Mon 2025-01-06 to Fri 2025-01-10, but Wed 2025-01-08 is a holiday = 4 working days
    const result = calculateWorkingDays('2025-01-06', '2025-01-10', [0, 6], ['2025-01-08']);
    expect(result).toBe(4);
  });

  it('returns 0 for a weekend-only range', () => {
    // Sat 2025-01-04 to Sun 2025-01-05 = 0 working days
    const result = calculateWorkingDays('2025-01-04', '2025-01-05', [0, 6], []);
    expect(result).toBe(0);
  });

  it('single day that is a working day = 1', () => {
    const result = calculateWorkingDays('2025-01-06', '2025-01-06', [0, 6], []);
    expect(result).toBe(1);
  });

  it('single day that is a holiday = 0', () => {
    const result = calculateWorkingDays('2025-01-06', '2025-01-06', [0, 6], ['2025-01-06']);
    expect(result).toBe(0);
  });

  it('two-week range with 1 holiday = 9 working days', () => {
    // Mon 2025-01-06 to Fri 2025-01-17 = 10 working days - 1 holiday = 9
    const result = calculateWorkingDays('2025-01-06', '2025-01-17', [0, 6], ['2025-01-13']);
    expect(result).toBe(9);
  });

  it('cross-weekend range counts correctly', () => {
    // Thu 2025-01-02 to Mon 2025-01-06 = 3 working days (Thu, Fri, Mon)
    const result = calculateWorkingDays('2025-01-02', '2025-01-06', [0, 6], []);
    expect(result).toBe(3);
  });
});

import { describe, it, expect } from 'vitest';
import { calculateWorkingDays } from '../../src/shared/workingDays.js';
import { getHaversineDistance, isWithinRadius } from '../../src/shared/haversine.js';
import { roundMoney, formatCurrency } from '../../src/shared/money.js';
import { getCompanyDateString } from '../../src/shared/dates.js';

describe('Shared Utilities (T0.4)', () => {
  describe('calculateWorkingDays', () => {
    it('should correctly calculate working days skipping Saturday and Sunday', () => {
      // 2026-10-19 (Mon) to 2026-10-25 (Sun) -> 5 working days (Mon-Fri)
      const count = calculateWorkingDays('2026-10-19', '2026-10-25', [0, 6], []);
      expect(count).toBe(5);
    });

    it('should exclude specified holidays', () => {
      // 2026-10-19 (Mon) to 2026-10-23 (Fri) with holiday on 2026-10-20 -> 4 days
      const count = calculateWorkingDays('2026-10-19', '2026-10-23', [0, 6], ['2026-10-20']);
      expect(count).toBe(4);
    });

    it('should return 0 if start date is after end date', () => {
      const count = calculateWorkingDays('2026-10-25', '2026-10-19', [0, 6], []);
      expect(count).toBe(0);
    });
  });

  describe('haversine and isWithinRadius', () => {
    const officeLat = 24.8607;
    const officeLng = 67.0011;

    it('should return true when distance is within 150m radius', () => {
      // Point extremely close (~10m)
      const inside = isWithinRadius(24.86075, 67.00115, officeLat, officeLng, 150);
      expect(inside).toBe(true);
    });

    it('should return false when distance exceeds radius', () => {
      // Point ~1km away
      const inside = isWithinRadius(24.8700, 67.0100, officeLat, officeLng, 150);
      expect(inside).toBe(false);
    });
  });

  describe('money utilities', () => {
    it('rounds money accurately to 2 decimals', () => {
      expect(roundMoney(4090.90909)).toBe(4090.91);
      expect(roundMoney(8181.81818)).toBe(8181.82);
    });

    it('formats currency with PKR and thousands separators', () => {
      expect(formatCurrency(90000)).toBe('PKR 90,000.00');
    });
  });

  describe('dates in company timezone', () => {
    it('produces YYYY-MM-DD format', () => {
      const dateStr = getCompanyDateString(new Date('2026-10-24T20:00:00Z'), 'Asia/Karachi');
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

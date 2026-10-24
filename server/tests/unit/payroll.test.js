import { describe, it, expect } from 'vitest';
import {
  calculateSalaryStructure,
  calculatePerDayRate,
  calculateIncomeTax,
  calculateDeductionDays,
  calculatePayslip
} from '../../src/modules/payroll/payroll.calc.js';

describe('Phase 5: Payroll Calculation Pure Functions (T5.1)', () => {
  describe('Gross Salary Structure (HRA 40%, Medical 10%, Gross 1.5x)', () => {
    it('calculates structure for basic 60,000', () => {
      const res = calculateSalaryStructure(60000);
      expect(res.basic).toBe(60000);
      expect(res.hra).toBe(24000);
      expect(res.medical).toBe(6000);
      expect(res.gross).toBe(90000);
    });
  });

  describe('Tax Slabs & Monthly Tax Test Vectors from rules.md Section 3.6', () => {
    it('Vector 1: Gross 45,000 -> Annual 540,000 -> Tax 0, Monthly 0', () => {
      const res = calculateIncomeTax(45000);
      expect(res.annualTax).toBe(0);
      expect(res.monthlyTax).toBe(0);
    });

    it('Vector 2: Gross 60,000 -> Annual 720,000 -> Tax 6,000, Monthly 500', () => {
      const res = calculateIncomeTax(60000);
      expect(res.annualTax).toBe(6000);
      expect(res.monthlyTax).toBe(500);
    });

    it('Vector 3: Gross 100,000 -> Annual 1,200,000 -> Tax 30,000, Monthly 2,500', () => {
      const res = calculateIncomeTax(100000);
      expect(res.annualTax).toBe(30000);
      expect(res.monthlyTax).toBe(2500);
    });

    it('Vector 4: Gross 150,000 -> Annual 1,800,000 -> Tax 120,000, Monthly 10,000', () => {
      const res = calculateIncomeTax(150000);
      expect(res.annualTax).toBe(120000);
      expect(res.monthlyTax).toBe(10000);
    });

    it('Vector 5: Gross 300,000 -> Annual 3,600,000 -> Tax 510,000, Monthly 42,500', () => {
      const res = calculateIncomeTax(300000);
      expect(res.annualTax).toBe(510000);
      expect(res.monthlyTax).toBe(42500);
    });
  });

  describe('Full Example Test Vector from rules.md Section 3.6', () => {
    it('Basic 60,000, 22 working days, 1 absent, 0 unpaid, 2 half-days -> Net 79,818.18', () => {
      // Basic 60,000 -> Gross 90,000
      // Annual 1,080,000 -> Tax 5% * 480,000 = 24,000 -> Monthly 2,000
      // Month has 22 working days -> Per day 4,090.91
      // Deduction days = 1 (absent) + 0 (unpaid) + 0.5 * 2 (half days) = 2.0 days
      // Deduction amount = 2.0 * 4090.91 = 8,181.82
      // Net = 90,000 - 8,181.82 - 2,000 = 79,818.18
      const res = calculatePayslip({
        basicSalary: 60000,
        workingDaysInMonth: 22,
        absentDays: 1,
        unpaidLeaveDays: 0,
        halfDays: 2
      });

      expect(res.basic).toBe(60000);
      expect(res.hra).toBe(24000);
      expect(res.medical).toBe(6000);
      expect(res.gross).toBe(90000);
      expect(res.annualTax).toBe(24000);
      expect(res.monthlyTax).toBe(2000);
      expect(res.perDayRate).toBe(4090.91);
      expect(res.deductionDays).toBe(2.0);
      expect(res.deductionAmount).toBe(8181.82);
      expect(res.netSalary).toBe(79818.18);
    });
  });

  describe('Deductions and Proration', () => {
    it('prorates joiner working days outside employment as deduction days', () => {
      const days = calculateDeductionDays({
        absentDays: 0,
        unpaidLeaveDays: 0,
        halfDays: 0,
        outsideEmploymentDays: 5
      });
      expect(days).toBe(5);
    });
  });
});

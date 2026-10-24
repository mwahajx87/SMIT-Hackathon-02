import { roundMoney } from '../../shared/money.js';

/**
 * Calculate Gross Salary components from Basic Salary.
 * HRA = 40% of basic, Medical = 10% of basic, Gross = 1.5 * basic.
 */
export function calculateSalaryStructure(basicSalary) {
  const basic = Number(basicSalary) || 0;
  const hra = basic * 0.4;
  const medical = basic * 0.1;
  const gross = basic + hra + medical;

  return {
    basic: roundMoney(basic),
    hra: roundMoney(hra),
    medical: roundMoney(medical),
    gross: roundMoney(gross)
  };
}

/**
 * Calculate Per Day rate from Gross salary and working days in month.
 * Per day = gross / working days.
 */
export function calculatePerDayRate(grossSalary, workingDaysInMonth) {
  if (!workingDaysInMonth || workingDaysInMonth <= 0) return 0;
  return roundMoney(grossSalary / workingDaysInMonth);
}

/**
 * Calculate annual income tax and monthly tax deduction using the progressive tax slabs.
 * Slabs based on annual taxable (gross * 12):
 * - 0 to 600,000: 0
 * - 600,001 to 1,200,000: 5% of amount above 600,000
 * - 1,200,001 to 2,400,000: 30,000 + 15% of amount above 1,200,000
 * - 2,400,001 to 3,600,000: 210,000 + 25% of amount above 2,400,000
 * - above 3,600,000: 510,000 + 35% of amount above 3,600,000
 */
export function calculateIncomeTax(grossSalary) {
  const gross = Number(grossSalary) || 0;
  const annualGross = gross * 12;

  let annualTax = 0;

  if (annualGross <= 600000) {
    annualTax = 0;
  } else if (annualGross <= 1200000) {
    annualTax = (annualGross - 600000) * 0.05;
  } else if (annualGross <= 2400000) {
    annualTax = 30000 + (annualGross - 1200000) * 0.15;
  } else if (annualGross <= 3600000) {
    annualTax = 210000 + (annualGross - 2400000) * 0.25;
  } else {
    annualTax = 510000 + (annualGross - 3600000) * 0.35;
  }

  const monthlyTax = annualTax / 12;

  return {
    annualTax: roundMoney(annualTax),
    monthlyTax: roundMoney(monthlyTax)
  };
}

/**
 * Calculate total deduction days for the month.
 * Deduction days = absent + unpaid + (0.5 * half_days) + outsideEmploymentWorkingDays
 */
export function calculateDeductionDays({
  absentDays = 0,
  unpaidLeaveDays = 0,
  halfDays = 0,
  outsideEmploymentDays = 0
}) {
  const days = absentDays + unpaidLeaveDays + 0.5 * halfDays + outsideEmploymentDays;
  return roundMoney(days);
}

/**
 * Calculate Complete Payslip for an Employee in a given month.
 *
 * Rules:
 * - Gross = 1.5 * basic (HRA 40%, Medical 10%)
 * - Per day = gross / working days in month
 * - Deduction days = absent + unpaid + 0.5 * half_days + outsideEmploymentDays
 * - Deduction amount = deduction days * per day
 * - Monthly tax = annual tax / 12
 * - Net = gross - deduction amount - monthly tax
 */
export function calculatePayslip({
  basicSalary,
  workingDaysInMonth,
  absentDays = 0,
  unpaidLeaveDays = 0,
  halfDays = 0,
  outsideEmploymentDays = 0
}) {
  const { basic, hra, medical, gross } = calculateSalaryStructure(basicSalary);
  const perDayRate = calculatePerDayRate(gross, workingDaysInMonth);
  const deductionDays = calculateDeductionDays({
    absentDays,
    unpaidLeaveDays,
    halfDays,
    outsideEmploymentDays
  });

  const deductionAmount = roundMoney(deductionDays * perDayRate);
  const { annualTax, monthlyTax } = calculateIncomeTax(gross);

  const netSalary = roundMoney(gross - deductionAmount - monthlyTax);

  return {
    basic,
    hra,
    medical,
    gross,
    workingDaysInMonth,
    perDayRate,
    absentDays,
    unpaidLeaveDays,
    halfDays,
    outsideEmploymentDays,
    deductionDays,
    deductionAmount,
    annualTax,
    monthlyTax,
    netSalary: Math.max(0, netSalary)
  };
}

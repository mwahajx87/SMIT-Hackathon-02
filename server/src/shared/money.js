/**
 * Round a number to 2 decimal places at the end of calculation.
 */
export function roundMoney(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency with thousands separators (PKR).
 */
export function formatCurrency(amount) {
  const rounded = roundMoney(amount);
  return `PKR ${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

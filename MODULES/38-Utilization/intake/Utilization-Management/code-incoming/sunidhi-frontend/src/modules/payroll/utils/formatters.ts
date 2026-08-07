/**
 * Presentation-only helpers.
 *
 * IMPORTANT: These format values for display. They must never add, subtract,
 * or derive new financial figures — that is out of scope for this module's
 * frontend (Contract §8, §46, §48). All monetary totals are display-formatted
 * strings that come directly from the API response.
 */

/** Formats a DECIMAL-as-string amount (e.g. "1500.00") for display only. */
export function formatMoney(amount: string | number, currency = 'INR'): string {
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/** Formats an ISO-8601 date/datetime string for UI display. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/** Formats a "YYYY-MM" payroll period into a readable label, e.g. "July 2026". */
export function formatPayrollPeriod(period: string): string {
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  const d = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(d.getTime())) return period;
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(d);
}

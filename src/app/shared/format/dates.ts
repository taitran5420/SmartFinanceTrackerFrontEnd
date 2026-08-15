/** Date helpers for the analytics/budget period params (backend wants ISO). */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface Period {
  /** ISO date-time at the start of the range. */
  startDate: string;
  /** ISO date-time at the end of the range. */
  endDate: string;
}

/** Whole-month range [first 00:00 … last 23:59:59] for the given month. */
export function monthRange(year: number, month1to12: number): Period {
  const start = new Date(year, month1to12 - 1, 1, 0, 0, 0);
  const end = new Date(year, month1to12, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** The current calendar month. */
export function currentMonth(now = new Date()): Period {
  return monthRange(now.getFullYear(), now.getMonth() + 1);
}

/** Range covering the last `n` months including the current one. */
export function lastMonths(n: number, now = new Date()): Period {
  const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function monthLabel(month1to12: number): string {
  return MONTHS[(month1to12 - 1 + 12) % 12];
}

/** Friendly date like "12 Jun 2026" from an ISO string. */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "12 Jun, 14:30" with time, for transaction rows. */
export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

/** yyyy-MM-dd for <input type="date"> and date-only request fields. */
export function toDateInput(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

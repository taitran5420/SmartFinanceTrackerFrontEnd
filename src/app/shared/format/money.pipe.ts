import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a number as USD currency. `signed` prefixes an explicit + for
 * positive values (used for income/expense deltas). Nullish → em dash.
 */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    options: { signed?: boolean; fractionDigits?: number } = {},
  ): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    const { signed = false, fractionDigits = 2 } = options;
    const formatted = Math.abs(value).toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    if (value < 0) {
      return `-${formatted}`;
    }
    return signed ? `+${formatted}` : formatted;
  }
}

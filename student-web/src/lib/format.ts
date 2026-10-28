import { CURRENCY } from './config';

/** API sends money as a string with two decimals ("3200.00"). Display only: never calculate with it. */
export function money(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  return `${CURRENCY} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export const label = (value: string): string => value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

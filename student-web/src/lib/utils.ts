import clsx, { type ClassValue } from 'clsx';

export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

/** Builds "?a=1&b=2" from an object, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const text = sp.toString();
  return text ? `?${text}` : '';
}

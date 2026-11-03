import type { StoreSettings } from '../types/api';

/**
 * Mirror of the backend TaxCalculator, used only for the live preview in the POS screen.
 * The server recalculates on checkout and its numbers are what get saved and printed.
 */
export type TaxLine = { amount: number; taxable: boolean };
export type TaxResult = { subtotal: number; discount: number; taxBase: number; tax: number; total: number };

export function calculateTax(lines: TaxLine[], discount: number, settings?: StoreSettings | null): TaxResult {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const disc = Math.min(Math.max(discount, 0), subtotal);
  const afterDiscount = subtotal - disc;
  const rate = Number(settings?.taxRate ?? 0) / 100;
  if (!settings?.taxEnabled || rate <= 0 || subtotal === 0) {
    return { subtotal, discount: disc, taxBase: 0, tax: 0, total: afterDiscount };
  }
  const taxableSubtotal = lines.filter((l) => l.taxable).reduce((s, l) => s + l.amount, 0);
  const base = taxableSubtotal - (disc * taxableSubtotal) / subtotal;
  const rawTax = settings.taxInclusive ? base - base / (1 + rate) : base * rate;
  const tax = roundHalfUp(rawTax);
  return { subtotal, discount: disc, taxBase: base, tax, total: settings.taxInclusive ? afterDiscount : afterDiscount + tax };
}

/** Matches Java's RoundingMode.HALF_UP for positive values, tolerant of float noise (500.4999999 -> 500.5). */
const roundHalfUp = (v: number) => Math.floor(Number(v.toFixed(6)) + 0.5);

export const taxLabel = (name?: string | null, rate?: number | null, inclusive?: boolean | null) =>
  `${name || 'Pajak'} ${Number(rate ?? 0).toLocaleString('id-ID')}%${inclusive ? ' (termasuk)' : ''}`;

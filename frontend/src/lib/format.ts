import type { PaymentMethod, Role } from '../types/api';

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('id-ID');
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' });

export const money = (value: number | null | undefined) => currency.format(Number(value ?? 0));
export const num = (value: number | null | undefined) => number.format(Number(value ?? 0));
export const formatDateTime = (iso?: string | null) => (iso ? dateTime.format(new Date(iso)) : '-');
export const formatDate = (iso?: string | null) => (iso ? dateOnly.format(new Date(iso)) : '-');
export const shortDay = (isoDate: string) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(new Date(`${isoDate}T00:00:00`));

/** Local date as yyyy-MM-dd (not UTC), suitable for <input type="date"> and API params. */
export const isoDate = (date: Date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDate(d);
};

export const paymentLabel: Record<PaymentMethod, string> = {
  CASH: 'Tunai',
  CARD: 'Kartu Debit/Kredit',
  TRANSFER: 'Transfer Bank',
  QRIS: 'QRIS',
};

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manajer',
  CASHIER: 'Kasir',
};

export const errorMessage = (err: unknown, fallback = 'Terjadi kesalahan') =>
  err instanceof Error && err.message ? err.message : fallback;

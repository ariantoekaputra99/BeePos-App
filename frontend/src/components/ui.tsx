import { ButtonHTMLAttributes, forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect } from 'react';
import { X } from 'lucide-react';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const variants: Record<Variant, string> = {
  primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold',
  secondary: 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700',
  danger: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30',
  ghost: 'text-slate-300 hover:bg-slate-800',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' };
  return (
    <button
      {...props}
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant], sizes[size], className)}
    />
  );
}

const fieldClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-400';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) =>
  <input ref={ref} {...props} className={cx(fieldClass, className)} />);
Input.displayName = 'Input';

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) =>
  <select {...props} className={cx(fieldClass, className)} />;

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) =>
  <textarea {...props} className={cx(fieldClass, className)} />;

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1.5 block text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const Card = ({ children, className }: { children: ReactNode; className?: string }) =>
  <div className={cx('rounded-2xl border border-slate-800 bg-slate-900 p-5', className)}>{children}</div>;

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const badgeTones = {
  slate: 'bg-slate-800 text-slate-300',
  green: 'bg-emerald-500/15 text-emerald-300',
  amber: 'bg-amber-400/15 text-amber-300',
  red: 'bg-rose-500/15 text-rose-300',
  blue: 'bg-sky-500/15 text-sky-300',
};
export const Badge = ({ children, tone = 'slate' }: { children: ReactNode; tone?: keyof typeof badgeTones }) =>
  <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', badgeTones[tone])}>{children}</span>;

export function Stat({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'warn' }) {
  return (
    <Card>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={cx('mt-2 text-2xl font-bold', tone === 'warn' ? 'text-amber-300' : 'text-white')}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }:
  { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center" onMouseDown={onClose}>
      <div className={cx('w-full rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800" aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Table({ headers, children, empty, compact }: { headers: ReactNode[]; children: ReactNode; empty?: boolean; compact?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className={cx('w-full text-left text-sm', !compact && 'min-w-[640px]')}>
        <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
          <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950">
          {empty ? <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-slate-500">Belum ada data</td></tr> : children}
        </tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className }: { children?: ReactNode; className?: string }) =>
  <td className={cx('px-4 py-3 align-middle text-slate-200', className)}>{children}</td>;

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const tones = { error: 'bg-rose-500/10 text-rose-300', success: 'bg-emerald-500/10 text-emerald-300', info: 'bg-sky-500/10 text-sky-300' };
  return <div className={cx('rounded-xl p-3 text-sm', tones[tone])}>{children}</div>;
}

export const Spinner = () => <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400" /></div>;

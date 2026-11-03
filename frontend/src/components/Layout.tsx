import { ReactNode, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { routes, RouteKey } from '../routes';
import type { Session } from '../types/api';
import { roleLabel } from '../lib/format';

type Props = { session: Session; current: RouteKey; onNavigate: (key: RouteKey) => void; onLogout: () => void; children: ReactNode };

export function Layout({ session, current, onNavigate, onLogout, children }: Props) {
  const [open, setOpen] = useState(false);
  const visible = routes.filter((r) => r.roles.includes(session.role));
  const groups = [...new Set(visible.map((r) => r.group))];

  const nav = (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{group}</p>
          <div className="space-y-1">
            {visible.filter((r) => r.group === group).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { onNavigate(key); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${current === key
                  ? 'bg-amber-400 font-semibold text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div>
      <p className="text-xs uppercase tracking-[.3em] text-amber-400">BeePos</p>
      <p className="mt-1 text-xl font-bold text-white">Retail OS</p>
    </div>
  );

  const account = (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="truncate text-sm font-medium text-white">{session.fullName || session.username}</p>
      <p className="text-xs text-slate-400">@{session.username} · {roleLabel[session.role]}</p>
      <button onClick={onLogout} className="mt-2 inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200">
        <LogOut size={14} /> Keluar
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800 bg-slate-900 p-5 print:hidden lg:flex">
        {brand}
        <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4">{account}</div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur print:hidden lg:hidden">
        {brand}
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800" aria-label="Buka menu"><Menu /></button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
          <div className="flex h-full w-72 flex-col bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">{brand}
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800" aria-label="Tutup menu"><X /></button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
            <div className="mt-4">{account}</div>
          </div>
        </div>
      )}

      <main className="min-h-screen p-4 sm:p-6 lg:ml-64 lg:p-8">{children}</main>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { api } from '../services/api';
import type { Session } from '../types/api';
import { Alert, Button, Field, Input } from '../components/ui';
import { errorMessage } from '../lib/format';

export function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError('');
    try {
      onLogin(await api.login(String(form.get('username')).trim(), String(form.get('password'))));
    } catch (err) {
      setError(errorMessage(err, 'Login gagal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[.3em] text-amber-400">BeePos</p>
        <h1 className="mt-3 text-3xl font-bold">Masuk ke Retail OS</h1>
        <p className="mt-2 text-sm text-slate-400">Gunakan akun operasional Anda untuk mengakses POS.</p>
        {error && <div className="mt-5"><Alert>{error}</Alert></div>}
        <div className="mt-6 space-y-4">
          <Field label="Username"><Input name="username" autoComplete="username" autoFocus required className="py-3" /></Field>
          <Field label="Password"><Input name="password" type="password" autoComplete="current-password" required className="py-3" /></Field>
        </div>
        <Button type="submit" disabled={loading} size="lg" className="mt-6 w-full">{loading ? 'Memproses...' : 'Masuk'}</Button>
        <p className="mt-5 text-center text-xs text-slate-500">Akun awal: <span className="text-slate-300">admin / admin123</span> — segera ganti password setelah masuk.</p>
      </form>
    </main>
  );
}

import { FormEvent, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { errorMessage, formatDate, roleLabel } from '../lib/format';
import { Button, Card, Field, Input, PageHeader } from '../components/ui';
import { useToast } from '../components/Toast';
import type { Session } from '../types/api';

export function SettingsPage({ session }: { session: Session }) {
  const toast = useToast();
  const me = useLoad(() => api.me());
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    if (f.get('newPassword') !== f.get('confirm')) {
      toast.error('Konfirmasi password tidak sama');
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(String(f.get('currentPassword')), String(f.get('newPassword')));
      toast.success('Password berhasil diganti');
      form.reset();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Akun Saya" description="Informasi akun dan keamanan." />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-white">Profil</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Nama" value={me.data?.fullName || '-'} />
            <Row label="Username" value={session.username} />
            <Row label="Email" value={me.data?.email ?? '-'} />
            <Row label="Role" value={roleLabel[session.role]} />
            <Row label="Terdaftar" value={formatDate(me.data?.createdAt)} />
          </dl>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-semibold text-white"><KeyRound size={18} /> Ganti Password</h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Field label="Password lama"><Input name="currentPassword" type="password" autoComplete="current-password" required /></Field>
            <Field label="Password baru" hint="Minimal 6 karakter"><Input name="newPassword" type="password" autoComplete="new-password" minLength={6} required /></Field>
            <Field label="Ulangi password baru"><Input name="confirm" type="password" autoComplete="new-password" minLength={6} required /></Field>
            <Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Password'}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 border-b border-slate-800 pb-2"><dt className="text-slate-400">{label}</dt><dd className="text-white">{value}</dd></div>
);

import { FormEvent, useState } from 'react';
import { Pencil, Plus, UserX } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { errorMessage, formatDate, roleLabel } from '../lib/format';
import { Alert, Badge, Button, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from '../components/ui';
import { useToast } from '../components/Toast';
import type { Role, Session, User } from '../types/api';

const roleTone: Record<Role, 'amber' | 'blue' | 'slate'> = { ADMIN: 'amber', MANAGER: 'blue', CASHIER: 'slate' };

export function UsersPage({ session }: { session: Session }) {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(() => api.users());
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const current = editing && editing !== 'new' ? editing : null;
  const self = current?.username === session.username;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const payload = {
      username: String(f.get('username')).trim(),
      email: String(f.get('email')).trim(),
      fullName: String(f.get('fullName') || '').trim(),
      role: (self && current ? current.role : f.get('role')) as Role,
      password: String(f.get('password') || ''),
      active: current ? (self ? true : f.get('active') === 'on') : true,
    };
    setBusy(true);
    try {
      if (current) await api.updateUser(current.id, payload);
      else await api.createUser(payload);
      toast.success('Pengguna disimpan');
      setEditing(null);
      void reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    if (!deactivating) return;
    setBusy(true);
    try {
      await api.deactivateUser(deactivating.id);
      toast.success(`${deactivating.username} dinonaktifkan`);
      setDeactivating(null);
      void reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Pengguna" description="Kelola akun kasir, manajer, dan admin beserta hak aksesnya."
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> Tambah Pengguna</Button>} />
      <div className="mb-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
        <p><Badge tone="amber">Admin</Badge> semua fitur termasuk pengguna</p>
        <p><Badge tone="blue">Manajer</Badge> produk, stok, PO, laporan, batal transaksi</p>
        <p><Badge>Kasir</Badge> kasir, riwayat transaksi, pelanggan</p>
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {loading && !data ? <Spinner /> : (
        <Table headers={['Pengguna', 'Email', 'Role', 'Status', 'Dibuat', '']} empty={(data ?? []).length === 0}>
          {(data ?? []).map((u) => (
            <tr key={u.id} className={u.active ? '' : 'opacity-50'}>
              <Td><p className="font-medium text-white">{u.fullName || u.username}</p><p className="text-xs text-slate-500">@{u.username}</p></Td>
              <Td>{u.email}</Td>
              <Td><Badge tone={roleTone[u.role]}>{roleLabel[u.role]}</Badge></Td>
              <Td>{u.active ? <Badge tone="green">Aktif</Badge> : <Badge tone="red">Nonaktif</Badge>}</Td>
              <Td className="text-slate-400">{formatDate(u.createdAt)}</Td>
              <Td className="whitespace-nowrap text-right">
                <Button variant="ghost" size="sm" onClick={() => setEditing(u)} aria-label="Ubah"><Pencil size={14} /></Button>
                {u.active && u.username !== session.username &&
                  <Button variant="ghost" size="sm" onClick={() => setDeactivating(u)} aria-label="Nonaktifkan"><UserX size={14} className="text-rose-300" /></Button>}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={editing !== null} title={current ? 'Ubah Pengguna' : 'Tambah Pengguna'} onClose={() => setEditing(null)}>
        <form key={current?.id ?? 'new'} onSubmit={submit} className="space-y-3">
          <Field label="Username *"><Input name="username" required minLength={3} maxLength={50} defaultValue={current?.username} /></Field>
          <Field label="Nama lengkap"><Input name="fullName" defaultValue={current?.fullName ?? ''} /></Field>
          <Field label="Email *"><Input name="email" type="email" required defaultValue={current?.email} /></Field>
          <Field label="Role">
            <Select name="role" defaultValue={current?.role ?? 'CASHIER'} disabled={self}>
              <option value="CASHIER">Kasir</option>
              <option value="MANAGER">Manajer</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <Field label={current ? 'Password baru' : 'Password *'} hint={current ? 'Kosongkan jika tidak diubah. Minimal 6 karakter.' : 'Minimal 6 karakter.'}>
            <Input name="password" type="password" autoComplete="new-password" minLength={6} required={!current} />
          </Field>
          {current && !self && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="active" defaultChecked={current.active} className="accent-amber-400" /> Akun aktif
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Batal</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deactivating !== null} title="Nonaktifkan Pengguna" onClose={() => setDeactivating(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDeactivating(null)}>Batal</Button>
          <Button variant="danger" disabled={busy} onClick={deactivate}>Nonaktifkan</Button>
        </>}>
        <p className="text-sm text-slate-300"><b>{deactivating?.username}</b> tidak bisa login lagi. Riwayat transaksinya tetap tersimpan.</p>
      </Modal>
    </>
  );
}

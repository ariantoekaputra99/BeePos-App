import { FormEvent, ReactNode, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Alert, Button, Field, Input, Modal, PageHeader, Spinner, Table, Td, Textarea } from './ui';
import { useToast } from './Toast';
import { useLoad } from '../lib/useLoad';
import { errorMessage } from '../lib/format';

export type CrudField<T> = {
  key: keyof T & string;
  label: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  showInTable?: boolean;
  render?: (row: T) => ReactNode;
};

type Props<T extends { id: number }> = {
  title: string;
  description: string;
  entityLabel: string;
  fields: CrudField<T>[];
  load: () => Promise<T[]>;
  create: (data: Omit<T, 'id'>) => Promise<T>;
  update: (id: number, data: Omit<T, 'id'>) => Promise<T>;
  remove?: (id: number) => Promise<void>;
  canDelete?: boolean;
};

/** Generic list + modal form page for simple master data (categories, customers, suppliers). */
export function CrudPage<T extends { id: number }>(props: Props<T>) {
  const { title, description, entityLabel, fields, load, create, update, remove, canDelete = true } = props;
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(load);
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  const rows = (data ?? []).filter((row) =>
    fields.some((f) => String(row[f.key] ?? '').toLowerCase().includes(query.toLowerCase())));
  const tableFields = fields.filter((f) => f.showInTable !== false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(fields.map((f) => [f.key, String(form.get(f.key) ?? '').trim() || null])) as Omit<T, 'id'>;
    setBusy(true);
    try {
      if (editing === 'new') await create(payload);
      else if (editing) await update(editing.id, payload);
      toast.success(`${entityLabel} berhasil disimpan`);
      setEditing(null);
      void reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || !remove) return;
    setBusy(true);
    try {
      await remove(deleting.id);
      toast.success(`${entityLabel} dihapus`);
      setDeleting(null);
      void reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const current = editing && editing !== 'new' ? editing : null;

  return (
    <>
      <PageHeader title={title} description={description}
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> Tambah {entityLabel}</Button>} />
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Cari ${entityLabel.toLowerCase()}...`} className="pl-9" />
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {loading && !data ? <Spinner /> : (
        <Table headers={[...tableFields.map((f) => f.label), '']} empty={rows.length === 0}>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-900/60">
              {tableFields.map((f) => <Td key={f.key}>{f.render ? f.render(row) : String(row[f.key] ?? '-')}</Td>)}
              <Td className="whitespace-nowrap text-right">
                <Button variant="ghost" size="sm" onClick={() => setEditing(row)} aria-label="Ubah"><Pencil size={14} /></Button>
                {remove && canDelete && <Button variant="ghost" size="sm" onClick={() => setDeleting(row)} aria-label="Hapus"><Trash2 size={14} className="text-rose-300" /></Button>}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={editing !== null} title={editing === 'new' ? `Tambah ${entityLabel}` : `Ubah ${entityLabel}`} onClose={() => setEditing(null)}>
        <form key={current?.id ?? 'new'} onSubmit={submit} className="space-y-3">
          {fields.map((f) => (
            <Field key={f.key} label={f.label + (f.required ? ' *' : '')}>
              {f.type === 'textarea'
                ? <Textarea name={f.key} rows={3} defaultValue={String(current?.[f.key] ?? '')} />
                : <Input name={f.key} type={f.type ?? 'text'} required={f.required} defaultValue={String(current?.[f.key] ?? '')} />}
            </Field>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Batal</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} title={`Hapus ${entityLabel}`} onClose={() => setDeleting(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDeleting(null)}>Batal</Button>
          <Button variant="danger" disabled={busy} onClick={confirmDelete}>Hapus</Button>
        </>}>
        <p className="text-sm text-slate-300">Yakin ingin menghapus <b>{deleting ? String(deleting[fields[0].key]) : ''}</b>? Tindakan ini tidak bisa dibatalkan.</p>
      </Modal>
    </>
  );
}

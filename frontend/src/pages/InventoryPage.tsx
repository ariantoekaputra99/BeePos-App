import { FormEvent, useState } from 'react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { errorMessage, formatDateTime, num } from '../lib/format';
import { Alert, Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Table, Td } from '../components/ui';
import { useToast } from '../components/Toast';
import type { Movement } from '../types/api';

type Kind = 'in' | 'out' | 'adjust';
const kinds: Record<Kind, { label: string; qtyLabel: string; hint: string }> = {
  in: { label: 'Stok Masuk', qtyLabel: 'Jumlah masuk', hint: 'Barang datang di luar PO, retur dari pelanggan, dll.' },
  out: { label: 'Stok Keluar', qtyLabel: 'Jumlah keluar', hint: 'Barang rusak, kedaluwarsa, hilang, dipakai sendiri.' },
  adjust: { label: 'Stock Opname', qtyLabel: 'Jumlah fisik hasil hitung', hint: 'Stok sistem diganti dengan hasil hitung fisik; selisihnya dicatat.' },
};

const typeTone: Record<Movement['type'], 'green' | 'red' | 'amber' | 'blue' | 'slate'> = {
  IN: 'green', PURCHASE: 'green', VOID: 'blue', OUT: 'red', SALE: 'slate', ADJUST: 'amber',
};
const typeLabel: Record<Movement['type'], string> = {
  IN: 'Masuk', PURCHASE: 'Pembelian', VOID: 'Batal jual', OUT: 'Keluar', SALE: 'Penjualan', ADJUST: 'Opname',
};

export function InventoryPage() {
  const toast = useToast();
  const products = useLoad(() => api.products());
  const [filter, setFilter] = useState<number | ''>('');
  const movements = useLoad(() => api.movements(filter === '' ? undefined : filter), [filter]);
  const [kind, setKind] = useState<Kind>('in');
  const [productId, setProductId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);

  const selected = (products.data ?? []).find((p) => p.id === productId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (productId === '') return;
    const form = event.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    try {
      const m = await api.stock(kind, productId, Number(f.get('quantity')), String(f.get('note') || '') || undefined);
      toast.success(`${kinds[kind].label} tersimpan. Stok ${m.productName} sekarang ${m.stockAfter}`);
      form.reset();
      void products.reload();
      void movements.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Stok & Opname" description="Catat stok masuk/keluar dan lakukan stock opname. Semua perubahan tercatat di riwayat." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-950 p-1">
            {(Object.keys(kinds) as Kind[]).map((k) => (
              <button key={k} onClick={() => setKind(k)}
                className={`rounded-lg px-2 py-2 text-xs font-medium ${kind === k ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}>
                {kinds[k].label}
              </button>
            ))}
          </div>
          <p className="mb-4 text-xs text-slate-400">{kinds[kind].hint}</p>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Produk">
              <Select required value={productId} onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Pilih produk...</option>
                {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — stok {p.stock}</option>)}
              </Select>
            </Field>
            {selected && <p className="text-sm text-slate-400">Stok sistem saat ini: <b className="text-white">{num(selected.stock)} {selected.unit ?? ''}</b></p>}
            <Field label={kinds[kind].qtyLabel}>
              <Input key={kind} name="quantity" type="number" min={kind === 'adjust' ? 0 : 1} required />
            </Field>
            <Field label="Catatan"><Input name="note" maxLength={255} placeholder="opsional" /></Field>
            <Button type="submit" disabled={busy || productId === ''} className="w-full">{busy ? 'Menyimpan...' : `Simpan ${kinds[kind].label}`}</Button>
          </form>
        </Card>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Riwayat Pergerakan Stok</h2>
            <Select value={filter} onChange={(e) => setFilter(e.target.value ? Number(e.target.value) : '')} className="max-w-xs">
              <option value="">Semua produk (200 terakhir)</option>
              {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          {movements.error && <div className="mb-4"><Alert>{movements.error}</Alert></div>}
          {movements.loading && !movements.data ? <Spinner /> : (
            <Table headers={['Waktu', 'Produk', 'Jenis', 'Jumlah', 'Stok Akhir', 'Catatan', 'Oleh']} empty={(movements.data ?? []).length === 0}>
              {(movements.data ?? []).map((m) => {
                const sign = ['OUT', 'SALE'].includes(m.type) ? '-' : m.type === 'ADJUST' ? '±' : '+';
                return (
                  <tr key={m.id}>
                    <Td className="whitespace-nowrap text-slate-400">{formatDateTime(m.createdAt)}</Td>
                    <Td><p className="text-white">{m.productName}</p><p className="text-xs text-slate-500">{m.sku}</p></Td>
                    <Td><Badge tone={typeTone[m.type]}>{typeLabel[m.type]}</Badge></Td>
                    <Td className="font-semibold">{sign}{num(m.quantity)}</Td>
                    <Td>{m.stockAfter ?? '-'}</Td>
                    <Td className="text-slate-400">{m.note}</Td>
                    <Td className="text-slate-400">{m.createdBy ?? '-'}</Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      </div>
    </>
  );
}

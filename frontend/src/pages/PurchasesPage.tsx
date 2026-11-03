import { useState } from 'react';
import { Check, Eye, Plus, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { errorMessage, formatDateTime, money, num } from '../lib/format';
import { Alert, Badge, Button, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from '../components/ui';
import { useToast } from '../components/Toast';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types/api';

type Line = { productId: number | ''; quantity: number; unitPrice: number };
const statusTone: Record<PurchaseOrderStatus, 'amber' | 'green' | 'red'> = { PENDING: 'amber', RECEIVED: 'green', CANCELLED: 'red' };
const statusLabel: Record<PurchaseOrderStatus, string> = { PENDING: 'Menunggu', RECEIVED: 'Diterima', CANCELLED: 'Dibatalkan' };

export function PurchasesPage() {
  const toast = useToast();
  const purchases = useLoad(() => api.purchases());
  const products = useLoad(() => api.products());
  const suppliers = useLoad(() => api.suppliers());
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [busy, setBusy] = useState(false);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const valid = supplierId !== '' && lines.length > 0 && lines.every((l) => l.productId !== '' && l.quantity > 0 && l.unitPrice >= 0);

  const openCreate = () => {
    // Pre-fill with low-stock products to speed up restocking.
    const low = (products.data ?? []).filter((p) => p.lowStock).slice(0, 10);
    setLines(low.length
      ? low.map((p) => ({ productId: p.id, quantity: Math.max((p.minStock ?? 5) * 2 - p.stock, 1), unitPrice: Number(p.costPrice) }))
      : [{ productId: '', quantity: 1, unitPrice: 0 }]);
    setSupplierId('');
    setNote('');
    setCreating(true);
  };

  const updateLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const create = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const po = await api.createPurchase({
        supplierId: Number(supplierId), note: note || undefined,
        items: lines.map((l) => ({ productId: Number(l.productId), quantity: l.quantity, unitPrice: l.unitPrice })),
      });
      toast.success(`PO ${po.orderNumber} dibuat`);
      setCreating(false);
      void purchases.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const act = async (po: PurchaseOrder, action: 'receive' | 'cancel') => {
    setBusy(true);
    try {
      const updated = action === 'receive' ? await api.receivePurchase(po.id) : await api.cancelPurchase(po.id);
      toast.success(action === 'receive' ? `Barang PO ${po.orderNumber} diterima, stok bertambah` : `PO ${po.orderNumber} dibatalkan`);
      setViewing(updated);
      void purchases.reload();
      void products.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const data = purchases.data ?? [];

  return (
    <>
      <PageHeader title="Pembelian (Purchase Order)" description="Pesan barang ke supplier. Saat PO diterima, stok bertambah dan harga modal diperbarui."
        actions={<Button onClick={openCreate}><Plus size={16} /> Buat PO</Button>} />
      {purchases.error && <div className="mb-4"><Alert>{purchases.error}</Alert></div>}
      {purchases.loading && !purchases.data ? <Spinner /> : (
        <Table headers={['No. PO', 'Tanggal', 'Supplier', 'Item', 'Total', 'Status', '']} empty={data.length === 0}>
          {data.map((po) => (
            <tr key={po.id} className="hover:bg-slate-900/60">
              <Td className="font-medium">{po.orderNumber}</Td>
              <Td className="whitespace-nowrap text-slate-400">{formatDateTime(po.createdAt)}</Td>
              <Td>{po.supplierName}</Td>
              <Td>{po.items.length} produk</Td>
              <Td className="font-semibold">{money(po.total)}</Td>
              <Td><Badge tone={statusTone[po.status]}>{statusLabel[po.status]}</Badge></Td>
              <Td className="text-right"><Button variant="ghost" size="sm" onClick={() => setViewing(po)} aria-label="Detail"><Eye size={14} /></Button></Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={creating} wide title="Buat Purchase Order" onClose={() => setCreating(false)}
        footer={<>
          <span className="mr-auto self-center text-sm text-slate-300">Total: <b className="text-amber-300">{money(total)}</b></span>
          <Button variant="secondary" onClick={() => setCreating(false)}>Batal</Button>
          <Button disabled={!valid || busy} onClick={create}>{busy ? 'Menyimpan...' : 'Simpan PO'}</Button>
        </>}>
        {(suppliers.data ?? []).length === 0 && <div className="mb-3"><Alert tone="info">Belum ada supplier. Tambahkan dulu di menu Supplier.</Alert></div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Supplier *">
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Pilih supplier...</option>
              {(suppliers.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} /></Field>
        </div>
        <div className="mt-4 space-y-2">
          <div className="hidden grid-cols-[1fr_90px_130px_110px_32px] gap-2 text-xs text-slate-400 sm:grid">
            <span>Produk</span><span>Jumlah</span><span>Harga beli/unit</span><span className="text-right">Subtotal</span><span />
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_90px_130px_110px_32px] sm:items-center">
              <Select className="col-span-2 sm:col-span-1" value={l.productId} onChange={(e) => {
                const p = (products.data ?? []).find((x) => x.id === Number(e.target.value));
                updateLine(i, { productId: e.target.value ? Number(e.target.value) : '', unitPrice: p ? Number(p.costPrice) : l.unitPrice });
              }}>
                <option value="">Pilih produk...</option>
                {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} (stok {p.stock})</option>)}
              </Select>
              <Input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })} aria-label="Jumlah" />
              <Input type="number" min={0} value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) || 0 })} aria-label="Harga beli" />
              <span className="text-right text-sm text-slate-300">{money(l.quantity * l.unitPrice)}</span>
              <button onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} disabled={lines.length === 1}
                className="justify-self-end text-rose-300 disabled:opacity-30" aria-label="Hapus baris"><Trash2 size={16} /></button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, { productId: '', quantity: 1, unitPrice: 0 }])}><Plus size={14} /> Tambah baris</Button>
        </div>
      </Modal>

      <Modal open={viewing !== null} wide title={`Detail ${viewing?.orderNumber ?? ''}`} onClose={() => setViewing(null)}
        footer={viewing?.status === 'PENDING' ? <>
          <Button variant="danger" disabled={busy} onClick={() => viewing && act(viewing, 'cancel')}><X size={16} /> Batalkan PO</Button>
          <Button disabled={busy} onClick={() => viewing && act(viewing, 'receive')}><Check size={16} /> Terima Barang</Button>
        </> : <Button variant="secondary" onClick={() => setViewing(null)}>Tutup</Button>}>
        {viewing && (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-slate-400">Supplier:</span> {viewing.supplierName}</p>
              <p><span className="text-slate-400">Status:</span> <Badge tone={statusTone[viewing.status]}>{statusLabel[viewing.status]}</Badge></p>
              <p><span className="text-slate-400">Dibuat:</span> {formatDateTime(viewing.createdAt)} oleh {viewing.createdBy ?? '-'}</p>
              {viewing.receivedAt && <p><span className="text-slate-400">Diterima:</span> {formatDateTime(viewing.receivedAt)}</p>}
              {viewing.note && <p className="sm:col-span-2"><span className="text-slate-400">Catatan:</span> {viewing.note}</p>}
            </div>
            <Table compact headers={['Produk', 'Jumlah', 'Harga beli', 'Subtotal']}>
              {viewing.items.map((it) => (
                <tr key={it.productId}>
                  <Td>{it.productName} <span className="text-xs text-slate-500">{it.sku}</span></Td>
                  <Td>{num(it.quantity)}</Td>
                  <Td>{money(it.unitPrice)}</Td>
                  <Td className="font-semibold">{money(it.lineTotal)}</Td>
                </tr>
              ))}
            </Table>
            <p className="text-right text-lg font-bold">Total <span className="text-amber-300">{money(viewing.total)}</span></p>
          </div>
        )}
      </Modal>
    </>
  );
}

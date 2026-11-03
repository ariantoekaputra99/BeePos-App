import { useState } from 'react';
import { Ban, Receipt } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { daysAgo, errorMessage, formatDateTime, isoDate, money, paymentLabel } from '../lib/format';
import { Alert, Badge, Button, Field, Input, Modal, PageHeader, Spinner, Table, Td } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { useToast } from '../components/Toast';
import { isManager } from '../routes';
import type { Sale, Session } from '../types/api';

export function SalesPage({ session }: { session: Session }) {
  const toast = useToast();
  const [from, setFrom] = useState(isoDate());
  const [to, setTo] = useState(isoDate());
  const { data, loading, error, reload } = useLoad(() => api.sales(from, to), [from, to]);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [voiding, setVoiding] = useState<Sale | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  const rows = (data ?? []).filter((s) =>
    `${s.invoiceNumber} ${s.customerName ?? ''} ${s.cashier ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const completed = rows.filter((s) => s.status === 'COMPLETED');

  const doVoid = async () => {
    if (!voiding) return;
    setBusy(true);
    try {
      await api.voidSale(voiding.id, reason);
      toast.success(`Transaksi ${voiding.invoiceNumber} dibatalkan, stok dikembalikan`);
      setVoiding(null);
      setReason('');
      void reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const presets: Array<[string, string, string]> = [
    ['Hari ini', isoDate(), isoDate()],
    ['Kemarin', daysAgo(1), daysAgo(1)],
    ['7 hari', daysAgo(6), isoDate()],
    ['30 hari', daysAgo(29), isoDate()],
  ];

  return (
    <>
      <PageHeader title="Riwayat Transaksi" description="Lihat, cetak ulang struk, dan batalkan transaksi." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Dari"><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Sampai"><Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-2">
          {presets.map(([label, f, t]) => (
            <Button key={label} variant={from === f && to === t ? 'primary' : 'secondary'} size="sm" onClick={() => { setFrom(f); setTo(t); }}>{label}</Button>
          ))}
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari invoice / pelanggan / kasir" className="max-w-xs" />
      </div>
      <p className="mb-3 text-sm text-slate-400">
        {completed.length} transaksi selesai · total <b className="text-amber-300">{money(completed.reduce((s, x) => s + Number(x.total), 0))}</b>
      </p>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {loading && !data ? <Spinner /> : (
        <Table headers={['Invoice', 'Waktu', 'Kasir', 'Pelanggan', 'Metode', 'Item', 'Total', 'Status', '']} empty={rows.length === 0}>
          {rows.map((s) => (
            <tr key={s.id} className="hover:bg-slate-900/60">
              <Td className="font-medium">{s.invoiceNumber}</Td>
              <Td className="whitespace-nowrap text-slate-400">{formatDateTime(s.createdAt)}</Td>
              <Td>{s.cashier ?? '-'}</Td>
              <Td>{s.customerName ?? 'Umum'}</Td>
              <Td>{paymentLabel[s.paymentMethod]}</Td>
              <Td>{s.totalItems}</Td>
              <Td className="font-semibold">{money(s.total)}</Td>
              <Td>{s.status === 'VOIDED' ? <Badge tone="red">Batal</Badge> : <Badge tone="green">Selesai</Badge>}</Td>
              <Td className="whitespace-nowrap text-right">
                <Button variant="ghost" size="sm" onClick={() => setSelected(s)} aria-label="Lihat struk"><Receipt size={14} /></Button>
                {isManager(session.role) && s.status === 'COMPLETED' &&
                  <Button variant="ghost" size="sm" onClick={() => setVoiding(s)} aria-label="Batalkan"><Ban size={14} className="text-rose-300" /></Button>}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <ReceiptModal sale={selected} onClose={() => setSelected(null)} />

      <Modal open={voiding !== null} title="Batalkan Transaksi" onClose={() => setVoiding(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setVoiding(null)}>Kembali</Button>
          <Button variant="danger" disabled={busy} onClick={doVoid}>Batalkan Transaksi</Button>
        </>}>
        <p className="text-sm text-slate-300">
          Transaksi <b>{voiding?.invoiceNumber}</b> senilai <b>{money(voiding?.total)}</b> akan dibatalkan dan stok barang dikembalikan.
        </p>
        <Field label="Alasan pembatalan" className="mt-4">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="mis. salah input, retur pelanggan" maxLength={255} />
        </Field>
      </Modal>
    </>
  );
}

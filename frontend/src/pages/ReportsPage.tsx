import { useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { daysAgo, errorMessage, isoDate, money, num, paymentLabel, shortDay } from '../lib/format';
import { Alert, Button, Card, Field, Input, PageHeader, Spinner, Stat, Table, Td } from '../components/ui';
import { BarChart } from '../components/BarChart';
import { useToast } from '../components/Toast';

export function ReportsPage() {
  const toast = useToast();
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(isoDate());
  const { data, loading, error } = useLoad(() => api.salesReport(from, to), [from, to]);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await api.downloadSalesCsv(from, to);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const firstOfMonth = (() => { const d = new Date(); d.setDate(1); return isoDate(d); })();
  const presets: Array<[string, string, string]> = [
    ['Hari ini', isoDate(), isoDate()],
    ['7 hari', daysAgo(6), isoDate()],
    ['30 hari', daysAgo(29), isoDate()],
    ['Bulan ini', firstOfMonth, isoDate()],
  ];
  const margin = data && Number(data.totalRevenue) > 0 ? (Number(data.grossProfit) / Number(data.totalRevenue)) * 100 : 0;

  return (
    <>
      <PageHeader title="Laporan Penjualan" description="Omzet, laba kotor, produk terlaris, dan rekap metode pembayaran."
        actions={<Button variant="secondary" onClick={download} disabled={downloading}><Download size={16} /> {downloading ? 'Mengunduh...' : 'Export CSV'}</Button>} />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Dari"><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Sampai"><Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
        {presets.map(([label, f, t]) => (
          <Button key={label} size="sm" variant={from === f && to === t ? 'primary' : 'secondary'} onClick={() => { setFrom(f); setTo(t); }}>{label}</Button>
        ))}
      </div>
      {error && <Alert>{error}</Alert>}
      {loading && !data && <Spinner />}
      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Omzet" value={money(data.totalRevenue)} sub={`${num(data.totalOrders)} transaksi · ${num(data.totalItems)} item`} />
            <Stat label="Laba Kotor" value={money(data.grossProfit)} sub={`Margin ${margin.toFixed(1)}% · HPP ${money(data.totalCost)}`} />
            <Stat label="Rata-rata per Transaksi" value={money(data.averageOrder)} />
            <Stat label="Diskon / Pajak" value={money(data.totalDiscount)} sub={`Pajak ${money(data.totalTax)} · ${data.voidedOrders} transaksi batal`} />
          </section>

          <Card>
            <h2 className="font-semibold text-white">Omzet Harian</h2>
            <div className="mt-4">
              <BarChart data={data.daily.map((d) => ({ label: data.daily.length > 10 ? `${d.date.slice(8)}/${d.date.slice(5, 7)}` : shortDay(d.date), value: Number(d.revenue), hint: `${d.orders} transaksi` }))} format={money} />
            </div>
          </Card>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0">
              <h2 className="mb-3 font-semibold text-white">Produk Terlaris</h2>
              <Table compact headers={['#', 'Produk', 'Terjual', 'Omzet']} empty={data.topProducts.length === 0}>
                {data.topProducts.map((p, i) => (
                  <tr key={p.productId}>
                    <Td className="text-slate-500">{i + 1}</Td>
                    <Td>{p.name}</Td>
                    <Td>{num(p.quantity)}</Td>
                    <Td className="font-semibold">{money(p.revenue)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
            <div className="min-w-0">
              <h2 className="mb-3 font-semibold text-white">Metode Pembayaran</h2>
              <Table compact headers={['Metode', 'Transaksi', 'Jumlah']} empty={data.byPaymentMethod.length === 0}>
                {data.byPaymentMethod.map((p) => (
                  <tr key={p.method}>
                    <Td>{paymentLabel[p.method]}</Td>
                    <Td>{num(p.orders)}</Td>
                    <Td className="font-semibold">{money(p.amount)}</Td>
                  </tr>
                ))}
              </Table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

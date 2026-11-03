import { AlertTriangle, ShoppingCart } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { formatDateTime, money, num, paymentLabel, shortDay } from '../lib/format';
import { Alert, Badge, Button, Card, PageHeader, Spinner, Stat } from '../components/ui';
import { BarChart } from '../components/BarChart';
import { isManager, RouteKey } from '../routes';
import type { Session } from '../types/api';

export function DashboardPage({ session, onNavigate }: { session: Session; onNavigate: (key: RouteKey) => void }) {
  const { data, loading, error } = useLoad(() => api.dashboard());
  const manager = isManager(session.role);

  return (
    <>
      <PageHeader
        title={`Halo, ${session.fullName || session.username}`}
        description="Ringkasan operasional toko hari ini."
        actions={<Button onClick={() => onNavigate('pos')}><ShoppingCart size={16} /> Buka Kasir</Button>}
      />
      {error && <Alert>{error}</Alert>}
      {loading && !data && <Spinner />}
      {data && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Omzet Hari Ini" value={money(data.todayRevenue)} sub={`${num(data.todayOrders)} transaksi`} />
            {manager
              ? <Stat label="Laba Kotor Hari Ini" value={money(data.todayProfit)} sub={`Total laba kotor ${money(data.grossProfit)}`} />
              : <Stat label="Transaksi Hari Ini" value={num(data.todayOrders)} />}
            <Stat label="Produk Aktif" value={num(data.totalProducts)} sub={`${num(data.totalOrders)} transaksi sepanjang waktu`} />
            <Stat label="Stok Menipis" value={num(data.lowStockProducts)} tone={data.lowStockProducts > 0 ? 'warn' : 'default'}
              sub={data.lowStockProducts > 0 ? 'Perlu restock' : 'Semua stok aman'} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
            <Card>
              <h2 className="font-semibold text-white">Penjualan 7 Hari Terakhir</h2>
              <p className="text-sm text-slate-400">Total {money(data.last7Days.reduce((s, d) => s + d.revenue, 0))}</p>
              <div className="mt-4">
                <BarChart data={data.last7Days.map((d) => ({ label: shortDay(d.date), value: d.revenue, hint: `${d.orders} transaksi` }))} format={money} />
              </div>
            </Card>
            <Card>
              <h2 className="font-semibold text-white">Produk Terlaris (7 hari)</h2>
              {data.topProducts.length === 0 ? <p className="mt-6 text-sm text-slate-500">Belum ada penjualan.</p> : (
                <ol className="mt-4 space-y-3">
                  {data.topProducts.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-amber-300">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{p.name}</p>
                        <p className="text-xs text-slate-500">{num(p.quantity)} terjual</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-200">{money(p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Transaksi Terbaru</h2>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('sales')}>Lihat semua</Button>
              </div>
              <div className="mt-3 divide-y divide-slate-800">
                {data.recentSales.length === 0 && <p className="py-6 text-sm text-slate-500">Belum ada transaksi.</p>}
                {data.recentSales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{s.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(s.createdAt)} · {paymentLabel[s.paymentMethod]} · {s.cashier ?? '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${s.status === 'VOIDED' ? 'text-slate-500 line-through' : 'text-amber-300'}`}>{money(s.total)}</p>
                      {s.status === 'VOIDED' && <Badge tone="red">Batal</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h2 className="flex items-center gap-2 font-semibold text-white"><AlertTriangle size={18} className="text-amber-300" /> Stok Menipis</h2>
              {data.lowStock.length === 0 ? <p className="mt-6 text-sm text-slate-500">Tidak ada produk dengan stok menipis.</p> : (
                <ul className="mt-4 space-y-2">
                  {data.lowStock.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-xl bg-slate-950 px-3 py-2 text-sm">
                      <span className="truncate">{p.name} <span className="text-xs text-slate-500">{p.sku}</span></span>
                      <Badge tone={p.stock === 0 ? 'red' : 'amber'}>{p.stock} / min {p.minStock}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {manager && data.lowStock.length > 0 && (
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => onNavigate('purchases')}>Buat Purchase Order</Button>
              )}
            </Card>
          </section>
        </div>
      )}
    </>
  );
}

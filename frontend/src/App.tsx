import React, { useMemo, useState } from 'react';

const stats = [
  { label: 'Penjualan hari ini', value: 'Rp 14.250.000', tone: 'emerald' },
  { label: 'Transaksi', value: '268', tone: 'sky' },
  { label: 'Produk aktif', value: '1.240', tone: 'violet' },
  { label: 'Laba bersih', value: 'Rp 3.820.000', tone: 'amber' },
];

const recentSales = [
  { id: '#1024', customer: 'Andi', item: 'Minyak Goreng 2L', total: 'Rp 34.000', time: '09:15' },
  { id: '#1025', customer: 'Rina', item: 'Beras 5kg', total: 'Rp 72.000', time: '09:28' },
  { id: '#1026', customer: 'Budi', item: 'Ayam Potong', total: 'Rp 120.000', time: '10:05' },
  { id: '#1027', customer: 'Dewi', item: 'Coca Cola 1L', total: 'Rp 18.000', time: '10:40' },
];

const topProducts = [
  { name: 'Beras 5kg', sold: 96 },
  { name: 'Minyak Goreng', sold: 78 },
  { name: 'Coca Cola 1L', sold: 64 },
  { name: 'Ayam Potong', sold: 52 },
];

const lowStock = [
  { name: 'Telur Ayam', stock: 8 },
  { name: 'Susu UHT', stock: 12 },
  { name: 'Sabun Cuci', stock: 5 },
];

const quickActions = ['Transaksi Baru', 'Tambah Produk', 'Laporan Harian', 'Kelola Pelanggan'];

export default function App() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const activeView = useMemo(() => {
    if (selectedTab === 'pos') return 'POS Terminal';
    if (selectedTab === 'products') return 'Product Management';
    if (selectedTab === 'reports') return 'Reports';
    return 'Overview Dashboard';
  }, [selectedTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-400">BeePos</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Point of Sale Dashboard</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {quickActions.map((action) => (
              <button
                key={action}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400 hover:text-amber-300"
              >
                {action}
              </button>
            ))}
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'pos', label: 'POS' },
            { key: 'products', label: 'Products' },
            { key: 'reports', label: 'Reports' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                selectedTab === tab.key
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Current view</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{activeView}</h2>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                stat.tone === 'emerald'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : stat.tone === 'sky'
                    ? 'bg-sky-500/10 text-sky-400'
                    : stat.tone === 'violet'
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'bg-amber-500/10 text-amber-400'
              }`}>
                {stat.label}
              </div>
              <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Penjualan terbaru</h2>
              <span className="text-sm text-slate-400">30 menit terakhir</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-t border-slate-800 bg-slate-900/40">
                      <td className="px-4 py-3 text-slate-300">{sale.id}</td>
                      <td className="px-4 py-3 text-slate-200">{sale.customer}</td>
                      <td className="px-4 py-3 text-slate-300">{sale.item}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{sale.total}</td>
                      <td className="px-4 py-3 text-slate-400">{sale.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-semibold text-white">Produk terlaris</h2>
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.name}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                      <span>{product.name}</span>
                      <span>{product.sold} pcs</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-800">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400"
                        style={{ width: `${(product.sold / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-5 text-xl font-semibold text-white">Stok menipis</h2>
              <div className="space-y-3">
                {lowStock.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-950/50 px-3 py-2">
                    <span className="text-slate-200">{item.name}</span>
                    <span className="rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300">
                      {item.stock} pcs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

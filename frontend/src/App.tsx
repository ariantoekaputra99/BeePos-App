import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from './services/api';
import type { DashboardSummary, Product, Role } from './types/api';

const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

type CartItem = Product & { quantity: number };

const fallbackProducts: Product[] = [
  { id: 1, name: 'Beras Premium 5kg', sku: 'BR-005', price: 72000, costPrice: 62000, stock: 24, category: 'Sembako' },
  { id: 2, name: 'Minyak Goreng 2L', sku: 'MG-002', price: 34000, costPrice: 28000, stock: 16, category: 'Sembako' },
  { id: 3, name: 'Coca Cola 1L', sku: 'CC-001', price: 18000, costPrice: 13000, stock: 42, category: 'Minuman' },
];

const fallbackSummary: DashboardSummary = { totalProducts: 3, lowStockProducts: 0, totalRevenue: 0, totalCost: 0, grossProfit: 0, totalOrders: 0, totalPurchaseValue: 0 };

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('beepos_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('beepos_user') ?? 'admin');
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('beepos_role') as Role) ?? 'ADMIN');
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadBusinessData = async () => {
    setLoading(true); setError('');
    try {
      const [loadedProducts, loadedSummary] = await Promise.all([api.products(), api.dashboard()]);
      setProducts(loadedProducts); setSummary(loadedSummary);
    } catch (err) {
      setProducts(fallbackProducts);
      setSummary(fallbackSummary);
      setError(err instanceof Error ? `${err.message} Data demo ditampilkan.` : 'API belum tersedia. Data demo ditampilkan.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (token) void loadBusinessData(); }, [token]);

  const filteredProducts = products.filter((product) => `${product.name} ${product.sku} ${product.category ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.login(String(form.get('username')), String(form.get('password')));
      localStorage.setItem('beepos_token', result.token); localStorage.setItem('beepos_user', result.username); localStorage.setItem('beepos_role', result.role);
      setToken(result.token); setUsername(result.username); setRole(result.role);
    } catch (err) { setError(err instanceof Error ? err.message : 'Login gagal'); }
    finally { setLoading(false); }
  };

  const checkout = async () => {
    if (!cart.length) return;
    setLoading(true); setError('');
    try {
      await api.createSale({ items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })), paymentMethod: 'CASH', tax: 0, discount: 0 });
      setCart([]); setMessage('Transaksi berhasil disimpan dan stok diperbarui.'); await loadBusinessData();
    } catch (err) { setError(err instanceof Error ? err.message : 'Transaksi gagal'); }
    finally { setLoading(false); }
  };

  if (!token) return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100"><form onSubmit={login} className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"><p className="text-xs uppercase tracking-[.3em] text-amber-400">BeePos</p><h1 className="mt-3 text-3xl font-bold">Masuk ke Retail OS</h1><p className="mt-2 text-sm text-slate-400">Gunakan akun operasional Anda untuk mengakses POS.</p>{error && <p className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}<label className="mt-6 block text-sm text-slate-300">Username<input name="username" defaultValue="admin" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-amber-400" /></label><label className="mt-4 block text-sm text-slate-300">Password<input name="password" type="password" defaultValue="admin123" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-amber-400" /></label><button disabled={loading} className="mt-6 w-full rounded-xl bg-amber-400 py-3 font-bold text-slate-950 disabled:opacity-50">{loading ? 'Memproses...' : 'Masuk'}</button></form></main>;

  return <div className="min-h-screen bg-slate-950 text-slate-100"><aside className="fixed hidden h-screen w-64 border-r border-slate-800 bg-slate-900 p-6 md:block"><p className="text-xs uppercase tracking-[.3em] text-amber-400">BeePos</p><h1 className="mt-2 text-2xl font-bold">Retail OS</h1><nav className="mt-10 space-y-2"><a href="#dashboard" className="block rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950">Dashboard & POS</a><a href="#products" className="block rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">Produk</a><a href="#reports" className="block rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">Laporan</a></nav><div className="absolute bottom-6 left-6 right-6 rounded-xl border border-slate-700 bg-slate-950 p-3"><p className="text-xs text-slate-400">{username} · {role}</p><button onClick={() => { localStorage.clear(); setToken(null); }} className="mt-2 text-xs text-rose-300">Keluar</button></div></aside><main className="min-h-screen md:ml-64"><header className="border-b border-slate-800 bg-slate-950/90 px-6 py-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">Selamat datang, {username}</p><h2 className="text-2xl font-bold">Dashboard Operasional</h2></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">● API connected</span></div></header><div className="p-6" id="dashboard">{(error || message) && <div className={`mb-5 rounded-xl p-3 text-sm ${error ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>{error || message}</div>}<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[['Omzet', money(summary.totalRevenue)], ['Gross Profit', money(summary.grossProfit)], ['Produk', summary.totalProducts], ['Stok Menipis', summary.lowStockProducts]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-2xl font-bold text-white">{value}</p></div>)}</section><section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]" id="products"><div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Produk untuk POS</h2><p className="text-sm text-slate-400">Data berasal dari Spring Boot API</p></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk..." className="w-48 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400" /></div><div className="grid gap-4 md:grid-cols-2">{filteredProducts.map((product) => <button key={product.id} disabled={product.stock < 1} onClick={() => setCart((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item) : [...current, { ...product, quantity: 1 }]; })} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left hover:border-amber-400 disabled:opacity-50"><div className="flex justify-between"><span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{product.category || 'Umum'}</span><span className="text-xs text-slate-400">{product.stock} stok</span></div><h3 className="mt-5 font-semibold">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.sku}</p><p className="mt-4 font-bold text-amber-300">{money(product.price)}</p></button>)}</div></div><aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex justify-between"><div><h2 className="text-xl font-semibold">Keranjang</h2><p className="text-sm text-slate-400">{cart.length} produk</p></div><button onClick={() => setCart([])} className="text-xs text-rose-300">Reset</button></div><div className="mt-5 space-y-3">{cart.length ? cart.map((item) => <div key={item.id} className="rounded-xl bg-slate-950 p-3"><div className="flex justify-between gap-3"><span className="text-sm">{item.name}</span><b className="text-amber-300">{money(item.price * item.quantity)}</b></div><div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><button onClick={() => setCart((items) => items.map((line) => line.id === item.id ? { ...line, quantity: line.quantity - 1 } : line).filter((line) => line.quantity > 0))} className="rounded bg-slate-800 px-2 py-1">−</button><span>{item.quantity}</span><button onClick={() => setCart((items) => items.map((line) => line.id === item.id ? { ...line, quantity: line.quantity + 1 } : line))} className="rounded bg-slate-800 px-2 py-1">+</button></div></div>) : <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-500">Keranjang kosong</div>}</div><div className="mt-5 border-t border-slate-800 pt-4"><div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-amber-300">{money(total)}</span></div><button onClick={checkout} disabled={!cart.length || loading} className="mt-4 w-full rounded-xl bg-amber-400 py-3 font-bold text-slate-950 disabled:opacity-40">{loading ? 'Menyimpan...' : 'Bayar Cash'}</button></div></aside></section></div></main></div>;
}

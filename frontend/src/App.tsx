import { useMemo, useState } from 'react';

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
};

type Supplier = {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
};

type InventoryMovement = {
  id: number;
  product: string;
  type: 'IN' | 'OUT';
  qty: number;
  note: string;
  date: string;
};

type SaleRecord = {
  id: string;
  customer: string;
  total: number;
  payment: string;
  time: string;
};

type CartItem = Product & { quantity: number };

const formatMoney = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const initialProducts: Product[] = [
  { id: 1, name: 'Beras Premium 5kg', sku: 'BR-005', price: 72000, stock: 24, category: 'Sembako' },
  { id: 2, name: 'Minyak Goreng 2L', sku: 'MG-002', price: 34000, stock: 16, category: 'Sembako' },
  { id: 3, name: 'Coca Cola 1L', sku: 'CC-001', price: 18000, stock: 42, category: 'Minuman' },
  { id: 4, name: 'Ayam Potong', sku: 'AY-001', price: 120000, stock: 8, category: 'Segar' },
  { id: 5, name: 'Telur Ayam 1kg', sku: 'TL-001', price: 29000, stock: 5, category: 'Segar' },
  { id: 6, name: 'Sabun Cuci 900ml', sku: 'SC-009', price: 14500, stock: 14, category: 'Rumah Tangga' },
];

const initialCustomers: Customer[] = [
  { id: 1, name: 'Andi Pratama', phone: '081234567890', email: 'andi@mail.com', city: 'Jakarta' },
  { id: 2, name: 'Rina Permata', phone: '081298765432', email: 'rina@mail.com', city: 'Bandung' },
  { id: 3, name: 'Budi Santoso', phone: '081223344556', email: 'budi@mail.com', city: 'Surabaya' },
  { id: 4, name: 'Dewi Lestari', phone: '081245678912', email: 'dewi@mail.com', city: 'Medan' },
];

const initialSuppliers: Supplier[] = [
  { id: 1, name: 'PT Maju Makmur', contact: 'Sulastri', phone: '081111222333', email: 'supplier1@mail.com' },
  { id: 2, name: 'CV Mandiri Sejahtera', contact: 'Hasan', phone: '082222333444', email: 'supplier2@mail.com' },
  { id: 3, name: 'UD Tiga Putra', contact: 'Bambang', phone: '083333444555', email: 'supplier3@mail.com' },
];

const initialInventory: InventoryMovement[] = [
  { id: 1, product: 'Beras Premium 5kg', type: 'IN', qty: 30, note: 'Pembelian baru', date: '2026-09-18' },
  { id: 2, product: 'Minyak Goreng 2L', type: 'OUT', qty: 12, note: 'Penjualan kasir', date: '2026-09-18' },
  { id: 3, product: 'Coca Cola 1L', type: 'IN', qty: 20, note: 'Restock distributor', date: '2026-09-18' },
  { id: 4, product: 'Ayam Potong', type: 'OUT', qty: 7, note: 'Order pelanggan', date: '2026-09-18' },
];

const initialSales: SaleRecord[] = [
  { id: 'INV-1024', customer: 'Andi', total: 118000, payment: 'Cash', time: '09:15' },
  { id: 'INV-1025', customer: 'Rina', total: 72000, payment: 'QRIS', time: '09:42' },
  { id: 'INV-1026', customer: 'Budi', total: 240000, payment: 'Card', time: '10:05' },
  { id: 'INV-1027', customer: 'Dewi', total: 185000, payment: 'Transfer', time: '10:40' },
];

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Produk' },
  { key: 'inventory', label: 'Inventori' },
  { key: 'customers', label: 'Pelanggan' },
  { key: 'suppliers', label: 'Supplier' },
  { key: 'sales', label: 'Penjualan' },
  { key: 'reports', label: 'Laporan' },
  { key: 'pos', label: 'POS' },
] as const;

export default function App() {
  const [selectedTab, setSelectedTab] = useState<(typeof navItems)[number]['key']>('dashboard');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [inventory, setInventory] = useState<InventoryMovement[]>(initialInventory);
  const [sales, setSales] = useState<SaleRecord[]>(initialSales);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState('');

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query.toLowerCase()),
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const lowStock = products.filter((product) => product.stock < 10);
  const todaySales = sales.reduce((sum, sale) => sum + sale.total, 0);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const changeCartQty = (id: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const checkout = () => {
    if (!cart.length) return;

    const transactionTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setProducts((current) =>
      current.map((product) => {
        const itemInCart = cart.find((item) => item.id === product.id);
        if (!itemInCart) return product;
        return { ...product, stock: Math.max(0, product.stock - itemInCart.quantity) };
      }),
    );

    setInventory((current) => [
      {
        id: Date.now(),
        product: cart.map((item) => item.name).join(', '),
        type: 'OUT',
        qty: cart.reduce((sum, item) => sum + item.quantity, 0),
        note: 'Penjualan POS',
        date: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);

    setSales((current) => [
      {
        id: `INV-${Date.now()}`.slice(0, 12),
        customer: 'Walk-in Customer',
        total: transactionTotal,
        payment: 'Cash',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
      ...current,
    ]);

    setCart([]);
    setMessage(`Transaksi berhasil diproses: ${formatMoney(transactionTotal)}`);
    setSelectedTab('dashboard');
    setTimeout(() => setMessage(''), 2600);
  };

  const stockHealth = products.map((product) => ({
    name: product.name,
    stock: product.stock,
    width: Math.min(product.stock * 4, 100),
  }));

  const renderDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Penjualan Hari Ini', value: formatMoney(todaySales), tone: 'emerald' },
          { label: 'Transaksi', value: `${sales.length}`, tone: 'sky' },
          { label: 'Produk Aktif', value: `${products.length}`, tone: 'violet' },
          { label: 'Stok Menipis', value: `${lowStock.length}`, tone: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                stat.tone === 'emerald'
                  ? 'bg-emerald-500/10 text-emerald-300'
                  : stat.tone === 'sky'
                    ? 'bg-sky-500/10 text-sky-300'
                    : stat.tone === 'violet'
                      ? 'bg-violet-500/10 text-violet-300'
                      : 'bg-amber-500/10 text-amber-300'
              }`}
            >
              {stat.label}
            </span>
            <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Penjualan Terbaru</h2>
            <span className="text-sm text-slate-400">30 menit terakhir</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Pembayaran</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-t border-slate-800">
                    <td className="px-4 py-3 text-slate-300">{sale.id}</td>
                    <td className="px-4 py-3 text-slate-200">{sale.customer}</td>
                    <td className="px-4 py-3 text-slate-300">{sale.payment}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">{formatMoney(sale.total)}</td>
                    <td className="px-4 py-3 text-slate-400">{sale.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-semibold text-white">Kondisi Stok</h2>
          <div className="space-y-4">
            {stockHealth.slice(0, 5).map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{item.name}</span>
                  <span>{item.stock} pcs</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400"
                    style={{ width: `${Math.min(item.width, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Daftar Produk</h2>
          <p className="text-sm text-slate-400">Kelola katalog dan harga produk retail</p>
        </div>
        <button className="rounded-xl bg-amber-400 px-4 py-2 font-semibold text-slate-950">+ Produk Baru</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{product.category}</span>
              <span className={`text-xs ${product.stock < 10 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {product.stock} pcs
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">{product.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{product.sku}</p>
            <p className="mt-4 text-xl font-bold text-amber-300">{formatMoney(product.price)}</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">Edit</button>
              <button className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950" onClick={() => addToCart(product)}>
                + Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventori</h2>
          <p className="text-sm text-slate-400">Pencatatan stock masuk dan keluar</p>
        </div>
        <button className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-slate-950">+ Restock</button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Catatan</th>
              <th className="px-4 py-3">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((entry) => (
              <tr key={entry.id} className="border-t border-slate-800">
                <td className="px-4 py-3 text-slate-200">{entry.product}</td>
                <td className={`px-4 py-3 font-semibold ${entry.type === 'IN' ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {entry.type}
                </td>
                <td className="px-4 py-3 text-slate-300">{entry.qty}</td>
                <td className="px-4 py-3 text-slate-400">{entry.note}</td>
                <td className="px-4 py-3 text-slate-400">{entry.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pelanggan</h2>
          <p className="text-sm text-slate-400">Daftar pelanggan loyal dan repeat buyer</p>
        </div>
        <button className="rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white">+ Pelanggan</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {customers.map((customer) => (
          <div key={customer.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-lg font-semibold text-white">{customer.name}</h3>
            <p className="mt-3 text-sm text-slate-400">{customer.phone}</p>
            <p className="text-sm text-slate-400">{customer.email}</p>
            <p className="mt-2 text-sm text-amber-300">{customer.city}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Supplier</h2>
          <p className="text-sm text-slate-400">Kelola pemasok dan mitra distribusi</p>
        </div>
        <button className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950">+ Supplier</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h3 className="text-lg font-semibold text-white">{supplier.name}</h3>
            <p className="mt-2 text-sm text-slate-400">Kontak: {supplier.contact}</p>
            <p className="text-sm text-slate-400">{supplier.phone}</p>
            <p className="text-sm text-slate-400">{supplier.email}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Riwayat Penjualan</h2>
          <p className="text-sm text-slate-400">Semua transaksi yang sudah tercatat</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-t border-slate-800">
                <td className="px-4 py-3 text-slate-200">{sale.id}</td>
                <td className="px-4 py-3 text-slate-300">{sale.customer}</td>
                <td className="px-4 py-3 text-slate-300">{sale.payment}</td>
                <td className="px-4 py-3 font-semibold text-emerald-400">{formatMoney(sale.total)}</td>
                <td className="px-4 py-3 text-slate-400">{sale.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold text-white">Ringkasan Harian</h2>
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3">
            <span className="text-slate-300">Pendapatan</span>
            <span className="font-semibold text-emerald-300">{formatMoney(todaySales)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3">
            <span className="text-slate-300">Produk Terjual</span>
            <span className="font-semibold text-white">{cart.reduce((sum, item) => sum + item.quantity, 0) + 78}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3">
            <span className="text-slate-300">Rupiah Laba</span>
            <span className="font-semibold text-amber-300">{formatMoney(todaySales * 0.28)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold text-white">Top Kategori</h2>
        <div className="mt-5 space-y-4">
          {[
            { name: 'Sembako', value: 72 },
            { name: 'Minuman', value: 54 },
            { name: 'Segar', value: 64 },
            { name: 'Rumah Tangga', value: 38 },
          ].map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                <span>{item.name}</span>
                <span>{item.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPos = () => (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
      <section>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">POS Terminal</h2>
              <p className="text-sm text-slate-400">Transaksi cepat untuk kasir</p>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk..."
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-400"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{product.category}</span>
                  <span className={`text-xs ${product.stock < 10 ? 'text-rose-300' : 'text-slate-400'}`}>{product.stock} st</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                <p className="mt-4 text-lg font-bold text-amber-300">{formatMoney(product.price)}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Keranjang</h2>
            <p className="text-sm text-slate-400">{cart.length} item dipilih</p>
          </div>
          <button onClick={() => setCart([])} className="text-sm text-rose-300">
            Reset
          </button>
        </div>

        <div className="space-y-3">
          {cart.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
              Keranjang masih kosong
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-950/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400">{formatMoney(item.price)}</p>
                  </div>
                  <p className="font-semibold text-amber-300">{formatMoney(item.price * item.quantity)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeCartQty(item.id, -1)} className="rounded bg-slate-800 px-2 py-1 text-sm">-</button>
                    <span className="min-w-6 text-center text-sm text-slate-200">{item.quantity}</span>
                    <button onClick={() => changeCartQty(item.id, 1)} className="rounded bg-slate-800 px-2 py-1 text-sm">+</button>
                  </div>
                  <button onClick={() => changeCartQty(item.id, -999)} className="text-xs text-rose-300">Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span>{formatMoney(cartTotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-lg font-bold text-white">
            <span>Total</span>
            <span className="text-amber-300">{formatMoney(cartTotal)}</span>
          </div>
          <button
            onClick={checkout}
            disabled={!cart.length}
            className="mt-5 w-full rounded-xl bg-amber-400 py-3 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Bayar Sekarang
          </button>
        </div>
      </aside>
    </div>
  );

  const activeContent =
    selectedTab === 'dashboard'
      ? renderDashboard()
      : selectedTab === 'products'
        ? renderProducts()
        : selectedTab === 'inventory'
          ? renderInventory()
          : selectedTab === 'customers'
            ? renderCustomers()
            : selectedTab === 'suppliers'
              ? renderSuppliers()
              : selectedTab === 'sales'
                ? renderSales()
                : selectedTab === 'reports'
                  ? renderReports()
                  : renderPos();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1600px]">
        <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-slate-900 p-6 md:block">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400">BeePos</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Retail OS</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSelectedTab(item.key)}
                className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                  selectedTab === item.key
                    ? 'bg-amber-400 font-semibold text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-slate-700 bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="mt-1 font-semibold text-white">Admin BeePos</p>
          </div>
        </aside>

        <main className="min-h-screen md:ml-64">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-400">Selamat pagi, Admin</p>
                <h2 className="text-2xl font-bold text-white">
                  {navItems.find((item) => item.key === selectedTab)?.label}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">Export</button>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">● System online</div>
              </div>
            </div>
          </header>

          <div className="p-6">
            {message && (
              <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {message}
              </div>
            )}
            {activeContent}
          </div>
        </main>
      </div>
    </div>
  );
}

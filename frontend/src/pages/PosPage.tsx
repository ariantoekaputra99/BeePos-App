import { FormEvent, useMemo, useRef, useState } from 'react';
import { Minus, Plus, ScanBarcode, Search, Trash2, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { errorMessage, money, paymentLabel } from '../lib/format';
import { Alert, Badge, Button, Field, Input, Modal, Select, Spinner } from '../components/ui';
import { ReceiptModal } from '../components/Receipt';
import { useToast } from '../components/Toast';
import type { Customer, PaymentMethod, Product, Sale, Session } from '../types/api';

type CartLine = { product: Product; quantity: number };
const METHODS: PaymentMethod[] = ['CASH', 'QRIS', 'CARD', 'TRANSFER'];

export function PosPage(_: { session: Session }) {
  const toast = useToast();
  const products = useLoad(() => api.products());
  const customers = useLoad(() => api.customers());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cash, setCash] = useState<number | ''>('');
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLElement>(null);

  const list = products.data ?? [];
  const categories = useMemo(() => [...new Set(list.map((p) => p.category).filter(Boolean))] as string[], [list]);
  const filtered = list.filter((p) =>
    (!category || p.category === category) &&
    `${p.name} ${p.sku} ${p.barcode ?? ''}`.toLowerCase().includes(query.toLowerCase()));

  const subtotal = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const tax = Math.round(((subtotal - safeDiscount) * taxPercent) / 100);
  const total = subtotal - safeDiscount + tax;
  const paid = method === 'CASH' ? (cash === '' ? 0 : cash) : total;
  const change = paid - total;
  const canPay = cart.length > 0 && !busy && (method !== 'CASH' || paid >= total);

  const add = (product: Product, qty = 1) => {
    setCart((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      const current = existing?.quantity ?? 0;
      if (current + qty > product.stock) {
        toast.error(`Stok ${product.name} tersisa ${product.stock}`);
        return lines;
      }
      return existing
        ? lines.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + qty } : l))
        : [...lines, { product, quantity: qty }];
    });
  };

  const setQty = (id: number, quantity: number) =>
    setCart((lines) => lines
      .map((l) => (l.product.id === id ? { ...l, quantity: Math.min(Math.max(quantity, 0), l.product.stock) } : l))
      .filter((l) => l.quantity > 0));

  const scan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = scanRef.current;
    const code = input?.value.trim();
    if (!code || !input) return;
    try {
      const local = list.find((p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
      add(local ?? await api.productByCode(code));
    } catch (err) {
      toast.error(errorMessage(err));
    }
    input.value = '';
    input.focus();
  };

  const reset = () => {
    setCart([]); setDiscount(0); setCash(''); setCustomerId(''); setNote(''); setMethod('CASH');
  };

  const checkout = async () => {
    if (!canPay) return;
    setBusy(true);
    try {
      const sale = await api.createSale({
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        paymentMethod: method,
        tax,
        discount: safeDiscount,
        amountPaid: method === 'CASH' ? paid : total,
        customerId: customerId === '' ? null : customerId,
        note: note || undefined,
      });
      setReceipt(sale);
      reset();
      toast.success(`Transaksi ${sale.invoiceNumber} berhasil`);
      void products.reload();
    } catch (err) {
      toast.error(errorMessage(err, 'Transaksi gagal'));
      void products.reload();
    } finally {
      setBusy(false);
    }
  };

  const quickCash = [...new Set([total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000])]
    .filter((v) => v > 0).slice(0, 4);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="min-w-0 pb-20 xl:pb-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <form onSubmit={scan} className="relative flex-1">
            <ScanBarcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input ref={scanRef} placeholder="Scan barcode / ketik SKU lalu Enter" className="pl-10" autoFocus />
          </form>
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama produk..." className="pl-10" />
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {['', ...categories].map((c) => (
            <button key={c || 'all'} onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1.5 text-xs ${category === c ? 'bg-amber-400 font-semibold text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              {c || 'Semua'}
            </button>
          ))}
        </div>
        {products.error && <Alert>{products.error}</Alert>}
        {products.loading && !products.data ? <Spinner /> : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((p) => {
              const inCart = cart.find((l) => l.product.id === p.id)?.quantity ?? 0;
              return (
                <button key={p.id} disabled={p.stock < 1} onClick={() => add(p)}
                  className="relative rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-40">
                  {inCart > 0 && <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-slate-950">{inCart}</span>}
                  <Badge>{p.category || 'Umum'}</Badge>
                  <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-white">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{p.sku}</p>
                  <div className="mt-3 flex items-end justify-between gap-1">
                    <span className="font-bold text-amber-300">{money(p.price)}</span>
                    <span className={`text-xs ${p.lowStock ? 'text-amber-300' : 'text-slate-400'}`}>{p.stock} {p.unit ?? ''}</span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate-500">Produk tidak ditemukan.</p>}
          </div>
        )}
      </section>

      {cart.length > 0 && (
        <button onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 shadow-2xl xl:hidden">
          <span>{cart.reduce((s, l) => s + l.quantity, 0)} item · Lihat keranjang</span>
          <span>{money(total)}</span>
        </button>
      )}

      <aside ref={cartRef} className="h-fit scroll-mt-20 rounded-2xl border border-slate-800 bg-slate-900 p-5 xl:sticky xl:top-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Keranjang</h2>
            <p className="text-xs text-slate-400">{cart.reduce((s, l) => s + l.quantity, 0)} item</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} disabled={!cart.length}>Kosongkan</Button>
        </div>

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {cart.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Keranjang kosong</div>}
          {cart.map(({ product, quantity }) => (
            <div key={product.id} className="rounded-xl bg-slate-950 p-3">
              <div className="flex justify-between gap-3">
                <span className="text-sm text-white">{product.name}</span>
                <b className="whitespace-nowrap text-sm text-amber-300">{money(Number(product.price) * quantity)}</b>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <button onClick={() => setQty(product.id, quantity - 1)} className="rounded bg-slate-800 p-1 hover:bg-slate-700" aria-label="Kurangi"><Minus size={14} /></button>
                <input value={quantity} inputMode="numeric" aria-label="Jumlah"
                  onChange={(e) => setQty(product.id, Number(e.target.value.replace(/\D/g, '')) || 0)}
                  className="w-12 rounded bg-slate-800 py-0.5 text-center text-slate-100 outline-none" />
                <button onClick={() => add(product)} className="rounded bg-slate-800 p-1 hover:bg-slate-700" aria-label="Tambah"><Plus size={14} /></button>
                <span className="ml-1">× {money(product.price)}</span>
                <button onClick={() => setQty(product.id, 0)} className="ml-auto text-rose-300 hover:text-rose-200" aria-label="Hapus"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Diskon (Rp)"><Input type="number" min={0} value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value) || 0)} placeholder="0" /></Field>
          <Field label="Pajak (%)"><Input type="number" min={0} max={100} value={taxPercent || ''} onChange={(e) => setTaxPercent(Number(e.target.value) || 0)} placeholder="0" /></Field>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <Field label="Pelanggan (opsional)" className="flex-1">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Umum</option>
              {(customers.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
            </Select>
          </Field>
          <Button variant="secondary" onClick={() => setNewCustomer(true)} aria-label="Pelanggan baru" title="Pelanggan baru"><UserPlus size={16} /></Button>
        </div>

        <div className="mt-4 space-y-1.5 border-t border-slate-800 pt-4 text-sm">
          <Line label="Subtotal" value={money(subtotal)} />
          {safeDiscount > 0 && <Line label="Diskon" value={`- ${money(safeDiscount)}`} />}
          {tax > 0 && <Line label={`Pajak ${taxPercent}%`} value={money(tax)} />}
          <div className="flex justify-between pt-1 text-xl font-bold"><span>Total</span><span className="text-amber-300">{money(total)}</span></div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {METHODS.map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`rounded-xl px-2 py-2 text-xs font-medium ${method === m ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              {m === 'CARD' ? 'Kartu' : m === 'TRANSFER' ? 'Transfer' : paymentLabel[m]}
            </button>
          ))}
        </div>

        {method === 'CASH' && (
          <div className="mt-3">
            <Field label="Uang diterima">
              <Input type="number" min={0} value={cash} onChange={(e) => setCash(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickCash.map((v) => (
                <button key={v} onClick={() => setCash(v)} className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
                  {v === total ? 'Uang pas' : money(v)}
                </button>
              ))}
            </div>
            {cart.length > 0 && cash !== '' && (
              <p className={`mt-2 text-sm ${change >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {change >= 0 ? `Kembalian: ${money(change)}` : `Kurang: ${money(-change)}`}
              </p>
            )}
          </div>
        )}

        <Field label="Catatan (opsional)" className="mt-3"><Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} /></Field>

        <Button size="lg" className="mt-4 w-full" disabled={!canPay} onClick={checkout}>
          {busy ? 'Menyimpan...' : `Bayar ${money(total)}`}
        </Button>
      </aside>

      <ReceiptModal sale={receipt} onClose={() => { setReceipt(null); scanRef.current?.focus(); }} title="Transaksi Berhasil" />
      <QuickCustomer open={newCustomer} onClose={() => setNewCustomer(false)}
        onCreated={(c) => { customers.setData([...(customers.data ?? []), c]); setCustomerId(c.id); }} />
    </div>
  );
}

const Line = ({ label, value }: { label: string; value: string }) =>
  <div className="flex justify-between text-slate-300"><span>{label}</span><span>{value}</span></div>;

function QuickCustomer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: Customer) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const c = await api.createCustomer({ name: String(form.get('name')), phone: String(form.get('phone') || '') || null });
      onCreated(c);
      toast.success('Pelanggan ditambahkan');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} title="Pelanggan Baru" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nama"><Input name="name" required autoFocus /></Field>
        <Field label="No. HP"><Input name="phone" inputMode="tel" /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={busy}>Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}

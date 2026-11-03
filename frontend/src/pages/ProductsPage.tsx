import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { ImageOff, ImagePlus, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, imageSrc } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { errorMessage, money, num } from '../lib/format';
import { Alert, Badge, Button, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td, Textarea } from '../components/ui';
import { useToast } from '../components/Toast';
import type { Product, ProductInput } from '../types/api';

export function ProductsPage() {
  const toast = useToast();
  const [showInactive, setShowInactive] = useState(false);
  const products = useLoad(() => api.products({ includeInactive: showInactive }), [showInactive]);
  const categories = useLoad(() => api.categories());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Reset the image picker whenever the modal opens for another product.
  useEffect(() => { setImageFile(null); setRemoveImage(false); }, [editing]);
  useEffect(() => {
    if (!imageFile) { setImagePreview(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const pickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Format gambar harus JPG, PNG, atau WebP'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran gambar maksimal 2 MB'); return; }
    setImageFile(file);
    setRemoveImage(false);
  };

  const rows = (products.data ?? []).filter((p) =>
    (!category || p.category === category) && (!lowOnly || p.lowStock) &&
    `${p.name} ${p.sku} ${p.barcode ?? ''}`.toLowerCase().includes(query.toLowerCase()));

  const current = editing && editing !== 'new' ? editing : null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? '').trim() || null;
    const payload: ProductInput = {
      name: String(f.get('name')).trim(),
      sku: String(f.get('sku')).trim(),
      barcode: text('barcode'),
      category: text('category'),
      unit: text('unit'),
      price: Number(f.get('price')),
      costPrice: Number(f.get('costPrice')),
      stock: current ? current.stock : Number(f.get('stock') || 0),
      minStock: Number(f.get('minStock') || 0),
      description: text('description'),
      active: current ? f.get('active') === 'on' : true,
      taxable: f.get('taxable') === 'on',
    };
    setBusy(true);
    try {
      const saved = current ? await api.updateProduct(current.id, payload) : await api.createProduct(payload);
      if (imageFile) {
        try {
          await api.uploadProductImage(saved.id, imageFile);
        } catch (err) {
          toast.error(`Produk tersimpan, tetapi gambar gagal diunggah: ${errorMessage(err)}`);
        }
      } else if (removeImage && current?.imageUrl) {
        await api.deleteProductImage(saved.id);
      }
      toast.success('Produk disimpan');
      setEditing(null);
      void products.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteProduct(deleting.id);
      toast.success('Produk dinonaktifkan');
      setDeleting(null);
      void products.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const margin = (p: Product) => (Number(p.price) > 0 ? ((Number(p.price) - Number(p.costPrice)) / Number(p.price)) * 100 : 0);

  return (
    <>
      <PageHeader title="Produk" description="Kelola katalog, harga jual, harga modal, dan batas stok minimum."
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> Tambah Produk</Button>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama / SKU / barcode" className="pl-9" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto">
          <option value="">Semua kategori</option>
          {(categories.data ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="accent-amber-400" /> Stok menipis</label>
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-amber-400" /> Tampilkan nonaktif</label>
      </div>

      {products.error && <div className="mb-4"><Alert>{products.error}</Alert></div>}
      {products.loading && !products.data ? <Spinner /> : (
        <Table headers={['Produk', 'Kategori', 'Harga Jual', 'Harga Modal', 'Margin', 'Stok', '']} empty={rows.length === 0}>
          {rows.map((p) => (
            <tr key={p.id} className={`hover:bg-slate-900/60 ${p.active === false ? 'opacity-50' : ''}`}>
              <Td>
                <div className="flex items-center gap-3">
                  <Thumb url={p.imageUrl} />
                  <div className="min-w-0">
                    <p className="font-medium text-white">{p.name} {p.active === false && <Badge>Nonaktif</Badge>}</p>
                    <p className="text-xs text-slate-500">{p.sku}{p.barcode ? ` · ${p.barcode}` : ''}{p.taxable === false ? ' · bebas pajak' : ''}</p>
                  </div>
                </div>
              </Td>
              <Td>{p.category ?? '-'}</Td>
              <Td className="font-semibold">{money(p.price)}</Td>
              <Td className="text-slate-400">{money(p.costPrice)}</Td>
              <Td><Badge tone={margin(p) < 10 ? 'amber' : 'green'}>{margin(p).toFixed(1)}%</Badge></Td>
              <Td>
                <Badge tone={p.stock === 0 ? 'red' : p.lowStock ? 'amber' : 'slate'}>{num(p.stock)} {p.unit ?? ''}</Badge>
                <span className="ml-1 text-xs text-slate-500">min {p.minStock ?? 5}</span>
              </Td>
              <Td className="whitespace-nowrap text-right">
                <Button variant="ghost" size="sm" onClick={() => setEditing(p)} aria-label="Ubah"><Pencil size={14} /></Button>
                {p.active !== false && <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} aria-label="Nonaktifkan"><Trash2 size={14} className="text-rose-300" /></Button>}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={editing !== null} wide title={current ? 'Ubah Produk' : 'Tambah Produk'} onClose={() => setEditing(null)}>
        <form key={current?.id ?? 'new'} onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              {imagePreview || (!removeImage && current?.imageUrl)
                ? <img src={imagePreview ?? imageSrc(current?.imageUrl) ?? undefined} alt="Gambar produk" className="h-full w-full object-cover" />
                : <Package className="text-slate-600" size={32} />}
            </div>
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700">
                <ImagePlus size={16} /> {current?.imageUrl || imageFile ? 'Ganti gambar' : 'Pilih gambar'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickImage} />
              </label>
              {(imageFile || (current?.imageUrl && !removeImage)) && (
                <button type="button" onClick={() => { setImageFile(null); setRemoveImage(true); }}
                  className="ml-2 inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"><ImageOff size={14} /> Hapus gambar</button>
              )}
              <p className="text-xs text-slate-500">JPG, PNG, atau WebP, maks. 2 MB. Disarankan rasio 4:3.</p>
            </div>
          </div>
          <Field label="Nama produk *" className="sm:col-span-2"><Input name="name" required defaultValue={current?.name} /></Field>
          <Field label="SKU *"><Input name="sku" required defaultValue={current?.sku} /></Field>
          <Field label="Barcode"><Input name="barcode" defaultValue={current?.barcode ?? ''} /></Field>
          <Field label="Kategori">
            <Select name="category" defaultValue={current?.category ?? ''}>
              <option value="">Tanpa kategori</option>
              {(categories.data ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              {current?.category && !(categories.data ?? []).some((c) => c.name === current.category) &&
                <option value={current.category}>{current.category}</option>}
            </Select>
          </Field>
          <Field label="Satuan"><Input name="unit" placeholder="pcs, botol, kg..." defaultValue={current?.unit ?? ''} /></Field>
          <Field label="Harga jual (Rp) *"><Input name="price" type="number" min={0} step="any" required defaultValue={current?.price} /></Field>
          <Field label="Harga modal (Rp) *"><Input name="costPrice" type="number" min={0} step="any" required defaultValue={current?.costPrice} /></Field>
          {current
            ? <Field label="Stok saat ini" hint="Ubah stok lewat menu Stok & Opname agar tercatat."><Input value={current.stock} disabled /></Field>
            : <Field label="Stok awal"><Input name="stock" type="number" min={0} defaultValue={0} /></Field>}
          <Field label="Stok minimum" hint="Peringatan stok menipis muncul di bawah angka ini."><Input name="minStock" type="number" min={0} defaultValue={current?.minStock ?? 5} /></Field>
          <Field label="Deskripsi" className="sm:col-span-2"><Textarea name="description" rows={2} defaultValue={current?.description ?? ''} /></Field>
          <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
            <input type="checkbox" name="taxable" defaultChecked={current ? current.taxable !== false : true} className="accent-amber-400" /> Kena pajak toko
            <span className="text-xs text-slate-500">(hilangkan centang untuk barang bebas pajak)</span>
          </label>
          {current && (
            <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
              <input type="checkbox" name="active" defaultChecked={current.active !== false} className="accent-amber-400" /> Produk aktif (tampil di kasir)
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Batal</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} title="Nonaktifkan Produk" onClose={() => setDeleting(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setDeleting(null)}>Batal</Button>
          <Button variant="danger" disabled={busy} onClick={doDelete}>Nonaktifkan</Button>
        </>}>
        <p className="text-sm text-slate-300">
          <b>{deleting?.name}</b> tidak akan tampil lagi di kasir. Riwayat penjualannya tetap tersimpan dan produk bisa diaktifkan kembali.
        </p>
      </Modal>
    </>
  );
}

function Thumb({ url }: { url?: string | null }) {
  const src = imageSrc(url);
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
      {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Package size={16} className="text-slate-600" />}
    </div>
  );
}

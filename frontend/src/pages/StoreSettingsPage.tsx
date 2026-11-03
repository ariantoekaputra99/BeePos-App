import { FormEvent, useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { api } from '../services/api';
import { useLoad } from '../lib/useLoad';
import { errorMessage, formatDateTime, money } from '../lib/format';
import { calculateTax, taxLabel } from '../lib/tax';
import { setStoreSettingsCache } from '../lib/useStoreSettings';
import { Alert, Button, Card, Field, Input, PageHeader, Spinner, Textarea } from '../components/ui';
import { useToast } from '../components/Toast';
import type { StoreSettings } from '../types/api';

export function StoreSettingsPage() {
  const toast = useToast();
  const { data, loading, error, setData } = useLoad(() => api.settings());
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      const saved = await api.updateSettings({
        storeName: form.storeName, address: form.address, phone: form.phone, receiptFooter: form.receiptFooter,
        taxEnabled: form.taxEnabled, taxName: form.taxName, taxRate: Number(form.taxRate), taxInclusive: form.taxInclusive,
      });
      setData(saved);
      setStoreSettingsCache(saved);
      toast.success('Pengaturan toko disimpan');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !form) return <Spinner />;
  if (error && !form) return <Alert>{error}</Alert>;
  if (!form) return null;

  // Example: a 100.000 cart, to show how the current settings behave.
  const example = calculateTax([{ amount: 100000, taxable: true }], 0, form);

  return (
    <>
      <PageHeader title="Pengaturan Toko" description="Identitas toko di struk dan aturan pajak untuk setiap transaksi." />
      <form onSubmit={submit} className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 font-semibold text-white"><Store size={18} /> Profil & Struk</h2>
          <div className="mt-4 space-y-3">
            <Field label="Nama toko *"><Input required maxLength={100} value={form.storeName} onChange={(e) => set('storeName', e.target.value)} /></Field>
            <Field label="Alamat"><Input maxLength={255} value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Telepon"><Input maxLength={50} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Catatan kaki struk" hint="Tampil di bagian bawah struk.">
              <Textarea rows={2} maxLength={500} value={form.receiptFooter ?? ''} onChange={(e) => set('receiptFooter', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-white">Pajak</h2>
          <label className="mt-4 flex items-center gap-3 text-sm text-slate-200">
            <input type="checkbox" checked={form.taxEnabled} onChange={(e) => set('taxEnabled', e.target.checked)} className="h-4 w-4 accent-amber-400" />
            Kenakan pajak pada transaksi
          </label>
          <div className={`mt-4 space-y-3 ${form.taxEnabled ? '' : 'pointer-events-none opacity-40'}`}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama pajak" hint="mis. PPN atau PB1"><Input required maxLength={20} value={form.taxName} onChange={(e) => set('taxName', e.target.value)} /></Field>
              <Field label="Tarif (%)"><Input type="number" min={0} max={100} step="0.01" required value={form.taxRate}
                onChange={(e) => set('taxRate', e.target.value === '' ? 0 : Number(e.target.value))} /></Field>
            </div>
            <fieldset className="space-y-2 text-sm">
              <legend className="mb-1.5 text-slate-300">Harga jual produk</legend>
              <label className="flex items-start gap-3 rounded-xl border border-slate-800 p-3 text-slate-200">
                <input type="radio" name="inclusive" checked={!form.taxInclusive} onChange={() => set('taxInclusive', false)} className="mt-0.5 accent-amber-400" />
                <span><b>Belum termasuk pajak</b><br /><span className="text-xs text-slate-400">Pajak ditambahkan di atas total belanja saat bayar.</span></span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-slate-800 p-3 text-slate-200">
                <input type="radio" name="inclusive" checked={form.taxInclusive} onChange={() => set('taxInclusive', true)} className="mt-0.5 accent-amber-400" />
                <span><b>Sudah termasuk pajak</b><br /><span className="text-xs text-slate-400">Total tidak berubah; porsi pajak dihitung dari harga dan ditampilkan di struk.</span></span>
              </label>
            </fieldset>
            <div className="rounded-xl bg-slate-950 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Contoh belanja {money(100000)}</p>
              <div className="mt-2 flex justify-between text-slate-300"><span>{taxLabel(form.taxName, form.taxRate, form.taxInclusive)}</span><span>{money(example.tax)}</span></div>
              <div className="flex justify-between font-semibold text-white"><span>Total dibayar</span><span>{money(example.total)}</span></div>
            </div>
            <p className="text-xs text-slate-500">Produk bebas pajak bisa diatur per produk di menu Produk. Pajak dihitung setelah diskon dan dibulatkan ke rupiah terdekat.</p>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3 lg:col-span-2">
          <p className="text-xs text-slate-500">{data?.updatedAt ? `Terakhir diubah ${formatDateTime(data.updatedAt)} oleh ${data.updatedBy ?? '-'}` : ''}</p>
          <Button type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Pengaturan'}</Button>
        </div>
      </form>
    </>
  );
}

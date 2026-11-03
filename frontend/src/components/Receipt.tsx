import { Printer } from 'lucide-react';
import type { Sale } from '../types/api';
import { formatDateTime, money, num, paymentLabel } from '../lib/format';
import { Badge, Button, Modal } from './ui';
import { useStoreSettings } from '../lib/useStoreSettings';
import { taxLabel } from '../lib/tax';

const FALLBACK_NAME = import.meta.env.VITE_STORE_NAME ?? 'BeePos Store';

export function ReceiptBody({ sale }: { sale: Sale }) {
  const store = useStoreSettings();
  const name = store?.storeName || FALLBACK_NAME;
  const footer = store?.receiptFooter ?? 'Terima kasih atas kunjungan Anda';
  const hasTax = Number(sale.tax) > 0;
  return (
    <div className="receipt mx-auto max-w-xs bg-white p-4 font-mono text-[12px] leading-snug text-black">
      <div className="text-center">
        <p className="text-sm font-bold">{name}</p>
        {store?.address && <p>{store.address}</p>}
        {store?.phone && <p>Telp. {store.phone}</p>}
        <p className="mt-1">{sale.invoiceNumber}</p>
        <p>{formatDateTime(sale.createdAt)}</p>
        <p>Kasir: {sale.cashier ?? '-'}{sale.customerName ? ` · ${sale.customerName}` : ''}</p>
        {sale.status === 'VOIDED' && <p className="mt-1 font-bold">*** DIBATALKAN ***</p>}
      </div>
      <hr className="my-2 border-dashed border-black" />
      {sale.items.map((item) => (
        <div key={item.productId} className="mb-1">
          <p>{item.productName}</p>
          <div className="flex justify-between">
            <span>{num(item.quantity)} x {money(item.unitPrice)}</span>
            <span>{money(item.lineTotal)}</span>
          </div>
        </div>
      ))}
      <hr className="my-2 border-dashed border-black" />
      <Row label="Subtotal" value={money(sale.subtotal)} />
      {Number(sale.discount) > 0 && <Row label="Diskon" value={`-${money(sale.discount)}`} />}
      {hasTax && !sale.taxInclusive && <Row label={taxLabel(sale.taxName, sale.taxRate)} value={money(sale.tax)} />}
      <Row label="TOTAL" value={money(sale.total)} bold />
      {hasTax && sale.taxInclusive && <Row label={`Termasuk ${taxLabel(sale.taxName, sale.taxRate)}`} value={money(sale.tax)} />}
      <Row label={paymentLabel[sale.paymentMethod]} value={money(sale.amountPaid ?? sale.total)} />
      {Number(sale.changeAmount ?? 0) > 0 && <Row label="Kembali" value={money(sale.changeAmount)} />}
      <hr className="my-2 border-dashed border-black" />
      {footer && <p className="whitespace-pre-line text-center">{footer}</p>}
    </div>
  );
}

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between ${bold ? 'text-sm font-bold' : ''}`}><span>{label}</span><span>{value}</span></div>
);

export function ReceiptModal({ sale, onClose, title = 'Struk Transaksi' }: { sale: Sale | null; onClose: () => void; title?: string }) {
  if (!sale) return null;
  return (
    <Modal open title={title} onClose={onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Tutup</Button>
        <Button onClick={() => window.print()}><Printer size={16} /> Cetak Struk</Button>
      </>}>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">{sale.totalItems} item</span>
        {sale.status === 'VOIDED' ? <Badge tone="red">Dibatalkan</Badge> : <Badge tone="green">Lunas</Badge>}
      </div>
      {sale.status === 'VOIDED' && sale.voidReason && <p className="mb-3 text-sm text-rose-300">Alasan batal: {sale.voidReason}</p>}
      <div className="print-area rounded-xl bg-white">
        <ReceiptBody sale={sale} />
      </div>
    </Modal>
  );
}

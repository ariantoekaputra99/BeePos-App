import { CrudPage } from '../components/CrudPage';
import { api } from '../services/api';
import type { Supplier } from '../types/api';

export function SuppliersPage() {
  return (
    <CrudPage<Supplier>
      title="Supplier"
      description="Pemasok barang yang dipakai saat membuat purchase order."
      entityLabel="Supplier"
      fields={[
        { key: 'name', label: 'Nama Supplier', required: true },
        { key: 'contactPerson', label: 'Kontak' },
        { key: 'phone', label: 'Telepon', type: 'tel' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'address', label: 'Alamat', type: 'textarea', showInTable: false },
      ]}
      load={api.suppliers}
      create={api.createSupplier}
      update={api.updateSupplier}
      remove={api.deleteSupplier}
    />
  );
}

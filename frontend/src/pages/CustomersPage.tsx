import { CrudPage } from '../components/CrudPage';
import { api } from '../services/api';
import { isManager } from '../routes';
import type { Customer, Session } from '../types/api';

export function CustomersPage({ session }: { session: Session }) {
  return (
    <CrudPage<Customer>
      title="Pelanggan"
      description="Data pelanggan untuk dicatat di transaksi kasir."
      entityLabel="Pelanggan"
      fields={[
        { key: 'name', label: 'Nama', required: true },
        { key: 'phone', label: 'No. HP', type: 'tel' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'address', label: 'Alamat', type: 'textarea' },
      ]}
      load={api.customers}
      create={api.createCustomer}
      update={api.updateCustomer}
      remove={api.deleteCustomer}
      canDelete={isManager(session.role)}
    />
  );
}

import { CrudPage } from '../components/CrudPage';
import { api } from '../services/api';
import type { Category } from '../types/api';

export function CategoriesPage() {
  return (
    <CrudPage<Category>
      title="Kategori"
      description="Kelompokkan produk agar mudah dicari di kasir dan laporan. Mengganti nama kategori juga memperbarui produknya."
      entityLabel="Kategori"
      fields={[
        { key: 'name', label: 'Nama', required: true },
        { key: 'description', label: 'Deskripsi', type: 'textarea' },
      ]}
      load={api.categories}
      create={api.createCategory}
      update={api.updateCategory}
      remove={api.deleteCategory}
    />
  );
}

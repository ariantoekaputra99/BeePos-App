import type {
  Category, Customer, StoreSettings, DashboardSummary, LoginResponse, Movement, Product, ProductInput, PurchaseOrder,
  PurchaseOrderRequest, Sale, SaleRequest, SalesReport, Supplier, User, UserInput,
} from '../types/api';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const SESSION_KEY = 'beepos_session';

/** Absolute URL for an imageUrl returned by the API (or null). */
export const imageSrc = (imageUrl?: string | null) => (imageUrl ? `${API_URL}${imageUrl}` : null);

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Called when the backend answers 401 so the app can return to the login screen. */
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (handler: () => void) => { onUnauthorized = handler; };

export const sessionStore = {
  get(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  },
  set(session: LoginResponse) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); },
  clear() { localStorage.removeItem(SESSION_KEY); },
};

async function raw(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  // FormData sets its own multipart boundary header.
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = sessionStore.get()?.token;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi atau pastikan backend berjalan.', 0);
  }
  if (response.status === 401 && !path.startsWith('/auth/login')) {
    sessionStore.clear();
    onUnauthorized();
  }
  if (!response.ok) {
    let message = `Request gagal (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch { /* non-JSON error body */ }
    throw new ApiError(message, response.status);
  }
  return response;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await raw(path, options);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') search.set(k, String(v)); });
  const s = search.toString();
  return s ? `?${s}` : '';
};

export const api = {
  login: (username: string, password: string) => send<LoginResponse>('POST', '/auth/login', { username, password }),
  me: () => request<User>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    send<void>('POST', '/auth/change-password', { currentPassword, newPassword }),

  dashboard: () => request<DashboardSummary>('/dashboard/summary'),

  products: (params: { q?: string; category?: string; includeInactive?: boolean; lowStock?: boolean } = {}) =>
    request<Product[]>(`/products${qs(params)}`),
  productByCode: (code: string) => request<Product>(`/products/code/${encodeURIComponent(code)}`),
  createProduct: (p: ProductInput) => send<Product>('POST', '/products', p),
  updateProduct: (id: number, p: ProductInput) => send<Product>('PUT', `/products/${id}`, p),
  deleteProduct: (id: number) => send<void>('DELETE', `/products/${id}`),
  uploadProductImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<Product>(`/products/${id}/image`, { method: 'POST', body: form });
  },
  deleteProductImage: (id: number) => send<Product>('DELETE', `/products/${id}/image`),

  settings: () => request<StoreSettings>('/settings'),
  updateSettings: (s: Omit<StoreSettings, 'updatedAt' | 'updatedBy'>) => send<StoreSettings>('PUT', '/settings', s),

  categories: () => request<Category[]>('/categories'),
  createCategory: (c: Omit<Category, 'id'>) => send<Category>('POST', '/categories', c),
  updateCategory: (id: number, c: Omit<Category, 'id'>) => send<Category>('PUT', `/categories/${id}`, c),
  deleteCategory: (id: number) => send<void>('DELETE', `/categories/${id}`),

  customers: () => request<Customer[]>('/customers'),
  createCustomer: (c: Omit<Customer, 'id'>) => send<Customer>('POST', '/customers', c),
  updateCustomer: (id: number, c: Omit<Customer, 'id'>) => send<Customer>('PUT', `/customers/${id}`, c),
  deleteCustomer: (id: number) => send<void>('DELETE', `/customers/${id}`),

  suppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (s: Omit<Supplier, 'id'>) => send<Supplier>('POST', '/suppliers', s),
  updateSupplier: (id: number, s: Omit<Supplier, 'id'>) => send<Supplier>('PUT', `/suppliers/${id}`, s),
  deleteSupplier: (id: number) => send<void>('DELETE', `/suppliers/${id}`),

  movements: (productId?: number) => request<Movement[]>(`/inventory${qs({ productId })}`),
  stock: (kind: 'in' | 'out' | 'adjust', productId: number, quantity: number, note?: string) =>
    send<Movement>('POST', `/inventory/${kind}`, { productId, quantity, note }),

  purchases: () => request<PurchaseOrder[]>('/purchases'),
  createPurchase: (po: PurchaseOrderRequest) => send<PurchaseOrder>('POST', '/purchases', po),
  receivePurchase: (id: number) => send<PurchaseOrder>('POST', `/purchases/${id}/receive`),
  cancelPurchase: (id: number) => send<PurchaseOrder>('POST', `/purchases/${id}/cancel`),

  sales: (from?: string, to?: string) => request<Sale[]>(`/sales${qs({ from, to })}`),
  sale: (id: number) => request<Sale>(`/sales/${id}`),
  createSale: (sale: SaleRequest) => send<Sale>('POST', '/sales', sale),
  voidSale: (id: number, reason: string) => send<Sale>('POST', `/sales/${id}/void`, { reason }),

  salesReport: (from: string, to: string) => request<SalesReport>(`/reports/sales${qs({ from, to })}`),
  downloadSalesCsv: async (from: string, to: string) => {
    const response = await raw(`/reports/sales.csv${qs({ from, to })}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  users: () => request<User[]>('/users'),
  createUser: (u: UserInput) => send<User>('POST', '/users', u),
  updateUser: (id: number, u: UserInput) => send<User>('PUT', `/users/${id}`, u),
  deactivateUser: (id: number) => send<void>('DELETE', `/users/${id}`),
};

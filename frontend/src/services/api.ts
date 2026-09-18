import type { DashboardSummary, LoginResponse, Product, SaleRequest } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('beepos_token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('beepos_token');
    throw new Error('Sesi login berakhir. Silakan login kembali.');
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request gagal (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  products: () => request<Product[]>('/products'),
  dashboard: () => request<DashboardSummary>('/dashboard/summary'),
  createSale: (sale: SaleRequest) =>
    request('/sales', { method: 'POST', body: JSON.stringify(sale) }),
};

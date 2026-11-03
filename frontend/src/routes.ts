import {
  BarChart3, Boxes, ClipboardList, Contact, History, LayoutDashboard, LucideIcon, Package, Settings, ShoppingCart,
  Tags, Truck, UserCog,
} from 'lucide-react';
import type { Role } from './types/api';

export type RouteKey =
  | 'dashboard' | 'pos' | 'sales' | 'products' | 'categories' | 'inventory' | 'purchases'
  | 'customers' | 'suppliers' | 'reports' | 'users' | 'settings';

export type RouteDef = { key: RouteKey; label: string; icon: LucideIcon; roles: Role[]; group: string };

const ALL: Role[] = ['ADMIN', 'MANAGER', 'CASHIER'];
const MGMT: Role[] = ['ADMIN', 'MANAGER'];

export const routes: RouteDef[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL, group: 'Operasional' },
  { key: 'pos', label: 'Kasir (POS)', icon: ShoppingCart, roles: ALL, group: 'Operasional' },
  { key: 'sales', label: 'Riwayat Transaksi', icon: History, roles: ALL, group: 'Operasional' },
  { key: 'customers', label: 'Pelanggan', icon: Contact, roles: ALL, group: 'Operasional' },
  { key: 'products', label: 'Produk', icon: Package, roles: MGMT, group: 'Inventori' },
  { key: 'categories', label: 'Kategori', icon: Tags, roles: MGMT, group: 'Inventori' },
  { key: 'inventory', label: 'Stok & Opname', icon: Boxes, roles: MGMT, group: 'Inventori' },
  { key: 'purchases', label: 'Pembelian (PO)', icon: ClipboardList, roles: MGMT, group: 'Inventori' },
  { key: 'suppliers', label: 'Supplier', icon: Truck, roles: MGMT, group: 'Inventori' },
  { key: 'reports', label: 'Laporan', icon: BarChart3, roles: MGMT, group: 'Manajemen' },
  { key: 'users', label: 'Pengguna', icon: UserCog, roles: ['ADMIN'], group: 'Manajemen' },
  { key: 'settings', label: 'Akun Saya', icon: Settings, roles: ALL, group: 'Manajemen' },
];

export const canAccess = (key: RouteKey, role: Role) => routes.find((r) => r.key === key)?.roles.includes(role) ?? false;

export const isManager = (role: Role) => role === 'ADMIN' || role === 'MANAGER';

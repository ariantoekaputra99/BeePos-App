export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  stock: number;
  category?: string;
  description?: string;
};

export type DashboardSummary = {
  totalProducts: number;
  lowStockProducts: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalOrders: number;
  totalPurchaseValue: number;
};

export type SaleRequest = {
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'QRIS';
  tax: number;
  discount: number;
};

export type LoginResponse = {
  token: string;
  username: string;
  role: Role;
};

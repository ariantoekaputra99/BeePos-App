export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'QRIS';
export type SaleStatus = 'COMPLETED' | 'VOIDED';
export type PurchaseOrderStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export type Session = {
  token: string;
  username: string;
  role: Role;
  fullName?: string | null;
};

export type LoginResponse = Session;

export type User = {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  role: Role;
  active: boolean;
  createdAt?: string;
};

export type UserInput = {
  username: string;
  email: string;
  fullName?: string;
  role: Role;
  password?: string;
  active?: boolean;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  price: number;
  costPrice: number;
  stock: number;
  minStock?: number | null;
  unit?: string | null;
  category?: string | null;
  description?: string | null;
  active?: boolean | null;
  taxable?: boolean | null;
  /** Relative to API_URL, e.g. /products/3/image?v=ab12; null when the product has no image. */
  imageUrl?: string | null;
  lowStock?: boolean;
};

export type ProductInput = Omit<Product, 'id' | 'lowStock' | 'imageUrl'>;

export type StoreSettings = {
  storeName: string;
  address?: string | null;
  phone?: string | null;
  receiptFooter?: string | null;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  taxInclusive: boolean;
  updatedAt?: string | null;
  updatedBy?: string | null;
};

export type Category = { id: number; name: string; description?: string | null };

export type Customer = { id: number; name: string; phone?: string | null; email?: string | null; address?: string | null };

export type Supplier = {
  id: number;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type SaleItem = {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Sale = {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  taxName?: string | null;
  taxRate?: number | null;
  taxInclusive?: boolean | null;
  discount: number;
  total: number;
  amountPaid?: number | null;
  changeAmount?: number | null;
  cashier?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  note?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  totalItems: number;
  items: SaleItem[];
};

export type SaleRequest = {
  items: Array<{ productId: number; quantity: number }>;
  paymentMethod: PaymentMethod;
  discount: number;
  amountPaid?: number;
  customerId?: number | null;
  note?: string;
};

export type Movement = {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'SALE' | 'VOID' | 'PURCHASE' | 'ADJUST';
  quantity: number;
  stockAfter?: number | null;
  note: string;
  createdBy?: string | null;
  createdAt: string;
};

export type PurchaseOrder = {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  total: number;
  note?: string | null;
  createdBy?: string | null;
  createdAt: string;
  receivedAt?: string | null;
  items: Array<{ productId: number; productName: string; sku: string; quantity: number; unitPrice: number; lineTotal: number }>;
};

export type PurchaseOrderRequest = {
  supplierId: number;
  note?: string;
  items: Array<{ productId: number; quantity: number; unitPrice: number }>;
};

export type DailySales = { date: string; revenue: number; orders: number };
export type TopProduct = { productId: number; name: string; quantity: number; revenue: number };
export type LowStockProduct = { id: number; name: string; sku: string; stock: number; minStock: number };

/** Cost/profit fields are null for cashiers. */
export type DashboardSummary = {
  totalProducts: number;
  lowStockProducts: number;
  totalRevenue: number;
  totalCost: number | null;
  grossProfit: number | null;
  totalOrders: number;
  totalPurchaseValue: number | null;
  todayRevenue: number;
  todayOrders: number;
  todayProfit: number | null;
  last7Days: DailySales[];
  topProducts: TopProduct[];
  lowStock: LowStockProduct[];
  recentSales: Sale[];
};

export type SalesReport = {
  from: string;
  to: string;
  totalRevenue: number;
  netRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalDiscount: number;
  totalTax: number;
  averageOrder: number;
  totalOrders: number;
  totalItems: number;
  voidedOrders: number;
  daily: DailySales[];
  byPaymentMethod: Array<{ method: PaymentMethod; amount: number; orders: number }>;
  topProducts: TopProduct[];
  sales: Sale[];
};

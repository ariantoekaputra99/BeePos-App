# Arsitektur POS BeePos-App

## 1. Tujuan aplikasi
BeePos-App adalah aplikasi Point of Sale untuk retail modern yang fokus pada kecepatan transaksi, pengelolaan stok, dan laporan penjualan.

## 2. Pengguna
- Admin
- Manajer
- Kasir

## 3. Modul utama
- Auth & User Management
- Product Catalog
- Category Management
- Customer & Supplier
- Inventory / Stock Movement
- POS Transaction
- Payment
- Reporting & Dashboard

## 4. Entity utama
- User
- Role
- Category
- Product
- Customer
- Supplier
- Inventory
- Sale
- SaleItem
- Payment
- AuditLog

## 5. Flow bisnis inti
1. Admin mengelola produk dan kategori.
2. Kasir menerima pesanan dari pelanggan.
3. Sistem menambahkan item ke cart.
4. Penjualan disimpan ke tabel `sales` dan `sale_items`.
5. Inventory berkurang sesuai kuantitas yang berhasil dibeli.
6. Sistem menghasilkan invoice dan laporan harian.

## 6. Struktur backend
- `controller` : endpoint API
- `service` : business logic
- `repository` : persistence access
- `entity` : model database
- `dto` : request/response payload
- `config` : security dan application config

## 7. Struktur frontend
- Dashboard overview
- Product management page
- POS transaction page
- Sales report page
- Settings & users page

## 8. Prinsip teknis
- Backend dengan Spring Boot 3
- Database PostgreSQL
- ORM JPA/Hibernate
- REST API JSON
- Role based access control
- Validation serta error handling konsisten

## 9. Target deployment
- Local via Docker Compose
- Staging via VPS Ubuntu
- Production via Nginx + Docker + PostgreSQL + PM2 / systemd

# BeePos-App

BeePos-App adalah aplikasi Point of Sale (POS) yang dibangun dengan arsitektur modern untuk kebutuhan toko retail dan bisnis kecil menengah.

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Java Spring Boot 3 + Spring Security
- Database: PostgreSQL
- Deployment: Docker + VPS

## Struktur Proyek
- `backend/` : API REST Spring Boot
- `frontend/` : Dashboard admin POS berbasis React
- `docker-compose.yml` : Setup lokal untuk PostgreSQL, backend, dan frontend
- `docs/` : Dokumentasi dan panduan pengembangan

## Fitur Utama
- Autentikasi pengguna dan role-based access control
- Manajemen produk, kategori, pelanggan, dan supplier
- Transaksi penjualan POS
- Stok inventori
- Laporan penjualan harian/bulanan
- Struk dan invoice
- Dashboard analitik

## Quick Start

### 1. Clone repository
```bash
git clone https://github.com/ariantoekaputra99/BeePos-App.git
cd BeePos-App
```

### 2. Jalankan database PostgreSQL
dengan Docker:
```bash
docker-compose up -d postgres
```

### 3. Jalankan backend Spring Boot
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Jalankan frontend React
```bash
cd frontend
npm install
npm run dev
```

### 5. Akses aplikasi
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

## Default Environment
Backend menggunakan:
- DB: `bee_pos`
- User: `beeuser`
- Password: `bee123`

## Roadmap
- [ ] Authentication & authorization
- [ ] Product management
- [ ] POS transaction flow
- [ ] Inventory tracking
- [ ] Sales reports
- [ ] Docker production deployment
- [ ] CI/CD pipeline

## Kontribusi
Pull requests sangat diterima. Untuk perubahan besar, silakan buka issue terlebih dahulu.

# BeePos-App

BeePos-App adalah platform Point of Sale (POS) untuk bisnis retail dan usaha kecil menengah. Proyek ini sedang dikembangkan dalam beberapa fase untuk menghasilkan aplikasi yang siap digunakan, bukan hanya mockup.

## Fase yang sedang berjalan

### Fase 1 - Foundation
- Setup repository dan struktur monorepo
- Spring Boot backend awal
- React frontend awal
- PostgreSQL + Docker Compose
- Endpoint auth dan product demo

### Fase 2 - Domain bisnis POS
- Entity bisnis: user, role, category, customer, supplier, product, sale, sale item
- Repository dan service layer
- API CRUD untuk master data
- UI dashboard operasional

### Fase 3 - Operational flow
- Login dan autentikasi pengguna
- POS transaction flow
- Inventory update otomatis
- Dashboard penjualan
- Struk/invoice

### Fase 4 - Production readiness
- JWT + Security hardening
- Validation, exception handling, audit logs
- CI/CD pipeline
- Deployment ke VPS
- Monitoring dan backups

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Java Spring Boot 3 + Spring Security + JPA
- Database: PostgreSQL
- Infrastructure: Docker + Docker Compose + VPS

## Struktur Proyek
- `backend/` : API REST Spring Boot
- `frontend/` : Dashboard admin dan POS
- `docker-compose.yml` : Database dan environment lokal
- `docs/` : Dokumentasi arsitektur dan requirement

## Fitur Utama
- Dashboard penjualan harian
- Manajemen produk, kategori, supplier, dan pelanggan
- Inventori otomatis ketika transaksi terjadi
- POS transaction dengan cart dan item list
- Laporan penjualan dan profit
- Akses role admin, kasir, manager

## Setup Lokal

### 1. Clone repository
```bash
git clone https://github.com/ariantoekaputra99/BeePos-App.git
cd BeePos-App
```

### 2. Jalankan database PostgreSQL
```bash
docker-compose up -d postgres
```

### 3. Jalankan backend
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Jalankan frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Akses aplikasi
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- PostgreSQL: localhost:5432

## Default Environment
- DB: `bee_pos`
- User DB: `beeuser`
- Password DB: `bee123`

## Dokumentasi
- `docs/pos-architecture.md` : arsitektur domain dan flow

## Roadmap
- [x] Repo and initial setup
- [x] Backend skeleton
- [x] Frontend dashboard skeleton
- [ ] Role-based auth
- [ ] Product master data
- [ ] Sales transaction flow
- [ ] Inventory and stock movement
- [ ] Reporting and analytics
- [ ] Docker production deployment
- [ ] VPS deployment and CI/CD

## Kontribusi
Pull request diterima. Untuk perubahan besar, harap buka issue terlebih dahulu.

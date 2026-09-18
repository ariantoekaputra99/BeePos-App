# BeePos-App

BeePos-App adalah aplikasi Point of Sale modern untuk retail dan usaha kecil menengah. Proyek ini dikembangkan secara bertahap dengan arsitektur monorepo dan siap diperluas menjadi produk yang lebih lengkap.

## Status proyek
- [x] Repository dan struktur awal
- [x] Backend dasar Spring Boot
- [x] Autentikasi JWT dasar
- [x] Entity utama POS
- [x] CRUD master data produk, pelanggan, supplier, inventory
- [x] Fitur transaksi POS dan stok otomatis
- [x] UI dashboard awal POS
- [x] Preview visual artifact
- [ ] Integrasi API frontend ke backend lengkap
- [ ] Deployment production VPS
- [ ] CI/CD pipeline

## Stack
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Java Spring Boot 3 + Spring Security + JPA
- Database: PostgreSQL
- Infra: Docker + Docker Compose

## Menjalankan lokal

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
docker-compose up -d postgres
```

## Preview UI
- `docs/screenshots/pos-terminal.svg`
- `docs/screenshots/README.md`

## Catatan
Screenshot browser asli tidak bisa diambil dari environment ini, namun file preview visual dan struktur UI sudah disiapkan di repo agar project bisa dipresentasikan dan diteruskan ke tahap integrasi penuh.

# Deploy ke VPS

## Prasyarat
- Ubuntu 22.04+ dengan Docker Engine dan plugin Docker Compose
- Domain yang mengarah ke IP VPS (mis. `pos.example.com`)
- Firewall hanya membuka port 22, 80, 443

## 1. Ambil kode dan siapkan konfigurasi
```bash
git clone https://github.com/ariantoekaputra99/BeePos-App.git
cd BeePos-App
cp .env.example .env
```

Edit `.env`:
- `POSTGRES_PASSWORD` — password acak yang panjang
- `JWT_SECRET` — hasil `openssl rand -base64 48`
- `APP_ADMIN_PASSWORD` — password awal akun `admin`
- `APP_SEED_DEMO=false`
- `STORE_NAME`, `STORE_ADDRESS` — tampil di struk
- Agar database dan backend tidak terbuka ke internet, jangan publish port-nya: hapus bagian `ports` pada service `postgres` dan `backend` di `docker-compose.yml` (frontend Nginx sudah mem-proxy `/api` ke backend lewat jaringan internal Docker).

## 2. Jalankan
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```
Aplikasi berjalan di port `FRONTEND_PORT` (default 8081).

## 3. HTTPS dengan Nginx + Let's Encrypt di host
```nginx
# /etc/nginx/sites-available/beepos
server {
    server_name pos.example.com;
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/beepos /etc/nginx/sites-enabled/
sudo certbot --nginx -d pos.example.com
```

## 4. Backup database
```bash
# backup harian (crontab -e)
0 2 * * * docker exec bee_pos_db pg_dump -U beeuser bee_pos | gzip > /var/backups/beepos-$(date +\%F).sql.gz
# restore
gunzip -c beepos-2026-01-01.sql.gz | docker exec -i bee_pos_db psql -U beeuser bee_pos
```
Uji restore secara berkala dan simpan salinan di luar VPS.

## 5. Update aplikasi
```bash
git pull
docker compose up -d --build
```

## Checklist production
- [ ] Semua secret di `.env` sudah diganti, `.env` tidak di-commit
- [ ] `APP_SEED_DEMO=false`
- [ ] Password `admin` diganti setelah login pertama (menu **Akun Saya**)
- [ ] Port PostgreSQL & backend tidak dipublish ke internet
- [ ] HTTPS aktif
- [ ] Backup terjadwal + uji restore
- [ ] CI (GitHub Actions) hijau sebelum deploy

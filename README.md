# Purbalingga Akun — SSO Backend

Auth server berbasis NestJS + OAuth 2.0 + OpenID Connect.

---

## Prasyarat

| Tool | Versi |
|---|---|
| Node.js | v20+ |
| MySQL | 8.0+ |
| Redis | 7+ |

---

## Langkah Setup

### 1. Clone & Install

```bash
cd purbalingga-sso-backend
npm install
```

### 2. Generate RSA Keypair

```bash
# Di terminal (Linux/macOS/Git Bash)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Lihat isinya
cat private.pem
cat public.pem
```

### 3. Buat file .env

```bash
cp .env.example .env
```

Edit `.env` — isi minimal:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=purbalingga_sso
DB_USER=root
DB_PASS=
DB_AUTO_CREATE=true
DB_AUTO_MIGRATE=true

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<isi dari private.pem>
-----END RSA PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<isi dari public.pem>
-----END PUBLIC KEY-----"

SSO_BASE_URL=https://apisso.qode.my.id
FRONTEND_URL=https://sso.qode.my.id

RESEND_API_KEY=<Resend API key>
RESEND_FROM=Purbalingga Akun <noreply@purbalingga.id>
```

Catatan mail:
- Ini memakai Resend production API, bukan Mailtrap atau SMTP testing.
- `RESEND_API_KEY` wajib diisi dari dashboard Resend.
- `RESEND_FROM` harus memakai sender/domain yang sudah diverifikasi di Resend.

### 4. Buat Database MySQL

Kalau `DB_AUTO_CREATE=true`, app akan mencoba membuat database ini otomatis saat startup atau saat seeder dijalankan.

Kalau `DB_AUTO_MIGRATE=true`, app juga akan menjalankan semua migrasi SQL di `src/database/migrations/` saat startup. Ini berguna untuk VPS kosong karena tabel akan dibuat otomatis sebelum app jalan.

Kalau kamu mau buat manual, pakai:

```sql
CREATE DATABASE purbalingga_sso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Jalankan Seeder

```bash
# Install ts-node jika belum ada
npm install -g ts-node

# Jalankan seeder — membuat admin user + 4 OAuth clients
npx ts-node src/database/seeds/index.ts
```

Output contoh:
```
✅ Admin user dibuat: admin@purbalingga.id / Admin1234!
✅ Client "Purbalingga SSO" dibuat
   client_id:     purbalingga-sso
   client_secret: secret_sso_abc123...
   ⚠️  Simpan client_secret di atas!
✅ Client "Purbalingga Pay" dibuat
   client_id:     purbalingga-pay
   client_secret: secret_pay_abc123...
   ⚠️  Simpan client_secret di atas!
```

**PENTING:** Catat client_secret karena hanya muncul sekali saat seeder.

### 6. Jalankan Migrasi Manual

Kalau kamu mau menjalankan migrasi tanpa start app, pakai:

```bash
npm run migration:run
```

Migrasi ini akan:

- membuat database kalau belum ada
- membuat tabel inti SSO
- menambahkan tabel monitoring dan field profile
- mencatat migrasi yang sudah pernah dijalankan supaya aman di-run ulang

### 7. Jalankan Server

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start
```

Server berjalan di: **https://apisso.qode.my.id**

---

## Test Endpoint

### Register user baru
```bash
curl -X POST https://apisso.qode.my.id/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","password":"Password123!","name":"Budi"}'
```

### Login
```bash
curl -X POST https://apisso.qode.my.id/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@purbalingga.id","password":"Admin1234!"}'
```

### OIDC Discovery
```bash
curl https://apisso.qode.my.id/.well-known/openid-configuration
```

### OAuth2 Authorize (buka di browser)
```
https://apisso.qode.my.id/oauth/authorize?
  response_type=code&
  client_id=purbalingga-sso&
  redirect_uri=https://sso.qode.my.id/callback&
  scope=openid profile email&
  state=random123
```

---

## Struktur Endpoint

| Method | Path | Keterangan |
|---|---|---|
| POST | /auth/register | Daftar akun baru |
| POST | /auth/login | Login → set SSO cookie |
| GET | /auth/verify-email | Verifikasi email |
| POST | /auth/forgot-password | Kirim link reset |
| POST | /auth/reset-password | Reset password |
| POST | /auth/2fa/enable | Aktifkan TOTP MFA |
| POST | /auth/2fa/verify | Verifikasi kode TOTP |
| GET | /oauth/authorize | Inisiasi OAuth2 flow |
| POST | /oauth/token | Exchange code → token |
| GET | /oauth/userinfo | Info user (OIDC) |
| POST | /oauth/logout | Global logout |
| POST | /consent/grant | User setujui izin |
| POST | /consent/deny | User tolak izin |
| DELETE | /consent/:clientId | Cabut izin app |
| GET | /sessions | List sesi aktif |
| DELETE | /sessions/:id | Hapus satu sesi |
| GET | /.well-known/openid-configuration | OIDC discovery |
| GET | /.well-known/jwks.json | Public key JWT |
| GET | /admin/clients | List OAuth clients |
| POST | /admin/clients | Daftar client baru |

## Monitoring API

| Method | Path | Description | Response Format | Contoh Response |
|---|---|---|---|---|
| POST | `/api/validate-token` | Validasi token JWT SSO | `{ valid: boolean, claims?: object, user?: object, reason?: string }` | `{ "valid": true, "claims": { "sub": "...", "email": "admin@purbalingga.id" }, "user": { "id": "...", "email": "admin@purbalingga.id" } }` |
| POST | `/api/activity` | Catat aktivitas user | `{ message: string }` | `{ "message": "Activity tercatat" }` |
| POST | `/api/last-active` | Update timestamp last active user | `{ message: string }` | `{ "message": "Last active diperbarui" }` |
| GET | `/api/logins` | History login sukses/gagal untuk monitoring | `{ date: string, total: number, success: number, failed: number, items: array }` | `{ "date": "2026-04-26", "total": 1, "success": 1, "failed": 0, "items": [] }` |
| GET | `/api/registers` | History registrasi user | `{ date: string, total: number, items: array }` | `{ "date": "2026-04-26", "total": 1, "items": [] }` |
| GET | `/api/users` | List user untuk monitoring/admin | `{ items: array, total: number, page: number, limit: number }` | `{ "items": [], "total": 0, "page": 1, "limit": 100 }` |
| GET | `/api/users/:id` | Detail 1 user spesifik | `object` | `{ "id": "...", "email": "admin@purbalingga.id", "name": "Admin Purbalingga" }` |
| GET | `/api/active-users` | List user yang sedang aktif | `{ total: number, items: array }` | `{ "total": 1, "items": [] }` |
| GET | `/api/active-users/detail` | Detail active users termasuk sesi | `{ total: number, items: array }` | `{ "total": 1, "items": [] }` |

---

## Dengan Docker (MySQL + Redis)

```bash
# Jalankan MySQL + Redis via Docker
docker-compose up -d

# Cek status
docker-compose ps

# Stop
docker-compose down
```

Setelah Docker up, lanjut ke langkah 5 (seeder).

---

## Troubleshooting

**Error: connect ECONNREFUSED 127.0.0.1:3306**
→ MySQL belum berjalan. Jalankan XAMPP/MySQL/Docker.

**Error: Redis connection refused**
→ Redis belum berjalan. Jalankan Redis atau Docker.

**Error: JWT malformed**
→ Cek format private/public key di .env. Pastikan newline `\n` benar.

**TypeORM synchronize error**
→ Pastikan database `purbalingga_sso` sudah dibuat di MySQL.

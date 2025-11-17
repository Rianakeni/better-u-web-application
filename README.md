# Better U - Web Application

Dokumentasi singkat untuk pengembang: cara meng-install, menjalankan, dan memahami struktur proyek (backend Strapi + client React).

## Summary

Proyek ini terdiri dari dua bagian utama:

- `backend/` — Strapi CMS (Node + Strapi v5). Menyediakan REST API, plugin, dan custom endpoints.
- `client/` — React app (Create React App) yang menjadi frontend dan memanggil API Strapi.

File README ini menjelaskan bagaimana men-setup lingkungan pengembangan, environment variables penting, dan perintah umum (PowerShell friendly).

---

## Prasyarat

- Node.js LTS (disarankan versi 18 — backend package.json mensyaratkan `>=18.0.0 <=22.x.x`).
- npm (biasanya sudah tersedia bersama Node). Jika pakai yarn, perintah setara bisa digunakan.
- Git (opsional, untuk clone repository).

Pastikan Node yang dipakai sesuai. Cek versi di PowerShell:

```powershell
node -v
npm -v
```

---

## Struktur proyek (ringkas)

- backend/ — Strapi application

  - `package.json`, `config/`, `src/`, `database/`, `public/`
  - Database default: `sqlite` (lihat `config/database.ts`), namun bisa dikonfigurasi ke Postgres/MySQL via env.
  - Script utama: `npm run develop` (atau `npm run start`, `npm run build`) — lihat `backend/package.json`.

- client/ — React frontend (Create React App)
  - `package.json`, `src/` (komponen & hooks), `public/`
  - Jalankan: `npm start` untuk development; `npm run build` untuk produksi.

---

## Environment variables penting

- `REACT_APP_API_URL` — base URL Strapi API. Contoh: `http://localhost:1337` atau remote URL.

Cara set (PowerShell):

```powershell
$env:REACT_APP_API_URL = "http://localhost:1337"
# atau buat file .env di folder client:
# REACT_APP_API_URL=http://localhost:1337
```

## Installasi (langkah demi langkah, Windows PowerShell)

1. Clone repository (jika belum):

```powershell
git clone <repo-url>
cd webapp
```

2. Install dependencies backend & client:

```powershell
# Backend
cd backend
npm install

# Client (di jendela/powerShell terpisah atau setelah backend selesai)
cd ..\client
npm install
```

3. Siapkan env:

- `backend/.env` — minimal contoh di atas (sqlite).
- `client/.env` atau `client/.env.local` — set `REACT_APP_API_URL` ke alamat backend (mis. `http://localhost:1337`).

4. Menjalankan development (dua terminal terpisah direkomendasikan):

Terminal A (backend):

```powershell
cd webapp\backend
npm run develop
# atau: npm run dev
```

Terminal B (client):

```powershell
cd webapp\client
npm start
```

Frontend akan default di http://localhost:3000, dan Strapi di default di http://localhost:1337 (atau port yang di-set di env).

---

## Build & Deploy singkat

- Backend (Strapi):

```powershell
cd backend
npm run build    # membangun admin panel
npm run develop    # jalankan (production mode)
```

- Client (React):

```powershell
cd client
npm start
# hasil build ada di folder client/build — deploy ke static hosting (Netlify, Vercel, static server)
```

Catatan: untuk integrasi produksi, atur `REACT_APP_API_URL` ke alamat backend publik/terproteksi.

---

## Pengembangan & debugging

- Logging/konsole: frontend memakai `console.log()` pada beberapa hooks (mis. `useMySchedule`, `useMyHistory`, `useDashboard`) untuk debugging fetch.
- Jika muncul 401/403 saat memanggil API, pastikan cookie/JWT valid. Frontend menyimpan JWT di `localStorage` di key `user` (lihat `client/src/helpers.js` dan `client/src/lib/strapiClient.js`).

---

## API yang dipakai (ringkasan)

Backend adalah Strapi — endpoint utama berada di `/api`. Frontend memanggil beberapa endpoint utama seperti:

- Auth: `POST /api/auth/local`, `POST /api/auth/local/register`
- Users: `GET /api/users/me`, `PUT /api/users/me`
- Media: `POST /api/upload`
- Articles: `GET /api/articles`, `POST /api/articles`, `PUT /api/articles/:id`, `DELETE /api/articles/:id`
- Schedules: `GET /api/schedules?filters[...]` (banyak variasi), `GET /api/schedules/:id`
- Medical records: `GET /api/medical-records/:id`, `POST /api/medical-records/:id/generate-pdf` (custom)

Detail endpoint dan file pemanggil ada di `client/src/lib/strapiClient.js` dan berbagai hooks di `client/src/components/**`.

---

## Quick tips for

- Base API URL di frontend diatur melalui `REACT_APP_API_URL`. Jika frontend tidak bisa mengakses API, cek konfigurasi CORS di Strapi admin (`backend/config/server.js` atau settings Strapi).
- Strapi admin panel: setelah backend berjalan, akses `http://localhost:1337/admin` untuk membuat akun admin, lihat content-types, dan testing API.
- Jika menambah content-type atau mengubah model Strapi, rebuild admin `npm run build` pada backend bila perlu.
- Untuk token handling, lihat `client/src/lib/strapiClient.js` (interceptor menambahkan Authorization header ke `strapiAxios`). JWT disimpan di `localStorage` key `user` (lihat `client/src/helpers.js`).

---

## Copyright & Kontributor

© 2025 oleh **Riana Keni**, Mahasiswa Fakultas Ilmu Komputer, Universitas Klabat. All Rights Reserved.

**Advisor**: Bpk **Reymon Rotikan, S.Kom., M.S., M.M**  
**Ketua Panelis**: Dr **Stenly R. Pungus, S.Kom., M.T., M.M., Ph.D**  
**Anggota Panelis**: Bpk **Stenly I. Adam, S.Kom., M.Sc.**

---

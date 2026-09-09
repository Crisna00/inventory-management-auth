# Inventory Management - Authentication Update

Versi ini menambahkan autentikasi ke project Inventory Management yang sudah memiliki Pallet Layout, Pallet Detail, Inbound, dan Outbound.

## Fitur baru

- Login user
- Daftar user
- Logout
- Ganti akun
- Sesi login disimpan di localStorage frontend
- Password di backend tidak disimpan sebagai plaintext; backend menggunakan `crypto.scryptSync`
- Endpoint data pallet/layout/transaksi membutuhkan sesi login
- Akun demo:
  - Username: `admin`
  - Password: `admin123`

## Menjalankan

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend berjalan di `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Catatan

Data user masih in-memory untuk tahap development. Jika backend direstart, user hasil register akan kembali ke kondisi awal. Saat MongoDB diintegrasikan, data user dapat dipindahkan ke collection `users`.

# Dokumentasi API: Aplikasi Stok Sparepart (Backend)

Dokumentasi ini menjelaskan REST API backend untuk aplikasi manajemen stok sparepart: cara menjalankan, aturan akses, daftar endpoint, struktur database, aturan bisnis, dan hasil pengujian otomatis.

## Daftar Isi

1. [Ringkasan](#1-ringkasan)
2. [Teknologi](#2-teknologi)
3. [Menjalankan Backend](#3-menjalankan-backend)
4. [Konvensi API](#4-konvensi-api)
5. [Hak Akses](#5-hak-akses)
6. [Daftar Endpoint](#6-daftar-endpoint)
7. [Struktur Database](#7-struktur-database)
8. [Aturan Bisnis](#8-aturan-bisnis)
9. [Pengujian Otomatis](#9-pengujian-otomatis)
10. [Keterbatasan yang Diketahui](#10-keterbatasan-yang-diketahui)

---

## 1. Ringkasan

Backend menyediakan API untuk:

- **Autentikasi**: login dan pendaftaran akun (pendaftaran hanya oleh admin).
- **Manajemen user**: melihat, mengubah, dan menghapus akun.
- **Data master**: kategori, supplier, dan sparepart.
- **Transaksi stok**: pencatatan barang masuk dan barang keluar yang otomatis memperbarui stok sparepart.

Ada dua peran pengguna:

| Role      | Gambaran                                                                                |
| --------- | --------------------------------------------------------------------------------------- |
| `admin`   | Akses penuh: kelola user, data master, dan transaksi stok.                              |
| `petugas` | Membaca data master dan mengelola transaksi stok. Hanya boleh mengubah akunnya sendiri. |

## 2. Teknologi

| Komponen    | Teknologi                                              |
| ----------- | ------------------------------------------------------ |
| Runtime     | Node.js (ES Modules)                                   |
| Framework   | Express 5                                              |
| Database    | MySQL (driver `mysql2`)                                |
| Autentikasi | JWT (`jsonwebtoken`), password di-hash dengan `bcrypt` |
| Logging     | `pino`                                                 |
| Pengujian   | Vitest + Supertest                                     |

Struktur folder `src/`:

```
src/
├── app.js            # konfigurasi Express, route, error handler
├── server.js         # koneksi database dan menjalankan server
├── errors.js         # kelas error dengan kode status HTTP
├── logger.js
├── controllers/      # menerima request, memanggil service, membalas response
├── services/         # aturan bisnis dan validasi
├── database/
│   ├── index.js      # koneksi (pool) MySQL
│   ├── schema.js     # pembuatan tabel
│   ├── lazy.js
│   ├── repository/   # query SQL per tabel
│   └── seeder/       # skrip pembuatan admin pertama
├── middleware/       # autentikasi dan pembatasan role
├── routes/           # definisi URL
└── tests/            # pengujian otomatis
```

## 3. Menjalankan Backend

### 3.1 Instalasi

```bash
npm install
```

### 3.2 Konfigurasi `.env`

Buat file `.env` di folder `Backend` dengan variabel berikut (isi nilainya sesuai lingkungan masing-masing):

| Variabel         | Keterangan                                  |
| ---------------- | ------------------------------------------- |
| `DB_HOST`        | Alamat server MySQL                         |
| `DB_PORT`        | Port MySQL (umumnya 3306)                   |
| `DB_USER`        | User MySQL                                  |
| `DB_PASSWORD`    | Password MySQL                              |
| `DB_NAME`        | Nama database                               |
| `PORT`           | Port server API (bawaan 3000)               |
| `JWT_SECRET`     | Kunci rahasia untuk menandatangani token    |
| `NODE_ENV`       | Lingkungan (`development`, `test`, dst.)    |
| `LOG_LEVEL`      | Tingkat log (`info`, `silent`, dst.)        |
| `ADMIN_NAME`     | Nama admin pertama (dipakai skrip seed)     |
| `ADMIN_USERNAME` | Username admin pertama (dipakai skrip seed) |
| `ADMIN_PASSWORD` | Password admin pertama (dipakai skrip seed) |

> File `.env` berisi data rahasia dan **tidak boleh** ikut di-commit ke Git.

### 3.3 Menyiapkan database dan admin pertama

1. Buat database kosong di MySQL dengan nama sesuai `DB_NAME`.
2. Jalankan skrip seed. Skrip ini membuat kelima tabel dan satu akun admin:

```bash
npm run seed:admin
```

Karena pendaftaran akun hanya boleh dilakukan admin yang sudah login, admin pertama harus dibuat lewat skrip ini. Admin berikutnya dan semua petugas dibuat lewat `POST /api/auth/register`.

### 3.4 Menjalankan server

```bash
npm run start   # menjalankan server
npm run dev     # mode pengembangan (restart otomatis saat file berubah)
```

Server berjalan di `http://localhost:3000` (atau sesuai `PORT`).

### 3.5 Menjalankan test

Test memakai database terpisah agar data asli tidak tersentuh. Siapkan database kedua dengan nama berakhiran `_test`, dan file `.env.test` yang berisi variabel yang sama dengan `.env` (dengan `DB_NAME` berakhiran `_test`). Lalu:

```bash
npm test
```

## 4. Konvensi API

### 4.1 Base URL

```
http://localhost:3000/api
```

### 4.2 Autentikasi

Semua endpoint selain `POST /api/auth/login` dan `GET /` memerlukan token JWT di header:

```
Authorization: Bearer <token>
```

Token didapat dari login dan berlaku **1 hari**. Isi token: `id`, `name`, `username`, `role`.

### 4.3 Format response

**Sukses**

```json
{
  "success": true,
  "message": "Data kategori berhasil diambil.",
  "data": {}
}
```

**Error dari service**

```json
{
  "success": false,
  "message": "Kode sparepart sudah digunakan"
}
```

**Error dari middleware (autentikasi dan hak akses)**

```json
{
  "message": "Token tidak valid"
}
```

Response error dari middleware tidak memiliki field `success`. Gunakan **kode status HTTP** untuk membedakan jenis error, dan ambil teks dari `message`.

### 4.4 Kode status

| Kode | Arti                  | Contoh penyebab                                                                            |
| ---- | --------------------- | ------------------------------------------------------------------------------------------ |
| 200  | OK                    | Data berhasil diambil, diubah, atau dihapus                                                |
| 201  | Created               | Data baru berhasil dibuat                                                                  |
| 400  | Bad Request           | Field wajib kosong, nilai negatif, role tidak valid, JSON rusak                            |
| 401  | Unauthorized          | Token tidak ada atau tidak valid, login gagal                                              |
| 403  | Forbidden             | Role tidak punya akses ke endpoint tersebut                                                |
| 404  | Not Found             | Data dengan id tersebut tidak ada, atau endpoint tidak ada                                 |
| 409  | Conflict              | Data kembar (username, kode sparepart), stok tidak mencukupi, data masih dipakai data lain |
| 500  | Internal Server Error | Kesalahan tak terduga di server                                                            |

## 5. Hak Akses

| Endpoint                                                   |     Admin      |              Petugas              |
| ---------------------------------------------------------- | :------------: | :-------------------------------: |
| `POST /auth/login`                                         |     publik     |              publik               |
| `POST /auth/register`                                      |       ✔        |                 ✘                 |
| `GET /users`, `GET /users/:id`                             |       ✔        |                 ✘                 |
| `PUT /users/:id`                                           | ✔ (semua user) | ✔ (akun sendiri, tanpa ubah role) |
| `DELETE /users/:id`                                        |       ✔        |                 ✘                 |
| `GET /categories`, `/categories/search`, `/categories/:id` |       ✔        |                 ✔                 |
| `POST/PUT/DELETE /categories`                              |       ✔        |                 ✘                 |
| `GET /suppliers`, `/suppliers/search`                      |       ✔        |                 ✔                 |
| `GET /suppliers/:id`                                       |       ✔        |                 ✘                 |
| `POST/PUT/DELETE /suppliers`                               |       ✔        |                 ✘                 |
| `GET /spareparts`, `/spareparts/search`, `/spareparts/:id` |       ✔        |                 ✔                 |
| `POST/PUT/DELETE /spareparts`                              |       ✔        |                 ✘                 |
| Semua endpoint `/stock-transactions`                       |       ✔        |                 ✔                 |

Pesan error hak akses:

| Kode | Pesan                                              | Penyebab                                           |
| ---- | -------------------------------------------------- | -------------------------------------------------- |
| 401  | `Token tidak ditemukan`                            | Header `Authorization` tidak ada atau salah format |
| 401  | `Token tidak valid`                                | Token rusak atau kedaluwarsa                       |
| 403  | `Akses ditolak`                                    | Role tidak termasuk yang diizinkan                 |
| 403  | `Akses ditolak: hanya boleh mengubah akun sendiri` | Petugas mengubah akun orang lain                   |
| 403  | `Akses ditolak: petugas tidak boleh mengubah role` | Petugas mencoba mengganti role                     |

## 6. Daftar Endpoint

Tanda `*` pada tabel body berarti field wajib.

### 6.1 Root

| Method | URL | Akses  |
| ------ | --- | ------ |
| GET    | `/` | Publik |

Respons `200`: `{ "success": true, "message": "API Stok Sparepart berjalan." }`

---

### 6.2 Auth

#### POST `/api/auth/login`

Akses: publik.

| Field        | Tipe   | Keterangan |
| ------------ | ------ | ---------- |
| `username`\* | string |            |
| `password`\* | string |            |

Respons `200`:

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": 1,
      "name": "Administrator",
      "username": "admin",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

Error: `400` (username atau password kosong), `401` (`Username atau password salah`).

Frontend memakai `data.user.role` untuk mengarahkan pengguna ke halaman admin atau halaman petugas.

#### POST `/api/auth/register`

Akses: **admin**. Dipakai admin untuk membuat akun baru.

| Field        | Tipe   | Keterangan                                |
| ------------ | ------ | ----------------------------------------- |
| `name`\*     | string | Nama lengkap                              |
| `username`\* | string | Harus unik                                |
| `password`\* | string | Disimpan dalam bentuk hash                |
| `role`       | string | `admin` atau `petugas`. Bawaan: `petugas` |

Respons `201`:

```json
{
  "success": true,
  "message": "User berhasil terdaftar.",
  "data": { "id": 2, "name": "Budi", "username": "budi", "role": "petugas" }
}
```

Error: `400` (field kosong atau role tidak valid), `401`, `403`, `409` (`Username sudah digunakan`).

---

### 6.3 Users

| Method | URL              | Akses                         | Keterangan                         |
| ------ | ---------------- | ----------------------------- | ---------------------------------- |
| GET    | `/api/users`     | Admin                         | Daftar semua user (tanpa password) |
| GET    | `/api/users/:id` | Admin                         | Detail satu user (tanpa password)  |
| PUT    | `/api/users/:id` | Admin, petugas (akun sendiri) | Mengubah user                      |
| DELETE | `/api/users/:id` | Admin                         | Menghapus user                     |

Data user pada response: `id`, `name`, `username`, `role`, `created_at`, `updated_at`. Password tidak pernah dikembalikan.

#### PUT `/api/users/:id`

| Field        | Tipe   | Keterangan                                                                                      |
| ------------ | ------ | ----------------------------------------------------------------------------------------------- |
| `name`\*     | string |                                                                                                 |
| `username`\* | string | Harus unik                                                                                      |
| `password`   | string | Opsional. Jika tidak dikirim, password lama tidak berubah. Jika dikirim, di-hash ulang          |
| `role`       | string | `admin` atau `petugas`. Jika tidak dikirim, role tidak berubah. Petugas tidak boleh mengubahnya |

Respons `200`: `data` berisi `true`.

Error: `400` (nama atau username kosong, atau role tidak valid), `401`, `403`, `404` (`User tidak ditemukan`), `409` (`Username sudah digunakan`).

---

### 6.4 Categories

| Method | URL                            | Akses          | Keterangan                            |
| ------ | ------------------------------ | -------------- | ------------------------------------- |
| GET    | `/api/categories`              | Admin, petugas | Semua kategori (terbaru di atas)      |
| GET    | `/api/categories/search?name=` | Admin, petugas | Cari berdasarkan nama (sebagian kata) |
| GET    | `/api/categories/:id`          | Admin, petugas | Detail kategori                       |
| POST   | `/api/categories`              | Admin          | Membuat kategori                      |
| PUT    | `/api/categories/:id`          | Admin          | Mengubah kategori                     |
| DELETE | `/api/categories/:id`          | Admin          | Menghapus kategori                    |

Body `POST` dan `PUT`:

| Field         | Tipe   | Keterangan |
| ------------- | ------ | ---------- |
| `name`\*      | string |            |
| `description` | string | Opsional   |

Respons `POST` `201`: `data` berisi `{ id, name, description }`. Respons `PUT` dan `DELETE` `200`: `data` berisi `true`.

Error: `400` (nama kosong), `404` (`Kategori tidak ditemukan`).

---

### 6.5 Suppliers

| Method | URL                           | Akses          | Keterangan            |
| ------ | ----------------------------- | -------------- | --------------------- |
| GET    | `/api/suppliers`              | Admin, petugas | Semua supplier        |
| GET    | `/api/suppliers/search?name=` | Admin, petugas | Cari berdasarkan nama |
| GET    | `/api/suppliers/:id`          | **Admin**      | Detail supplier       |
| POST   | `/api/suppliers`              | Admin          | Membuat supplier      |
| PUT    | `/api/suppliers/:id`          | Admin          | Mengubah supplier     |
| DELETE | `/api/suppliers/:id`          | Admin          | Menghapus supplier    |

Body `POST` dan `PUT`:

| Field     | Tipe   | Keterangan            |
| --------- | ------ | --------------------- |
| `name`\*  | string |                       |
| `address` | string | Opsional              |
| `phone`   | string | Opsional              |
| `contact` | string | Nama kontak, opsional |

Respons `POST` `201`: `data` berisi `{ id, name, address, phone, contact }`. Respons `PUT` dan `DELETE` `200`: `data` berisi `true`.

Error: `400` (nama kosong), `404` (`Supplier tidak ditemukan`).

---

### 6.6 Spareparts

| Method | URL                            | Akses          | Keterangan                                     |
| ------ | ------------------------------ | -------------- | ---------------------------------------------- |
| GET    | `/api/spareparts`              | Admin, petugas | Semua sparepart                                |
| GET    | `/api/spareparts/search?name=` | Admin, petugas | Cari berdasarkan nama (parameter `name` wajib) |
| GET    | `/api/spareparts/:id`          | Admin, petugas | Detail sparepart                               |
| POST   | `/api/spareparts`              | Admin          | Membuat sparepart                              |
| PUT    | `/api/spareparts/:id`          | Admin          | Mengubah sparepart                             |
| DELETE | `/api/spareparts/:id`          | Admin          | Menghapus sparepart                            |

Body `POST` dan `PUT`:

| Field         | Tipe    | Keterangan                                 |
| ------------- | ------- | ------------------------------------------ |
| `kode`\*      | string  | Kode unik sparepart                        |
| `name`\*      | string  |                                            |
| `brand`       | string  | Opsional                                   |
| `unit`        | string  | Satuan. Bawaan: `pcs`                      |
| `category_id` | integer | Id kategori, opsional                      |
| `supplier_id` | integer | Id supplier, opsional                      |
| `buy_price`   | number  | Harga beli, tidak boleh negatif. Bawaan: 0 |
| `sell_price`  | number  | Harga jual, tidak boleh negatif. Bawaan: 0 |
| `stock`       | integer | Stok awal, tidak boleh negatif. Bawaan: 0  |
| `min_stock`   | integer | Batas stok minimum. Bawaan: 0              |
| `description` | string  | Opsional                                   |

> Untuk `PUT`, kirim **data lengkap**. Field yang tidak dikirim kembali ke nilai bawaan (misalnya `stock` menjadi 0).

Contoh respons `POST` `201`:

```json
{
  "success": true,
  "message": "Sparepart berhasil ditambahkan.",
  "data": {
    "id": 1,
    "kode": "BSI-001",
    "name": "Busi NGK",
    "brand": "NGK",
    "unit": "pcs",
    "category_id": 1,
    "supplier_id": 1,
    "buy_price": "15000.00",
    "sell_price": "20000.00",
    "stock": 10,
    "min_stock": 5,
    "description": "Busi motor",
    "status": "aman",
    "created_at": "2026-11-02T03:00:00.000Z",
    "updated_at": "2026-11-02T03:00:00.000Z",
    "category_name": "Busi",
    "supplier_name": "PT Maju Jaya"
  }
}
```

Catatan:

- `status` dihitung otomatis oleh database, bukan dikirim klien (lihat [Aturan Bisnis](#8-aturan-bisnis)).
- `category_name` dan `supplier_name` ikut dikirim pada daftar, detail, pencarian, serta hasil `POST` dan `PUT`. Nilainya `null` jika sparepart tidak punya kategori atau supplier.
- Kolom harga (`buy_price`, `sell_price`) dikembalikan sebagai **string** (`"15000.00"`), sehingga frontend perlu mengubahnya ke angka saat menghitung.

Respons `PUT` `200`: `data` berisi objek sparepart terbaru.

Respons `DELETE` `200` **tidak memiliki field `data`**:

```json
{
  "success": true,
  "message": "Sparepart berhasil dihapus."
}
```

Respons pencarian (`GET /api/spareparts/search`) memakai pesan `Data sparepart berhasil dicari.`, dengan `data` berisi daftar sparepart yang cocok.

Error:

| Kode | Penyebab                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 400  | Kode atau nama kosong; harga atau stok negatif; `category_id` atau `supplier_id` tidak ada; pencarian tanpa `name` |
| 404  | `Sparepart tidak ditemukan`                                                                                        |
| 409  | `Kode sparepart sudah digunakan`; saat `DELETE`, sparepart masih punya transaksi stok                              |

---

### 6.7 Stock Transactions

Semua endpoint di bagian ini dapat diakses **admin dan petugas**.

| Method | URL                           | Keterangan              |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/api/stock-transactions`     | Semua transaksi         |
| GET    | `/api/stock-transactions/in`  | Hanya barang masuk      |
| GET    | `/api/stock-transactions/out` | Hanya barang keluar     |
| GET    | `/api/stock-transactions/:id` | Detail satu transaksi   |
| POST   | `/api/stock-transactions`     | Mencatat transaksi baru |
| PUT    | `/api/stock-transactions/:id` | Mengubah transaksi      |
| DELETE | `/api/stock-transactions/:id` | Menghapus transaksi     |

Body `POST` dan `PUT`:

| Field           | Tipe    | Keterangan                                           |
| --------------- | ------- | ---------------------------------------------------- |
| `date`\*        | string  | Tanggal transaksi, format `YYYY-MM-DD`               |
| `type`\*        | string  | `in` (barang masuk) atau `out` (barang keluar)       |
| `sparepartId`\* | integer | Id sparepart                                         |
| `supplierId`    | integer | **Wajib** jika `type` = `in`. Diabaikan jika `out`   |
| `quantity`      | integer | Harus lebih dari 0. Bawaan: 1                        |
| `buyPrice`      | number  | Tidak boleh negatif. Bawaan: 0. Diabaikan jika `out` |
| `notes`         | string  | Catatan, opsional                                    |

Id user pencatat diambil otomatis dari token login, tidak dikirim di body.

Contoh body barang masuk:

```json
{
  "date": "2026-11-02",
  "type": "in",
  "sparepartId": 1,
  "supplierId": 1,
  "quantity": 5,
  "buyPrice": 15000,
  "notes": "Pembelian awal"
}
```

Contoh respons `POST` `201`:

```json
{
  "success": true,
  "message": "Transaksi stok berhasil ditambahkan.",
  "data": {
    "id": 1,
    "date": "2026-11-02T00:00:00.000Z",
    "type": "in",
    "sparepart_id": 1,
    "supplier_id": 1,
    "user_id": 2,
    "quantity": 5,
    "buy_price": "15000.00",
    "notes": "Pembelian awal",
    "created_at": "2026-11-02T03:00:00.000Z",
    "updated_at": "2026-11-02T03:00:00.000Z",
    "sparepart_kode": "BSI-001",
    "sparepart_name": "Busi NGK",
    "supplier_name": "PT Maju Jaya",
    "user_name": "Budi"
  }
}
```

Respons `PUT` `200`: objek transaksi terbaru. Respons `DELETE` `200`: `data` berisi `{ id, type, sparepart_id }`.

Error:

| Kode | Penyebab                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| 400  | Tanggal kosong; `type` bukan `in`/`out`; sparepart tidak dipilih; `quantity` ≤ 0; `buyPrice` negatif; barang masuk tanpa supplier |
| 404  | `Sparepart tidak ditemukan`; `Supplier tidak ditemukan`; `Transaksi stok tidak ditemukan`                                         |
| 409  | `Stok ... tidak mencukupi`; perubahan atau penghapusan transaksi akan membuat stok menjadi minus                                  |

## 7. Struktur Database

Database terdiri dari 5 tabel. Semua tabel memiliki kolom `created_at` dan `updated_at` (diisi otomatis).

### 7.1 `users`

| Kolom      | Tipe                    | Keterangan                  |
| ---------- | ----------------------- | --------------------------- |
| `id`       | INT, PK, auto increment |                             |
| `name`     | VARCHAR(100)            | Wajib                       |
| `username` | VARCHAR(100)            | Wajib, **unik**             |
| `password` | VARCHAR(255)            | Hash bcrypt                 |
| `role`     | ENUM('admin','petugas') | Bawaan di database: `admin` |

### 7.2 `categories`

| Kolom         | Tipe         | Keterangan |
| ------------- | ------------ | ---------- |
| `id`          | INT, PK      |            |
| `name`        | VARCHAR(100) | Wajib      |
| `description` | TEXT         |            |

### 7.3 `suppliers`

| Kolom     | Tipe         | Keterangan |
| --------- | ------------ | ---------- |
| `id`      | INT, PK      |            |
| `name`    | VARCHAR(100) | Wajib      |
| `address` | TEXT         |            |
| `phone`   | VARCHAR(20)  |            |
| `contact` | VARCHAR(100) |            |

### 7.4 `spareparts`

| Kolom         | Tipe                         | Keterangan                                     |
| ------------- | ---------------------------- | ---------------------------------------------- |
| `id`          | INT, PK                      |                                                |
| `kode`        | VARCHAR(50)                  | Wajib, **unik**                                |
| `name`        | VARCHAR(100)                 | Wajib                                          |
| `brand`       | VARCHAR(100)                 |                                                |
| `unit`        | VARCHAR(20)                  | Bawaan `pcs`                                   |
| `category_id` | INT, FK ke `categories.id`   | `ON DELETE SET NULL`                           |
| `supplier_id` | INT, FK ke `suppliers.id`    | `ON DELETE SET NULL`                           |
| `buy_price`   | DECIMAL(10,2)                | Bawaan 0                                       |
| `sell_price`  | DECIMAL(10,2)                | Bawaan 0                                       |
| `stock`       | INT                          | Bawaan 0                                       |
| `min_stock`   | INT                          | Bawaan 0                                       |
| `description` | TEXT                         |                                                |
| `status`      | VARCHAR(20), kolom terhitung | Dihitung otomatis dari `stock` dan `min_stock` |

### 7.5 `stock_transactions`

| Kolom          | Tipe                       | Keterangan                  |
| -------------- | -------------------------- | --------------------------- |
| `id`           | INT, PK                    |                             |
| `date`         | DATE                       | Wajib                       |
| `type`         | ENUM('in','out')           | Wajib                       |
| `sparepart_id` | INT, FK ke `spareparts.id` | Wajib, `ON DELETE RESTRICT` |
| `supplier_id`  | INT, FK ke `suppliers.id`  | `ON DELETE SET NULL`        |
| `user_id`      | INT, FK ke `users.id`      | `ON DELETE SET NULL`        |
| `quantity`     | INT                        | Bawaan 1                    |
| `buy_price`    | DECIMAL(10,2)              | Bawaan 0                    |
| `notes`        | TEXT                       |                             |

### 7.6 Relasi antar tabel

```
categories 1 ──── * spareparts * ──── 1 suppliers
                       │
                       1
                       │
                       *
users 1 ──── * stock_transactions * ──── 1 suppliers
```

- Satu kategori dan satu supplier dapat dimiliki banyak sparepart.
- Satu sparepart memiliki banyak transaksi stok.
- Satu transaksi stok dicatat oleh satu user dan (untuk barang masuk) berasal dari satu supplier.

## 8. Aturan Bisnis

**Stok dan transaksi**

1. Stok sparepart **berubah otomatis** mengikuti transaksi: barang masuk menambah stok, barang keluar mengurangi stok.
2. Pencatatan transaksi dan perubahan stok berjalan dalam satu **transaksi database** (atomik): keduanya berhasil bersama atau dibatalkan bersama.
3. Barang masuk **wajib** memiliki supplier. Pada barang keluar, `supplierId` dan `buyPrice` dikosongkan otomatis.
4. Barang keluar tidak boleh melebihi stok yang ada (409).
5. Saat transaksi **diubah**, efek transaksi lama dibatalkan lalu efek data baru diterapkan. Saat transaksi **dihapus**, efeknya dibatalkan. Jika pembatalan itu membuat stok minus, perubahan ditolak (409).
6. Sparepart yang sudah memiliki transaksi **tidak dapat dihapus** (409).

**Status sparepart** (dihitung otomatis)

| Kondisi               | Status         |
| --------------------- | -------------- |
| `stock` ≤ 0           | `habis`        |
| `stock` ≤ `min_stock` | `hampir habis` |
| selain itu            | `aman`         |

**Akun dan keamanan**

7. Akun baru hanya dapat dibuat oleh admin yang sudah login. Tidak ada pendaftaran publik.
8. Admin pertama dibuat lewat skrip `npm run seed:admin`.
9. Petugas hanya dapat mengubah **akunnya sendiri** dan tidak dapat mengubah role (mencegah kenaikan hak akses).
10. Password disimpan dalam bentuk hash `bcrypt` dan tidak pernah dikembalikan oleh API.
11. `username` dan `kode` sparepart harus unik.

## 9. Pengujian Otomatis

Pengujian memakai **Vitest** dan **Supertest**, dan dijalankan terhadap database terpisah (`DB_NAME` berakhiran `_test`). Tabel dikosongkan sebelum tiap file test, dan terdapat pengaman yang menghentikan test jika nama database tidak berakhiran `_test`.

| File test            | Jumlah | Cakupan                                                                                      |
| -------------------- | -----: | -------------------------------------------------------------------------------------------- |
| `app.test.js`        |      3 | Endpoint root, endpoint tidak ada (404), JSON rusak (400)                                    |
| `auth.test.js`       |     14 | Login, aturan register (tanpa token, petugas, admin), hak akses dasar                        |
| `master.test.js`     |     14 | CRUD kategori dan supplier, pembatasan role                                                  |
| `spareparts.test.js` |     11 | CRUD sparepart, validasi, status otomatis, pembatasan role                                   |
| `stock.test.js`      |     16 | Validasi transaksi, dampak transaksi ke stok (tambah, kurang, ubah, hapus, tolak stok minus) |
| `users.test.js`      |     11 | Baca, ubah, hapus user; pembatasan akses petugas                                             |
| **Total**            | **69** |                                                                                              |

Menjalankan semua test:

```bash
npm test
```

## 10. Keterbatasan yang Diketahui

Hal-hal berikut belum ditangani dan dapat menjadi bahan pengembangan berikutnya:

1. **Validasi `PUT` kategori dan supplier**: field `name` belum divalidasi pada `PUT`. Mengirim body tanpa `name` menghasilkan error 500, bukan 400.
2. **Pencarian tanpa parameter**: `GET /categories/search` dan `GET /suppliers/search` tanpa `name` belum divalidasi (hasil kosong). Pencarian sparepart sudah menolak dengan 400.
3. **Tanpa paginasi**: endpoint daftar mengembalikan semua data sekaligus. Perlu paginasi jika data sangat banyak.
4. **Token tidak dapat dicabut**: token berlaku sampai kedaluwarsa (1 hari). Role dibaca dari token, sehingga perubahan role baru berlaku setelah login ulang.
5. **Format response error tidak seragam**: error dari middleware tidak memiliki `success: false`. Frontend sebaiknya mengandalkan kode status HTTP.
6. **Format tanggal**: kolom tanggal dikembalikan driver MySQL sebagai string waktu ISO 8601, sehingga frontend perlu memformatnya sebelum ditampilkan.
7. **Migrasi skema**: tabel dibuat dengan `CREATE TABLE IF NOT EXISTS`, yang tidak memperbarui tabel yang sudah ada. Perubahan skema pada database yang sudah berjalan memerlukan migrasi (`ALTER TABLE`) atau pembuatan ulang database.
8. **Belum ada ganti password mandiri** dan batas percobaan login (rate limiting).

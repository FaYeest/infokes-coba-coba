# Sistem Manajemen Data Pasien Rawat Inap

Aplikasi web React + Express + MySQL untuk tugas kuliah tentang manipulasi string dan query database. UI dibuat dark, clean, responsif, dan memakai layout sidebar seperti aplikasi profesional.

## Teknologi

- Frontend: ReactJS, Vite, Tailwind CSS, Lucide React
- Backend: Node.js, Express, MySQL2, raw SQL prepared statements
- Database: MySQL

## Struktur Folder

```txt
infokes/
├─ client/              # React UI
├─ server/              # Express API
├─ database/schema.sql  # Database, tabel, dummy data, contoh query
└─ README.md
```

## Cara Menjalankan

1. Install dependency.

```bash
npm install
```

2. Buat database MySQL dengan file SQL.

```bash
mysql -u root -p < database/schema.sql
```

Jika command `mysql` belum tersedia di terminal, import `database/schema.sql` melalui phpMyAdmin, MySQL Workbench, Laragon, XAMPP, atau tool MySQL lain.

3. Siapkan konfigurasi backend.

```bash
Copy-Item server\.env.example server\.env
```

Ubah `DB_USER`, `DB_PASSWORD`, `DB_HOST`, dan `DB_PORT` sesuai MySQL lokal.

4. Jalankan backend dan frontend.

```bash
npm run dev
```

Frontend berjalan di `http://localhost:5173`, backend di `http://localhost:5000`.

## Fitur Utama

- Dashboard menampilkan total pasien, pasien rawat inap aktif, pasien keluar, dan update rawat inap terbaru.
- Manajemen pasien mendukung tambah, edit, hapus, tabel data, dan pencarian nama/nomor RM dengan query `LIKE`.
- Data rawat inap mendukung tambah data, update diagnosa, update kamar, update status, serta tampilan relasi pasien dan rawat inap memakai `JOIN`.
- Manipulasi string dilakukan di backend saat pasien disimpan: nama di-`trim`, spasi ganda dirapikan, lalu diubah menjadi Title Case.
- Validasi form ada di frontend dan backend untuk mencegah nama, alamat, kamar, dan diagnosa kosong.
- Feedback aksi ditampilkan lewat toast, error banner, validasi field, dan modal konfirmasi hapus.

## Endpoint API

```txt
GET    /api/dashboard
GET    /api/pasien?search=
POST   /api/pasien
PUT    /api/pasien/:id
DELETE /api/pasien/:id
GET    /api/rawat-inap
POST   /api/rawat-inap
PATCH  /api/rawat-inap/:id/diagnosa
PATCH  /api/rawat-inap/:id/kamar
PATCH  /api/rawat-inap/:id/status
```

## Contoh Manipulasi String

Input:

```txt
"  budi   santoso  "
```

Diproses backend:

```js
trim() -> "budi   santoso"
replace(/\s+/g, " ") -> "budi santoso"
Title Case -> "Budi Santoso"
```

Hasil yang tersimpan:

```txt
"Budi Santoso"
```

## Demo Manipulasi String via CLI

Cara paling sederhana tanpa membuka UI adalah menjalankan manipulasi string langsung lewat Node.js CLI:

```powershell
node -e "const nama='  budi   santoso  '; const hasil=nama.trim().replace(/\s+/g,' ').toLowerCase().split(' ').map(kata => kata.charAt(0).toUpperCase() + kata.slice(1)).join(' '); console.log(hasil);"
```

Output:

```txt
Budi Santoso
```

Untuk membuktikan manipulasi string berjalan melalui backend aplikasi, pastikan backend sudah aktif, lalu jalankan:

```powershell
$body = @{
  nomor_rm = "RM-CLI-001"
  nama = "  budi   santoso  "
  jenis_kelamin = "Laki-laki"
  tanggal_lahir = "2000-01-15"
  alamat = "Jl. CLI No. 1"
  no_telepon = "081234567899"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/pasien" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Lalu cek hasil nama yang sudah berubah menjadi Title Case:

```powershell
Invoke-RestMethod "http://localhost:5000/api/pasien?search=budi" | ConvertTo-Json -Depth 5
```

Pada hasil JSON, field `nama` akan tampil sebagai:

```json
"nama": "Budi Santoso"
```

## Query Database

File `database/schema.sql` berisi:

- `CREATE DATABASE`
- `CREATE TABLE pasien`
- `CREATE TABLE rawat_inap`
- `INSERT` data dummy
- `SELECT` data pasien
- `UPDATE` data pasien
- `DELETE` data pasien
- `JOIN` pasien dengan rawat inap
- Search pasien menggunakan `LIKE`

## Skenario Demo Presentasi

1. Buka dashboard dan jelaskan statistik total pasien, rawat inap aktif, pasien keluar, dan data terbaru.
2. Buka Data Pasien, tambah pasien dengan nama berantakan seperti `  budi   santoso  `.
3. Tunjukkan preview manipulasi string dan hasil nama tersimpan sebagai `Budi Santoso`.
4. Edit data pasien, ubah alamat atau nomor telepon, lalu simpan.
5. Gunakan search untuk mencari pasien dengan sebagian nama, misalnya `budi`, dan jelaskan query `LIKE`.
6. Buka Rawat Inap, tambah data rawat inap untuk pasien tersebut.
7. Update diagnosa, kamar, dan status pasien menjadi `Keluar`.
8. Tunjukkan bahwa dashboard ikut berubah setelah data disinkronkan.
9. Jalankan contoh CLI manipulasi string untuk membuktikan input nama berantakan berubah menjadi Title Case.
10. Buka `database/schema.sql` untuk menunjukkan query lengkap dan dummy data.

## Catatan

- MySQL harus berjalan sebelum backend dinyalakan.
- Jika backend gagal start, cek `server/.env` dan pastikan database `db_rawat_inap` sudah dibuat.
- Aplikasi tidak memakai login agar fokus pada CRUD, manipulasi string, dan query database.

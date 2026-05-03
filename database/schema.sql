-- ============================================================
-- Database Sistem Manajemen Data Pasien Rawat Inap
-- Materi: Manipulasi String dan Query Database
-- DBMS: MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_rawat_inap
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_rawat_inap;

-- ============================================================
-- CREATE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS pasien (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nomor_rm VARCHAR(30) NOT NULL UNIQUE,
  nama VARCHAR(120) NOT NULL,
  jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
  tanggal_lahir DATE NOT NULL,
  alamat TEXT NOT NULL,
  no_telepon VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rawat_inap (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pasien_id INT NOT NULL,
  tanggal_masuk DATE NOT NULL,
  tanggal_keluar DATE,
  kamar VARCHAR(50) NOT NULL,
  diagnosa VARCHAR(255) NOT NULL,
  status ENUM('Dirawat', 'Observasi', 'Keluar') NOT NULL DEFAULT 'Dirawat',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rawat_inap_pasien
    FOREIGN KEY (pasien_id)
    REFERENCES pasien(id)
    ON DELETE CASCADE
);

-- ============================================================
-- CONTOH QUERY CRUD PASIEN
-- Query di bawah ini sengaja dikomentari agar schema.sql tidak
-- otomatis membuat data dummy saat di-import.
-- ============================================================

-- SELECT data pasien
-- SELECT
--   id,
--   nomor_rm,
--   nama,
--   jenis_kelamin,
--   tanggal_lahir,
--   alamat,
--   no_telepon
-- FROM pasien
-- ORDER BY created_at DESC;

-- INSERT data pasien
-- INSERT INTO pasien
--   (nomor_rm, nama, jenis_kelamin, tanggal_lahir, alamat, no_telepon)
-- VALUES
--   ('RM-20260503-0001', 'Budi Santoso', 'Laki-laki', '1998-02-12', 'Jl. Melati No. 14, Jakarta', '081234567001');

-- UPDATE data pasien
-- UPDATE pasien
-- SET
--   nama = 'Budi Saputra Santoso',
--   alamat = 'Jl. Melati Raya No. 14, Jakarta',
--   no_telepon = '081234567555'
-- WHERE nomor_rm = 'RM-20260503-0001';

-- DELETE data pasien
-- DELETE FROM pasien
-- WHERE nomor_rm = 'RM-20260503-0001';

-- ============================================================
-- CONTOH QUERY RAWAT INAP DAN JOIN
-- ============================================================

-- INSERT data rawat inap
-- INSERT INTO rawat_inap
--   (pasien_id, tanggal_masuk, kamar, diagnosa, status)
-- VALUES
--   ((SELECT id FROM pasien WHERE nomor_rm = 'RM-20260503-0001'), '2026-05-03', 'Anggrek-210', 'Observasi nyeri abdomen', 'Observasi');

-- UPDATE diagnosa
-- UPDATE rawat_inap
-- SET diagnosa = 'Gastroenteritis akut'
-- WHERE id = 1;

-- UPDATE kamar
-- UPDATE rawat_inap
-- SET kamar = 'Mawar-205'
-- WHERE id = 1;

-- UPDATE status pasien keluar
-- UPDATE rawat_inap
-- SET status = 'Keluar', tanggal_keluar = CURDATE()
-- WHERE id = 1;

-- JOIN pasien dengan rawat_inap
-- SELECT
--   p.nomor_rm,
--   p.nama,
--   p.jenis_kelamin,
--   ri.tanggal_masuk,
--   ri.tanggal_keluar,
--   ri.kamar,
--   ri.diagnosa,
--   ri.status
-- FROM rawat_inap ri
-- INNER JOIN pasien p ON p.id = ri.pasien_id
-- ORDER BY ri.updated_at DESC;

-- Search pasien menggunakan LIKE
-- SELECT
--   id,
--   nomor_rm,
--   nama,
--   alamat
-- FROM pasien
-- WHERE nama LIKE '%Budi%'
--    OR nomor_rm LIKE '%Budi%';

-- Ringkasan dashboard
-- SELECT COUNT(*) AS total_pasien FROM pasien;
-- SELECT COUNT(*) AS total_rawat_inap FROM rawat_inap WHERE status IN ('Dirawat', 'Observasi');
-- SELECT COUNT(*) AS total_pasien_keluar FROM rawat_inap WHERE status = 'Keluar';

-- Contoh manipulasi string di SQL
-- Aplikasi melakukan trim, merapikan spasi, dan Title Case di backend JavaScript.
-- Query di bawah menunjukkan TRIM di MySQL:
SELECT TRIM('  budi santoso  ') AS nama_setelah_trim;

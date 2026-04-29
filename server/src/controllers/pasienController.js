import { pool } from "../config/db.js";
import {
  createMedicalRecordNumber,
  normalizePatientName,
  normalizeWhitespace
} from "../helpers/string.js";
import { validatePatientPayload } from "../helpers/validation.js";

const patientSelect = `
  SELECT
    id,
    nomor_rm,
    nama,
    jenis_kelamin,
    DATE_FORMAT(tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
    alamat,
    no_telepon,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at,
    DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') AS updated_at
  FROM pasien
`;

export async function getPatients(req, res, next) {
  try {
    const search = normalizeWhitespace(req.query.search || "");

    if (search) {
      const like = `%${search}%`;
      const [rows] = await pool.query(
        `${patientSelect}
        WHERE nama LIKE ? OR nomor_rm LIKE ?
        ORDER BY created_at DESC`,
        [like, like]
      );
      return res.json({ success: true, data: rows, meta: { search } });
    }

    const [rows] = await pool.query(`${patientSelect} ORDER BY created_at DESC`);
    res.json({ success: true, data: rows, meta: { search: "" } });
  } catch (error) {
    next(error);
  }
}

export async function createPatient(req, res, next) {
  try {
    const errors = validatePatientPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: "Validasi pasien gagal.", errors });
    }

    const normalizedName = normalizePatientName(req.body.nama);
    const nomorRm = normalizeWhitespace(req.body.nomor_rm || "") || createMedicalRecordNumber();

    const [result] = await pool.query(
      `INSERT INTO pasien
        (nomor_rm, nama, jenis_kelamin, tanggal_lahir, alamat, no_telepon)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nomorRm,
        normalizedName,
        req.body.jenis_kelamin,
        req.body.tanggal_lahir,
        normalizeWhitespace(req.body.alamat),
        normalizeWhitespace(req.body.no_telepon || "")
      ]
    );

    res.status(201).json({
      success: true,
      message: "Pasien berhasil ditambahkan.",
      data: { id: result.insertId, nomor_rm: nomorRm, nama: normalizedName }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Nomor rekam medis sudah digunakan.",
        errors: { nomor_rm: "Gunakan nomor rekam medis lain." }
      });
    }
    next(error);
  }
}

export async function updatePatient(req, res, next) {
  try {
    const errors = validatePatientPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: "Validasi pasien gagal.", errors });
    }

    const normalizedName = normalizePatientName(req.body.nama);
    const nomorRm = normalizeWhitespace(req.body.nomor_rm || "");

    const [result] = await pool.query(
      `UPDATE pasien
      SET nomor_rm = ?,
        nama = ?,
        jenis_kelamin = ?,
        tanggal_lahir = ?,
        alamat = ?,
        no_telepon = ?
      WHERE id = ?`,
      [
        nomorRm || createMedicalRecordNumber(),
        normalizedName,
        req.body.jenis_kelamin,
        req.body.tanggal_lahir,
        normalizeWhitespace(req.body.alamat),
        normalizeWhitespace(req.body.no_telepon || ""),
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Pasien tidak ditemukan." });
    }

    res.json({
      success: true,
      message: "Data pasien berhasil diperbarui.",
      data: { id: Number(req.params.id), nama: normalizedName }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Nomor rekam medis sudah digunakan.",
        errors: { nomor_rm: "Gunakan nomor rekam medis lain." }
      });
    }
    next(error);
  }
}

export async function deletePatient(req, res, next) {
  try {
    const [result] = await pool.query("DELETE FROM pasien WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Pasien tidak ditemukan." });
    }

    res.json({ success: true, message: "Pasien berhasil dihapus." });
  } catch (error) {
    next(error);
  }
}

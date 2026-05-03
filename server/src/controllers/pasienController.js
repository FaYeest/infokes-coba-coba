import { pool } from "../config/db.js";
import {
  createMedicalRecordNumber,
  getMedicalRecordDateStamp,
  getMedicalRecordSequence,
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

function getListLimit(value) {
  const parsed = Number(value || 200);
  if (!Number.isFinite(parsed) || parsed < 1) return 200;
  return Math.min(parsed, 500);
}

async function getNextMedicalRecordNumber() {
  const today = new Date();
  const dateStamp = getMedicalRecordDateStamp(today);
  const [rows] = await pool.query(
    `SELECT nomor_rm
    FROM pasien
    WHERE nomor_rm LIKE ?
    ORDER BY nomor_rm DESC
    LIMIT 1`,
    [`RM-${dateStamp}-%`]
  );

  const lastSequence = rows[0] ? getMedicalRecordSequence(rows[0].nomor_rm) : 0;
  return createMedicalRecordNumber(today, lastSequence + 1);
}

export async function getPatients(req, res, next) {
  try {
    const search = normalizeWhitespace(req.query.search || "");
    const limit = getListLimit(req.query.limit);

    if (search) {
      const like = `%${search}%`;
      const [rows] = await pool.query(
        `${patientSelect}
        WHERE nama LIKE ? OR nomor_rm LIKE ?
        ORDER BY created_at DESC, id DESC
        LIMIT ?`,
        [like, like, limit]
      );
      return res.json({ success: true, data: rows, meta: { search, limit } });
    }

    const [rows] = await pool.query(`${patientSelect} ORDER BY created_at DESC, id DESC LIMIT ?`, [limit]);
    res.json({ success: true, data: rows, meta: { search: "", limit } });
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
    const nomorRm = normalizeWhitespace(req.body.nomor_rm || "") || (await getNextMedicalRecordNumber());

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

    if (!nomorRm) {
      return res.status(422).json({
        success: false,
        message: "Validasi pasien gagal.",
        errors: { nomor_rm: "Nomor rekam medis wajib ada saat update." }
      });
    }

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
        nomorRm,
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

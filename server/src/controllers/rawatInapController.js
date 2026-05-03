import { pool } from "../config/db.js";
import { normalizeWhitespace } from "../helpers/string.js";
import {
  validateInpatientPayload,
  validateRequiredText,
  validateStatus
} from "../helpers/validation.js";

const inpatientSelect = `
  SELECT
    ri.id,
    ri.pasien_id,
    p.nomor_rm,
    p.nama,
    p.jenis_kelamin,
    DATE_FORMAT(ri.tanggal_masuk, '%Y-%m-%d') AS tanggal_masuk,
    DATE_FORMAT(ri.tanggal_keluar, '%Y-%m-%d') AS tanggal_keluar,
    ri.kamar,
    ri.diagnosa,
    ri.status,
    DATE_FORMAT(ri.created_at, '%Y-%m-%d %H:%i') AS created_at,
    DATE_FORMAT(ri.updated_at, '%Y-%m-%d %H:%i') AS updated_at
  FROM rawat_inap ri
  INNER JOIN pasien p ON p.id = ri.pasien_id
`;

function getListLimit(value) {
  const parsed = Number(value || 200);
  if (!Number.isFinite(parsed) || parsed < 1) return 200;
  return Math.min(parsed, 500);
}

export async function getInpatients(req, res, next) {
  try {
    const limit = getListLimit(req.query.limit);
    const [rows] = await pool.query(
      `${inpatientSelect} ORDER BY ri.updated_at DESC, ri.id DESC LIMIT ?`,
      [limit]
    );
    res.json({ success: true, data: rows, meta: { limit } });
  } catch (error) {
    next(error);
  }
}

export async function createInpatient(req, res, next) {
  try {
    const errors = validateInpatientPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        success: false,
        message: "Validasi rawat inap gagal.",
        errors
      });
    }

    const [result] = await pool.query(
      `INSERT INTO rawat_inap
        (pasien_id, tanggal_masuk, tanggal_keluar, kamar, diagnosa, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(req.body.pasien_id),
        req.body.tanggal_masuk,
        req.body.tanggal_keluar || null,
        normalizeWhitespace(req.body.kamar),
        normalizeWhitespace(req.body.diagnosa),
        req.body.status || "Dirawat"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Data rawat inap berhasil ditambahkan.",
      data: { id: result.insertId }
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(422).json({
        success: false,
        message: "Pasien tidak ditemukan.",
        errors: { pasien_id: "Pilih pasien yang sudah terdaftar." }
      });
    }
    next(error);
  }
}

export async function updateDiagnosis(req, res, next) {
  try {
    const errors = validateRequiredText("diagnosa", req.body.diagnosa, "Diagnosa");
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: "Validasi diagnosa gagal.", errors });
    }

    const [result] = await pool.query("UPDATE rawat_inap SET diagnosa = ? WHERE id = ?", [
      normalizeWhitespace(req.body.diagnosa),
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Data rawat inap tidak ditemukan." });
    }

    res.json({ success: true, message: "Diagnosa berhasil diperbarui." });
  } catch (error) {
    next(error);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const errors = validateRequiredText("kamar", req.body.kamar, "Kamar");
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: "Validasi kamar gagal.", errors });
    }

    const [result] = await pool.query("UPDATE rawat_inap SET kamar = ? WHERE id = ?", [
      normalizeWhitespace(req.body.kamar),
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Data rawat inap tidak ditemukan." });
    }

    res.json({ success: true, message: "Kamar berhasil diperbarui." });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const errors = validateStatus(req.body.status);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: "Validasi status gagal.", errors });
    }

    const tanggalKeluar =
      req.body.status === "Keluar"
        ? req.body.tanggal_keluar || new Date().toISOString().slice(0, 10)
        : null;

    const [result] = await pool.query(
      "UPDATE rawat_inap SET status = ?, tanggal_keluar = ? WHERE id = ?",
      [req.body.status, tanggalKeluar, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Data rawat inap tidak ditemukan." });
    }

    res.json({ success: true, message: "Status pasien berhasil diperbarui." });
  } catch (error) {
    next(error);
  }
}

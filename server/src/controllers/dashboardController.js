import { pool } from "../config/db.js";

export async function getDashboard(req, res, next) {
  try {
    const [[totalPasien]] = await pool.query("SELECT COUNT(*) AS total FROM pasien");
    const [[totalRawatInap]] = await pool.query(
      "SELECT COUNT(*) AS total FROM rawat_inap WHERE status IN ('Dirawat', 'Observasi')"
    );
    const [[totalKeluar]] = await pool.query(
      "SELECT COUNT(*) AS total FROM rawat_inap WHERE status = 'Keluar'"
    );
    const [latest] = await pool.query(
      `SELECT
        ri.id,
        p.nomor_rm,
        p.nama,
        ri.kamar,
        ri.diagnosa,
        ri.status,
        DATE_FORMAT(ri.tanggal_masuk, '%Y-%m-%d') AS tanggal_masuk,
        DATE_FORMAT(ri.updated_at, '%Y-%m-%d %H:%i') AS updated_at
      FROM rawat_inap ri
      INNER JOIN pasien p ON p.id = ri.pasien_id
      ORDER BY ri.updated_at DESC
      LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        total_pasien: totalPasien.total,
        total_rawat_inap: totalRawatInap.total,
        total_pasien_keluar: totalKeluar.total,
        terbaru: latest
      }
    });
  } catch (error) {
    next(error);
  }
}

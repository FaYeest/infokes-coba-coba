import { normalizeWhitespace } from "./string.js";

export const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];
export const STATUS_OPTIONS = ["Dirawat", "Observasi", "Keluar"];

function isValidDate(value) {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export function validatePatientPayload(payload) {
  const errors = {};
  const nama = normalizeWhitespace(payload.nama);
  const alamat = normalizeWhitespace(payload.alamat);

  if (!nama) errors.nama = "Nama pasien tidak boleh kosong.";
  if (!alamat) errors.alamat = "Alamat pasien tidak boleh kosong.";
  if (!GENDER_OPTIONS.includes(payload.jenis_kelamin)) {
    errors.jenis_kelamin = "Jenis kelamin harus Laki-laki atau Perempuan.";
  }
  if (!isValidDate(payload.tanggal_lahir)) {
    errors.tanggal_lahir = "Tanggal lahir wajib diisi dengan format tanggal yang valid.";
  }

  return errors;
}

export function validateInpatientPayload(payload) {
  const errors = {};
  const kamar = normalizeWhitespace(payload.kamar);
  const diagnosa = normalizeWhitespace(payload.diagnosa);

  if (!Number(payload.pasien_id)) errors.pasien_id = "Pasien wajib dipilih.";
  if (!isValidDate(payload.tanggal_masuk)) {
    errors.tanggal_masuk = "Tanggal masuk wajib diisi dengan format tanggal yang valid.";
  }
  if (!kamar) errors.kamar = "Kamar rawat inap tidak boleh kosong.";
  if (!diagnosa) errors.diagnosa = "Diagnosa tidak boleh kosong.";
  if (!STATUS_OPTIONS.includes(payload.status || "Dirawat")) {
    errors.status = "Status pasien tidak valid.";
  }

  return errors;
}

export function validateRequiredText(field, value, label) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return { [field]: `${label} tidak boleh kosong.` };
  }
  return {};
}

export function validateStatus(value) {
  if (!STATUS_OPTIONS.includes(value)) {
    return { status: "Status pasien tidak valid." };
  }
  return {};
}

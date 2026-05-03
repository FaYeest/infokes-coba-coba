import { pool } from "../config/db.js";

const TOTAL_ROWS = Number(process.env.COVID_SEED_TOTAL || 120000);
const BATCH_SIZE = Number(process.env.COVID_SEED_BATCH_SIZE || 1000);
const SEED_PREFIX = "RM-COV";
const SHOULD_RESET = process.argv.includes("--reset-covid");

const maleFirstNames = [
  "Ahmad",
  "Arif",
  "Bagus",
  "Bima",
  "Budi",
  "Dimas",
  "Fajar",
  "Galih",
  "Hendra",
  "Joko",
  "Naufal",
  "Raka",
  "Rizki",
  "Teguh",
  "Wahyu",
  "Yoga"
];

const femaleFirstNames = [
  "Ayu",
  "Citra",
  "Dewi",
  "Gita",
  "Indah",
  "Kartika",
  "Kirana",
  "Lestari",
  "Maya",
  "Nanda",
  "Putri",
  "Sari",
  "Sekar",
  "Utami",
  "Wulan",
  "Yuni"
];

const maleMiddleNames = [
  "Adi",
  "Cahya",
  "Erlangga",
  "Fitra",
  "Galih",
  "Mahendra",
  "Pradana",
  "Tirta",
  "Wisesa",
  "Aulia"
];

const femaleMiddleNames = [
  "Ayu",
  "Dian",
  "Intan",
  "Kirana",
  "Nirmala",
  "Rahayu",
  "Sekar",
  "Wisesa",
  "Aulia",
  "Permata"
];

const familyNames = [
  "Pratama",
  "Santoso",
  "Wijaya",
  "Saputra",
  "Permana",
  "Nugroho",
  "Kusuma",
  "Maulana",
  "Ramadhan",
  "Purnama",
  "Hidayat",
  "Setiawan",
  "Wibowo",
  "Kurniawan",
  "Gunawan",
  "Siregar",
  "Syahputra",
  "Herlambang"
];

const cities = [
  "Jakarta",
  "Bandung",
  "Bekasi",
  "Depok",
  "Tangerang",
  "Bogor",
  "Semarang",
  "Surabaya",
  "Yogyakarta",
  "Malang",
  "Medan",
  "Makassar"
];

const diagnoses = [
  "COVID-19 tanpa pneumonia",
  "COVID-19 pneumonia ringan",
  "COVID-19 pneumonia sedang",
  "COVID-19 pneumonia berat",
  "COVID-19 dengan komorbid hipertensi",
  "COVID-19 dengan komorbid diabetes melitus",
  "COVID-19 suspek, observasi gejala respirasi",
  "COVID-19 pasca-isolasi dengan keluhan sesak"
];

const wards = ["Isolasi", "ICU", "HCU", "Mawar", "Melati", "Anggrek", "Kenanga"];

function pad(value, width) {
  return String(value).padStart(width, "0");
}

function dateToStamp(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`;
}

function dateToSql(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function gender(index) {
  return index % 2 === 0 ? "Laki-laki" : "Perempuan";
}

function hashIndex(index, salt = 0) {
  let value = Math.imul(index + 1, 2654435761) ^ Math.imul(salt + 1, 1597334677);
  value ^= value >>> 16;
  value = Math.imul(value, 2246822519);
  value ^= value >>> 13;
  value = Math.imul(value, 3266489917);
  value ^= value >>> 16;
  return value >>> 0;
}

function pickFrom(list, index, salt) {
  return list[hashIndex(index, salt) % list.length];
}

function patientName(index) {
  const selectedGender = gender(index);
  const firstPool = selectedGender === "Laki-laki" ? maleFirstNames : femaleFirstNames;
  const middlePool = selectedGender === "Laki-laki" ? maleMiddleNames : femaleMiddleNames;
  const first = pickFrom(firstPool, index, 11);
  const middle = pickFrom(middlePool, index, 29);
  const last = pickFrom(familyNames, index, 53);
  return `${first} ${middle} ${last}`;
}

function birthDate(index) {
  const year = 1945 + (index % 62);
  const month = (index % 12) + 1;
  const day = (index % 27) + 1;
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`;
}

function address(index) {
  const city = cities[index % cities.length];
  return `Jl. Isolasi COVID-19 No. ${index + 1}, ${city}`;
}

function phone(index) {
  return `0899${pad(index + 1, 8)}`;
}

function admissionDate(index) {
  const start = new Date("2020-03-02T00:00:00");
  return addDays(start, Math.floor(index / 120));
}

function medicalRecordNumber(index) {
  const admittedAt = admissionDate(index);
  const sequence = (index % 120) + 1;
  return `${SEED_PREFIX}-${dateToStamp(admittedAt)}-${pad(sequence, 4)}`;
}

function inpatientStatus(index) {
  if (index % 20 === 0) return "Dirawat";
  if (index % 10 === 0) return "Observasi";
  return "Keluar";
}

function dischargeDate(index, admittedAt, status) {
  if (status !== "Keluar") return null;
  return dateToSql(addDays(admittedAt, 3 + (index % 11)));
}

function room(index) {
  const ward = wards[index % wards.length];
  const floor = 1 + (index % 5);
  const number = 1 + (index % 40);
  return `${ward}-${floor}${pad(number, 2)}`;
}

function diagnosis(index) {
  return diagnoses[index % diagnoses.length];
}

function createPatientRows(start, size) {
  const rows = [];
  for (let offset = 0; offset < size; offset += 1) {
    const index = start + offset;
    rows.push([
      medicalRecordNumber(index),
      patientName(index),
      gender(index),
      birthDate(index),
      address(index),
      phone(index)
    ]);
  }
  return rows;
}

function createInpatientRows(start, size, firstPatientId) {
  const rows = [];
  for (let offset = 0; offset < size; offset += 1) {
    const index = start + offset;
    const admittedAt = admissionDate(index);
    const status = inpatientStatus(index);
    rows.push([
      firstPatientId + offset,
      dateToSql(admittedAt),
      dischargeDate(index, admittedAt, status),
      room(index),
      diagnosis(index),
      status
    ]);
  }
  return rows;
}

async function resetCovidSeed(connection) {
  const [patientRows] = await connection.query(
    "SELECT COUNT(*) AS total FROM pasien WHERE nomor_rm LIKE ?",
    [`${SEED_PREFIX}-%`]
  );

  const total = patientRows[0]?.total || 0;
  if (total === 0) return;

  await connection.query("DELETE FROM pasien WHERE nomor_rm LIKE ?", [`${SEED_PREFIX}-%`]);
  console.log(`Deleted existing COVID-19 seed rows: ${total}`);
}

async function seedCovidData() {
  const connection = await pool.getConnection();
  const startedAt = Date.now();

  try {
    if (SHOULD_RESET) {
      await resetCovidSeed(connection);
    }

    for (let start = 0; start < TOTAL_ROWS; start += BATCH_SIZE) {
      const size = Math.min(BATCH_SIZE, TOTAL_ROWS - start);
      const patientRows = createPatientRows(start, size);

      const [patientResult] = await connection.query(
        `INSERT INTO pasien
          (nomor_rm, nama, jenis_kelamin, tanggal_lahir, alamat, no_telepon)
        VALUES ?`,
        [patientRows]
      );

      const inpatientRows = createInpatientRows(start, size, patientResult.insertId);
      await connection.query(
        `INSERT INTO rawat_inap
          (pasien_id, tanggal_masuk, tanggal_keluar, kamar, diagnosa, status)
        VALUES ?`,
        [inpatientRows]
      );

      const inserted = start + size;
      if (inserted % 10000 === 0 || inserted === TOTAL_ROWS) {
        console.log(`Inserted ${inserted.toLocaleString("id-ID")} / ${TOTAL_ROWS.toLocaleString("id-ID")} COVID-19 records`);
      }
    }

    const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`Done. Seeded ${TOTAL_ROWS.toLocaleString("id-ID")} COVID-19 patients and inpatient records in ${elapsedSeconds}s.`);
  } finally {
    connection.release();
    await pool.end();
  }
}

seedCovidData().catch(async (error) => {
  console.error("Failed to seed COVID-19 data.");
  console.error(error.message);
  await pool.end();
  process.exit(1);
});

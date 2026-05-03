export function normalizeWhitespace(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

export function sanitizePatientName(value = "") {
  return normalizeWhitespace(String(value).replace(/[^\p{L}\s]/gu, " "));
}

export function toTitleCase(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizePatientName(value = "") {
  return toTitleCase(sanitizePatientName(value));
}

export function getMedicalRecordDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function getMedicalRecordSequence(recordNumber = "") {
  const sequence = Number(String(recordNumber).split("-").at(-1));
  return Number.isFinite(sequence) ? sequence : 0;
}

export function createMedicalRecordNumber(date = new Date(), sequence = 1) {
  const dateStamp = getMedicalRecordDateStamp(date);
  const paddedSequence = String(sequence).padStart(4, "0");
  return `RM-${dateStamp}-${paddedSequence}`;
}

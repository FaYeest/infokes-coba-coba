export function normalizeWhitespace(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

export function toTitleCase(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizePatientName(value = "") {
  return toTitleCase(value);
}

export function createMedicalRecordNumber() {
  const timestamp = Date.now().toString().slice(-8);
  return `RM-${timestamp}`;
}

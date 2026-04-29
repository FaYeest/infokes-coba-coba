const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "Request gagal.");
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  dashboard: () => apiRequest("/dashboard"),
  patients: (search = "") =>
    apiRequest(`/pasien${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createPatient: (data) => apiRequest("/pasien", { method: "POST", body: JSON.stringify(data) }),
  updatePatient: (id, data) =>
    apiRequest(`/pasien/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePatient: (id) => apiRequest(`/pasien/${id}`, { method: "DELETE" }),
  inpatients: () => apiRequest("/rawat-inap"),
  createInpatient: (data) =>
    apiRequest("/rawat-inap", { method: "POST", body: JSON.stringify(data) }),
  patchDiagnosis: (id, diagnosa) =>
    apiRequest(`/rawat-inap/${id}/diagnosa`, {
      method: "PATCH",
      body: JSON.stringify({ diagnosa })
    }),
  patchRoom: (id, kamar) =>
    apiRequest(`/rawat-inap/${id}/kamar`, {
      method: "PATCH",
      body: JSON.stringify({ kamar })
    }),
  patchStatus: (id, status, tanggal_keluar) =>
    apiRequest(`/rawat-inap/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, tanggal_keluar })
    })
};

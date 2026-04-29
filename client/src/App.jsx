import {
  Activity,
  BedDouble,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Home,
  Menu,
  PanelLeftClose,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./lib/api";

const STATUS_OPTIONS = ["Dirawat", "Observasi", "Keluar"];
const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pasien", label: "Data Pasien", icon: UsersRound },
  { id: "rawat", label: "Rawat Inap", icon: BedDouble }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextRecordNumber() {
  return `RM-${Date.now().toString().slice(-6)}`;
}

function normalizeWhitespace(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

function titleCase(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusTone(status) {
  if (status === "Keluar") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "Observasi") return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  return "border-notion-green/35 bg-notion-green/12 text-notion-green";
}

function genderTone(gender) {
  return gender === "Perempuan"
    ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
    : "border-blue-400/30 bg-blue-400/10 text-blue-100";
}

function getErrorMessage(error) {
  return error?.message || "Aksi gagal diproses.";
}

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [patients, setPatients] = useState([]);
  const [inpatients, setInpatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [patientModal, setPatientModal] = useState({ open: false, mode: "create", record: null });
  const [inpatientModal, setInpatientModal] = useState({ open: false });
  const [patchModal, setPatchModal] = useState({ open: false, type: null, row: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(window.__infokesToast);
    window.__infokesToast = window.setTimeout(() => setToast(null), 3600);
  }, []);

  const refreshAll = useCallback(
    async (search = patientSearch) => {
      setLoading(true);
      setError("");
      try {
        const [dashboardResult, patientResult, inpatientResult] = await Promise.all([
          api.dashboard(),
          api.patients(search),
          api.inpatients()
        ]);
        setDashboard(dashboardResult.data);
        setPatients(patientResult.data);
        setInpatients(inpatientResult.data);
      } catch (err) {
        setError(
          "Tidak bisa memuat data. Pastikan backend aktif, MySQL berjalan, dan database sudah di-import."
        );
      } finally {
        setLoading(false);
      }
    },
    [patientSearch]
  );

  const loadPatients = useCallback(async (search) => {
    try {
      const patientResult = await api.patients(search);
      setPatients(patientResult.data);
    } catch (err) {
      setError("Pencarian gagal. Periksa koneksi API dan database.");
    }
  }, []);

  useEffect(() => {
    refreshAll("");
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadPatients(patientSearch);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [patientSearch, loadPatients]);

  async function handleSavePatient(formData) {
    setBusy(true);
    try {
      if (patientModal.mode === "edit") {
        await api.updatePatient(patientModal.record.id, formData);
        showToast("Data pasien diperbarui.");
      } else {
        await api.createPatient(formData);
        showToast("Pasien baru ditambahkan.");
      }
      setPatientModal({ open: false, mode: "create", record: null });
      await refreshAll(patientSearch);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveInpatient(formData) {
    setBusy(true);
    try {
      await api.createInpatient(formData);
      showToast("Data rawat inap ditambahkan.");
      setInpatientModal({ open: false });
      await refreshAll(patientSearch);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handlePatchSubmit(payload) {
    setBusy(true);
    try {
      if (patchModal.type === "diagnosa") {
        await api.patchDiagnosis(patchModal.row.id, payload.value);
      }
      if (patchModal.type === "kamar") {
        await api.patchRoom(patchModal.row.id, payload.value);
      }
      if (patchModal.type === "status") {
        await api.patchStatus(patchModal.row.id, payload.value, payload.tanggal_keluar);
      }
      showToast("Data rawat inap diperbarui.");
      setPatchModal({ open: false, type: null, row: null });
      await refreshAll(patientSearch);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePatient() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.deletePatient(deleteTarget.id);
      showToast("Pasien berhasil dihapus.");
      setDeleteTarget(null);
      await refreshAll(patientSearch);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  const currentTitle = useMemo(
    () => navigation.find((item) => item.id === activeView)?.label || "Dashboard",
    [activeView]
  );

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950/82 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-notion-green/55 hover:bg-notion-green/12 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                title="Buka navigasi"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-normal text-notion-green">
                  Sistem Rawat Inap
                </p>
                <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">
                  {currentTitle}
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refreshAll(patientSearch)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300/40 hover:bg-sky-400/10 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Sinkron
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {error ? <ErrorBanner message={error} onClose={() => setError("")} /> : null}
          {loading ? (
            <LoadingState />
          ) : (
            <>
              {activeView === "dashboard" ? (
                <DashboardView
                  dashboard={dashboard}
                  patients={patients}
                  inpatients={inpatients}
                  onGoPatients={() => setActiveView("pasien")}
                  onGoInpatients={() => setActiveView("rawat")}
                />
              ) : null}
              {activeView === "pasien" ? (
                <PatientsView
                  patients={patients}
                  search={patientSearch}
                  onSearch={setPatientSearch}
                  onAdd={() =>
                    setPatientModal({ open: true, mode: "create", record: null })
                  }
                  onEdit={(record) => setPatientModal({ open: true, mode: "edit", record })}
                  onDelete={(record) => setDeleteTarget(record)}
                />
              ) : null}
              {activeView === "rawat" ? (
                <InpatientsView
                  inpatients={inpatients}
                  onAdd={() => setInpatientModal({ open: true })}
                  onPatch={(type, row) => setPatchModal({ open: true, type, row })}
                />
              ) : null}
            </>
          )}
        </main>
      </div>

      <PatientModal
        state={patientModal}
        busy={busy}
        onClose={() => setPatientModal({ open: false, mode: "create", record: null })}
        onSubmit={handleSavePatient}
      />
      <InpatientModal
        open={inpatientModal.open}
        patients={patients}
        busy={busy}
        onClose={() => setInpatientModal({ open: false })}
        onSubmit={handleSaveInpatient}
      />
      <PatchModal
        state={patchModal}
        busy={busy}
        onClose={() => setPatchModal({ open: false, type: null, row: null })}
        onSubmit={handlePatchSubmit}
      />
      <ConfirmDeleteModal
        patient={deleteTarget}
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePatient}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function Sidebar({ activeView, onNavigate, open, onClose }) {
  return (
    <>
      <div
        className={classNames(
          "fixed inset-0 z-40 bg-black/60 transition lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink-950/95 p-4 shadow-panel backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-notion-green/25 bg-notion-green/14">
              <Stethoscope className="h-5 w-5 text-notion-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">SIMRS</p>
              <p className="text-xs text-slate-400">Rawat Inap</p>
            </div>
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 lg:hidden"
            onClick={onClose}
            title="Tutup navigasi"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={classNames(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition active:scale-[0.99]",
                  active
                    ? "border border-notion-green/28 bg-notion-green/16 text-white"
                    : "text-slate-300 hover:bg-white/7 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto" />
      </aside>
    </>
  );
}

function DashboardView({ dashboard, patients, inpatients, onGoPatients, onGoInpatients }) {
  const latest = dashboard?.terbaru || [];
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={UsersRound}
          label="Total Pasien"
          value={dashboard?.total_pasien || patients.length || 0}
          tone="green"
        />
        <StatCard
          icon={BedDouble}
          label="Rawat Inap Aktif"
          value={dashboard?.total_rawat_inap || 0}
          tone="sky"
        />
        <StatCard
          icon={CheckCircle2}
          label="Pasien Keluar"
          value={dashboard?.total_pasien_keluar || 0}
          tone="emerald"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="glass-panel rounded-lg p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">Ringkasan Terbaru</h2>
              <p className="text-sm text-slate-400">Update rawat inap terakhir</p>
            </div>
            <button
              type="button"
              onClick={onGoInpatients}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:border-notion-green/45 hover:bg-notion-green/12"
            >
              <ClipboardList className="h-4 w-4" />
              Lihat Rawat Inap
            </button>
          </div>

          <div className="space-y-3">
            {latest.length ? (
              latest.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-notion-green/30 hover:bg-white/[0.06] sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-white">{row.nama}</h3>
                      <span className="text-xs text-slate-500">{row.nomor_rm}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{row.diagnosa}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Kamar {row.kamar} · Masuk {row.tanggal_masuk}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
              ))
            ) : (
              <EmptyState title="Belum ada rawat inap" actionLabel="Tambah data" onAction={onGoInpatients} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* <StringPreview /> */}
          <div className="glass-panel rounded-lg p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-400/10 text-sky-200">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Search</h2>
                <p className="text-sm text-slate-400">{patients.length} data dalam daftar pasien</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoPatients}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300/40 hover:bg-sky-400/10 active:scale-[0.99]"
            >
              <UserRound className="h-4 w-4" />
              Buka Data Pasien
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const toneMap = {
    green: "bg-notion-green/14 text-notion-green",
    sky: "bg-sky-400/12 text-sky-200",
    emerald: "bg-emerald-400/12 text-emerald-200"
  };
  return (
    <div className="glass-panel rounded-lg p-5 transition hover:border-notion-green/30">
      <div className="mb-4 flex items-center justify-between">
        <div className={classNames("grid h-11 w-11 place-items-center rounded-lg", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <Activity className="h-4 w-4 text-slate-500" />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PatientsView({ patients, search, onSearch, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="field h-11 pl-10 pr-4"
            placeholder="Cari nama atau nomor RM"
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-notion-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-notion-green/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Pasien
        </button>
      </div>

      <div className="glass-panel overflow-hidden rounded-lg">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.035] text-xs uppercase tracking-normal text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">Nomor RM</th>
                <th className="px-5 py-4 font-medium">Nama</th>
                <th className="px-5 py-4 font-medium">Jenis Kelamin</th>
                <th className="px-5 py-4 font-medium">Tanggal Lahir</th>
                <th className="px-5 py-4 font-medium">Alamat</th>
                <th className="px-5 py-4 font-medium">Kontak</th>
                <th className="px-5 py-4 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {patients.length ? (
                patients.map((patient) => (
                  <tr key={patient.id} className="transition hover:bg-white/[0.035]">
                    <td className="px-5 py-4 font-medium text-notion-green">{patient.nomor_rm}</td>
                    <td className="px-5 py-4 font-semibold text-white">{patient.nama}</td>
                    <td className="px-5 py-4">
                      <span
                        className={classNames(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs",
                          genderTone(patient.jenis_kelamin)
                        )}
                      >
                        {patient.jenis_kelamin}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{patient.tanggal_lahir}</td>
                    <td className="max-w-[260px] truncate px-5 py-4 text-slate-300">{patient.alamat}</td>
                    <td className="px-5 py-4 text-slate-300">{patient.no_telepon || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(patient)}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-sky-300/40 hover:bg-sky-400/10"
                          title="Edit pasien"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(patient)}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-rose-300/40 hover:bg-rose-400/10 hover:text-rose-100"
                          title="Hapus pasien"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-12" colSpan={7}>
                    <EmptyState title="Data pasien belum ditemukan" actionLabel="Tambah pasien" onAction={onAdd} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InpatientsView({ inpatients, onAdd, onPatch }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-notion-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-notion-green/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Tambah Rawat Inap
        </button>
      </div>

      <div className="glass-panel overflow-hidden rounded-lg">
        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.035] text-xs uppercase tracking-normal text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">Pasien</th>
                <th className="px-5 py-4 font-medium">Masuk</th>
                <th className="px-5 py-4 font-medium">Keluar</th>
                <th className="px-5 py-4 font-medium">Kamar</th>
                <th className="px-5 py-4 font-medium">Diagnosa</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {inpatients.length ? (
                inpatients.map((row) => (
                  <tr key={row.id} className="transition hover:bg-white/[0.035]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{row.nama}</p>
                      <p className="text-xs text-slate-500">{row.nomor_rm}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{row.tanggal_masuk}</td>
                    <td className="px-5 py-4 text-slate-300">{row.tanggal_keluar || "-"}</td>
                    <td className="px-5 py-4 text-slate-100">{row.kamar}</td>
                    <td className="max-w-[280px] px-5 py-4 text-slate-300">{row.diagnosa}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onPatch("diagnosa", row)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-notion-green/45 hover:bg-notion-green/12"
                        >
                          Diagnosa
                        </button>
                        <button
                          type="button"
                          onClick={() => onPatch("kamar", row)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-sky-300/40 hover:bg-sky-400/10"
                        >
                          Kamar
                        </button>
                        <button
                          type="button"
                          onClick={() => onPatch("status", row)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-emerald-300/40 hover:bg-emerald-400/10"
                        >
                          Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-12" colSpan={7}>
                    <EmptyState title="Data rawat inap belum ada" actionLabel="Tambah rawat inap" onAction={onAdd} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// function StringPreview() {
//   const rawName = "  budi   santoso  ";
//   return (
//     <div className="glass-panel rounded-lg p-5">
//       <div className="mb-4 flex items-center gap-3">
//         <div className="grid h-10 w-10 place-items-center rounded-lg bg-notion-green/14 text-notion-green">
//           <Sparkles className="h-4 w-4" />
//         </div>
//         <div>
//           <h2 className="text-lg font-semibold text-white">Manipulasi String</h2>
//           <p className="text-sm text-slate-400">Trim, rapikan spasi, Title Case</p>
//         </div>
//       </div>
//       <div className="grid gap-3">
//         <PreviewRow label="Input mentah" value={`"${rawName}"`} />
//         <PreviewRow label="Hasil" value={`"${titleCase(rawName)}"`} strong />
//       </div>
//     </div>
//   );
// }

function PreviewRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={classNames("text-sm", strong ? "font-semibold text-notion-text" : "text-slate-300")}>
        {value}
      </span>
    </div>
  );
}

function PatientModal({ state, busy, onClose, onSubmit }) {
  if (!state.open) return null;
  return (
    <Modal title={state.mode === "edit" ? "Edit Pasien" : "Tambah Pasien"} onClose={onClose}>
      <PatientForm record={state.record} mode={state.mode} busy={busy} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}

function PatientForm({ record, mode, busy, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    nomor_rm: record?.nomor_rm || nextRecordNumber(),
    nama: record?.nama || "",
    jenis_kelamin: record?.jenis_kelamin || "Laki-laki",
    tanggal_lahir: record?.tanggal_lahir || "",
    alamat: record?.alamat || "",
    no_telepon: record?.no_telepon || ""
  }));
  const [errors, setErrors] = useState({});
  const preview = titleCase(form.nama);

  function validate() {
    const nextErrors = {};
    if (!normalizeWhitespace(form.nama)) nextErrors.nama = "Nama pasien tidak boleh kosong.";
    if (!form.tanggal_lahir) nextErrors.tanggal_lahir = "Tanggal lahir wajib diisi.";
    if (!normalizeWhitespace(form.alamat)) nextErrors.alamat = "Alamat pasien tidak boleh kosong.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch (err) {
      setErrors(err?.payload?.errors || {});
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomor RM" error={errors.nomor_rm}>
          <input
            className="field h-11 px-3"
            value={form.nomor_rm}
            onChange={(event) => setForm({ ...form, nomor_rm: event.target.value })}
            placeholder="RM-000001"
          />
        </Field>
        <Field label="Jenis Kelamin" error={errors.jenis_kelamin}>
          <select
            className="field h-11 px-3"
            value={form.jenis_kelamin}
            onChange={(event) => setForm({ ...form, jenis_kelamin: event.target.value })}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Nama Pasien" error={errors.nama}>
        <input
          className="field h-11 px-3"
          value={form.nama}
          onChange={(event) => setForm({ ...form, nama: event.target.value })}
          placeholder="Contoh:   budi   santoso"
          required
        />
      </Field>

      <div className="rounded-lg border border-notion-green/24 bg-notion-green/10 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400">Preview nama</span>
          <span className="font-semibold text-notion-text">{preview || "-"}</span>
        </div>
      </div>

      <Field label="Tanggal Lahir" error={errors.tanggal_lahir}>
        <input
          className="field h-11 px-3"
          type="date"
          value={form.tanggal_lahir}
          onChange={(event) => setForm({ ...form, tanggal_lahir: event.target.value })}
          required
        />
      </Field>

      <Field label="Alamat" error={errors.alamat}>
        <textarea
          className="field min-h-24 px-3 py-3"
          value={form.alamat}
          onChange={(event) => setForm({ ...form, alamat: event.target.value })}
          placeholder="Alamat lengkap"
          required
        />
      </Field>

      <Field label="No. Telepon" error={errors.no_telepon}>
        <input
          className="field h-11 px-3"
          value={form.no_telepon}
          onChange={(event) => setForm({ ...form, no_telepon: event.target.value })}
          placeholder="08xxxxxxxxxx"
        />
      </Field>

      <FormActions busy={busy} onCancel={onCancel} submitLabel={mode === "edit" ? "Update" : "Simpan"} />
    </form>
  );
}

function InpatientModal({ open, patients, busy, onClose, onSubmit }) {
  if (!open) return null;
  return (
    <Modal title="Tambah Rawat Inap" onClose={onClose}>
      <InpatientForm patients={patients} busy={busy} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}

function InpatientForm({ patients, busy, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    pasien_id: patients[0]?.id || "",
    tanggal_masuk: today(),
    tanggal_keluar: "",
    kamar: "",
    diagnosa: "",
    status: "Dirawat"
  });
  const [errors, setErrors] = useState({});

  function validate() {
    const nextErrors = {};
    if (!form.pasien_id) nextErrors.pasien_id = "Pasien wajib dipilih.";
    if (!form.tanggal_masuk) nextErrors.tanggal_masuk = "Tanggal masuk wajib diisi.";
    if (!normalizeWhitespace(form.kamar)) nextErrors.kamar = "Kamar tidak boleh kosong.";
    if (!normalizeWhitespace(form.diagnosa)) nextErrors.diagnosa = "Diagnosa tidak boleh kosong.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch (err) {
      setErrors(err?.payload?.errors || {});
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Pasien" error={errors.pasien_id}>
        <select
          className="field h-11 px-3"
          value={form.pasien_id}
          onChange={(event) => setForm({ ...form, pasien_id: event.target.value })}
          required
        >
          {patients.length ? null : <option value="">Belum ada pasien</option>}
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.nomor_rm} - {patient.nama}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal Masuk" error={errors.tanggal_masuk}>
          <input
            className="field h-11 px-3"
            type="date"
            value={form.tanggal_masuk}
            onChange={(event) => setForm({ ...form, tanggal_masuk: event.target.value })}
            required
          />
        </Field>
        <Field label="Tanggal Keluar" error={errors.tanggal_keluar}>
          <input
            className="field h-11 px-3"
            type="date"
            value={form.tanggal_keluar}
            onChange={(event) => setForm({ ...form, tanggal_keluar: event.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kamar" error={errors.kamar}>
          <input
            className="field h-11 px-3"
            value={form.kamar}
            onChange={(event) => setForm({ ...form, kamar: event.target.value })}
            placeholder="Mawar-201"
            required
          />
        </Field>
        <Field label="Status" error={errors.status}>
          <select
            className="field h-11 px-3"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Diagnosa" error={errors.diagnosa}>
        <textarea
          className="field min-h-24 px-3 py-3"
          value={form.diagnosa}
          onChange={(event) => setForm({ ...form, diagnosa: event.target.value })}
          placeholder="Contoh: Demam tifoid"
          required
        />
      </Field>

      <FormActions busy={busy} onCancel={onCancel} submitLabel="Simpan" disabled={!patients.length} />
    </form>
  );
}

function PatchModal({ state, busy, onClose, onSubmit }) {
  if (!state.open || !state.row) return null;
  const config = {
    diagnosa: { title: "Update Diagnosa", label: "Diagnosa", initial: state.row.diagnosa },
    kamar: { title: "Update Kamar", label: "Kamar", initial: state.row.kamar },
    status: { title: "Update Status", label: "Status", initial: state.row.status }
  }[state.type];

  return (
    <Modal title={config.title} onClose={onClose}>
      <PatchForm type={state.type} config={config} row={state.row} busy={busy} onCancel={onClose} onSubmit={onSubmit} />
    </Modal>
  );
}

function PatchForm({ type, config, row, busy, onCancel, onSubmit }) {
  const [value, setValue] = useState(config.initial || "");
  const [tanggalKeluar, setTanggalKeluar] = useState(row.tanggal_keluar || today());
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!normalizeWhitespace(value)) {
      setError(`${config.label} tidak boleh kosong.`);
      return;
    }
    try {
      await onSubmit({ value, tanggal_keluar: tanggalKeluar });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
        <span className="font-semibold text-white">{row.nama}</span> · {row.nomor_rm}
      </div>
      <Field label={config.label} error={error}>
        {type === "status" ? (
          <select className="field h-11 px-3" value={value} onChange={(event) => setValue(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            className="field min-h-24 px-3 py-3"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        )}
      </Field>
      {type === "status" && value === "Keluar" ? (
        <Field label="Tanggal Keluar">
          <input
            className="field h-11 px-3"
            type="date"
            value={tanggalKeluar}
            onChange={(event) => setTanggalKeluar(event.target.value)}
          />
        </Field>
      ) : null}
      <FormActions busy={busy} onCancel={onCancel} submitLabel="Update" />
    </form>
  );
}

function ConfirmDeleteModal({ patient, busy, onClose, onConfirm }) {
  if (!patient) return null;
  return (
    <Modal title="Hapus Pasien" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-300">
          Data <span className="font-semibold text-white">{patient.nama}</span> akan dihapus bersama
          riwayat rawat inapnya.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-rose-200">{error}</span> : null}
    </label>
  );
}

function FormActions({ busy, onCancel, submitLabel, disabled }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={busy || disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-notion-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-notion-green/90 disabled:opacity-60"
      >
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {submitLabel}
      </button>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="glass-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-ink-950/94 px-5 py-4 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
            title="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={classNames(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none self-start justify-self-start sm:justify-self-end",
        statusTone(status)
      )}
    >
      {status}
    </span>
  );
}

function EmptyState({ title, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/14 bg-white/[0.025] px-4 py-8 text-center">
      <ClipboardList className="mb-3 h-8 w-8 text-slate-500" />
      <p className="font-semibold text-white">{title}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-notion-green/45 hover:bg-notion-green/12"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function ErrorBanner({ message, onClose }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
      <p>{message}</p>
      <button type="button" onClick={onClose} className="text-rose-100" title="Tutup pesan">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid min-h-[52vh] place-items-center">
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
        <RefreshCw className="h-4 w-4 animate-spin text-notion-green" />
        Memuat data
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className="fixed bottom-5 right-5 z-[80] max-w-sm">
      <div
        className={classNames(
          "flex items-start gap-3 rounded-lg border p-4 shadow-panel backdrop-blur-xl",
          isError
            ? "border-rose-300/24 bg-rose-950/88 text-rose-50"
            : "border-emerald-300/24 bg-emerald-950/88 text-emerald-50"
        )}
      >
        {isError ? <X className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
        <p className="text-sm">{toast.message}</p>
        <button type="button" onClick={onClose} className="ml-2" title="Tutup notifikasi">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

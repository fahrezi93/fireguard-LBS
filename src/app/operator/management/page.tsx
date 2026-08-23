"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FaTags, FaArrowLeft, FaLayerGroup, FaMapMarkerAlt,
  FaFireExtinguisher, FaPlus, FaEdit, FaTrash, FaTimes,
  FaSave, FaExclamationTriangle, FaSpinner, FaUserShield, FaHistory
} from "react-icons/fa";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import OperatorLayout from "@/components/OperatorLayout";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string | null;
}

interface Kelurahan {
  id: number;
  name: string;
  kecamatan: string;
  kota: string;
}

interface PosPemadam {
  id: number;
  name: string;
  kelurahan_id: number | null;
  address: string | null;
  latitude: number;
  longitude: number;
  contact_phone: string | null;
  status: "aktif" | "nonaktif";
}

type ActiveTab = "kategori" | "kelurahan" | "pos" | "petugas";

interface Petugas {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  is_verified: number;
  created_at: string;
}

const blankPetugas = () => ({
  name: "", email: "", phone_number: "", password: "",
});

// ─── Blank form helpers ───────────────────────────────────────────────────────

const blankCategory = (): Omit<Category, "id"> => ({
  name: "", icon: "🔥", color: "#ef4444", description: "",
});
const blankKelurahan = (): Omit<Kelurahan, "id"> => ({
  name: "", kecamatan: "Plaju", kota: "Palembang",
});
const blankPos = (): Omit<PosPemadam, "id"> => ({
  name: "", address: "", latitude: -2.9833, longitude: 104.7527,
  contact_phone: "", status: "aktif", kelurahan_id: null,
});

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 shrink-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FaTimes className="text-sm" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteModal({ itemName, onConfirm, onClose, loading }: {
  itemName: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <Modal title="Konfirmasi Hapus" onClose={onClose}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <FaExclamationTriangle className="text-red-500 text-2xl" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Hapus &ldquo;{itemName}&rdquo;?</p>
          <p className="text-sm text-gray-500 mt-1">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
            Hapus
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-colors";

// ─── Category Modal ───────────────────────────────────────────────────────────

function CategoryModal({ initial, onClose, onSaved }: {
  initial?: Category; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<Omit<Category, "id">>(
    initial
      ? { name: initial.name, icon: initial.icon, color: initial.color, description: initial.description ?? "" }
      : blankCategory()
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.icon.trim() || !form.color.trim()) {
      setErr("Nama, ikon, dan warna wajib diisi."); return;
    }
    setLoading(true); setErr("");
    try {
      const res = await fetch(
        isEdit ? `/api/operator/categories/${initial!.id}` : "/api/operator/categories",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      const json = await res.json();
      if (!res.ok) { setErr(json.message ?? "Terjadi kesalahan"); return; }
      onSaved();
    } finally { setLoading(false); }
  };

  return (
    <Modal title={isEdit ? "Edit Kategori" : "Tambah Kategori"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {err && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{err}</div>}
        <Field label="Nama Kategori" required>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Kebakaran gedung" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ikon (Emoji)" required>
            <input className={inputCls} value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="🔥" maxLength={4} />
          </Field>
          <Field label="Warna" required>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
              <input className={`${inputCls} flex-1`} value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="#ef4444" />
            </div>
          </Field>
        </div>
        <Field label="Deskripsi">
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)} placeholder="Deskripsi singkat (opsional)" />
        </Field>
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-2xl" style={{ color: form.color }}>{form.icon || "?"}</span>
          <span className="text-sm font-bold text-gray-700">{form.name || "Nama kategori"}</span>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-red-500 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Kelurahan Modal ──────────────────────────────────────────────────────────

function KelurahanModal({ initial, onClose, onSaved }: {
  initial?: Kelurahan; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<Omit<Kelurahan, "id">>(
    initial ? { name: initial.name, kecamatan: initial.kecamatan, kota: initial.kota } : blankKelurahan()
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Nama kelurahan wajib diisi."); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch(
        isEdit ? `/api/operator/kelurahan/${initial!.id}` : "/api/operator/kelurahan",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      const json = await res.json();
      if (!res.ok) { setErr(json.message ?? "Terjadi kesalahan"); return; }
      onSaved();
    } finally { setLoading(false); }
  };

  return (
    <Modal title={isEdit ? "Edit Kelurahan" : "Tambah Kelurahan"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {err && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{err}</div>}
        <Field label="Nama Kelurahan" required>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Plaju Ulu" />
        </Field>
        <Field label="Kecamatan">
          <input className={inputCls} value={form.kecamatan} onChange={(e) => set("kecamatan", e.target.value)} placeholder="Plaju" />
        </Field>
        <Field label="Kota">
          <input className={inputCls} value={form.kota} onChange={(e) => set("kota", e.target.value)} placeholder="Palembang" />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-red-500 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {isEdit ? "Simpan Perubahan" : "Tambah Kelurahan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Pos Pemadam Modal ────────────────────────────────────────────────────────

function PosPemadamModal({ initial, onClose, onSaved }: {
  initial?: PosPemadam; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<Omit<PosPemadam, "id">>(
    initial
      ? { name: initial.name, address: initial.address ?? "", latitude: initial.latitude,
          longitude: initial.longitude, contact_phone: initial.contact_phone ?? "",
          status: initial.status, kelurahan_id: initial.kelurahan_id }
      : blankPos()
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Nama pos wajib diisi."); return; }
    if (!form.latitude || !form.longitude) { setErr("Latitude dan longitude wajib diisi."); return; }
    setLoading(true); setErr("");
    try {
      const res = await fetch(
        isEdit ? `/api/operator/fire-stations/${initial!.id}` : "/api/operator/fire-stations",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      const json = await res.json();
      if (!res.ok) { setErr(json.message ?? "Terjadi kesalahan"); return; }
      onSaved();
    } finally { setLoading(false); }
  };

  return (
    <Modal title={isEdit ? "Edit Pos Pemadam" : "Tambah Pos Pemadam"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {err && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">{err}</div>}
        <Field label="Nama Pos" required>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Pos Pemadam Kebakaran Plaju" />
        </Field>
        <Field label="Alamat">
          <input className={inputCls} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Jl. Merdeka No. 1" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude" required>
            <input type="number" step="any" className={inputCls} value={form.latitude}
              onChange={(e) => set("latitude", parseFloat(e.target.value) || 0)} placeholder="-2.9833" />
          </Field>
          <Field label="Longitude" required>
            <input type="number" step="any" className={inputCls} value={form.longitude}
              onChange={(e) => set("longitude", parseFloat(e.target.value) || 0)} placeholder="104.7527" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nomor Kontak">
            <input className={inputCls} value={form.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} placeholder="0711-xxxxxx" />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value as "aktif" | "nonaktif")}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-red-500 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {isEdit ? "Simpan Perubahan" : "Tambah Pos"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2 transition-opacity">
      <button onClick={onEdit} title="Edit"
        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <FaEdit />
      </button>
      <button onClick={onDelete} title="Hapus"
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <FaTrash />
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-12 text-center">
      <p className="text-gray-400 text-sm font-medium">Belum ada {label}</p>
      <p className="text-gray-300 text-xs mt-1">Klik &ldquo;Tambah Baru&rdquo; untuk menambahkan data.</p>
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: i === 0 ? "2rem" : "80%" }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ManagementPage() {
  const router = useRouter();
  const { toast, success, error, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>("kategori");

  // Per-resource loading flags so switching tabs is instant
  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingKel, setLoadingKel] = useState(true);
  const [loadingPos, setLoadingPos] = useState(true);
  const [loadingPet, setLoadingPet] = useState(true);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [kelurahans, setKelurahans] = useState<Kelurahan[]>([]);
  const [posPemadam, setPosPemadam] = useState<PosPemadam[]>([]);
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);

  // Track which datasets have been fetched at least once
  const fetchedRef = useRef({ kategori: false, kelurahan: false, pos: false, petugas: false });

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>();
  const [editKelurahan, setEditKelurahan] = useState<Kelurahan | undefined>();
  const [editPos, setEditPos] = useState<PosPemadam | undefined>();
  const [editPetugas, setEditPetugas] = useState<any>();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; type: ActiveTab } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch functions — each independent so they run in parallel ───────────

  const fetchCategories = useCallback(async (silent = false) => {
    if (!silent) setLoadingCat(true);
    try {
      const res = await fetch("/api/operator/categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(Array.isArray(json) ? json : (json.data ?? []));
        fetchedRef.current.kategori = true;
      } else {
        error("Gagal memuat data kategori");
      }
    } catch {
      error("Gagal memuat data kategori");
    } finally {
      setLoadingCat(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchKelurahan = useCallback(async (silent = false) => {
    if (!silent) setLoadingKel(true);
    try {
      const res = await fetch("/api/operator/kelurahan");
      if (res.ok) {
        const json = await res.json();
        setKelurahans(Array.isArray(json) ? json : (json.data ?? []));
        fetchedRef.current.kelurahan = true;
      } else {
        error("Gagal memuat data kelurahan");
      }
    } catch {
      error("Gagal memuat data kelurahan");
    } finally {
      setLoadingKel(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPos = useCallback(async (silent = false) => {
    if (!silent) setLoadingPos(true);
    try {
      const res = await fetch("/api/operator/fire-stations");
      if (res.ok) {
        const json = await res.json();
        setPosPemadam(Array.isArray(json) ? json : (json.data ?? []));
        fetchedRef.current.pos = true;
      } else {
        error("Gagal memuat data pos pemadam");
      }
    } catch {
      error("Gagal memuat data pos pemadam");
    } finally {
      setLoadingPos(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPetugas = useCallback(async (silent = false) => {
    if (!silent) setLoadingPet(true);
    try {
      const res = await fetch("/api/operator/users/petugas");
      if (res.ok) {
        const json = await res.json();
        setPetugasList(Array.isArray(json) ? json : (json.data ?? []));
        fetchedRef.current.petugas = true;
      } else {
        error("Gagal memuat data petugas");
      }
    } catch {
      error("Gagal memuat data petugas");
    } finally {
      setLoadingPet(false);
    }
  }, [error]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/operator/users/petugas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPetugas),
      });
      const json = await res.json();
      if (res.ok) {
        handleSaved("Akun petugas berhasil dibuat");
      } else {
        error(json.message || "Gagal membuat akun");
      }
    } catch {
      error("Terjadi kesalahan jaringan");
    }
  };

  // On mount: fire all 3 requests in parallel
  useEffect(() => {
    Promise.all([fetchCategories(), fetchKelurahan(), fetchPos(), fetchPetugas()]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────

  const refetchActive = useCallback(() => {
    if (activeTab === "kategori") fetchCategories();
    else if (activeTab === "kelurahan") fetchKelurahan();
    else if (activeTab === "pos") fetchPos();
    else if (activeTab === "petugas") fetchPetugas();
  }, [activeTab, fetchCategories, fetchKelurahan, fetchPos, fetchPetugas]);

  const handleSaved = (msg: string) => {
    success(msg);
    setShowAdd(false);
    setEditCategory(undefined);
    setEditKelurahan(undefined);
    setEditPos(undefined);
    refetchActive();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const urlMap: Record<ActiveTab, string> = {
        kategori: `/api/operator/categories/${deleteTarget.id}`,
        kelurahan: `/api/operator/kelurahan/${deleteTarget.id}`,
        pos: `/api/operator/fire-stations/${deleteTarget.id}`,
        petugas: `/api/operator/users/petugas/${deleteTarget.id}`,
      };
      const res = await fetch(urlMap[deleteTarget.type], { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        success(json.message ?? "Berhasil dihapus");
        setDeleteTarget(null);
        refetchActive();
      } else {
        error(json.message ?? "Gagal menghapus");
      }
    } catch {
      error("Terjadi kesalahan jaringan");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Derived loading state for active tab ─────────────────────────────────

  const isLoading =
    activeTab === "kategori" ? loadingCat :
    activeTab === "kelurahan" ? loadingKel :
    loadingPos;

  const skeletonCols =
    activeTab === "kategori" ? 5 :
    activeTab === "kelurahan" ? 5 :
    6;

  const tabLabel: Record<ActiveTab, string> = {
    kategori: "Kategori Darurat",
    kelurahan: "Area Kelurahan",
    pos: "Pos Pemadam",
    petugas: "Akun Petugas",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {toast.show && <Toast {...toast} onClose={hideToast} />}

      {/* ── Modals ── */}
            {showAdd && activeTab === "petugas" && (
        <Modal title="Tambah Akun Petugas" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
              <input required type="text" value={editPetugas?.name || ""} onChange={(e) => setEditPetugas({ ...editPetugas, name: e.target.value })}
                className={inputCls}
                placeholder="Misal: Budi Santoso" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input required type="email" value={editPetugas?.email || ""} onChange={(e) => setEditPetugas({ ...editPetugas, email: e.target.value })}
                className={inputCls}
                placeholder="budi@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No WhatsApp</label>
              <input required type="text" value={editPetugas?.phone_number || ""} onChange={(e) => setEditPetugas({ ...editPetugas, phone_number: e.target.value })}
                className={inputCls}
                placeholder="Misal: 08123456789" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password Sementara</label>
              <input required type="text" value={editPetugas?.password || ""} onChange={(e) => setEditPetugas({ ...editPetugas, password: e.target.value })}
                className={inputCls}
                placeholder="Minimal 6 karakter" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-900/20 transition-all flex items-center justify-center gap-2 mt-4">
              <FaSave /> Simpan
            </button>
          </form>
        </Modal>
      )}
      {showAdd && activeTab === "kategori" && (
        <CategoryModal onClose={() => setShowAdd(false)} onSaved={() => handleSaved("Kategori berhasil ditambahkan")} />
      )}
      {showAdd && activeTab === "kelurahan" && (
        <KelurahanModal onClose={() => setShowAdd(false)} onSaved={() => handleSaved("Kelurahan berhasil ditambahkan")} />
      )}
      {showAdd && activeTab === "pos" && (
        <PosPemadamModal onClose={() => setShowAdd(false)} onSaved={() => handleSaved("Pos pemadam berhasil ditambahkan")} />
      )}
      {editCategory && (
        <CategoryModal initial={editCategory} onClose={() => setEditCategory(undefined)} onSaved={() => handleSaved("Kategori berhasil diperbarui")} />
      )}
      {editKelurahan && (
        <KelurahanModal initial={editKelurahan} onClose={() => setEditKelurahan(undefined)} onSaved={() => handleSaved("Kelurahan berhasil diperbarui")} />
      )}
      {editPos && (
        <PosPemadamModal initial={editPos} onClose={() => setEditPos(undefined)} onSaved={() => handleSaved("Pos pemadam berhasil diperbarui")} />
      )}
      {deleteTarget && (
        <DeleteModal itemName={deleteTarget.name} loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}

    <OperatorLayout>
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200/70 p-3 sm:p-4 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-xl flex items-center justify-center shadow-inner border border-gray-200/50 shrink-0">
            <FaTags className="text-gray-600 text-base sm:text-lg" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Manajemen Data
            </h2>
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 mt-0.5">Master Data Sistem</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 bg-gray-50 p-1 rounded-xl border border-gray-200/60 w-full sm:w-auto">
          {(["kategori", "kelurahan", "pos", "petugas"] as ActiveTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-xs font-bold"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}>
              {tab === "kategori" && <FaLayerGroup className="text-xs" />}
              {tab === "kelurahan" && <FaMapMarkerAlt className="text-xs" />}
              {tab === "pos" && <FaFireExtinguisher className="text-xs" />}
              {tab === "petugas" && <FaUserShield className="text-xs" />}
              <span className="hidden sm:inline">
                {tab === "kategori" ? "Kategori" : tab === "kelurahan" ? "Kelurahan" : tab === "pos" ? "Pos Pemadam" : "Akun Petugas"}
              </span>
              <span className="sm:hidden">
                {tab === "kategori" ? "Kategori" : tab === "kelurahan" ? "Kelurahan" : tab === "pos" ? "Pos" : "Petugas"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-8">
          {/* Title + Add */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">{tabLabel[activeTab]}</h2>
              <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5 sm:mt-1">Kelola master data untuk referensi operasional sistem.</p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="bg-gray-900 hover:bg-red-500 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors shadow-xs group w-full sm:w-auto">
              <FaPlus className="text-xs group-hover:scale-110 transition-transform" /> Tambah Baru
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Mobile Card List View (Visible on small screens) */}
            <div className="block sm:hidden divide-y divide-gray-100">
              {isLoading && (
                <div className="p-8 text-center text-xs text-gray-400">Memuat data...</div>
              )}

              {/* Mobile Petugas Cards */}
              {!isLoading && activeTab === "petugas" && petugasList.map((pet) => (
                <div key={pet.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400">ID #{pet.id}</span>
                      <h4 className="font-bold text-sm text-gray-900">{pet.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => router.push(`/operator/management/petugas/${pet.id}`)}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-xs"
                        title="Lihat Riwayat Tugas"
                      >
                        <FaHistory />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: pet.id, name: pet.name, type: "petugas" })}
                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs"
                        title="Hapus"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>Email: <span className="font-semibold text-gray-700">{pet.email}</span></div>
                    <div>WhatsApp: <span className="font-semibold text-gray-700">{pet.phone_number || "-"}</span></div>
                    <div>Dibuat: <span className="text-gray-600">{new Date(pet.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span></div>
                  </div>
                </div>
              ))}

              {/* Mobile Kategori Cards */}
              {!isLoading && activeTab === "kategori" && categories.map((cat) => (
                <div key={cat.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl" style={{ color: cat.color }}>{cat.icon}</div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400">ID #{cat.id}</span>
                        <h4 className="font-bold text-sm text-gray-900">{cat.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditCategory(cat)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: cat.id, name: cat.name, type: "kategori" })}
                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs"
                        title="Hapus"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {cat.description}
                    </p>
                  )}
                </div>
              ))}

              {/* Mobile Kelurahan Cards */}
              {!isLoading && activeTab === "kelurahan" && kelurahans.map((kel) => (
                <div key={kel.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400">ID #{kel.id}</span>
                      <h4 className="font-bold text-sm text-gray-900">{kel.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditKelurahan(kel)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: kel.id, name: kel.name, type: "kelurahan" })}
                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs"
                        title="Hapus"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>Kecamatan: <span className="font-semibold text-gray-800">{kel.kecamatan}</span></div>
                    <div>Kota: <span className="font-semibold text-gray-800">{kel.kota}</span></div>
                  </div>
                </div>
              ))}

              {/* Mobile Pos Cards */}
              {!isLoading && activeTab === "pos" && posPemadam.map((pos) => (
                <div key={pos.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400">ID #{pos.id}</span>
                      <h4 className="font-bold text-sm text-gray-900">{pos.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditPos(pos)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: pos.id, name: pos.name, type: "pos" })}
                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs"
                        title="Hapus"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        pos.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pos.status === "aktif" ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {pos.status.toUpperCase()}
                      </span>
                    </div>
                    <div>Kontak: <span className="font-mono font-semibold text-gray-800">{pos.contact_phone || "—"}</span></div>
                    <div>Alamat: <span className="text-gray-700">{pos.address || "—"}</span></div>
                  </div>
                </div>
              ))}

              {/* Mobile Empty states */}
              {!isLoading && activeTab === "petugas" && petugasList.length === 0 && <EmptyState label="akun petugas" />}
              {!isLoading && activeTab === "kategori" && categories.length === 0 && <EmptyState label="kategori darurat" />}
              {!isLoading && activeTab === "kelurahan" && kelurahans.length === 0 && <EmptyState label="data kelurahan" />}
              {!isLoading && activeTab === "pos" && posPemadam.length === 0 && <EmptyState label="pos pemadam" />}
            </div>

            {/* Desktop Table View (Visible on sm and up) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    {activeTab === "petugas" && (
                      <>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama & Kontak</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Aksi</th>
                      </>
                    )}
                    {activeTab === "kategori" && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Ikon</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                      </>
                    )}
                    {activeTab === "kelurahan" && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Kelurahan</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kecamatan</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kota</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                      </>
                    )}
                    {activeTab === "pos" && (
                      <>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Pos</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Skeleton rows while loading */}
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={skeletonCols} />
                  ))}

                  {/* Data rows */}
                  {!isLoading && activeTab === "petugas" && petugasList.map((pet) => (
                    <tr key={pet.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">#{pet.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{pet.name}</div>
                        <div className="text-sm text-gray-500 flex flex-col mt-0.5">
                          <span>Email: {pet.email}</span>
                          <span>WA: {pet.phone_number || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                         {new Date(pet.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => router.push(`/operator/management/petugas/${pet.id}`)}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Lihat Riwayat Tugas">
                            <FaHistory />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: pet.id, name: pet.name, type: "petugas" })}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Hapus">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && activeTab === "kategori" && categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-400 font-bold">{cat.id}</td>
                      <td className="px-6 py-4 text-2xl" style={{ color: cat.color }}>{cat.icon}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{cat.description || <span className="italic text-gray-300">—</span>}</td>
                      <td className="px-6 py-4 text-right">
                        <ActionButtons onEdit={() => setEditCategory(cat)} onDelete={() => setDeleteTarget({ id: cat.id, name: cat.name, type: "kategori" })} />
                      </td>
                    </tr>
                  ))}

                  {!isLoading && activeTab === "kelurahan" && kelurahans.map((kel) => (
                    <tr key={kel.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-400 font-bold">{kel.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{kel.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{kel.kecamatan}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{kel.kota}</td>
                      <td className="px-6 py-4 text-right">
                        <ActionButtons onEdit={() => setEditKelurahan(kel)} onDelete={() => setDeleteTarget({ id: kel.id, name: kel.name, type: "kelurahan" })} />
                      </td>
                    </tr>
                  ))}

                  {!isLoading && activeTab === "pos" && posPemadam.map((pos) => (
                    <tr key={pos.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-400 font-bold">{pos.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{pos.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          pos.status === "aktif" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pos.status === "aktif" ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {pos.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{pos.contact_phone || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{pos.address || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <ActionButtons onEdit={() => setEditPos(pos)} onDelete={() => setDeleteTarget({ id: pos.id, name: pos.name, type: "pos" })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Desktop Empty states */}
              {!isLoading && activeTab === "petugas" && petugasList.length === 0 && <EmptyState label="akun petugas" />}
              {!isLoading && activeTab === "kategori" && categories.length === 0 && <EmptyState label="kategori darurat" />}
              {!isLoading && activeTab === "kelurahan" && kelurahans.length === 0 && <EmptyState label="data kelurahan" />}
              {!isLoading && activeTab === "pos" && posPemadam.length === 0 && <EmptyState label="pos pemadam" />}
            </div>
          </div>
      </div>
    </OperatorLayout>
    </>
  );
}

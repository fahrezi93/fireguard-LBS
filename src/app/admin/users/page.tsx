"use client";

import { useEffect, useState } from "react";
import { FaUserPlus, FaShieldAlt, FaSpinner, FaTimes, FaSave, FaEdit, FaTrash } from "react-icons/fa";
import OperatorLayout from "@/components/OperatorLayout";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  kelurahan_id: number | null;
  phone_number: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "KELURAHAN", kelurahan_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        kelurahan_id: form.kelurahan_id ? parseInt(form.kelurahan_id) : null,
      };

      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/admin/users/${editId}` : "/api/admin/users";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan user");

      setShowAdd(false);
      setEditId(null);
      setForm({ name: "", email: "", password: "", role: "KELURAHAN", kelurahan_id: "" });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (u: User) => {
    setEditId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      password: "", 
      role: u.role,
      kelurahan_id: u.kelurahan_id ? u.kelurahan_id.toString() : "",
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus pengguna ini? Data akan terhapus permanen.")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus user");
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <OperatorLayout>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <FaShieldAlt className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
              <p className="text-xs sm:text-sm text-gray-500">Kelola akun Kelurahan, Operator, dan Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: "", email: "", password: "", role: "KELURAHAN", kelurahan_id: "" }); }}
            className="w-full sm:w-auto justify-center bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition text-xs sm:text-sm shadow-xs"
          >
            <FaUserPlus className="text-xs sm:text-sm" /> Tambah Akun
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Mobile Card List View */}
          <div className="block sm:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading data pengguna...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Belum ada user.</div>
            ) : (
              users.map(u => (
                <div key={u.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{u.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEditClick(u)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-xs" title="Edit">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition text-xs" title="Hapus">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'KELURAHAN' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'OPERATOR' ? 'bg-amber-100 text-amber-700' :
                      u.role === 'PETUGAS' ? 'bg-teal-100 text-teal-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role}
                    </span>
                    {u.kelurahan_id && (
                      <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        Kel. ID: <strong>{u.kelurahan_id}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Kel. ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Loading data pengguna...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500 text-sm">Belum ada user.</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'KELURAHAN' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'OPERATOR' ? 'bg-amber-100 text-amber-700' :
                          u.role === 'PETUGAS' ? 'bg-teal-100 text-teal-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{u.kelurahan_id || '-'}</td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button onClick={() => handleEditClick(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 sm:px-6 sm:py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-gray-900">{editId ? "Edit Akun" : "Tambah Akun Baru"}</h3>
              <button onClick={() => { setShowAdd(false); setEditId(null); setForm({ name: "", email: "", password: "", role: "KELURAHAN", kelurahan_id: "" }); }} className="text-gray-400 hover:text-gray-700 p-1">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs sm:text-sm font-medium">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Contoh: Budi Santoso" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input required type="email" className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="budi@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password Sementara</label>
                <input required={!editId} type="text" placeholder={editId ? "Tidak dapat mengubah password saat edit" : "Minimal 6 karakter"} className={`w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm ${editId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400'}`} value={form.password} onChange={e => setForm({...form, password: e.target.value})} disabled={!!editId} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="KELURAHAN">KELURAHAN</option>
                    <option value="PETUGAS">PETUGAS</option>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="MASYARAKAT">MASYARAKAT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Kelurahan</label>
                  <input type="number" placeholder="Opsional" className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 disabled:bg-gray-100 disabled:text-gray-400" value={form.kelurahan_id} onChange={e => setForm({...form, kelurahan_id: e.target.value})} disabled={form.role !== 'KELURAHAN' && form.role !== 'PETUGAS'} />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-gray-900 text-white py-2.5 sm:py-3 rounded-xl font-bold flex justify-center items-center gap-2 mt-3 text-sm active:scale-98 transition-transform disabled:opacity-50">
                {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />} Simpan Akun
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </OperatorLayout>
  );
}

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
      <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-red-600 text-3xl" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
              <p className="text-sm text-gray-500">Kelola akun Kelurahan dan Operator</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: "", email: "", password: "", role: "KELURAHAN", kelurahan_id: "" }); }}
            className="bg-gray-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition"
          >
            <FaUserPlus /> Tambah Akun
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
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
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada user.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'KELURAHAN' ? 'bg-blue-100 text-blue-700' :
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

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{editId ? "Edit Akun" : "Tambah Akun Baru"}</h3>
              <button onClick={() => { setShowAdd(false); setEditId(null); setForm({ name: "", email: "", password: "", role: "KELURAHAN", kelurahan_id: "" }); }} className="text-gray-400 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama</label>
                <input required type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input required type="email" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password Sementara</label>
                <input required={!editId} type="text" placeholder={editId ? "Tidak dapat mengubah password saat edit" : ""} className={`w-full border border-gray-200 rounded-xl px-4 py-2 text-sm ${editId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-900'}`} value={form.password} onChange={e => setForm({...form, password: e.target.value})} disabled={!!editId} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="KELURAHAN">KELURAHAN</option>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="MASYARAKAT">MASYARAKAT (User Biasa)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Kelurahan</label>
                  <input type="number" placeholder="Opsional" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900" value={form.kelurahan_id} onChange={e => setForm({...form, kelurahan_id: e.target.value})} disabled={form.role !== 'KELURAHAN'} />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 mt-2">
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

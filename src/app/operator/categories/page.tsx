"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaTags, FaCheck, FaTimes } from "react-icons/fa";

interface DisasterCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesManagementPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<DisasterCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DisasterCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    color: "#9F1C19",
    description: "",
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/operator/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      } else if (response.status === 401) {
        router.push("/operator/login");
      }
    } catch (error) {
      // Error fetching categories
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCategory
        ? "/api/operator/categories"
        : "/api/operator/categories";
      
      const method = editingCategory ? "PUT" : "POST";
      
      const body = editingCategory
        ? { ...formData, id: editingCategory.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(editingCategory ? "Kategori berhasil diupdate!" : "Kategori berhasil ditambahkan!");
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: "", icon: "", color: "#9F1C19", description: "" });
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.message || "Gagal menyimpan kategori");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menyimpan kategori");
    }
  };

  const handleEdit = (category: DisasterCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (category: DisasterCategory) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/operator/categories?id=${category.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchCategories();
      } else {
        const data = await response.json();
        alert(data.message || "Gagal menghapus kategori");
      }
    } catch (error) {
      alert("Terjadi kesalahan saat menghapus kategori");
    }
  };

  const toggleActive = async (category: DisasterCategory) => {
    try {
      const response = await fetch("/api/operator/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          is_active: category.is_active === 1 ? 0 : 1,
        }),
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      // Error toggling category
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-700 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-all rounded-xl hover:bg-gray-100"
              >
                <FaArrowLeft />
                <span>Kembali</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl">
                  <FaTags className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Kelola Kategori Bencana</h1>
                  <p className="text-xs text-gray-500">Tambah, edit, atau hapus kategori bencana</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", icon: "", color: "#9F1C19", description: "" });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium shadow-sm"
            >
              <FaPlus />
              <span>Tambah Kategori</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                category.is_active === 1
                  ? "border-gray-200 hover:border-gray-300"
                  : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {category.is_active === 1 ? "Aktif" : "Nonaktif"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(category)}
                    className={`p-2 rounded-lg transition-colors ${
                      category.is_active === 1
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                    title={category.is_active === 1 ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {category.is_active === 1 ? <FaCheck /> : <FaTimes />}
                  </button>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FaEdit />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <FaTags className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Belum ada kategori bencana</p>
            <p className="text-sm text-gray-400 mt-1">Klik tombol &quot;Tambah Kategori&quot; untuk membuat kategori baru</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Contoh: Kebakaran, Banjir, Gempa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji Icon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-2xl text-center"
                  placeholder="🔥"
                  maxLength={2}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pilih emoji yang sesuai (Windows: Win + . atau Mac: Cmd + Ctrl + Space)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-12 border border-gray-200 rounded-xl cursor-pointer"
                    required
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                    placeholder="#9F1C19"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Deskripsi singkat tentang kategori ini"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData({ name: "", icon: "", color: "#9F1C19", description: "" });
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
                >
                  {editingCategory ? "Simpan Perubahan" : "Tambah Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

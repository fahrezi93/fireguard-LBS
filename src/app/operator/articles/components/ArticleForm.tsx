"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import OperatorLayout from "@/components/OperatorLayout";

interface Category {
  id: number;
  name: string;
}

export default function ArticleForm({ articleId }: { articleId?: number }) {
  const router = useRouter();
  const { toast, success, error, hideToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    category_id: "",
    cover_image: "",
    status: "draft",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!articleId);

  useEffect(() => {
    fetchCategories();
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/operator/disaster-categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || (Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchArticle = async () => {
    try {
      // In a real app we might need a specific endpoint to fetch for edit, 
      // but for now we'll fetch from the public API or just fetch all and find.
      // Wait, we can't use public API if it's draft.
      // Let's create /api/operator/articles/[id] GET if needed, or fetch from /api/operator/articles
      const response = await fetch("/api/operator/articles");
      if (response.ok) {
        const data = await response.json();
        const article = data.find((a: any) => a.id === articleId);
        if (article) {
          setFormData({
            title: article.title,
            slug: article.slug,
            content: article.content,
            category_id: article.category_id?.toString() || "",
            cover_image: article.cover_image || "",
            status: article.status,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from title if title is changed and slug is empty or user is typing title
      ...(name === "title" && !articleId ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = articleId ? `/api/operator/articles/${articleId}` : "/api/operator/articles";
      const method = articleId ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan artikel");
      }

      success(articleId ? "Artikel berhasil diperbarui" : "Artikel berhasil dibuat");
      setTimeout(() => {
        router.push("/operator/articles");
      }, 1500);
    } catch (err: any) {
      error(err.message || "Terjadi kesalahan");
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <OperatorLayout>
      {toast.show && <Toast {...toast} onClose={hideToast} />}
      
      <div className="bg-white border-b border-gray-200/70 p-3 sm:p-4 sticky top-0 z-20 flex justify-between items-center gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => router.push('/operator/articles')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0"
            aria-label="Kembali"
          >
            <FaArrowLeft className="text-sm" />
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
              {articleId ? "Edit Artikel" : "Tulis Artikel Baru"}
            </h2>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all shrink-0 active:scale-95"
        >
          <FaSave className="text-xs" /> {isSubmitting ? "Menyimpan..." : "Simpan"}
        </button>
      </div>

      <div className="max-w-[1000px] mx-auto p-3 sm:p-5 lg:p-8">
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/70 shadow-xs space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Judul Artikel *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Contoh: Cara Mencegah Kebakaran di Rumah"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug (URL) *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Publikasikan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL Gambar Cover (Opsional)</label>
              <input
                type="text"
                name="cover_image"
                value={formData.cover_image}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex justify-between">
                <span>Konten Artikel *</span>
                <span className="text-xs text-gray-400 font-normal">Mendukung Format Markdown Dasar (opsional)</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={15}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-sm"
                placeholder="Tulis isi artikel di sini..."
              />
            </div>
          </div>
        </form>
      </div>
    </OperatorLayout>
  );
}

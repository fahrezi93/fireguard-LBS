"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaFileAlt } from "react-icons/fa";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";
import OperatorLayout from "@/components/OperatorLayout";

interface Article {
  id: number;
  title: string;
  slug: string;
  category_name: string;
  author_name: string;
  status: string;
  created_at: string;
}

export default function ArticlesManagementPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast, success, error, hideToast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/operator/articles");
      if (!response.ok) throw new Error("Gagal memuat artikel");
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      error("Gagal memuat artikel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus artikel ini?")) return;

    try {
      const response = await fetch(`/api/operator/articles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Gagal menghapus");
      success("Artikel berhasil dihapus");
      fetchArticles();
    } catch (err) {
      error("Gagal menghapus artikel");
    }
  };

  return (
    <OperatorLayout>
      {toast.show && <Toast {...toast} onClose={hideToast} />}
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200/70 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FaFileAlt className="text-red-500" /> Manajemen Edukasi & Berita
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-1">Kelola artikel edukasi bencana</p>
        </div>
        <button
          onClick={() => router.push('/operator/articles/create')}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <FaPlus /> Artikel Baru
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200/70 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Memuat data...</div>
          ) : articles.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-3" />
              <p>Belum ada artikel. Silakan buat artikel baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Judul</th>
                    <th className="px-6 py-4 font-semibold">Kategori</th>
                    <th className="px-6 py-4 font-semibold">Penulis</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Tanggal</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{article.title}</div>
                        <div className="text-xs text-gray-400 mt-1">/{article.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{article.category_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{article.author_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                          article.status === 'published' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {article.status === 'published' ? 'Dipublikasikan' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(article.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/operator/articles/${article.id}/edit`)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
}

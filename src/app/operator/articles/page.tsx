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
      <div className="bg-white border-b border-gray-200/70 p-3 sm:p-4 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
            <FaFileAlt className="text-base sm:text-lg" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Manajemen Edukasi & Berita
            </h2>
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 mt-0.5">Kelola artikel edukasi dan panduan bencana</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/operator/articles/create')}
          className="w-full sm:w-auto justify-center bg-red-500 hover:bg-red-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
        >
          <FaPlus className="text-xs" /> Artikel Baru
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-3 sm:p-5 lg:p-8">
        <div className="bg-white border border-gray-200/70 rounded-2xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-400">Memuat data artikel...</div>
          ) : articles.length === 0 ? (
            <div className="p-10 sm:p-12 text-center text-gray-500">
              <FaFileAlt className="text-3xl sm:text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium">Belum ada artikel. Silakan buat artikel baru.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List View */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {articles.map((article) => (
                  <div key={article.id} className="p-4 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 leading-snug">{article.title}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">/{article.slug}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => router.push(`/operator/articles/${article.id}/edit`)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-xs"
                          title="Hapus"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        article.status === 'published' 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {article.status === 'published' ? 'Dipublikasikan' : 'Draft'}
                      </span>
                      {article.category_name && (
                        <span className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                          {article.category_name}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[650px]">
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
            </>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaBookOpen, FaCalendarAlt, FaUser } from "react-icons/fa";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

interface Article {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  created_at: string;
  category_name: string;
  author_name: string;
}

export default function EdukasiPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/articles");
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error("Gagal memuat artikel", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar isLight={true} />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100 pt-24 pb-8 md:pt-28 md:pb-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[40%] h-[120%] bg-gradient-to-b from-red-50 to-orange-50/20 blur-3xl transform rotate-12 rounded-full opacity-60"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[30%] h-[100%] bg-gradient-to-tr from-orange-50/40 to-transparent blur-3xl rounded-full opacity-50"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold tracking-wide uppercase mb-3 shadow-xs border border-red-100/50">
              <FaBookOpen className="text-[10px]" /> Literasi Bencana
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight leading-snug">
              Edukasi & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Berita Terkini</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed font-normal">
              Tingkatkan kewaspadaan Anda dengan panduan pencegahan dan berita terkini seputar penanganan bencana di sekitar kita.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-red-500 rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Memuat publikasi...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBookOpen className="text-2xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Publikasi</h3>
            <p className="text-gray-500 text-sm">Konten edukasi dan berita akan segera ditambahkan oleh operator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => {
              const imageUrl = article.cover_image?.startsWith('http') 
                ? article.cover_image 
                : (article.cover_image ? `/uploads/articles/${article.cover_image}` : null);

              return (
                <Link 
                  href={`/edukasi/${article.slug}`} 
                  key={article.id} 
                  className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out"
                >
                  <div className="relative h-44 sm:h-48 w-full bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                        <FaBookOpen className="text-4xl text-red-200/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80 mix-blend-multiply"></div>
                    {article.category_name && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-xs">
                          {article.category_name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1 bg-white">
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400 mb-2.5 tracking-wide uppercase">
                      <span className="flex items-center gap-1"><FaCalendarAlt className="text-gray-300" /> {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><FaUser className="text-gray-300" /> {article.author_name}</span>
                    </div>
                    
                    <h3 className="text-base font-bold text-gray-900 leading-snug mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <div className="mt-auto pt-3 flex items-center text-red-600 font-bold text-xs tracking-wide">
                      <span className="group-hover:mr-1.5 transition-all duration-200">Baca Selengkapnya</span>
                      <span className="text-sm leading-none opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">&rarr;</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer isLight={true} />
    </div>
  );
}

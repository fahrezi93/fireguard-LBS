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
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-gradient-to-b from-red-50 to-orange-50/20 blur-3xl transform rotate-12 rounded-full opacity-70"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[100%] bg-gradient-to-tr from-orange-50/50 to-transparent blur-3xl rounded-full opacity-60"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-semibold tracking-wide uppercase mb-6 shadow-sm border border-red-100/50">
              <FaBookOpen className="text-xs" /> Literasi Bencana
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              Edukasi & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Berita Terkini</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
              Tingkatkan kewaspadaan Anda dengan panduan pencegahan dan berita terkini seputar penanganan bencana di sekitar kita.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Memuat publikasi...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 px-6 bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-3xl mx-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBookOpen className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Belum Ada Publikasi</h3>
            <p className="text-gray-500 text-lg">Konten edukasi dan berita akan segera ditambahkan oleh operator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
            {articles.map((article) => {
              const imageUrl = article.cover_image?.startsWith('http') 
                ? article.cover_image 
                : (article.cover_image ? `/uploads/articles/${article.cover_image}` : null);

              return (
                <Link 
                  href={`/edukasi/${article.slug}`} 
                  key={article.id} 
                  className="group flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 ease-out"
                >
                  <div className="relative h-60 w-full bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                        <FaBookOpen className="text-5xl text-red-200/60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80 mix-blend-multiply"></div>
                    {article.category_name && (
                      <div className="absolute bottom-4 left-4 z-10">
                        <span className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                          {article.category_name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 md:p-8 flex flex-col flex-1 bg-white">
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 mb-4 tracking-wide uppercase">
                      <span className="flex items-center gap-1.5"><FaCalendarAlt className="text-gray-300" /> {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-1.5"><FaUser className="text-gray-300" /> {article.author_name}</span>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-[1.3] mb-4 group-hover:text-red-600 transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 flex items-center text-red-600 font-bold text-sm tracking-wide">
                      <span className="group-hover:mr-2 transition-all duration-300">Baca Selengkapnya</span>
                      <span className="text-lg leading-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">&rarr;</span>
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

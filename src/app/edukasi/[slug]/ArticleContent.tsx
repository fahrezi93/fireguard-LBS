"use client";

import ReactMarkdown from "react-markdown";
import { FaArrowLeft, FaCalendarAlt, FaUser, FaTag } from "react-icons/fa";
import Link from "next/link";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";

interface ArticleContentProps {
  article: {
    title: string;
    content: string;
    cover_image?: string;
    created_at: string;
    category_name?: string;
    author_name?: string;
  };
}

export default function ArticleContent({ article }: ArticleContentProps) {
  const imageUrl = article.cover_image?.startsWith("http")
    ? article.cover_image
    : article.cover_image
    ? `/uploads/articles/${article.cover_image}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar set to isLight={false} so text is crisp white on dark hero header */}
      <Navbar isLight={false} />

      {/* Sleek Hero Header Section */}
      <section className="relative w-full bg-slate-950 pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={article.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&w=1200&q=80";
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-950 to-slate-900 flex items-center justify-center">
            <FaTag className="text-8xl text-white/5" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />

        {/* Header Content Container */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6">
          <Link
            href="/edukasi"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium mb-4 transition-colors text-xs sm:text-sm group"
          >
            <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
            Kembali ke Literasi Bencana
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            {article.category_name && (
              <span className="bg-red-600 text-white px-3 py-1 rounded-md uppercase tracking-wider text-[11px] font-extrabold shadow-sm">
                {article.category_name}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs sm:text-sm text-white/80">
              <FaCalendarAlt className="text-white/60 text-xs" />
              {new Date(article.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            {article.author_name && (
              <span className="flex items-center gap-1.5 text-xs sm:text-sm text-white/80">
                <FaUser className="text-white/60 text-xs" />
                {article.author_name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-snug tracking-tight max-w-3xl">
            {article.title}
          </h1>
        </div>
      </section>

      {/* Main Article Body Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 -mt-6 sm:-mt-8 relative z-20">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/80 shadow-md">
          <article className="prose prose-slate prose-base sm:prose-lg max-w-none prose-headings:font-extrabold prose-headings:text-slate-900 prose-headings:tracking-tight prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-red-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-img:rounded-xl prose-img:shadow-md prose-li:text-slate-700 prose-blockquote:border-l-red-500 prose-blockquote:bg-red-50/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:text-slate-700">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </article>
        </div>
      </main>

      <Footer isLight={true} />
    </div>
  );
}

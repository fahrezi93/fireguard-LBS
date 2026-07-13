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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar isLight={true} />

      {/* Full-bleed Hero - padding-top accounts for fixed Navbar height */}
      <section
        className="relative w-full bg-gray-900 pt-20"
        style={{ height: "calc(70vh + 80px)", minHeight: "560px" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-gray-900 to-gray-950 flex items-center justify-center">
            <FaTag className="text-[10rem] text-white/5" />
          </div>
        )}

        {/* Layered gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/50 to-black/20" />

        {/* Content sits at the bottom of the hero */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-4xl mx-auto px-6 pb-12 md:pb-20">
            <Link
              href="/edukasi"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white font-medium mb-8 transition-colors text-sm group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Kembali ke Literasi Bencana
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              {article.category_name && (
                <span className="bg-red-600 text-white px-3.5 py-1.5 rounded-lg uppercase tracking-widest text-xs font-bold">
                  {article.category_name}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm text-white/70">
                <FaCalendarAlt className="text-white/40" />
                {new Date(article.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-white/70">
                <FaUser className="text-white/40" />
                {article.author_name}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.2] tracking-tight">
              {article.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <article className="prose prose-lg md:prose-xl prose-gray max-w-none prose-headings:font-extrabold prose-headings:text-gray-900 prose-headings:tracking-tight prose-p:text-gray-700 prose-p:leading-8 prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-2xl prose-img:shadow-lg prose-li:text-gray-700 prose-li:leading-8">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </article>
      </main>
      <Footer isLight={true} />
    </div>
  );
}

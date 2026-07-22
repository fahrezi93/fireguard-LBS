"use client";

import Link from 'next/link';
import { FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ArticleImage from './ArticleImage';

interface Article {
  id: number;
  title: string;
  slug: string;
  cover_image: string | null;
  created_at: string;
  category_name?: string;
}

export default function ArticleCardList({ articles }: { articles: Article[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, idx) => {
        const imageUrl = article.cover_image?.startsWith('http')
          ? article.cover_image
          : (article.cover_image ? `/uploads/articles/${article.cover_image}` : null);

        return (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
            className="h-full"
          >
            <Link
              href={`/edukasi/${article.slug}`}
              className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out"
            >
              <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden">
                <ArticleImage src={imageUrl} alt={article.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80 mix-blend-multiply"></div>
                {article.category_name && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-2xs">
                      {article.category_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1 bg-white">
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 mb-2.5 tracking-wide uppercase">
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="text-slate-300" />{" "}
                    {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
                  {article.title}
                </h4>

                <div className="mt-auto pt-3 flex items-center text-red-600 font-bold text-xs tracking-wide">
                  <span className="group-hover:mr-1.5 transition-all duration-200">Baca Selengkapnya</span>
                  <span className="text-sm leading-none opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">&rarr;</span>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

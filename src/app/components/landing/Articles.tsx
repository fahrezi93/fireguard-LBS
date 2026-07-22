import Link from 'next/link';
import { FaBookOpen, FaArrowRight } from 'react-icons/fa';
import { queryRows } from '@/lib/db';
import ArticleCardList from './ArticleCardList';

export default async function ArticlesSection() {
  let articles: any[] = [];
  try {
    articles = await queryRows(
      `SELECT a.id, a.title, a.slug, a.cover_image, a.created_at, c.name as category_name 
       FROM articles a
       LEFT JOIN disaster_categories c ON a.category_id = c.id
       WHERE a.status = 'published'
       ORDER BY a.created_at DESC LIMIT 6`
    );
  } catch (err) {
    console.error("Failed to fetch articles for landing page:", err);
  }

  if (articles.length === 0) {
    return null; // Don't show the section if there are no articles
  }

  return (
    <section id="edukasi" className="py-12 md:py-16 bg-slate-50/70 border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold tracking-wider uppercase mb-3 border border-red-100/50 shadow-2xs">
            <FaBookOpen className="text-[10px]" /> Literasi Bencana
          </span>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight leading-snug">
            Pusat Informasi & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Berita</span>
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
            Tingkatkan kewaspadaan Anda dengan panduan pencegahan dan berita terkini seputar penanganan bencana di sekitar kita.
          </p>
        </div>

        {/* Animated Article Cards Grid */}
        <ArticleCardList articles={articles} />

        <div className="mt-10 text-center">
          <Link href="/edukasi" className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-xs transition-all duration-200">
            Jelajahi Semua Publikasi <FaArrowRight className="text-xs text-slate-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { FaBookOpen, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { queryRows } from '@/lib/db';
import ArticleImage from './ArticleImage';

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const imageUrl = article.cover_image?.startsWith('http') 
              ? article.cover_image 
              : (article.cover_image ? `/uploads/articles/${article.cover_image}` : null);

            return (
              <Link 
                href={`/edukasi/${article.slug}`} 
                key={article.id} 
                className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out"
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
                    <span className="flex items-center gap-1"><FaCalendarAlt className="text-slate-300" /> {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/edukasi" className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-xs transition-all duration-200">
            Jelajahi Semua Publikasi <FaArrowRight className="text-xs text-slate-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}

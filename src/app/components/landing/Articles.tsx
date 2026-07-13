import Link from 'next/link';
import { FaBookOpen, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { queryRows } from '@/lib/db';

export default async function ArticlesSection() {
  let articles: any[] = [];
  try {
    articles = await queryRows(
      `SELECT a.id, a.title, a.slug, a.cover_image, a.created_at, c.name as category_name 
       FROM articles a
       LEFT JOIN disaster_categories c ON a.category_id = c.id
       WHERE a.status = 'published'
       ORDER BY a.created_at DESC LIMIT 3`
    );
  } catch (err) {
    console.error("Failed to fetch articles for landing page:", err);
  }

  if (articles.length === 0) {
    return null; // Don't show the section if there are no articles
  }

  return (
    <section id="edukasi" className="py-24 bg-[#F8FAFC] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-50/50 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-orange-50/50 to-transparent blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-red-100/50 text-red-600 text-sm font-bold tracking-widest uppercase mb-4 shadow-sm border border-red-100">
            Literasi Bencana
          </span>
          <h3 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Pusat Informasi & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Berita</span>
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed font-medium">
            Tingkatkan kewaspadaan Anda dengan panduan pencegahan dan berita terkini seputar penanganan bencana di sekitar kita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-10">
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
                <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
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
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 leading-[1.3] mb-4 group-hover:text-red-600 transition-colors line-clamp-3">
                    {article.title}
                  </h4>
                  
                  <div className="mt-auto pt-4 flex items-center text-red-600 font-bold text-sm tracking-wide">
                    <span className="group-hover:mr-2 transition-all duration-300">Baca Selengkapnya</span>
                    <span className="text-lg leading-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">&rarr;</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Link href="/edukasi" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-900 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            Jelajahi Semua Publikasi
          </Link>
        </div>
      </div>
    </section>
  );
}

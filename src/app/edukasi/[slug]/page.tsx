import { Metadata } from 'next';
import { queryRow } from '@/lib/db';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import ArticleContent from './ArticleContent';

// Optional: Fetch article for metadata (SEO)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const article = await queryRow<{title: string; cover_image: string; content: string}>(
    `SELECT title, cover_image, content FROM articles WHERE slug = ? AND status = 'published'`,
    [slug]
  );

  if (!article) {
    return { title: 'Artikel Tidak Ditemukan - SiagaBencana' };
  }

  return {
    title: `${article.title} - SiagaBencana`,
    description: article.content.replace(/[#*_`\-]/g, '').substring(0, 160),
    openGraph: {
      title: article.title,
      images: article.cover_image ? [article.cover_image] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const article = await queryRow<any>(
    `SELECT a.*, c.name as category_name, o.username as author_name 
     FROM articles a
     LEFT JOIN disaster_categories c ON a.category_id = c.id
     LEFT JOIN operators o ON a.author_id = o.id
     WHERE a.slug = ? AND a.status = 'published'`,
    [slug]
  );

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-500 mb-8">Artikel tidak ditemukan atau belum dipublikasikan.</p>
          <Link href="/edukasi" className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors">
            <FaArrowLeft /> Kembali ke Berita
          </Link>
        </div>
      </div>
    );
  }

  return <ArticleContent article={article} />;
}


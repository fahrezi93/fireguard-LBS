import { NextRequest, NextResponse } from 'next/server';
import { queryRow } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    const query = `
      SELECT a.*, c.name as category_name, o.username as author_name 
      FROM articles a
      LEFT JOIN disaster_categories c ON a.category_id = c.id
      LEFT JOIN operators o ON a.author_id = o.id
      WHERE a.slug = ? AND a.status = 'published'
    `;

    const article = await queryRow(query, [slug]);

    if (!article) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('[GET /api/articles/[slug]]', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

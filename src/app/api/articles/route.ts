import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    let query = `
      SELECT a.id, a.title, a.slug, a.cover_image, a.created_at, a.category_id,
             c.name as category_name, o.username as author_name 
      FROM articles a
      LEFT JOIN disaster_categories c ON a.category_id = c.id
      LEFT JOIN operators o ON a.author_id = o.id
      WHERE a.status = 'published'
    `;
    const args: any[] = [];

    if (categoryId) {
      query += ` AND a.category_id = ?`;
      args.push(categoryId);
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT ${limit}`;

    const articles = await queryRows(query, args);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('[GET /api/articles]', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

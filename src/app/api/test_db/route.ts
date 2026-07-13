import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    let query = `
      SELECT a.id, a.title, a.slug, a.cover_image, a.created_at, a.category_id,
             c.name as category_name, o.username as author_name 
      FROM articles a
      LEFT JOIN disaster_categories c ON a.category_id = c.id
      LEFT JOIN operators o ON a.author_id = o.id
      WHERE a.status = 'published'
    `;
    const articles = await queryRows(query, []);
    return NextResponse.json(articles);
  } catch (error: any) {
    return NextResponse.json({ message: error.message, stack: error.stack }, { status: 500 });
  }
}

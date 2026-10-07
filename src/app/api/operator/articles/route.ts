import { NextRequest, NextResponse } from 'next/server';
import { queryRows, executeAndGetLastInsertId } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');
    
    let query = `
      SELECT a.*, c.name as category_name, o.username as author_name 
      FROM articles a
      LEFT JOIN disaster_categories c ON a.category_id = c.id
      LEFT JOIN operators o ON a.author_id = o.id
    `;
    const args: any[] = [];

    if (categoryId) {
      query += ` WHERE a.category_id = ?`;
      args.push(categoryId);
    }
    
    query += ` ORDER BY a.created_at DESC`;

    const articles = await queryRows(query, args);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('[GET /api/operator/articles]', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { title, slug, content, category_id, cover_image, status } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ message: 'Title, slug, and content are required' }, { status: 400 });
    }

    const authorId = auth.payload.isOperator ? auth.payload.id : null;

    const insertId = await executeAndGetLastInsertId(
      `INSERT INTO articles (title, slug, content, category_id, author_id, cover_image, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, content, category_id || null, authorId, cover_image || null, status || 'draft']
    );

    return NextResponse.json({ message: 'Article created successfully', id: insertId }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/operator/articles] Error Details:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'Slug article sudah ada, silakan gunakan judul lain.' }, { status: 409 });
    }
    if (error.code === 'ER_DATA_TOO_LONG') {
      return NextResponse.json({ message: 'URL Cover image terlalu panjang.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan pada database server.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, category_id, cover_image, status } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ message: 'Title, slug, and content are required' }, { status: 400 });
    }

    const affectedRows = await execute(
      `UPDATE articles 
       SET title = ?, slug = ?, content = ?, category_id = ?, cover_image = ?, status = ?
       WHERE id = ?`,
      [title, slug, content, category_id || null, cover_image || null, status || 'draft', id]
    );

    if (affectedRows === 0) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Article updated successfully' });
  } catch (error: any) {
    console.error(`[PUT /api/operator/articles/[id]]`, error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'Slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { id } = await params;

    const affectedRows = await execute(`DELETE FROM articles WHERE id = ?`, [id]);

    if (affectedRows === 0) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(`[DELETE /api/operator/articles/[id]]`, error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

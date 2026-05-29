import { NextRequest, NextResponse } from 'next/server';
import { queryRows, execute, executeAndGetLastInsertId } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';

interface Category {
    id: number;
    name: string;
    icon: string;
    color: string;
    description?: string;
}

// GET: Ambil semua kategori
export async function GET(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const categories = await queryRows<Category>(
            'SELECT id, name, icon, color, description FROM disaster_categories ORDER BY id ASC'
        );
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ message: 'Gagal mengambil data kategori' }, { status: 500 });
    }
}

// POST: Tambah kategori baru
export async function POST(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const { name, icon, color, description } = await request.json();

        if (!name || !icon) {
            return NextResponse.json({ message: 'Nama dan icon diperlukan' }, { status: 400 });
        }

        const id = await executeAndGetLastInsertId(
            'INSERT INTO disaster_categories (name, icon, color, description) VALUES (?, ?, ?, ?)',
            [name, icon, color || '#9F1C19', description || '']
        );

        return NextResponse.json({
            success: true,
            message: 'Kategori berhasil ditambahkan',
            data: { id, name, icon, color, description }
        });
    } catch (error) {
        console.error('Error adding category:', error);
        return NextResponse.json({ message: 'Gagal menambah kategori' }, { status: 500 });
    }
}

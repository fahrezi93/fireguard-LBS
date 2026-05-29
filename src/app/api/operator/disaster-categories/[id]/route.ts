import { NextRequest, NextResponse } from 'next/server';
import { queryRow, execute } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';

// PUT: Update kategori
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const { name, icon, color, description } = await request.json();

        if (!name || !icon) {
            return NextResponse.json({ message: 'Nama dan icon diperlukan' }, { status: 400 });
        }

        await execute(
            'UPDATE disaster_categories SET name = ?, icon = ?, color = ?, description = ? WHERE id = ?',
            [name, icon, color || '#9F1C19', description || '', id]
        );

        return NextResponse.json({
            success: true,
            message: 'Kategori berhasil diperbarui'
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ message: 'Gagal memperbarui kategori' }, { status: 500 });
    }
}

// DELETE: Hapus kategori
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const { id: idParam } = await params;
        const id = parseInt(idParam);

        // Cek apakah ada laporan yang menggunakan kategori ini
        const report = await queryRow<{ count: number }>(
            'SELECT COUNT(*) as count FROM reports WHERE category_id = ?',
            [id]
        );

        if (report && report.count > 0) {
            return NextResponse.json({
                message: `Tidak dapat menghapus. ${report.count} laporan menggunakan kategori ini.`
            }, { status: 400 });
        }

        await execute('DELETE FROM disaster_categories WHERE id = ?', [id]);

        return NextResponse.json({
            success: true,
            message: 'Kategori berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ message: 'Gagal menghapus kategori' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';

interface YearlyStats {
    year: number;
    total: number;
}

interface KelurahanStats {
    kelurahan_id: number;
    kelurahan_name: string;
    kecamatan: string;
    total: number;
}

interface CategoryStats {
    category_id: number;
    category_name: string;
    category_icon: string;
    total: number;
}

interface MonthlyStats {
    month: number;
    month_name: string;
    total: number;
}

interface HotspotData {
    fire_latitude: number;
    fire_longitude: number;
    kelurahan_name: string;
    category_name: string;
    category_icon: string;
    created_at: string;
}

export async function GET(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

        // Hitung range tanggal sekali untuk dipakai di semua query
        // Ini jauh lebih efisien dari YEAR(created_at) = ? karena bisa pakai INDEX
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year + 1}-01-01`;

        // 1. Get available years
        const availableYears = await queryRows<{ year: number }>(
            `SELECT DISTINCT YEAR(created_at) as year FROM reports ORDER BY year DESC`
        );

        // 2. Get yearly statistics
        const yearlyStats = await queryRows<YearlyStats>(
            `SELECT YEAR(created_at) as year, COUNT(*) as total 
       FROM reports 
       GROUP BY YEAR(created_at) 
       ORDER BY year DESC`
        );

        // 3. Get statistics by kelurahan for selected year
        const kelurahanStats = await queryRows<KelurahanStats>(
            `SELECT 
        k.id as kelurahan_id,
        k.name as kelurahan_name,
        k.kecamatan,
        COUNT(r.id) as total 
       FROM reports r
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       WHERE r.created_at >= ? AND r.created_at < ?
       GROUP BY k.id, k.name, k.kecamatan
       ORDER BY total DESC`,
            [yearStart, yearEnd]
        );

        // 4. Get statistics by category for selected year
        const categoryStats = await queryRows<CategoryStats>(
            `SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        COUNT(r.id) as total 
       FROM reports r
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       WHERE r.created_at >= ? AND r.created_at < ?
       GROUP BY c.id, c.name, c.icon
       ORDER BY total DESC`,
            [yearStart, yearEnd]
        );

        // 5. Get monthly statistics for selected year
        const monthlyStats = await queryRows<MonthlyStats>(
            `SELECT 
        MONTH(created_at) as month,
        MONTHNAME(created_at) as month_name,
        COUNT(*) as total 
       FROM reports 
       WHERE created_at >= ? AND created_at < ?
       GROUP BY MONTH(created_at), MONTHNAME(created_at)
       ORDER BY month ASC`,
            [yearStart, yearEnd]
        );

        // 6. Get hotspot data (all report locations) for selected year
        const hotspots = await queryRows<HotspotData>(
            `SELECT 
        r.fire_latitude,
        r.fire_longitude,
        COALESCE(k.name, 'Tidak Diketahui') as kelurahan_name,
        COALESCE(c.name, 'Kebakaran') as category_name,
        COALESCE(c.icon, '🔥') as category_icon,
        r.created_at
       FROM reports r
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       WHERE r.created_at >= ? AND r.created_at < ?
       ORDER BY r.created_at DESC`,
            [yearStart, yearEnd]
        );

        // 7. Get total reports for selected year
        const totalReportsResult = await queryRows<{ total: number }>(
            `SELECT COUNT(*) as total FROM reports WHERE created_at >= ? AND created_at < ?`,
            [yearStart, yearEnd]
        );
        const totalReports = totalReportsResult[0]?.total || 0;

        // 8. Get status breakdown for selected year
        const statusStats = await queryRows<{ status: string; total: number }>(
            `SELECT status, COUNT(*) as total 
       FROM reports 
       WHERE created_at >= ? AND created_at < ?
       GROUP BY status`,
            [yearStart, yearEnd]
        );

        return NextResponse.json({
            success: true,
            data: {
                selectedYear: year,
                availableYears: availableYears.map(y => y.year),
                totalReports,
                yearlyStats,
                kelurahanStats,
                categoryStats,
                monthlyStats,
                statusStats,
                hotspots,
            }
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json(
            { message: 'Gagal mengambil data statistik' },
            { status: 500 }
        );
    }
}

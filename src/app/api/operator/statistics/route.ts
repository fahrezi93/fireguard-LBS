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

interface DailyStats {
    day: number;
    total: number;
}

interface PetugasLeaderboard {
    petugas_id: number;
    petugas_name: string;
    total_handled: number;
    total_completed: number;
    avg_response_time: number;
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
        const monthParam = searchParams.get('month');

        let dateStart = `${year}-01-01`;
        let dateEnd = `${year + 1}-01-01`;
        let selectedMonth = null;

        if (monthParam && monthParam !== 'all') {
            const month = parseInt(monthParam);
            selectedMonth = month;
            const paddedMonth = month.toString().padStart(2, '0');
            dateStart = `${year}-${paddedMonth}-01`;
            
            let nextYear = year;
            let nextMonth = month + 1;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear++;
            }
            const paddedNextMonth = nextMonth.toString().padStart(2, '0');
            dateEnd = `${nextYear}-${paddedNextMonth}-01`;
        }

        // 1. Get available years
        const availableYears = await queryRows<{ year: number }>(
            `SELECT DISTINCT YEAR(created_at) as year FROM reports ORDER BY year DESC`
        );

        // 2. Get yearly statistics (Selalu seluruh data)
        const yearlyStats = await queryRows<YearlyStats>(
            `SELECT YEAR(created_at) as year, COUNT(*) as total 
       FROM reports 
       GROUP BY YEAR(created_at) 
       ORDER BY year DESC`
        );

        // 3. Get statistics by kelurahan for selected timeframe
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
            [dateStart, dateEnd]
        );

        // 4. Get statistics by category for selected timeframe
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
            [dateStart, dateEnd]
        );

        // 5. Get monthly statistics (hanya hitung dari tahun terpilih, terlepas dari filter bulan)
        const yearStartOnly = `${year}-01-01`;
        const yearEndOnly = `${year + 1}-01-01`;
        const monthlyStats = await queryRows<MonthlyStats>(
            `SELECT 
        MONTH(created_at) as month,
        MONTHNAME(created_at) as month_name,
        COUNT(*) as total 
       FROM reports 
       WHERE created_at >= ? AND created_at < ?
       GROUP BY MONTH(created_at), MONTHNAME(created_at)
       ORDER BY month ASC`,
            [yearStartOnly, yearEndOnly]
        );

        // 6. Get daily statistics if a specific month is selected
        let dailyStats: DailyStats[] = [];
        if (selectedMonth !== null) {
            dailyStats = await queryRows<DailyStats>(
                `SELECT 
            DAY(created_at) as day,
            COUNT(*) as total 
           FROM reports 
           WHERE created_at >= ? AND created_at < ?
           GROUP BY DAY(created_at)
           ORDER BY day ASC`,
                [dateStart, dateEnd]
            );
        }

        // 7. Get Petugas Leaderboard for selected timeframe
        const petugasLeaderboard = await queryRows<PetugasLeaderboard>(
            `SELECT 
        u.id as petugas_id,
        u.name as petugas_name,
        COUNT(r.id) as total_handled,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as total_completed,
        ROUND(AVG(r.response_time_seconds)) as avg_response_time
       FROM reports r
       JOIN users u ON r.assigned_petugas_id = u.id
       WHERE r.created_at >= ? AND r.created_at < ?
       GROUP BY u.id, u.name
       ORDER BY total_completed DESC, total_handled DESC`,
            [dateStart, dateEnd]
        );

        // 8. Get hotspot data for selected timeframe
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
            [dateStart, dateEnd]
        );

        // 9. Get total reports for selected timeframe
        const totalReportsResult = await queryRows<{ total: number }>(
            `SELECT COUNT(*) as total FROM reports WHERE created_at >= ? AND created_at < ?`,
            [dateStart, dateEnd]
        );
        const totalReports = totalReportsResult[0]?.total || 0;

        // 10. Get status breakdown for selected timeframe
        const statusStats = await queryRows<{ status: string; total: number }>(
            `SELECT status, COUNT(*) as total 
       FROM reports 
       WHERE created_at >= ? AND created_at < ?
       GROUP BY status`,
            [dateStart, dateEnd]
        );

        return NextResponse.json({
            success: true,
            data: {
                selectedYear: year,
                selectedMonth: selectedMonth,
                availableYears: availableYears.map(y => y.year),
                totalReports,
                yearlyStats,
                kelurahanStats,
                categoryStats,
                monthlyStats,
                dailyStats,
                petugasLeaderboard,
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

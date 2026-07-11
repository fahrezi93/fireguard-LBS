import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { requireOperator } from "@/lib/api-security";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const { id } = await context.params;

        await execute("DELETE FROM users WHERE id = ? AND role = 'petugas'", [id]);

        return NextResponse.json({ success: true, message: "Akun petugas berhasil dihapus" });
    } catch (error) {
        console.error("Error deleting petugas:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menghapus akun petugas" },
            { status: 500 }
        );
    }
}

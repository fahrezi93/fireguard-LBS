import { NextRequest } from "next/server";
import { execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role !== 'petugas') {
      return jsonWithCors({ message: "Hanya petugas yang bisa mengubah status piket." }, { status: 403, request });
    }

    const { is_on_duty } = await request.json();

    if (typeof is_on_duty !== 'boolean') {
      return jsonWithCors({ message: "Status is_on_duty harus berupa boolean (true/false)." }, { status: 400, request });
    }

    await execute(
      "UPDATE users SET is_on_duty = ? WHERE id = ?",
      [is_on_duty ? 1 : 0, user.id]
    );

    return jsonWithCors({
      success: true,
      message: `Status piket berhasil diperbarui.`,
      is_on_duty
    }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Update Status Piket Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}

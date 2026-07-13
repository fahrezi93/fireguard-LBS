import { NextRequest, NextResponse } from "next/server";
import { queryRows } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

// Tambahkan helper CORS
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);
    if (user.role !== "petugas") {
      return jsonWithCors(
        { error: "Unauthorized" },
        { status: 401, request }
      );
    }

    // Ambil histori tugas (completed & false_report)
    const history = await queryRows(
      `SELECT r.id, r.description, r.address, r.status, r.status_petugas, 
              r.created_at, r.accepted_at, r.arrived_at, r.completed_at,
              r.completion_photo_url, r.response_time_seconds,
              c.name as category_name,
              r.user_id, r.guest_name, r.contact,
              u.name as registered_name, u.phone_number as registered_phone
       FROM reports r
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.assigned_petugas_id = ? AND r.status_petugas IN ('completed', 'false_report')
       ORDER BY r.completed_at DESC`,
      [user.id]
    );

    let totalCompleted = 0;
    let totalResponseTime = 0;
    let validResponseCount = 0;

    const formattedHistory = history.map((h: any) => {
      let durationSeconds = 0;
      if (h.completed_at && h.accepted_at) {
        durationSeconds = Math.floor(
          (new Date(h.completed_at).getTime() - new Date(h.accepted_at).getTime()) / 1000
        );
      }

      if (h.status_petugas === "completed") {
        totalCompleted++;
      }

      if (h.response_time_seconds) {
        totalResponseTime += h.response_time_seconds;
        validResponseCount++;
      }

      return {
        id: h.id,
        categoryName: h.category_name,
        address: h.address,
        statusPetugas: h.status_petugas,
        createdAt: h.created_at,
        acceptedAt: h.accepted_at,
        arrivedAt: h.arrived_at,
        completedAt: h.completed_at,
        photoUrl: h.completion_photo_url,
        durationSeconds: durationSeconds,
        responseTimeSeconds: h.response_time_seconds || 0,
        user_id: h.user_id,
        guest_name: h.guest_name,
        contact: h.contact,
        registered_name: h.registered_name,
        registered_phone: h.registered_phone,
      };
    });

    const avgResponseTime =
      validResponseCount > 0 ? Math.floor(totalResponseTime / validResponseCount) : 0;

    return jsonWithCors(
      {
        success: true,
        stats: {
          totalCompleted,
          avgResponseTimeSeconds: avgResponseTime,
        },
        history: formattedHistory,
      },
      { request }
    );
  } catch (error: any) {
    console.error("Petugas History API Error:", error);
    return jsonWithCors(
      { error: "Internal Server Error" },
      { status: 500, request }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest } from "@/lib/cors";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);
    if (!user.isOperator && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch("http://localhost:3001/status", { cache: 'no-store' });
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: "disconnected", hasQr: false, error: "WhatsApp Server is down" }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "File tidak ditemukan." }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary belum dikonfigurasi. Tambahkan CLOUDINARY_CLOUD_NAME dan CLOUDINARY_UPLOAD_PRESET.');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cloudFormData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);

    cloudFormData.append('file', blob, file.name || "upload.jpg");
    cloudFormData.append('upload_preset', uploadPreset);
    cloudFormData.append('folder', 'siagabencana/reports');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudFormData
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Cloudinary] Error Response (${response.status}):`, errText);
      throw new Error(`Cloudinary upload gagal: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ url: data.secure_url, success: true });

  } catch (error: any) {
    console.error("[Upload API Error]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengunggah file.", error: error?.message },
      { status: 500 }
    );
  }
}

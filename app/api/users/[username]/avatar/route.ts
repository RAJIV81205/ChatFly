import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { verifyToken } from "@/lib/middleware/verifyToken";
import cloudinary from "cloudinary";

/* ---------------- Cloudinary config ---------------- */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/* ---------------- Upload helper ---------------- */
async function uploadToCloudinary(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload_stream(
      {
        folder: "avatars",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

/* ---------------- Route ---------------- */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    /* ---------- Auth ---------- */
    const CookieStore = await cookies()
    const token = CookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await verifyToken(token);
    if (!currentUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    /* ---------- Authorization ---------- */
      const { username } = await params;
    if (currentUser.username !==  username) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    /* ---------- File ---------- */
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Basic validation
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 2MB)" },
        { status: 400 }
      );
    }

    /* ---------- Upload ---------- */
    const avatarUrl = await uploadToCloudinary(file);

    /* ---------- DB update ---------- */
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { profilePicUrl: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      profilePicUrl: avatarUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

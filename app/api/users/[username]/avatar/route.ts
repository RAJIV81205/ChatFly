import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { verifyToken } from "@/lib/middleware/verifyToken";
import cloudinary from "cloudinary";
import sharp from "sharp";

/* ---------------- Cloudinary config ---------------- */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/* ---------------- Upload helper ---------------- */
async function uploadToCloudinary(
  file: File
): Promise<{ url: string; publicId: string }> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  const optimizedBuffer = await sharp(inputBuffer)
    .rotate() // fix EXIF orientation
    .webp({
      quality: 80,
      effort: 4,
    })
    .toBuffer();

  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload_stream(
      {
        folder: "avatars",
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error || !result) return reject(error);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    ).end(optimizedBuffer);
  });
}

/* ---------------- Route ---------------- */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    /* ---------- Auth ---------- */
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await verifyToken(token);
    if (!currentUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    /* ---------- Authorization ---------- */
    const { username } = await params
    if (currentUser.username !== username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ---------- File ---------- */
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 2MB)" },
        { status: 400 }
      );
    }

    /* ---------- Delete old avatar ---------- */
    if (currentUser.profilePicPublicId) {
      await cloudinary.v2.uploader.destroy(
        currentUser.profilePicPublicId,
        { resource_type: "image" }
      );
    }

    /* ---------- Upload new avatar ---------- */
    const { url, publicId } = await uploadToCloudinary(file);

    /* ---------- DB update ---------- */
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        profilePicUrl: url,
        profilePicPublicId: publicId,
      },
    });

    return NextResponse.json({
      success: true,
      profilePicUrl: url,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

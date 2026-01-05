import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { verifyToken } from "@/lib/middleware/verifyToken";
import cloudinary from "cloudinary";
import { uploadToCloudinary } from "@/lib/cloudinary";

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
    const { username } = await params;

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
    const { url, publicId } = await uploadToCloudinary(
      file,
      `avatars/${currentUser.id}`
    );

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

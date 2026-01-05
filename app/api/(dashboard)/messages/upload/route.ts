import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createMessage } from "@/lib/db/services/messageService";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/* =========================
   POST /api/messages/upload
========================= */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const senderId = formData.get("senderId") as string | null;
    const conversationId = formData.get("conversationId") as string | null;
    const content = formData.get("content") as string | null; // optional caption

    if (!file || !senderId || !conversationId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    /* =========================
       Upload to Cloudinary
    ========================= */

    let uploadResult: { url: string; publicId: string };
    let mimeType = file.type;
    let fileSize = file.size;

    if (file.type.startsWith("image/")) {
      uploadResult = await uploadToCloudinary(
        file,
        `chat-files/${conversationId}`
      );
      mimeType = "image/webp";
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());

      uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `chat-files/${conversationId}`,
              resource_type: "raw"

            },
            (error, result) => {
              if (error || !result) reject(error);
              else
                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                });
            }
          )
          .end(buffer);
      });
    }

    /* =========================
       Delegate EVERYTHING
       to message service
    ========================= */

    const message = await createMessage({
      senderId,
      conversationId,
      content: content ?? undefined,
      files: [
        {
          fileName: file.name,
          fileUrl: uploadResult.url,
          cloudinaryPublicId: uploadResult.publicId,
          fileSize,
          mimeType,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}

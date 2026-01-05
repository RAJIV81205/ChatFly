import cloudinary from "cloudinary";
import sharp from "sharp";

/* ---------------- Cloudinary config ---------------- */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  const optimizedBuffer = await sharp(inputBuffer)
    .rotate()
    .webp({
      quality: 80,
      effort: 4,
    })
    .toBuffer();

  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader
      .upload_stream(
        {
          folder,
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
      )
      .end(optimizedBuffer);
  });
}

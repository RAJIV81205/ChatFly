import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { verifyOtpSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /* ---------- ZOD VALIDATION ---------- */
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;

    /* ---------- FIND OTP RECORD ---------- */
    const otpRecord = await prisma.emailOTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }, // latest OTP
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No OTP found for this email" },
        { status: 404 }
      );
    }

    /* ---------- CHECK EXPIRY ---------- */
    if (otpRecord.expiresAt < new Date()) {
      // cleanup expired OTP
      await prisma.emailOTP.delete({ where: { id: otpRecord.id } });

      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 410 }
      );
    }

    /* ---------- VERIFY OTP ---------- */
    const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValidOtp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    /* ---------- MARK EMAIL VERIFIED ---------- */
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    /* ---------- DELETE USED OTP ---------- */
    await prisma.emailOTP.deleteMany({
      where: { email },
    });

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

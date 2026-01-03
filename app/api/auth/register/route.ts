import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators/auth";
import { sendOTPEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action = "signup" } = body;

    /* =====================================================
       🔁 RESEND OTP FLOW
    ====================================================== */
    if (action === "resend") {
      const { email } = body;

      if (!email) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }

      const pendingUser = await prisma.user.findFirst({
        where: {
          email,
          emailVerified: false,
        },
      });

      if (!pendingUser) {
        return NextResponse.json(
          { error: "No pending verification for this email" },
          { status: 404 }
        );
      }

      // Delete old OTPs
      await prisma.emailOTP.deleteMany({ where: { email } });

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.emailOTP.create({
        data: { email, otpHash, expiresAt },
      });

      await sendOTPEmail(email, otp);

      return NextResponse.json(
        { 
          message: "OTP resent successfully",
          otpExpiresAt: expiresAt.toISOString()
        },
        { status: 200 }
      );
    }

    /* =====================================================
       🧾 SIGNUP FLOW
    ====================================================== */

    /* ---------- ZOD VALIDATION ---------- */
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, fullName, email, phone, password } = parsed.data;

    /* ---------- BLOCK VERIFIED USERS ---------- */
    const verifiedUser = await prisma.user.findFirst({
      where: {
        emailVerified: true,
        OR: [{ username }, { email }, { phone }],
      },
    });

    if (verifiedUser) {
      if (verifiedUser.username === username)
        return NextResponse.json({ error: "Username already exists" }, { status: 409 });
      if (verifiedUser.email === email)
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
      if (verifiedUser.phone === phone)
        return NextResponse.json({ error: "Phone already exists" }, { status: 409 });
    }

    /* ---------- HANDLE UNVERIFIED USER ---------- */
    const pendingUser = await prisma.user.findFirst({
      where: { email, emailVerified: false },
    });

    if (pendingUser) {
      const latestOtp = await prisma.emailOTP.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
      });

      // OTP still valid → do NOT overwrite user
      if (latestOtp && latestOtp.expiresAt > new Date()) {
        return NextResponse.json(
          { error: "OTP already sent. Please verify your email." },
          { status: 409 }
        );
      }

      // OTP expired → clean user + OTP
      await prisma.$transaction([
        prisma.emailOTP.deleteMany({ where: { email } }),
        prisma.user.delete({ where: { id: pendingUser.id } }),
      ]);
    }

    /* ---------- CREATE USER ---------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        phone,
        password: hashedPassword,
        emailVerified: false,
      },
    });

    /* ---------- CREATE & SEND OTP ---------- */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailOTP.create({
      data: { email, otpHash, expiresAt },
    });

    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.emailOTP.deleteMany({ where: { email } });

      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "User created. OTP sent.", 
        userId: user.id,
        otpExpiresAt: expiresAt.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

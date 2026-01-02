import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

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

    /* ---------- CHECK DUPLICATES ---------- */
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { phone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { error: "Phone number already exists" },
          { status: 409 }
        );
      }
    }

    /* ---------- HASH PASSWORD ---------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- CREATE USER ---------- */
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

    /* ---------- SEND OTP (NEXT STEP) ---------- */
    // generate OTP
    // hash OTP
    // save to EmailOTP table
    // send email

    return NextResponse.json(
      { message: "User created. OTP sent.", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

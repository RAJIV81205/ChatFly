import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    /* ---------- VALIDATION ---------- */
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    /* ---------- FIND VERIFIED USER ---------- */
    const user = await prisma.user.findFirst({
      where: {
        email,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    /* ---------- VERIFY PASSWORD ---------- */
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    /* ---------- SIGN JWT ---------- */
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    /* ---------- SET HTTP-ONLY COOKIE ---------- */
    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30 , // 30 day
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

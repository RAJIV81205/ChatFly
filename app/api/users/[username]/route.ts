import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/middleware/verifyToken";
import prisma from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const currentUser = await verifyToken(token);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { username } = await params;
    const isSelf = currentUser.username === username;

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { username },
      select: isSelf
        ? {
            // SELF → full data (except sensitive)
            id: true,
            username: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            profilePicUrl: true,
            bio: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            // ❌ password
            // ❌ lastSeen
          }
        : {
            // OTHER USER → public data only
            id: true,
            username: true,
            fullName: true,
            profilePicUrl: true,
            lastSeen: true,
          },
    });

    if (!user || (!isSelf && "emailVerified" in user && !user.emailVerified)) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      isSelf,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

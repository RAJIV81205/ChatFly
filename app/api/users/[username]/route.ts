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
          phone: true,
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


export async function PUT(
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

    if (!isSelf) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, phone, bio } = body;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { username },
      data: {
        fullName,
        phone,
        bio,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }


}

export async function DELETE(
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

    if (!isSelf) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { username },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    return NextResponse.json(
      { error: "Failed to delete user profile" },
      { status: 500 }
    );
  }
}




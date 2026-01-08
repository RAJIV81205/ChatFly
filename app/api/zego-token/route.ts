import { NextRequest, NextResponse } from "next/server";
import { generateToken04 } from "./zegoServerAssistant";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const roomId = searchParams.get("roomId");

    if (!userId || !roomId) {
      return NextResponse.json(
        { error: "Missing userId or roomId parameters" },
        { status: 400 }
      );
    }

    const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appId || isNaN(appId)) {
      console.error("Invalid NEXT_PUBLIC_ZEGO_APP_ID:", process.env.NEXT_PUBLIC_ZEGO_APP_ID);
      return NextResponse.json(
        { error: "Invalid Zego App ID configuration" },
        { status: 500 }
      );
    }

    if (!serverSecret) {
      console.error("ZEGO_SERVER_SECRET is not configured");
      return NextResponse.json(
        { error: "Zego server secret not configured" },
        { status: 500 }
      );
    }

    // Generate token with 24 hour expiry
    const effectiveTimeInSeconds = Math.floor(Date.now() / 1000);
    const expireTimeInSeconds = effectiveTimeInSeconds + 24 * 3600; // 24 hours

    // Zego expects this specific payload format
    const payloadObject = {
      room_id: roomId,
      privilege: {
        1: 1, // Login privilege
        2: 1, // Publish privilege  
      },
      stream_id_list: null,
    };
    const payload = JSON.stringify(payloadObject);

    console.log("Generating token with:", {
      appId,
      userId,
      roomId,
      serverSecret: serverSecret ? "***configured***" : "NOT SET",
      effectiveTime: new Date(effectiveTimeInSeconds * 1000).toISOString(),
      expireTime: new Date(expireTimeInSeconds * 1000).toISOString(),
      payload: payloadObject
    });

    const token = generateToken04(
      appId,
      userId,
      serverSecret,
      effectiveTimeInSeconds,
      expireTimeInSeconds,
      payload
    );

    if (!token) {
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: 500 }
      );
    }

    console.log("Token generated successfully, length:", token.length);

    return NextResponse.json({ 
      token,
      appId,
      userId,
      roomId,
      expiresAt: expireTimeInSeconds
    });
  } catch (error) {
    console.error("Error generating Zego token:", error);
    return NextResponse.json(
      { error: `Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
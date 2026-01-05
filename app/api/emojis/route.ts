import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://www.emoji.family/api/emojis", {
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch emojis" },
      { status: 500 } 
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

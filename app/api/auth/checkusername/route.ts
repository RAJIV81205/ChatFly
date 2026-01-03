import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST(request: Request) {
    try {
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                username,
                emailVerified: true
            }
        });

        console.log("User found:", !!user); // Debug log

        if (!user) {
            return NextResponse.json({ "message": "Username Available" }, { status: 200 })
        }

        return NextResponse.json({ "message": "Username Not Available" }, { status: 400 })

    } catch (error) {
        console.error("API Error:", error); // Debug log
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

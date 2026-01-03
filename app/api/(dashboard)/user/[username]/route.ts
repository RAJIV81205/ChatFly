import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/middleware/verifyToken";
import prisma from "@/lib/db/prisma";
import { cookies } from 'next/headers';

export async function GET(request: Request, {
    params }: {
        params: { username: string }
    }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    // Verify token and get user
    const user = await verifyToken(token);
    if (!user) {
        return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
        );
    }

    const routes = await prisma.route.findMany({
        where: {
            userId: user.id
        }
    });

    return NextResponse.json(routes);
}

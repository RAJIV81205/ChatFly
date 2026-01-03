import prisma from "../db/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";

interface TokenPayload extends JwtPayload {
    userId: string;
    email: string;
}

export async function verifyToken(token: string) {
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId
            }
        });
        if (!user) {
            return null;
        }
        return user;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}
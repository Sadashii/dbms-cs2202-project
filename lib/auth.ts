// lib/auth.ts
import jwt from "jsonwebtoken";

export const verifyAuth = (reqHeaders: Headers) => {
    const authHeader = reqHeaders.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;


    try {
        const token = authHeader.split(" ")[1];
        console.log(jwt.verify(token, process.env.JWT_ACCESS_SECRET!));

        return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string, role: string };
    } catch {
        return null;
    }
};
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";

export async function POST() {
    try {
        const cookieStore = cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (refreshToken) {
            await dbConnect();
            // Delete the specific session from the database to invalidate it server-side
            await Session.deleteOne({ refreshToken });
        }

        // Create a response and tell the browser to delete the cookie
        const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
        
        response.cookies.set("refresh_token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0, // Immediately expires the cookie
            path: "/",
        });

        return response;

    } catch (error: any) {
        console.error("Logout Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
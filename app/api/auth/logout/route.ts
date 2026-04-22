import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (refreshToken) {
            await dbConnect();

            await Session.deleteOne({ refreshToken });
        }

        const response = NextResponse.json(
            { message: "Logged out successfully" },
            { status: 200 },
        );

        response.cookies.set("refresh_token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        });

        return response;
    } catch (error: any) {
        console.error("Logout Error:", error);
        return NextResponse.json(
            { message: "Internal server error." },
            { status: 500 },
        );
    }
}

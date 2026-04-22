import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const authPayload = verifyAuth(req.headers);
        if (!authPayload || !authPayload.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(authPayload.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();

        return NextResponse.json({ message: "2FA disabled successfully" }, { status: 200 });
    } catch (err: any) {
        console.error("2FA Disable Error:", err);
        return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
    }
}

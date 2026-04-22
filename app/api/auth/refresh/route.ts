import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Session from "@/models/Session";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { backfillMissingCustomerIds, ensureUserHasValidCustomerId } from "@/lib/customerId";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
            return NextResponse.json({ message: "No refresh token provided." }, { status: 401 });
        }

        // Verify JWT signature
        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
        } catch (err) {
            return NextResponse.json({ message: "Invalid or expired refresh token." }, { status: 401 });
        }

        await dbConnect();
        await backfillMissingCustomerIds();

        // Ensure session exists in DB (meaning it wasn't revoked)
        const activeSession = await Session.findOne({ refreshToken });
        if (!activeSession) {
            return NextResponse.json({ message: "Session terminated remotely." }, { status: 401 });
        }

        // Fetch user data
        const user = await ensureUserHasValidCustomerId(decoded.userId);
        if (!user || user.currentStatus === 'Disabled' || user.currentStatus === 'Suspended') {
            return NextResponse.json({ message: "User account is suspended or disabled." }, { status: 403 });
        }

        // Issue new short-lived access token
        const newAccessToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: "15m" }
        );

        const userPayload = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            customerId: user.customerId,
            email: user.email,
            role: user.role,
            currentStatus: user.currentStatus,
        };

        return NextResponse.json({ 
            access_token: newAccessToken, 
            user: userPayload 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Refresh Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

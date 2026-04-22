import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notifications";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { checkRateLimit } from "@/lib/rateLimit";

const getUserAuth = async (request: Request) => {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
            userId: string;
            role: string;
        };
        return decoded;
    } catch {
        return null;
    }
};

export async function GET(request: Request) {
    try {
        const reqHeaders = await headers();
        const ip = reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? "unknown";
        if (!checkRateLimit(ip, "notifications-get", 100, 15 * 60 * 1000)) {
            return NextResponse.json({ message: "Too many requests" }, { status: 429 });
        }
        const user = await getUserAuth(request);
        if (!user)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();

        const notifications = await Notification.find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ notifications }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const reqHeaders = await headers();
        const ip = reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? "unknown";
        if (!checkRateLimit(ip, "notifications-patch", 20, 15 * 60 * 1000)) {
            return NextResponse.json({ message: "Too many requests" }, { status: 429 });
        }
        const user = await getUserAuth(request);
        if (!user)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        await dbConnect();
        const body = await request.json();

        if (body.markAll) {
            await Notification.updateMany(
                { userId: user.userId, isRead: false },
                { $set: { isRead: true, readAt: new Date() } },
            );
            return NextResponse.json(
                { message: "All notifications marked as read." },
                { status: 200 },
            );
        }

        if (!body.notificationId) {
            return NextResponse.json(
                { message: "Notification ID required." },
                { status: 400 },
            );
        }

        const notif = await Notification.findOneAndUpdate(
            { _id: body.notificationId, userId: user.userId },
            { $set: { isRead: true, readAt: new Date() } },
            { new: true },
        );

        if (!notif)
            return NextResponse.json(
                { message: "Not found." },
                { status: 404 },
            );

        return NextResponse.json(
            { message: "Marked as read.", notification: notif },
            { status: 200 },
        );
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

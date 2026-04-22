import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { verifyAuth } from "@/lib/auth";
import Session from "@/models/Session";

export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const authPayload = verifyAuth(req.headers);

        if (!authPayload || !authPayload.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("id");

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        if (sessionId === "all") {
            await Session.deleteMany({ userId: authPayload.userId });
            return NextResponse.json({ message: "All sessions logged out" }, { status: 200 });
        }

        const deleted = await Session.findOneAndDelete({ _id: sessionId, userId: authPayload.userId });
        
        if (!deleted) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Session logged out" }, { status: 200 });
    } catch (error: any) {
        console.error("DELETE Session Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

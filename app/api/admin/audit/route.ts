import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AuditLog from "@/models/Auditlogs";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";

/**
 * GET /api/admin/audit
 * Returns a paginated, filterable, and searchable list of audit logs.
 * Restricted to Manager and Admin roles.
 */
export async function GET(req: Request) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded || !["Admin", "Manager"].includes(decoded.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        // Ensure User model is registered for populate
        User.init();

        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
        const skip = (page - 1) * limit;

        // Filters
        const category = url.searchParams.get("category");
        const severity = url.searchParams.get("severity");
        const status = url.searchParams.get("status");
        const actionType = url.searchParams.get("actionType");
        const userId = url.searchParams.get("userId");
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");
        const search = url.searchParams.get("search");

        const query: any = {};

        if (category) query.category = category;
        if (severity) query.severity = severity;
        if (status) query.currentStatus = status;
        if (actionType) query.actionType = actionType;
        if (userId) query.userId = userId;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        if (search) {
            query.$or = [
                { logReference: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { resource: { $regex: search, $options: "i" } },
            ];
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate("userId", "firstName lastName email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error("Audit API Error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

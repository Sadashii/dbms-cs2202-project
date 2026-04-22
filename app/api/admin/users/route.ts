import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded)
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            );

        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");
        const roleFilter = searchParams.get("role");

        await dbConnect();

        let query: any = {};

        if (decoded.role === "Admin") {
            if (branchId) query.branchId = branchId;
            if (roleFilter) query.role = roleFilter;
        } else if (decoded.role === "Manager") {
            const currentUser = await User.findById(decoded.userId).select(
                "branchId",
            );
            if (!currentUser?.branchId) {
                return NextResponse.json(
                    { message: "Manager not assigned to a branch" },
                    { status: 403 },
                );
            }

            query.$or = [
                { role: "Employee", branchId: currentUser.branchId },
                { role: "Customer" },
            ];

            if (roleFilter) {
                if (roleFilter === "Employee") {
                    query = {
                        role: "Employee",
                        branchId: currentUser.branchId,
                    };
                } else if (roleFilter === "Customer") {
                    query = { role: "Customer" };
                } else {
                    return NextResponse.json(
                        {
                            message:
                                "Forbidden: Managers cannot see " + roleFilter,
                        },
                        { status: 403 },
                    );
                }
            }
            if (branchId && branchId !== currentUser.branchId.toString()) {
                query = { role: "Customer", branchId: branchId };
            }
        } else if (decoded.role === "Employee") {
            query.role = "Customer";
            if (branchId) query.branchId = branchId;
        } else {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const users = await User.find(query)
            .select("-passwords")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 },
        );
    }
}

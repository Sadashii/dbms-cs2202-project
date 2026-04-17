import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = verifyAuth(await headers());
        if (!decoded) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { id } = (await context.params);
        const { role, branchId } = await req.json();

        await dbConnect();

        const currentUser = await User.findById(decoded.userId);
        if (!currentUser) return NextResponse.json({ message: "Requester not found" }, { status: 404 });

        const targetUser = await User.findById(id);
        if (!targetUser) return NextResponse.json({ message: "Target user not found" }, { status: 404 });

        // RBAC Enforcement for Role Updates
        const roles = ['Customer', 'Employee', 'Manager', 'Admin'];
        const myRank = roles.indexOf(currentUser.role);
        const targetRank = roles.indexOf(targetUser.role);
        const newRoleRank = roles.indexOf(role);

        // Can only update if my rank is higher than current rank of target AND higher than or equal to the new rank
        // Exception: Admins can do anything except make someone an Admin (or we could allow Admin promotion depending on policy).
        // Let's stick to the rule: "update their role to a position below them"
        
        if (decoded.role !== 'Admin') {
            if (newRoleRank >= myRank) {
                return NextResponse.json({ message: "Forbidden: Cannot assign role >= your own" }, { status: 403 });
            }
            if (targetRank >= myRank) {
                return NextResponse.json({ message: "Forbidden: Cannot update user with role >= your own" }, { status: 403 });
            }
        }

        // Branch update logic
        if (branchId && decoded.role !== 'Admin') {
            // Managers can only assign employees to THEIR branch
            if (currentUser.branchId.toString() !== branchId) {
                return NextResponse.json({ message: "Forbidden: Cannot assign to another branch" }, { status: 403 });
            }
        }

        targetUser.role = role || targetUser.role;
        if (branchId !== undefined) targetUser.branchId = branchId;
        
        await targetUser.save();

        return NextResponse.json({ message: "User updated successfully", user: targetUser });

    } catch (error: any) {
        console.error("Error updating user role:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Complaint from "@/models/Complaints";
import ComplaintMessage from "@/models/ComplaintMessage";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { ensureUserHasValidCustomerId } from "@/lib/customerId";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST() {
    try {
        const reqHeaders = await headers();
        const ip =
            reqHeaders.get("x-forwarded-for") ??
            reqHeaders.get("x-real-ip") ??
            "unknown";
        if (
            !checkRateLimit(
                ip,
                "account-delete-request",
                2,
                24 * 60 * 60 * 1000,
            )
        ) {
            return NextResponse.json(
                { error: "Too many delete requests. Please contact support." },
                { status: 429 },
            );
        }

        await dbConnect();
        const decoded = verifyAuth(reqHeaders);
        if (!decoded?.userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const user = await ensureUserHasValidCustomerId(decoded.userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 },
            );
        }

        const existingRequest = await Complaint.findOne({
            userId: user._id,
            category: "Account",
            subject: "Account deletion request",
            currentStatus: { $in: ["Open", "In-Progress", "Re-Opened"] },
        }).sort({ createdAt: -1 });

        if (existingRequest) {
            return NextResponse.json(
                {
                    message: `Deletion request already exists under ticket ${existingRequest.ticketId}.`,
                    ticketId: existingRequest.ticketId,
                },
                { status: 200 },
            );
        }

        const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
        const description = `Customer ${user.firstName} ${user.lastName} requested account deletion. Customer ID: ${user.customerId}. Email: ${user.email}.`;

        const ticket = await Complaint.create({
            ticketId,
            userId: user._id,
            category: "Account",
            priority: "High",
            subject: "Account deletion request",
            description,
            currentStatus: "Open",
            statusHistory: [{ state: "Open", updatedAt: new Date() }],
            lastMessageAt: new Date(),
        });

        await ComplaintMessage.create({
            complaintId: ticket._id,
            senderId: user._id,
            senderRole: "Customer",
            message: description,
        });

        await createAuditLog({
            userId: user._id,
            userRole: decoded.role,
            actionType: "SUPPORT_TICKET_CREATED",
            category: "Security",
            severity: "Medium",
            resource: "Complaint",
            resourceId: ticket._id,
            description: "Customer requested account deletion.",
            currentStatus: "Success",
            payload: {
                newState: JSON.stringify({
                    ticketId: ticket.ticketId,
                    customerId: user.customerId,
                    subject: ticket.subject,
                }),
            },
        });

        return NextResponse.json(
            {
                message: `Deletion request submitted successfully under ticket ${ticket.ticketId}.`,
                ticketId: ticket.ticketId,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Delete Request Error:", error);
        return NextResponse.json(
            { error: "Failed to submit deletion request." },
            { status: 500 },
        );
    }
}

import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import AuditLog from "@/models/Auditlogs";
import crypto from "crypto";

export type AuditLogOptions = {
    userId: string;
    userRole: string;
    actionType:
        | "AUTH_LOGIN"
        | "AUTH_LOGOUT"
        | "AUTH_PASSWORD_CHANGE"
        | "AUTH_PASSWORD_RESET"
        | "TRANSACTION_INITIATED"
        | "TRANSACTION_COMPLETED"
        | "TRANSACTION_FAILED"
        | "ACCOUNT_REQUESTED"
        | "ACCOUNT_CREATED"
        | "ACCOUNT_REJECTED"
        | "ACCOUNT_FROZEN"
        | "ACCOUNT_UNFROZEN"
        | "KYC_SUBMITTED"
        | "KYC_VERIFIED"
        | "KYC_REJECTED"
        | "LOAN_APPLIED"
        | "LOAN_APPROVED"
        | "LOAN_REJECTED"
        | "CARD_REQUESTED"
        | "CARD_ISSUED"
        | "CARD_REJECTED"
        | "CARD_STATUS_CHANGED"
        | "CARD_DELETED"
        | "CARD_EXPENSE"
        | "CARD_REPAYMENT"
        | "SUPPORT_TICKET_CREATED"
        | "SUPPORT_TICKET_REPLY"
        | "SUPPORT_TICKET_RESOLVED";
    category: "Security" | "Financial" | "Operational" | "Administrative";
    severity: "Low" | "Medium" | "High" | "Critical";
    resource: string;
    resourceId?: string;
    description: string;
    currentStatus: "Success" | "Failure" | "Blocked" | "Flagged";
    payload?: {
        previousState?: any;
        newState?: any;
        diff?: string[];
    };
    metadata?: {
        deviceId?: string;
        geoPoint?: string;
        sessionId?: string;
    };
};

export async function createAuditLog(options: AuditLogOptions) {
    try {
        await dbConnect();

        const reqHeaders = await headers();
        const ipAddress =
            reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
            reqHeaders.get("x-real-ip") ||
            "unknown";
        const userAgent = reqHeaders.get("user-agent") || "unknown";

        const logReference = `LOG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        const formattedPayload = {
            previousState: options.payload?.previousState
                ? JSON.stringify(options.payload.previousState)
                : undefined,
            newState: options.payload?.newState
                ? JSON.stringify(options.payload.newState)
                : undefined,
            diff: options.payload?.diff || [],
        };

        const auditEntry = await AuditLog.create({
            logReference,
            userId: options.userId,
            userRole: options.userRole,
            actionType: options.actionType,
            category: options.category,
            severity: options.severity,
            resource: options.resource,
            resourceId: options.resourceId,
            description: options.description,
            currentStatus: options.currentStatus,
            payload: formattedPayload,
            metadata: {
                ipAddress,
                userAgent,
                deviceId: options.metadata?.deviceId,
                geoPoint: options.metadata?.geoPoint,
                sessionId: options.metadata?.sessionId,
            },
        });

        return auditEntry;
    } catch (error) {
        console.error("Critical: Failed to create audit log:", error);
        return null;
    }
}

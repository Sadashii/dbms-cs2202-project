import mongoose, { Schema, Document, Types } from "mongoose";
import crypto from "crypto";

export interface IAuditLog extends Document {
    logReference: string;
    userId: Types.ObjectId;
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
    resourceId?: Types.ObjectId;

    description: string;

    payload: {
        previousState?: string;
        newState?: string;
        diff?: string[];
    };

    metadata: {
        ipAddress: string;
        userAgent: string;
        deviceId?: string;
        geoPoint?: string;
        sessionId?: string;
    };

    currentStatus: "Success" | "Failure" | "Blocked" | "Flagged";

    logHash: string;
    expiresAt: Date;

    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        logReference: {
            type: String,
            unique: true,
            required: true,
            immutable: true,
            uppercase: true,
            trim: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
            immutable: true,
        },
        userRole: {
            type: String,
            required: true,
            immutable: true,
        },
        actionType: {
            type: String,
            required: true,
            index: true,
            immutable: true,
        },
        category: {
            type: String,
            enum: ["Security", "Financial", "Operational", "Administrative"],
            required: true,
            index: true,
            immutable: true,
        },
        severity: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Low",
            index: true,
            immutable: true,
        },
        resource: { type: String, required: true, immutable: true },
        resourceId: {
            type: Schema.Types.ObjectId,
            immutable: true,
            index: true,
        },
        description: { type: String, required: true, immutable: true },

        payload: {
            previousState: { type: String, immutable: true },
            newState: { type: String, immutable: true },
            diff: [{ type: String, immutable: true }],
        },

        metadata: {
            ipAddress: { type: String, required: true, immutable: true },
            userAgent: { type: String, required: true, immutable: true },
            deviceId: { type: String, immutable: true },
            geoPoint: { type: String, immutable: true },
            sessionId: { type: String, immutable: true },
        },

        currentStatus: {
            type: String,
            enum: ["Success", "Failure", "Blocked", "Flagged"],
            required: true,
            index: true,
            immutable: true,
        },

        logHash: {
            type: String,
            required: true,
            immutable: true,
        },

        expiresAt: {
            type: Date,
            required: true,
            immutable: true,

            default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

AuditLogSchema.pre("validate", async function () {
    if (this.isNew && !this.logHash) {
        const dataToHash = `${this.logReference}|${this.userId}|${this.actionType}|${this.currentStatus}|${this.createdAt?.toISOString()}`;
        this.logHash = crypto
            .createHash("sha256")
            .update(dataToHash)
            .digest("hex");
    }
});

AuditLogSchema.pre("save", async function () {
    if (!this.isNew) {
        throw new Error(
            "Audit logs are strictly append-only and cannot be updated.",
        );
    }
});

AuditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

AuditLogSchema.index({ severity: 1, currentStatus: 1, createdAt: -1 });

AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog ||
    mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

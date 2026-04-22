import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComplaint extends Document {
    ticketId: string;
    userId: Types.ObjectId;

    category: "Transaction" | "Loan" | "Account" | "KYC" | "Card" | "Other";
    priority: "Low" | "Medium" | "High" | "Urgent";
    subject: string;
    description: string;

    assignedTo?: Types.ObjectId;

    currentStatus: "Open" | "In-Progress" | "Resolved" | "Closed" | "Re-Opened";

    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        relatedTransactionId?: Types.ObjectId;
        relatedAccountId?: Types.ObjectId;
    };

    statusHistory: Array<{
        state: "Open" | "In-Progress" | "Resolved" | "Closed" | "Re-Opened";
        updatedBy?: Types.ObjectId;
        remarks?: string;
        updatedAt: Date;
    }>;

    lastMessageAt: Date;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
    {
        ticketId: {
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
        category: {
            type: String,
            enum: ["Transaction", "Loan", "Account", "KYC", "Card", "Other"],
            required: true,
            immutable: true,
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Urgent"],
            default: "Medium",
            index: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            immutable: true,
        },
        description: {
            type: String,
            required: true,
            immutable: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        currentStatus: {
            type: String,
            enum: ["Open", "In-Progress", "Resolved", "Closed", "Re-Opened"],
            default: "Open",
            index: true,
        },
        metadata: {
            ipAddress: { type: String, immutable: true },
            userAgent: { type: String, immutable: true },
            relatedTransactionId: {
                type: Schema.Types.ObjectId,
                ref: "Transaction",
                immutable: true,
            },
            relatedAccountId: {
                type: Schema.Types.ObjectId,
                ref: "Account",
                immutable: true,
            },
        },
        statusHistory: [
            {
                state: {
                    type: String,
                    enum: [
                        "Open",
                        "In-Progress",
                        "Resolved",
                        "Closed",
                        "Re-Opened",
                    ],
                    required: true,
                },
                updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
                remarks: { type: String },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
        lastMessageAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        resolvedAt: { type: Date },
    },
    {
        timestamps: true,

        optimisticConcurrency: true,
    },
);

ComplaintSchema.pre("save", async function () {
    if (this.isModified("currentStatus")) {
        const lastEntry = this.statusHistory[this.statusHistory.length - 1];
        this.statusHistory.push({
            state: this.currentStatus,
            updatedBy: lastEntry?.updatedBy,
            updatedAt: new Date(),
        });

        if (
            ["Resolved", "Closed"].includes(this.currentStatus) &&
            !this.resolvedAt
        ) {
            this.resolvedAt = new Date();
        }

        if (this.currentStatus === "Re-Opened") {
            this.resolvedAt = undefined;
        }
    }
});

ComplaintSchema.index({ assignedTo: 1, currentStatus: 1, lastMessageAt: -1 });

ComplaintSchema.index({ priority: 1, currentStatus: 1 });

export default mongoose.models.Complaint ||
    mongoose.model<IComplaint>("Complaint", ComplaintSchema);

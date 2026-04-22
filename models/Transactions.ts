import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITransaction extends Document {
    referenceId: string;
    type:
        | "Transfer"
        | "Deposit"
        | "Withdrawal"
        | "EMI_Payment"
        | "Fee"
        | "Refund";
    currency: "INR" | "USD" | "EUR";
    currentStatus: "Pending" | "Completed" | "Failed" | "Reversed";
    metadata?: {
        ipAddress?: string;
        failureReason?: string;
        initiatedBy?: Types.ObjectId;
    };
    statusHistory: Array<{
        state: "Pending" | "Completed" | "Failed" | "Reversed";
        updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        referenceId: {
            type: String,
            unique: true,
            required: true,
            immutable: true,
        },
        type: {
            type: String,
            enum: [
                "Transfer",
                "Deposit",
                "Withdrawal",
                "EMI_Payment",
                "Fee",
                "Refund",
            ],
            required: true,
            immutable: true,
        },
        currency: {
            type: String,
            default: "INR",
            enum: ["INR", "USD", "EUR"],
            immutable: true,
        },
        currentStatus: {
            type: String,
            enum: ["Pending", "Completed", "Failed", "Reversed"],
            default: "Pending",
            index: true,
        },
        metadata: {
            ipAddress: { type: String },
            failureReason: { type: String },
            initiatedBy: { type: Schema.Types.ObjectId, ref: "User" },
            cardId: { type: Schema.Types.ObjectId, ref: "Card" },
            merchant: { type: String },
            accountId: { type: Schema.Types.ObjectId, ref: "Account" },
            repayment: { type: Boolean },
            isOnline: { type: Boolean, default: false },
            isInternational: { type: Boolean, default: false },
            isContactless: { type: Boolean, default: false },
            isATM: { type: Boolean, default: false },
        },
        statusHistory: [
            {
                state: {
                    type: String,
                    enum: ["Pending", "Completed", "Failed", "Reversed"],
                },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    },
);

TransactionSchema.pre("save", async function () {
    if (this.isModified("currentStatus")) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedAt: new Date(),
        });
    }
});

export default mongoose.models.Transaction ||
    mongoose.model<ITransaction>("Transaction", TransactionSchema);

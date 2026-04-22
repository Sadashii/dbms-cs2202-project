import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAccount extends Document {
    userId: Types.ObjectId;
    branchId: Types.ObjectId;
    accountNumber: string;
    accountType: "Savings" | "Current" | "Fixed";
    balance: Types.Decimal128;
    currency: "INR" | "USD" | "EUR";
    currentStatus: "Active" | "Frozen" | "Closed";
    statusHistory: Array<{
        state: "Active" | "Frozen" | "Closed";
        reason?: string;
        updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
            immutable: true,
        },
        branchId: {
            type: Schema.Types.ObjectId,
            ref: "Branch",
            required: false,
            index: true,
            immutable: true,
        },
        accountNumber: {
            type: String,
            unique: true,
            required: true,
            immutable: true,
        },
        accountType: {
            type: String,
            enum: ["Savings", "Current", "Fixed"],
            required: true,
            immutable: true,
        },
        balance: {
            type: Schema.Types.Decimal128,
            default: 0.0,
            min: [0, "Amount must be greater than or equal to zero"],
        },
        currency: {
            type: String,
            default: "INR",
            enum: ["INR", "USD", "EUR"],
            immutable: true,
        },
        currentStatus: {
            type: String,
            enum: ["Active", "Frozen", "Closed"],
            default: "Active",
            index: true,
        },
        statusHistory: [
            {
                state: {
                    type: String,
                    enum: ["Active", "Frozen", "Closed"],
                    required: true,
                },
                reason: { type: String },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
        optimisticConcurrency: true,
    },
);

AccountSchema.pre("save", async function () {
    if (this.isModified("currentStatus")) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedAt: new Date(),
        });
    }
});

AccountSchema.index({ userId: 1, currentStatus: 1 });

export default mongoose.models.Account ||
    mongoose.model<IAccount>("Account", AccountSchema);

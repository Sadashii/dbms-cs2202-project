import mongoose, { Schema, Document, Types } from "mongoose";

export interface IScheduledPayment extends Document {
    scheduleReference: string;
    userId: Types.ObjectId;
    accountId: Types.ObjectId;
    beneficiaryId: Types.ObjectId;

    amount: Types.Decimal128;
    currency: "INR" | "USD" | "EUR";

    frequency: "Once" | "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";

    startDate: Date;
    nextRunDate: Date;
    endDate?: Date;

    executionHistory: Array<{
        attemptedAt: Date;
        status: "Success" | "Failed";
        transactionId?: Types.ObjectId;
        failureReason?: string;
    }>;

    currentStatus: "Active" | "Paused" | "Completed" | "Cancelled";

    metadata?: {
        ipAddress?: string;
        description?: string;
    };

    statusHistory: Array<{
        state: "Active" | "Paused" | "Completed" | "Cancelled";
        updatedBy: Types.ObjectId;
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

const ScheduledPaymentSchema = new Schema<IScheduledPayment>(
    {
        scheduleReference: {
            type: String,
            unique: true,
            required: true,
            immutable: true,
            uppercase: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        accountId: {
            type: Schema.Types.ObjectId,
            ref: "Account",
            required: true,
        },
        beneficiaryId: {
            type: Schema.Types.ObjectId,
            ref: "Beneficiary",
            required: true,
        },
        amount: {
            type: Schema.Types.Decimal128,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
            enum: ["INR", "USD", "EUR"],
            immutable: true,
        },
        frequency: {
            type: String,
            enum: ["Once", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
            required: true,
        },
        startDate: { type: Date, required: true },
        nextRunDate: { type: Date, required: true, index: true },
        endDate: { type: Date },

        executionHistory: [
            {
                attemptedAt: { type: Date, default: Date.now },
                status: { type: String, enum: ["Success", "Failed"] },
                transactionId: {
                    type: Schema.Types.ObjectId,
                    ref: "Transaction",
                },
                failureReason: { type: String },
            },
        ],

        currentStatus: {
            type: String,
            enum: ["Active", "Paused", "Completed", "Cancelled"],
            default: "Active",
            index: true,
        },
        metadata: {
            ipAddress: { type: String },
            description: { type: String },
        },
        statusHistory: [
            {
                state: { type: String },
                updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    },
);

ScheduledPaymentSchema.pre("save", async function () {
    if (this.isModified("currentStatus")) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedBy: this.userId,
            updatedAt: new Date(),
        });
    }
});

ScheduledPaymentSchema.index({ nextRunDate: 1, currentStatus: 1 });
ScheduledPaymentSchema.index({ userId: 1 });

export default mongoose.models.ScheduledPayment ||
    mongoose.model<IScheduledPayment>(
        "ScheduledPayment",
        ScheduledPaymentSchema,
    );

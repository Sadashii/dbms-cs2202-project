import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILoanPayment extends Document {
    paymentReference: string;
    loanId: Types.ObjectId;
    userId: Types.ObjectId;
    transactionId?: Types.ObjectId;

    amountExpected: Types.Decimal128;
    amountPaid: Types.Decimal128;

    principalComponent: Types.Decimal128;
    interestComponent: Types.Decimal128;
    lateFeeComponent: Types.Decimal128;

    currency: "INR" | "USD" | "EUR";
    dueDate: Date;
    paidDate?: Date;

    currentStatus:
        | "Pending"
        | "Paid"
        | "Partial"
        | "Overdue"
        | "Failed"
        | "Refunded";

    metadata?: {
        paymentMethod: "Internal_Transfer" | "External_ACH" | "Cash" | "Cheque";
        ipAddress?: string;
        failureReason?: string;
        notes?: string;
    };

    statusHistory: Array<{
        state:
            | "Pending"
            | "Paid"
            | "Partial"
            | "Overdue"
            | "Failed"
            | "Refunded";
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

const LoanPaymentSchema = new Schema<ILoanPayment>(
    {
        paymentReference: {
            type: String,
            unique: true,
            required: true,
            immutable: true,
            uppercase: true,
            trim: true,
        },
        loanId: {
            type: Schema.Types.ObjectId,
            ref: "Loan",
            required: true,
            index: true,
            immutable: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
            immutable: true,
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: "Transaction",
            immutable: true,
        },
        amountExpected: {
            type: Schema.Types.Decimal128,
            required: true,
            min: [0, "Expected amount cannot be negative"],
        },
        amountPaid: {
            type: Schema.Types.Decimal128,
            required: true,
            min: [0, "Amount paid cannot be negative"],
            validate: {
                validator: function (this: any, v: any) {
                    if (this.currentStatus === "Pending") return true;

                    const paid = parseFloat(v.toString());
                    const principal = parseFloat(
                        this.principalComponent?.toString() || "0",
                    );
                    const interest = parseFloat(
                        this.interestComponent?.toString() || "0",
                    );
                    const lateFee = parseFloat(
                        this.lateFeeComponent?.toString() || "0",
                    );
                    const total = principal + interest + lateFee;

                    return Math.abs(paid - total) < 0.01;
                },
                message: (props: any) =>
                    `Account Reconciliation Error: The amount paid must match the sum of its components (Principal/Interest).`,
            },
        },
        principalComponent: {
            type: Schema.Types.Decimal128,
            required: true,
            default: 0.0,
            min: [0, "Principal component cannot be negative"],
        },
        interestComponent: {
            type: Schema.Types.Decimal128,
            required: true,
            default: 0.0,
            min: [0, "Interest component cannot be negative"],
        },
        lateFeeComponent: {
            type: Schema.Types.Decimal128,
            required: true,
            default: 0.0,
            min: [0, "Late fee component cannot be negative"],
        },
        currency: {
            type: String,
            default: "INR",
            enum: ["INR", "USD", "EUR"],
            immutable: true,
        },
        dueDate: {
            type: Date,
            required: true,
            immutable: true,
        },
        paidDate: {
            type: Date,
        },
        currentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Partial",
                "Overdue",
                "Failed",
                "Refunded",
            ],
            default: "Pending",
            index: true,
        },
        metadata: {
            paymentMethod: {
                type: String,
                enum: ["Internal_Transfer", "External_ACH", "Cash", "Cheque"],
                default: "Internal_Transfer",
            },
            ipAddress: { type: String },
            failureReason: { type: String },
            notes: { type: String },
        },
        statusHistory: [
            {
                state: {
                    type: String,
                    enum: [
                        "Pending",
                        "Paid",
                        "Partial",
                        "Overdue",
                        "Failed",
                        "Refunded",
                    ],
                    required: true,
                },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
        optimisticConcurrency: true,
    },
);

LoanPaymentSchema.pre("save", function (next) {
    if (this.isModified("currentStatus")) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedAt: new Date(),
        });

        if (
            ["Paid", "Partial"].includes(this.currentStatus) &&
            !this.paidDate
        ) {
            this.paidDate = new Date();
        }
    }
});

LoanPaymentSchema.index({ loanId: 1, currentStatus: 1, dueDate: 1 });

LoanPaymentSchema.index({ userId: 1, currentStatus: 1, createdAt: -1 });

export default mongoose.models.LoanPayment ||
    mongoose.model<ILoanPayment>("LoanPayment", LoanPaymentSchema);

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBeneficiary extends Document {
    userId: Types.ObjectId;
    nickName: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    ifscCode: string;
    createdAt: Date;
    updatedAt: Date;
}

const BeneficiarySchema = new Schema<IBeneficiary>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        nickName: {
            type: String,
            required: true,
            trim: true,
        },
        accountNumber: {
            type: String,
            required: true,
            trim: true,
        },
        accountName: {
            type: String,
            required: true,
            trim: true,
        },
        bankName: {
            type: String,
            required: true,
            default: "VaultPay Internal",
        },
        ifscCode: {
            type: String,
            required: true,
            uppercase: true,
            default: "VLTB0001234",
        },
    },
    {
        timestamps: true,
    },
);

BeneficiarySchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

export default mongoose.models.Beneficiary ||
    mongoose.model<IBeneficiary>("Beneficiary", BeneficiarySchema);

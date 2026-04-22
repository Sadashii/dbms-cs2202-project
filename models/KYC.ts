import mongoose, { Schema, Document, Types } from "mongoose";

export interface IKYC extends Document {
    kycReference: string;
    userId: Types.ObjectId;
    accountRequestId?: Types.ObjectId;

    documentType:
        | "Passport"
        | "SSN"
        | "National_ID"
        | "Driving_License"
        | "PAN"
        | "Aadhar"
        | "Signature";

    documentDetails: {
        encryptedNumber: string;

        numberHash: string;
        expiryDate?: Date;
        issuedCountry: string;
    };

    attachments: Array<{
        fileUrl: string;
        fileName: string;
        fileType: "Front" | "Back" | "Selfie" | "Full";
        uploadedAt: Date;
    }>;

    currentStatus:
        | "Pending"
        | "In-Review"
        | "Verified"
        | "Rejected"
        | "Expired";

    verifiedAt?: Date;

    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        verifiedBy?: Types.ObjectId;
        rejectionReason?: string;
    };

    statusHistory: Array<{
        state: "Pending" | "In-Review" | "Verified" | "Rejected" | "Expired";
        remarks?: string;
        updatedBy?: Types.ObjectId;
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

const KYCSchema = new Schema<IKYC>(
    {
        kycReference: {
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
        accountRequestId: {
            type: Schema.Types.ObjectId,
            ref: "AccountRequest",
            required: false,
            index: true,
        },
        documentType: {
            type: String,
            enum: [
                "Passport",
                "SSN",
                "National_ID",
                "Driving_License",
                "PAN",
                "Aadhar",
                "Signature",
            ],
            required: true,
            immutable: true,
        },
        documentDetails: {
            encryptedNumber: { type: String, required: false, immutable: true },
            numberHash: {
                type: String,
                required: false,
                index: true,
                immutable: true,
            },
            expiryDate: { type: Date, immutable: true },
            issuedCountry: { type: String, required: false, default: "India" },
        },
        attachments: [
            {
                fileUrl: { type: String, required: true, immutable: true },
                fileName: { type: String, required: true, immutable: true },
                fileType: {
                    type: String,
                    enum: ["Front", "Back", "Selfie", "Full"],
                    required: true,
                    immutable: true,
                },
                uploadedAt: { type: Date, default: Date.now, immutable: true },
            },
        ],
        currentStatus: {
            type: String,
            enum: ["Pending", "In-Review", "Verified", "Rejected", "Expired"],
            default: "Pending",
            index: true,
        },
        verifiedAt: { type: Date },
        metadata: {
            ipAddress: { type: String, immutable: true },
            userAgent: { type: String, immutable: true },
            verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
            rejectionReason: { type: String },
        },
        statusHistory: [
            {
                state: {
                    type: String,
                    enum: [
                        "Pending",
                        "In-Review",
                        "Verified",
                        "Rejected",
                        "Expired",
                    ],
                    required: true,
                },
                remarks: { type: String },
                updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,

        optimisticConcurrency: true,
    },
);

KYCSchema.pre("save", async function () {
    if (!this.documentDetails) {
        this.documentDetails = { issuedCountry: "India" } as any;
    } else if (!this.documentDetails.issuedCountry) {
        this.documentDetails.issuedCountry = "India";
    }

    if (!Array.isArray(this.statusHistory)) {
        this.statusHistory = [];
    }

    if (!this.metadata) {
        this.metadata = {};
    }

    if (this.isModified("currentStatus")) {
        this.statusHistory.push({
            state: this.currentStatus,
            remarks:
                this.metadata?.rejectionReason ||
                `Status changed to ${this.currentStatus}`,
            updatedBy: this.metadata?.verifiedBy,
            updatedAt: new Date(),
        });

        if (this.currentStatus === "Verified" && !this.verifiedAt) {
            this.verifiedAt = new Date();
        }
    }
});

KYCSchema.index({ userId: 1, currentStatus: 1 });

KYCSchema.index({ currentStatus: 1, createdAt: 1 });

KYCSchema.index({ currentStatus: 1, "documentDetails.expiryDate": 1 });

KYCSchema.index({ "documentDetails.numberHash": 1 });

export default mongoose.models.KYC || mongoose.model<IKYC>("KYC", KYCSchema);

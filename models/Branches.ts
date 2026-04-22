import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBranch extends Document {
    branchCode: string;
    branchName: string;
    branchType: "Main" | "Mini" | "ATM_Only" | "Digital";

    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };

    location?: {
        type: "Point";
        coordinates: [number, number];
    };

    contactInfo: {
        email: string;
        phone: string;
        fax?: string;
    };

    managerId?: Types.ObjectId;

    operationalHours: Array<{
        day:
            | "Monday"
            | "Tuesday"
            | "Wednesday"
            | "Thursday"
            | "Friday"
            | "Saturday"
            | "Sunday";
        isOpen: boolean;
        openTime?: string;
        closeTime?: string;
    }>;

    currentStatus:
        | "Active"
        | "Maintenance"
        | "Temporarily_Closed"
        | "Permanently_Closed";

    metadata?: {
        vaultCapacity?: Types.Decimal128;
        lastInspectionDate?: Date;
        openedOn?: Date;
    };

    statusHistory: Array<{
        state:
            | "Active"
            | "Maintenance"
            | "Temporarily_Closed"
            | "Permanently_Closed";
        updatedBy?: Types.ObjectId;
        reason?: string;
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
    {
        branchCode: {
            type: String,
            unique: true,
            required: true,
            immutable: true,
            uppercase: true,
            trim: true,
        },
        branchName: {
            type: String,
            required: true,
            trim: true,
        },
        branchType: {
            type: String,
            enum: ["Main", "Mini", "ATM_Only", "Digital"],
            default: "Main",
        },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, default: "India" },
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: function (this: IBranch) {
                    return !!this.location?.coordinates;
                },
            },
            coordinates: {
                type: [Number],
                required: function (this: IBranch) {
                    return !!this.location?.type;
                },
            },
        },
        contactInfo: {
            email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
            },
            phone: { type: String, required: true, trim: true },
            fax: { type: String, trim: true },
        },
        managerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        operationalHours: [
            {
                day: {
                    type: String,
                    enum: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                    ],
                    required: true,
                },
                isOpen: { type: Boolean, default: true },

                openTime: {
                    type: String,
                    match: [
                        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        "Please use a valid HH:mm format",
                    ],
                },
                closeTime: {
                    type: String,
                    match: [
                        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        "Please use a valid HH:mm format",
                    ],
                },
            },
        ],
        currentStatus: {
            type: String,
            enum: [
                "Active",
                "Maintenance",
                "Temporarily_Closed",
                "Permanently_Closed",
            ],
            default: "Active",
            index: true,
        },
        metadata: {
            vaultCapacity: { type: Schema.Types.Decimal128 },
            lastInspectionDate: { type: Date },
            openedOn: { type: Date, default: Date.now, immutable: true },
        },
        statusHistory: [
            {
                state: {
                    type: String,
                    enum: [
                        "Active",
                        "Maintenance",
                        "Temporarily_Closed",
                        "Permanently_Closed",
                    ],
                    required: true,
                },
                updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
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

BranchSchema.pre("save", async function () {
    if (this.isModified("currentStatus")) {
        this.statusHistory.push({
            state: this.currentStatus,
            updatedBy:
                this.statusHistory[this.statusHistory.length - 1]?.updatedBy,
            updatedAt: new Date(),
        });
    }
});

BranchSchema.pre("validate", async function () {
    if (
        this.branchType === "ATM_Only" &&
        this.metadata?.vaultCapacity == null
    ) {
    }
});

BranchSchema.index({ location: "2dsphere" });

BranchSchema.index({ "address.city": 1, currentStatus: 1 });
BranchSchema.index({ "address.state": 1, currentStatus: 1 });

export default mongoose.models.Branch ||
    mongoose.model<IBranch>("Branch", BranchSchema);

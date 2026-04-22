import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISession extends Document {
    userId: Types.ObjectId;
    refreshToken: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    last_seen: Date;
    expiresAt: Date;
    createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        refreshToken: {
            type: String,
            required: true,
            unique: true,
        },
        deviceId: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String },
        location: { type: String },
        last_seen: { type: Date, default: Date.now },

        expiresAt: { type: Date, required: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    },
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session ||
    mongoose.model<ISession>("Session", SessionSchema);

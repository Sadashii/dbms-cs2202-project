import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
    userId: Types.ObjectId;
    title: string;
    body: string;
    type: "Alert" | "Transaction" | "Promotion" | "System";
    actionUrl?: string;
    relatedEntityId?: Types.ObjectId;
    isRead: boolean;
    readAt?: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
            immutable: true,
        },
        title: {
            type: String,
            required: true,
            immutable: true,
        },
        body: {
            type: String,
            required: true,
            immutable: true,
        },
        type: {
            type: String,
            enum: ["Alert", "Transaction", "Promotion", "System"],
            required: true,
            immutable: true,
        },
        actionUrl: {
            type: String,
            immutable: true,
        },
        relatedEntityId: {
            type: Schema.Types.ObjectId,
            immutable: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
        },

        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    },
    {
        timestamps: true,
    },
);

NotificationSchema.pre("save", function (next) {
    if (this.isModified("isRead") && this.isRead === true) {
        this.readAt = new Date();
    }
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);

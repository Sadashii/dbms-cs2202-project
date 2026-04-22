import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComplaintMessage extends Document {
    complaintId: Types.ObjectId;
    senderId: Types.ObjectId;
    senderRole: "Customer" | "Support" | "System";
    message: string;
    attachments?: string[];
    createdAt: Date;
}

const ComplaintMessageSchema = new Schema<IComplaintMessage>(
    {
        complaintId: {
            type: Schema.Types.ObjectId,
            ref: "Complaint",
            required: true,
            index: true,
            immutable: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
        },
        senderRole: {
            type: String,
            enum: ["Customer", "Support", "System"],
            required: true,
            immutable: true,
        },
        message: {
            type: String,
            required: true,
            immutable: true,
        },
        attachments: [
            {
                type: String,
                immutable: true,
            },
        ],
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    },
);

ComplaintMessageSchema.index({ complaintId: 1, createdAt: 1 });

ComplaintMessageSchema.post("save", async function (doc) {
    await mongoose
        .model("Complaint")
        .updateOne(
            { _id: doc.complaintId },
            { $set: { lastMessageAt: doc.createdAt } },
        );
});

export default mongoose.models.ComplaintMessage ||
    mongoose.model<IComplaintMessage>(
        "ComplaintMessage",
        ComplaintMessageSchema,
    );

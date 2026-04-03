import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITransaction extends Document {
  transactionId: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  amount: number;
  senderId: Types.ObjectId | null;
  receiverId: Types.ObjectId | null;
  status: "PENDING" | "COMPLETED" | "FAILED";
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["DEPOSIT", "WITHDRAWAL", "TRANSFER"], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    senderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      required: true,
      default: "PENDING",
    },
    timestamp: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: "Transactions",
  }
);

const Transaction =
  mongoose.models.Transaction ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
export default Transaction;

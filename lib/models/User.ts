import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  role: "CUSTOMER" | "EMPLOYEE";
  accountNumber: string;
  balance: number;
  otp: string | null;
  otpExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["CUSTOMER", "EMPLOYEE"], required: true, default: "CUSTOMER" },
    accountNumber: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0 },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

// Prevent model re-registration during hot-reload in dev
const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
export default User;

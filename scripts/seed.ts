/**
 * Seed script: creates the first EMPLOYEE (admin) user.
 *
 * Run once after spinning up the database:
 *   npm run seed
 *
 * Required environment variables (set in .env.local):
 *   MONGODB_URI   - MongoDB connection string
 *   ADMIN_NAME    - Full name of the initial admin (default: "Admin User")
 *   ADMIN_EMAIL   - Email address of the initial admin (no default – must be set)
 */

import mongoose from "mongoose";
import { randomInt } from "crypto";

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const ADMIN_NAME = process.env.ADMIN_NAME?.trim() || "Admin User";

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set. Add it to .env.local.");
  process.exit(1);
}

if (!ADMIN_EMAIL) {
  console.error("❌  ADMIN_EMAIL is not set. Add it to .env.local.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Inline schema – self-contained to avoid importing Next.js-specific modules.
// Must stay in sync with lib/models/User.ts.
// ---------------------------------------------------------------------------
interface UserFields {
  name: string;
  email: string;
  role: "CUSTOMER" | "EMPLOYEE";
  accountNumber: string;
  balance: number;
  otp: string | null;
  otpExpiry: Date | null;
}

const UserSchema = new mongoose.Schema<UserFields>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["CUSTOMER", "EMPLOYEE"], required: true },
    accountNumber: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0 },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
  },
  { timestamps: true, collection: "Users" }
);

function generateAccountNumber(): string {
  let num = randomInt(1, 10).toString();
  for (let i = 1; i < 10; i++) num += randomInt(0, 10).toString();
  return num;
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅  Connected to MongoDB.");

  const User =
    (mongoose.models.User as mongoose.Model<UserFields>) ??
    mongoose.model<UserFields>("User", UserSchema);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`ℹ️   An admin with email "${ADMIN_EMAIL}" already exists. Nothing to do.`);
    return;
  }

  // Check if any employee exists at all
  const anyEmployee = await User.findOne({ role: "EMPLOYEE" });
  if (anyEmployee) {
    console.log(
      `ℹ️   An EMPLOYEE account already exists (${anyEmployee.email}). ` +
        "Use the admin portal to manage additional staff."
    );
    return;
  }

  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: "EMPLOYEE",
    accountNumber: generateAccountNumber(),
    balance: 0,
    otp: null,
    otpExpiry: null,
  });

  console.log("🎉  First admin user created:");
  console.log(`    Name:           ${admin.name}`);
  console.log(`    Email:          ${admin.email}`);
  console.log(`    Account Number: ${admin.accountNumber}`);
  console.log();
  console.log(`    Log in at /login using the email address above.`);
}

seed()
  .catch((err: Error) => {
    console.error("❌  Seed failed:", err.message ?? err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());

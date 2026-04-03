import { randomUUID, randomInt } from "crypto";

/**
 * Generates a cryptographically random 6-digit numeric OTP using Node's crypto module.
 */
export function generateOTP(): string {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += randomInt(0, 10).toString();
  }
  return otp;
}

/**
 * Generates a unique transaction ID with a TXN- prefix.
 */
export function generateTransactionId(): string {
  return `TXN-${randomUUID().replace(/-/g, "").toUpperCase().slice(0, 16)}`;
}

/**
 * Generates a 10-digit numeric account number using crypto.randomInt for uniform distribution.
 */
export function generateAccountNumber(): string {
  // Generate each digit independently to avoid modulo bias
  let num = "";
  // First digit must be 1–9 to avoid a leading zero
  num += randomInt(1, 10).toString();
  for (let i = 1; i < 10; i++) {
    num += randomInt(0, 10).toString();
  }
  return num;
}

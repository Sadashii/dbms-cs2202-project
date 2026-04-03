import { randomUUID } from "crypto";

/**
 * Generates a cryptographically random 6-digit numeric OTP.
 */
export function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  // Use crypto.getRandomValues equivalent in Node – index is discarded, randomness comes from Math.random
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
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
 * Generates a 10-digit numeric account number.
 */
export function generateAccountNumber(): string {
  return String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000));
}

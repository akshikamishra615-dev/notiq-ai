// src/utils/verification.ts
export function generateVerificationCode(): string {
  // returns a 6‑digit numeric code as a string, zero‑padded
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

export function getExpiryTimestamp(minutes: number = 10): number {
  return Date.now() + minutes * 60 * 1000;
}

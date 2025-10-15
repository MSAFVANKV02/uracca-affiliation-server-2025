// utils/cript-data.ts
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Backend-only secret key (hex, 64 chars = 32 bytes)
const SECRET_KEY = process.env.DATA_SECRET_KEY;
const IV_LENGTH = 16; // AES block size

export function encryptData(data) {
  if (!SECRET_KEY) {
    throw new Error("DATA_SECRET_KEY env variable is missing!");
  }

  if (SECRET_KEY.length !== 64) {
    // 64 hex chars = 32 bytes for AES-256
    throw new Error("DATA_SECRET_KEY must be 64 hex characters long!");
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(SECRET_KEY, "hex"), // <-- use hex encoding
      iv
    );

    let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
    encrypted += cipher.final("base64");

    // Return IV + encrypted payload, frontend will split and decrypt
    return iv.toString("base64") + ":" + encrypted;
  } catch (err) {
    console.error("Encryption error:", err);
    throw new Error("Failed to encrypt data");
  }
}

// Optional: matching decrypt function for frontend use
export function decryptData(encrypted, keyHex) {
  const [ivBase64, data] = encrypted.split(":");
  const iv = Buffer.from(ivBase64, "base64");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(keyHex, "hex"),
    iv
  );
  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

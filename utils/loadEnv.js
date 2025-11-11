// loadEnv.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Get current file location for __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dotenvPath = path.resolve(__dirname, "../.env");

// Required env keys
const requiredEnvKeys = [
  "MONGODB_URL",
  "PORT",
  "NODE_ENV",
  "JWT_SECRET",
  "JWT_SECRET_ADMIN",
  "SESSION_SECRET",
  "DATA_SECRET_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "ENTITY_ID",
  "SENDER_ID"
];
const optionalEnvKeys = [
  "FAST2SMS_API_KEY",
  "BREVO_API_KEY",
  "cloudinary_cloud_name",
  "cloudinary_api_key",
  "cloudinary_api_secret"
];

// Load and validate .env
if (!fs.existsSync(dotenvPath)) {
  console.error("❌ .env file is required but not found.");
  process.exit(1);
}

dotenv.config({ path: dotenvPath });
console.log("✅ .env file loaded successfully");

const missingKeys = requiredEnvKeys.filter((key) => !process.env[key]);

const missingOptionalKeys = optionalEnvKeys.filter((key) => !process.env[key]);

if (missingOptionalKeys.length > 0) {
  console.log(
    `⚠️  Missing optional variables: ${missingOptionalKeys.join(", ")}`
  );
}

if (missingKeys.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingKeys.join(", ")}`
  );
  process.exit(1);
}

console.log("✅ All required environment variables are present");

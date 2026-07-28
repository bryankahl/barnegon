import "dotenv/config";

const requiredEnvVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "FIREBASE_SERVICE_ACCOUNT_KEY",
  "OPENAI_API_KEY",
  "CLOUDFLARE_API_TOKEN", 
  "CLOUDFLARE_ACCOUNT_ID" 
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    JSON.stringify({
      level: "FATAL",
      event: "boot_failure",
      message: `Missing required env vars: ${missing.join(", ")}`,
    })
  );
  process.exit(1);
}

export const config = {
  PORT: process.env.PORT || 8080,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  WEBHOOK_SIGNING_SECRET: process.env.WEBHOOK_SIGNING_SECRET,
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
};
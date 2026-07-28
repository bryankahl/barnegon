import express from "express";
import helmet from "helmet";
import cors from "cors";
import stripeModule from "stripe";
import { admin, db } from "../firebase-admin.js"; 
import { config } from "./config.js";
import { logger } from "./utils/logger.js";

import healthRouter from "./routes/health.js";
import createStripeRouter from "./routes/stripe.js";
import createStripeWebhookRouter from "./routes/stripeWebhook.js";
import createAiRouter from "./routes/ai.js";
import createRelayWebhookRouter from "./routes/relayWebhook.js";
import createLeadsRouter from "./routes/leads.js";
import createTurnstileRouter from "./routes/turnstile.js"; 
import requestLogger from "./middleware/requestLogger.js";

const stripe = stripeModule(config.STRIPE_SECRET_KEY);
const endpointSecret = config.STRIPE_WEBHOOK_SECRET;

export const app = express();

app.set("trust proxy", 1);

app.use(helmet());
const allowedOrigins = ["https://barnegon.com", "https://www.barnegon.com"];
app.use(cors({ origin: "*" }));
app.use(requestLogger());

app.use("/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "64kb" }));

app.use("/", healthRouter);
app.use("/api/stripe", createStripeRouter({ admin, db, stripe }));
app.use("/api/leads", createLeadsRouter({ db }));
app.use("/api/ai", createAiRouter({ db }));
app.use("/api/turnstile", createTurnstileRouter()); 
app.use("/webhook/stripe", createStripeWebhookRouter({ stripe, db, endpointSecret }));
app.use("/webhook/relay", createRelayWebhookRouter({ db }));

app.use((err, req, res, next) => {
  logger.error("unhandled_express_error", err);
  if (res.headersSent) return next(err);
  const requestId = res.getHeader("x-request-id") || res.locals?.requestId;
  res.status(500).json({
    error: { code: "INTERNAL", message: "Something went wrong. Please try again.", requestId },
  });
});
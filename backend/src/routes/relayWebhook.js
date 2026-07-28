import express from "express";
import rateLimit from "express-rate-limit";
import xss from "xss"; 
import { sendRelayWebhook } from "../services/relayService.js";
import { logger } from "../utils/logger.js";

function getRealIp(req) {
  const cf = req.headers["cf-connecting-ip"];
  if (typeof cf === "string" && cf.length > 0) return cf.trim();
  return req.ip;
}

const sanitizePayload = (data) => {
  if (typeof data === "string") return xss(data);
  if (Array.isArray(data)) return data.map(sanitizePayload);
  if (data !== null && typeof data === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizePayload(value);
    }
    return sanitized;
  }
  return data;
};

export default function createRelayWebhookRouter({ db }) {
  const router = express.Router();

  const relayLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 30, 
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { 
      error: { 
        code: "RATE_LIMITED", 
        message: "Too many webhook requests. Please slow down." 
      } 
    },
    keyGenerator: (req) => getRealIp(req),
  });

  router.post("/", relayLimiter, async (req, res) => {
    try {
      const { businessId, payload } = req.body || {};
      if (!businessId || typeof businessId !== "string") {
        return res.status(400).json({ error: "Missing or invalid businessId" });
      }
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Missing or invalid payload object" });
      }
      
      const payloadString = JSON.stringify(payload);
      if (payloadString.length > 10000) { 
        logger.warn("relay_payload_too_large", { businessId, size: payloadString.length });
        return res.status(400).json({ error: "Payload exceeds maximum allowed size (10KB)" });
      }

      const sanitizedPayload = sanitizePayload(payload);

      const result = await sendRelayWebhook(db, businessId, sanitizedPayload); 
      return res.status(200).json(result);

    } catch (err) {
      logger.error("relay_webhook_failed", err, { businessId: req.body?.businessId });
      if (err.message === "Business not found") {
        return res.status(404).json({ error: "Business not found" });
      }
      return res.status(502).json({ error: "Relay failed", detail: err.message });
    }
  });

  return router;
}
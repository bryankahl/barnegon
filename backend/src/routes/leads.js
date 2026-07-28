import express from "express";
import xss from "xss"; 
import verifyTurnstile from "../middleware/verifyTurnstile.js";
import { logger } from "../utils/logger.js";

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

export default function createLeadsRouter({ db }) {
  const router = express.Router();

  router.post("/", verifyTurnstile, async (req, res, next) => {
    try {
      const { businessId, leadData } = req.body;

      if (!businessId || !leadData) {
        return res.status(400).json({ 
          error: { code: "INVALID_ARGUMENT", message: "Missing businessId or leadData." } 
        });
      }

      const sanitizedLeadData = sanitizePayload(leadData);

      const leadsRef = db.collection(`businesses/${businessId}/leads`);
      const leadDoc = await leadsRef.add(sanitizedLeadData); 

      logger.info("lead_created_securely", { businessId, leadId: leadDoc.id });

      res.status(200).json({ success: true, leadId: leadDoc.id });
    } catch (err) {
      logger.error("lead_creation_error", err);
      next(err);
    }
  });

  return router;
}
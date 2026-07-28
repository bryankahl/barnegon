import express from "express";
import { logger } from "../utils/logger.js";
import { provisionTurnstileDomain, removeTurnstileDomain } from "../services/turnstileService.js";

export default function createTurnstileRouter() {
  const router = express.Router();

  router.post("/provision", async (req, res) => {
    try {
      const { domain, oldDomain } = req.body;

      const clean = (d) => {
        if (!d) return "";
        let cleaned = d.trim();
        try {
          if (cleaned.startsWith('http')) cleaned = new URL(cleaned).hostname;
          cleaned = cleaned.replace(/^www\./, '');
        } catch (e) {}
        return cleaned;
      };

      const cleanDomain = clean(domain);
      const cleanOldDomain = clean(oldDomain);

      if (cleanOldDomain && cleanOldDomain !== cleanDomain) {
        await removeTurnstileDomain(cleanOldDomain);
      }

      if (!cleanDomain) {
        return res.json({ success: true, message: "Domain removed." });
      }

      const result = await provisionTurnstileDomain(cleanDomain);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Turnstile Provision Endpoint Error", error);
      res.status(500).json({ error: { message: "Failed to update security widget." } });
    }
  });

  return router;
}
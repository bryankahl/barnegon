import express from "express";
import { handleWebhookEvent } from "../services/stripeService.js";
import { logger } from "../utils/logger.js"; // Bringing in your professional logger

export default function createStripeWebhookRouter({ stripe, db, endpointSecret }) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // 1. Verify Signature
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      logger.info("stripe_webhook_triggered", { type: event.type }); 
    } catch (err) {
      logger.error("webhook_signature_error", { error: err.message }); 
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      // 2. Delegate Business Logic
      await handleWebhookEvent(event, db);
      res.json({ received: true });
    } catch (err) {
      logger.error("webhook_logic_error", { error: err.message }); 
      // Returning 500 so Stripe's dashboard actually shows a red failure icon
      res.status(500).json({ error: "Processed with errors" }); 
    }
  });

  return router;
}
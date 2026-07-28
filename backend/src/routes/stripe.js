import express from "express";
import { createCheckoutSession, createPortalSession } from "../services/stripeService.js";
import { logger } from "../utils/logger.js"; 

export default function createStripeRouter({ admin, db, stripe }) {
  const router = express.Router();
  router.post("/create-checkout-session", async (req, res) => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    let decoded;
    // Catch 1: Firebase Auth Failures
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      logger.error("firebase_auth_failed", err, { endpoint: "/create-checkout-session" });
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Catch 2: Stripe API Failures
    try {
      const { uid, email } = decoded;
      const url = await createCheckoutSession({
        stripe,
        email,
        uid,
        successUrl: req.body.success_url,
        cancelUrl: req.body.cancel_url,
      });

      res.json({ url });
    } catch (err) {
      logger.error("stripe_checkout_session_failed", err, { uid: decoded.uid });
      res.status(502).json({ error: "Failed to create checkout session with billing provider" });
    }
  });

  router.post("/create-billing-portal-session", async (req, res) => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    let decoded;
    // Catch 1: Firebase Auth Failures
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      logger.error("firebase_auth_failed", err, { endpoint: "/create-billing-portal-session" });
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Catch 2: Stripe API Failures
    try {
      const { uid } = decoded;
      const url = await createPortalSession({
        stripe,
        db,
        uid,
        returnUrl: req.body.success_url,
      });
      res.json({ url });
    } catch (err) {
      logger.error("stripe_billing_portal_failed", err, { uid: decoded.uid });
      res.status(502).json({ error: "Failed to create billing portal session" });
    }
  });

  return router;
}
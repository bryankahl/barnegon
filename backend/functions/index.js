import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fetch from "node-fetch";

// Import your extracted logic
import { handleNewLead } from "./triggers/leadNotifications.js";
import { sendDirectSms } from "./services/notificationService.js";

initializeApp();
const db = getFirestore();

// Existing Secrets
export const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
export const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
export const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
export const TWILIO_PHONE_NUMBER = defineSecret("TWILIO_PHONE_NUMBER");

// Cloudflare Secrets
export const CLOUDFLARE_ACCOUNT_ID = defineSecret("CLOUDFLARE_ACCOUNT_ID");
export const CLOUDFLARE_API_TOKEN = defineSecret("CLOUDFLARE_API_TOKEN");
export const CLOUDFLARE_TURNSTILE_SITE_KEY = defineSecret("CLOUDFLARE_TURNSTILE_SITE_KEY");

export const sendLeadEmail = onDocumentCreated(
  {
    document: "businesses/{businessId}/leads/{leadId}",
    secrets: [RESEND_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
    region: "us-central1",
  },
  (event) => handleNewLead(event, db) 
);

export const sendSms = onCall(
  {
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
    region: "us-central1",
  },
  async (req) => {
    const { to, message } = req.data;
    if (!to || !message) {
      throw new Error("Missing 'to' or 'message' field");
    }
    return await sendDirectSms({ to, message });
  }
);

// NEW: Cloudflare Turnstile Whitelist Function
export const whitelistTurnstileDomain = onRequest(
  { 
    cors: true, 
    secrets: [CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_TURNSTILE_SITE_KEY],
    region: "us-central1"
  }, 
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
      const { domain } = req.body;
      if (!domain) return res.status(400).json({ error: "Domain is required." });

      // Clean the domain (e.g., https://www.client.com/page -> www.client.com)
      let cleanDomain = domain.trim();
      try {
        if (!cleanDomain.startsWith("http")) cleanDomain = `https://${cleanDomain}`;
        cleanDomain = new URL(cleanDomain).hostname;
      } catch (e) {
        return res.status(400).json({ error: "Invalid domain format." });
      }

      // Extract secrets
      const accountId = CLOUDFLARE_ACCOUNT_ID.value();
      const apiToken = CLOUDFLARE_API_TOKEN.value();
      const siteKey = CLOUDFLARE_TURNSTILE_SITE_KEY.value();

      const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
      const widgetUrl = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/challenges/widgets/${siteKey}`;
      const headers = {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        "User-Agent": "Barnegon-Firebase/1.0"
      };

      // 1. Fetch current domains
      const getResponse = await fetch(widgetUrl, { method: "GET", headers });
      const getResult = await getResponse.json();

      if (!getResult.success) throw new Error(`API Error: ${getResult.errors[0]?.message}`);

      const widgetConfig = getResult.result;
      const currentDomains = widgetConfig.domains || [];

      // 2. Check for duplicates
      if (currentDomains.includes(cleanDomain)) {
        return res.status(200).json({ success: true, domains: currentDomains, message: "Already whitelisted." });
      }

      // 3. Update Widget
      const updatedDomains = [...currentDomains, cleanDomain];
      const updatePayload = {
        name: widgetConfig.name,
        mode: widgetConfig.mode,
        domains: updatedDomains,
        bot_fight_mode: widgetConfig.bot_fight_mode,
        clearance_level: widgetConfig.clearance_level
      };

      const putResponse = await fetch(widgetUrl, { method: "PUT", headers, body: JSON.stringify(updatePayload) });
      const putResult = await putResponse.json();

      if (!putResult.success) throw new Error(`Update Error: ${putResult.errors[0]?.message}`);

      return res.status(200).json({ success: true, domains: putResult.result.domains });

    } catch (error) {
      console.error(`Firebase Error: ${error.message}`);
      return res.status(500).json({ error: "An error occurred whitelisting the domain." });
    }
  }
);
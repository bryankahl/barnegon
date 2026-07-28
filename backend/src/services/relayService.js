import crypto from "crypto";
import fetch from "node-fetch";
import { logger } from "../utils/logger.js";
import { config } from "../config.js";

// SSRF Blocklist (Local loopbacks and Cloud Metadata IPs)
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254", "metadata.google.internal"];

export async function sendRelayWebhook(db, businessId, payload) {
  const bizSnap = await db.collection("businesses").doc(businessId).get();
  if (!bizSnap.exists) {
    throw new Error("Business not found");
  }
  const biz = bizSnap.data() || {};

  const url = biz.crmWebhookUrl;
  if (!url || !/^https:\/\/.+/i.test(url)) {
    return { ok: true, skipped: "No webhook configured" };
  }

  // ✅ SSRF Mitigation: Strict URL Validation
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    throw new Error("Malformed webhook URL");
  }
  
  if (BLOCKED_HOSTS.some(host => parsedUrl.hostname.includes(host))) {
    logger.warn("ssrf_attempt_blocked", { businessId, hostname: parsedUrl.hostname });
    throw new Error("Invalid destination host");
  }

  // ✅ Replay Protection: Timestamp + HMAC
  let signature = "";
  const timestamp = Date.now().toString();
  
  if (config.WEBHOOK_SIGNING_SECRET) {
    // We bind the timestamp to the payload so the signature cannot be reused later
    const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
    signature = crypto
      .createHmac("sha256", config.WEBHOOK_SIGNING_SECRET)
      .update(signaturePayload)
      .digest("hex");
  }

  const MAX_ATTEMPTS = 3;
  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000); 

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature ? { 
            "X-Barnegon-Signature": signature,
            "X-Barnegon-Timestamp": timestamp 
          } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(t);

      if (resp.status >= 200 && resp.status < 300) {
        logger.info("relay_success", { businessId, attempt });
        return { ok: true, attempt };
      }

      const text = await resp.text().catch(() => "");
      logger.warn("relay_non_2xx", { businessId, attempt, status: resp.status, responseText: text.slice(0, 300) });
      lastError = new Error(`Non-2xx: ${resp.status}`);
    } catch (e) {
      logger.warn("relay_attempt_failed", { businessId, attempt, error: e.message });
      lastError = e;
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, attempt * 500 - 250));
    }
  }

  throw new Error(lastError?.message || "Relay failed after retries");
}
import fetch from "node-fetch";
import { logger } from "../utils/logger.js";
import { db } from "../../firebase-admin.js"; 

function getRealIp(req) {
  const cf = req.headers["cf-connecting-ip"];
  if (typeof cf === "string" && cf.length > 0) return cf.trim();
  return req.ip;
}

export default async function verifyTurnstile(req, res, next) {
  const { token } = req.body;
  const ip = getRealIp(req);

  // Safely extract the domain making the request
  const origin = req.headers.origin || req.headers.referer || "";
  let requestDomain = "";
  try {
    if (origin) {
      requestDomain = new URL(origin).hostname;
      // 🔥 THE FIX: Strip 'www.' so it matches the format saved in Firestore
      requestDomain = requestDomain.replace(/^www\./, '');
    }
  } catch (e) {
    logger.warn("Could not parse origin for Turnstile check", { origin });
  }

  if (!token) {
    logger.warn("Turnstile check failed: Missing token", { ip, domain: requestDomain });
    return res.status(403).json({ error: { message: "Security token missing. Are you a bot?" } });
  }

  if (!requestDomain) {
    logger.warn("Turnstile check failed: Missing domain origin", { ip });
    return res.status(403).json({ error: { message: "Unknown origin. Cannot verify security clearance." } });
  }

  try {
    // STRICT CHECK: Only check Firestore. No fallback.
    const widgetsSnapshot = await db.collection('turnstile_widgets')
      .where('domains', 'array-contains', requestDomain)
      .limit(1)
      .get();

    // If the domain is not in any of our Cloudflare widgets, reject them immediately.
    if (widgetsSnapshot.empty) {
      logger.warn(`Turnstile verification failed: Domain ${requestDomain} not registered`, { ip });
      return res.status(403).json({ error: { message: "Domain not authorized for security checks." } });
    }

    // We found a specific dynamic key for this domain in Firestore!
    const activeSecretKey = widgetsSnapshot.docs[0].data().secret;

    // Verify against Cloudflare using the strict key
    const cfResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: activeSecretKey,
        response: token,
        remoteip: ip || ""
      })
    });
    
    const cfData = await cfResponse.json();

    if (!cfData.success) {
      logger.warn("Turnstile verification failed", { errorCodes: cfData['error-codes'], ip, domain: requestDomain });
      return res.status(403).json({ error: { message: "Security clearance failed. Are you a bot?" } });
    }

    // SECURITY PASSED!
    next();
  } catch (err) {
    logger.error("Turnstile fetch error", { error: err.message });
    return res.status(500).json({ error: { message: "Internal server error during security check." } });
  }
}
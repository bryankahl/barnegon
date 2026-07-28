import express from "express";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch"; 
import xss from "xss"; // <-- DIY WAF: Import xss package
import { config } from "../config.js";
import verifyTurnstile from "../middleware/verifyTurnstile.js";
import { generateChatReply, generateSummary } from "../services/aiService.js";
import { logger } from "../utils/logger.js"; 

// DIY WAF: Recursive sanitization helper 
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

function sendError(res, status, code, message, extra = {}) {
  const requestId = res.getHeader("x-request-id") || res.locals?.requestId;

  return res.status(status).json({
    error: {
      code,
      message,
      requestId,
      ...extra,
    },
  });
}

function getRetryAfterSeconds(req, res) {
  const rl = res.getHeader("ratelimit");
  if (typeof rl === "string") {
    const m = rl.match(/reset=(\d+)/);
    if (m) return Number(m[1]);
  }
  const ra = res.getHeader("retry-after");
  if (typeof ra === "string") {
    const n = Number(ra);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function rateLimitHandler(routeName) {
  return (req, res /*, next */) => {
    const retryAfterSeconds = getRetryAfterSeconds(req, res);
    const msg = retryAfterSeconds
      ? `Too many requests. Try again in ${retryAfterSeconds}s.`
      : "Too many requests. Please slow down.";
    return sendError(res, 429, "RATE_LIMITED", msg, {
      route: routeName,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    });
  };
}

function getRealIp(req) {
  const cf = req.headers["cf-connecting-ip"];
  if (typeof cf === "string" && cf.length > 0) return cf.trim();
  return req.ip;
}

export default function createAiRouter({ db }) {
  const router = express.Router();

  const aiChatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { error: "Too many requests. Please slow down." },
    handler: rateLimitHandler("ai-chat"),
    keyGenerator: (req) => getRealIp(req),
  });

  const aiSummaryLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { error: "Too many requests. Please slow down." },
    handler: rateLimitHandler("ai-summary"),
    keyGenerator: (req) => getRealIp(req),
  });

  // Reusable Security Check
  async function verifyBusinessAndOrigin(req, targetBizId) {
    if (!targetBizId) {
      return { error: true, status: 400, code: "BAD_REQUEST", message: "`bizId` parameter is required." };
    }

    const bizDoc = await db.collection("businesses").doc(targetBizId).get();
    if (!bizDoc.exists) {
      return { error: true, status: 404, code: "NOT_FOUND", message: "Business not found." };
    }

    const bizData = bizDoc.data();
    const configuredWebsite = bizData.website;
    
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    const cleanDomain = (url) => {
      if (!url) return "";
      return url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split('/')[0];
    };

    const isAllowedOrigin = (targetDomain) => {
      if (!targetDomain) return false;
      const targetClean = cleanDomain(targetDomain);
      const originClean = cleanDomain(origin);
      const refererClean = cleanDomain(referer);
      return (
        (originClean && originClean === targetClean) ||
        (refererClean && refererClean === targetClean) ||
        (origin && origin.toLowerCase().startsWith(targetDomain.toLowerCase()))
      );
    };

    const dashboardAllowed =
      isAllowedOrigin("barnegon.com") ||
      isAllowedOrigin("localhost:3000") ||
      isAllowedOrigin("127.0.0.1:5500") ||
      isAllowedOrigin("ai-agent-demo-9fe52.web.app") ||
      isAllowedOrigin("ai-agent-demo-9fe52.firebaseapp.com");


    if (!dashboardAllowed) {
      if (!configuredWebsite || configuredWebsite.trim() === "") {
        logger.warn(`Security check failed: No website configured for biz ${targetBizId}.`, { origin, referer });
        return { 
          error: true, 
          status: 403, 
          code: "FORBIDDEN", 
          message: `Forbidden domain. Browser sent Origin: '${origin || referer || "null"}', Database expected a configured website but none was set.` 
        };
      }

      if (!isAllowedOrigin(configuredWebsite)) {
        logger.warn(`Security check failed: Unauthorized origin for biz ${targetBizId}.`, { origin, referer, expected: configuredWebsite });
        return { 
          error: true, 
          status: 403, 
          code: "FORBIDDEN", 
          message: `Forbidden domain. Browser sent Origin: '${origin || referer || "null"}', Database expected: '${configuredWebsite}'` 
        };
      }
    }

    return { error: false, bizData };
  }

  router.post("/chat", aiChatLimiter, verifyTurnstile, async (req, res) => {
    try {
      const { messages, biz, bizId } = req.body;

      const targetBizId = bizId || (typeof biz === "string" ? biz : null);

      const authCheck = await verifyBusinessAndOrigin(req, targetBizId);
      if (authCheck.error) {
        return sendError(res, authCheck.status, authCheck.code, authCheck.message);
      }
      
      const bizData = authCheck.bizData;

      if (!Array.isArray(messages)) {
        return sendError(res, 400, "BAD_REQUEST", "`messages` must be an array.");
      }
      
      const MAX_MESSAGES = 50;
      const MAX_TOTAL_CHARS = 20000;
      const MAX_SINGLE_MESSAGE_CHARS = 4000;
      
      if (messages.length === 0) {
        return sendError(res, 400, "BAD_REQUEST", "`messages` cannot be empty.");
      }
      if (messages.length > MAX_MESSAGES) {
        return sendError(res, 400, "BAD_REQUEST", `Too many messages (max ${MAX_MESSAGES}).`, {
          maxMessages: MAX_MESSAGES,
        });
      }

      let totalChars = 0;
      for (const m of messages) {
        if (!m || typeof m !== "object") {
          return sendError(res, 400, "BAD_REQUEST", "Each message must be an object.");
        }
        if (typeof m.role !== "string" || typeof m.content !== "string") {
          return sendError(res, 400, "BAD_REQUEST", "Each message must include string `role` and `content`.");
        }
        if (m.content.length > MAX_SINGLE_MESSAGE_CHARS) {
          return sendError(
            res,
            400,
            "BAD_REQUEST",
            `A message is too long (max ${MAX_SINGLE_MESSAGE_CHARS} chars).`,
            { maxSingleMessageChars: MAX_SINGLE_MESSAGE_CHARS }
          );
        }
        totalChars += m.content.length;
        if (totalChars > MAX_TOTAL_CHARS) {
          return sendError(
            res,
            400,
            "BAD_REQUEST",
            `Messages too large (max ${MAX_TOTAL_CHARS} chars total).`,
            { maxTotalChars: MAX_TOTAL_CHARS }
          );
        }
      }
      
      // DIY WAF: Sanitize message array to prevent XSS payloads going into AI logging/storage
      const sanitizedMessages = sanitizePayload(messages);

      const reply = await generateChatReply(sanitizedMessages, bizData); // <-- Pass sanitized data
      return res.json({ reply });
    } catch (err) {
      logger.error("ai_chat_error", { error: err.message }); 
      if (err?.name === "AbortError") {
        return sendError(res, 504, "UPSTREAM_TIMEOUT", "AI request timed out. Please try again.");
      }
      if (err?.message?.includes("OpenAI error")) {
         return sendError(res, 500, "UPSTREAM_ERROR", "AI service error. Please try again.");
      }
      return sendError(res, 500, "INTERNAL", "Something went wrong. Please try again.");
    }
  });

  router.post("/summary", aiSummaryLimiter, verifyTurnstile, async (req, res) => {    
    try {
      const { messages, bizId } = req.body;

      const authCheck = await verifyBusinessAndOrigin(req, bizId);
      if (authCheck.error) {
        return sendError(res, authCheck.status, authCheck.code, authCheck.message);
      }

      if (!Array.isArray(messages)) {
        return sendError(res, 400, "BAD_REQUEST", "`messages` must be an array.");
      }

      // DIY WAF: Sanitize before parsing into a summary
      const sanitizedMessages = sanitizePayload(messages);

      const summary = await generateSummary(sanitizedMessages); // <-- Pass sanitized data
      return res.json({ summary });
    } catch (err) {
      logger.error("ai_summary_generation_failed", { error: err.message }); 
      if (err?.name === "AbortError") {
        return sendError(res, 504, "UPSTREAM_TIMEOUT", "AI request timed out. Please try again.");
      }
      if (err?.message?.includes("OpenAI error")) {
        return sendError(res, 500, "UPSTREAM_ERROR", "AI service error. Please try again.");
     }
      return sendError(res, 500, "INTERNAL", "Something went wrong. Please try again.");
    }
  });

  return router;
}
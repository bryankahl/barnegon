import { requestSecurityToken } from '../../utils/security.js';

const BASE_URL = "https://homebase-stripe-backend-clean.onrender.com";

/**
 * Centralized generic fetch wrapper
 */
async function apiFetch(endpoint, { method = "GET", body = null, idToken = null } = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  // Attach Firebase Auth token if provided (for dashboard actions)
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || data.message || `HTTP Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export async function createCheckoutSession(uid, idToken) {
  return apiFetch("/api/stripe/create-checkout-session", {
    method: "POST",
    idToken,
    body: {
      uid,
      success_url: window.location.origin + "/dashboard.html",
      cancel_url: window.location.origin + "/index.html"
    }
  });
}

export async function createBillingPortalSession(idToken) {
  return apiFetch("/api/stripe/create-billing-portal-session", {
    method: "POST",
    idToken,
    body: {
      success_url: window.location.origin + "/dashboard.html"
    }
  });
}

export async function sendDashboardChat(prompt, idToken) {
  // Note: Your original code posted directly to the root URL. 
  // If you have a specific path like /api/ai/dashboard-chat, update it here.
  return apiFetch("", {
    method: "POST",
    idToken,
    body: { prompt }
  });
}

export async function sendWidgetChat(messages, biz, bizId) {
  const token = await requestSecurityToken();
  return apiFetch("/api/ai/chat", {
    method: "POST",
    body: { messages, biz, bizId, token }
  });
}

export async function getWidgetChatSummary(messages, bizId) {
  const token = await requestSecurityToken();
  return apiFetch("/api/ai/summary", {
    method: "POST",
    body: { messages, bizId, token }
  });
}

export async function relayWebhook(businessId, payload) {
  return apiFetch("/webhook/relay", {
    method: "POST",
    body: { businessId, payload }
  });
}

export async function whitelistDomain(domain, oldDomain = "", idToken = null) {
  return apiFetch("/api/turnstile/provision", {
    method: "POST",
    idToken,
    body: { domain, oldDomain } // Now we pass both!
  });
}
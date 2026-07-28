# Barnegon — AI Chat & Lead Generation Infrastructure

A production ready, SaaS platform built for service businesses. This repository contains the frontend and backend architecture, featuring zero-trust bot defense, dynamic domain provisioning, and webhook security.

## System Architecture

### 1. Payment Activation & Webhook Idempotency

Handling third-party webhooks safely requires guarding against both spoofed requests and network retries (replay attacks). This sequence guarantees that a user is only activated after a cryptographically verified, single-process payment.

![Stripe Webhook Security](./assets/FirstTimeSignupAndWebhookSecurity.png)

*   **Identity Injection:** When a user initiates checkout, their Firebase UID is embedded directly into the Stripe Checkout metadata, tightly coupling the transaction to their auth state.
*   **Cryptographic Verification:** The inbound `/webhook` endpoint intercepts the raw request buffer and verifies the HMAC signature against a local environment secret. Invalid signatures are instantly dropped (`400 Bad Request`).
*   **Database-Level Idempotency Lock:** To prevent race conditions or duplicate webhook deliveries from triggering double-activations, the backend attempts to `.create()` a Firestore document using the unique Stripe `event.id`. 
*   **Graceful Failures:** If the document already exists (Firestore Error Code 6), it means the webhook is a duplicate. The system catches the error, aborts the activation logic, but still returns a `200 OK` to satisfy Stripe's retry mechanism.

![Manage Billing Flow](./assets/ManageBilling.png)

### 2. Multi-Tenant Domain Provisioning (The Bucket System)

Cloudflare Turnstile enforces a hard limit of 10 allowed domains per widget sitekey. To support a scalable SaaS architecture without manual intervention, this system employs a dynamic "bucket pooling" algorithm.

![Domain Provisioning](./assets/DomainProvisioning.png)

*   **Capacity Polling:** When a new client provisions a custom domain via the dashboard, the backend queries the database for a widget "bucket" with an active `domainCount` under 10.
*   **Dynamic Appending:** If an open slot exists (1-9 domains), the backend uses Cloudflare's Management API to seamlessly append the new domain to the existing widget and increments the database counter.
*   **Autonomous Minting:** If all existing buckets are full (10/10), the system automatically executes a `POST` request to Cloudflare to mint an entirely new widget, retrieves the new Sitekey/Secret pair, stores it in the database, and begins filling the new bucket.

### 3. Zero-Trust Architecture & Lead Verification

Public-facing lead forms and AI chat interfaces are prime targets for botnets and XSS injections. The architecture assumes all inbound traffic is hostile until cryptographically proven otherwise.

![Zero Trust Security](./assets/TurnstileTokenAndSiteverify.png)
![Dynamic UI Rendering](./assets/DynamicLeadAndUIRendering.png)

*   **The Frontend Bouncer:** Cloudflare Turnstile executes a silent Proof-of-Work challenge in the browser. If passed, it issues a single-use cryptographic token.
*   **Backend Verification:** Before hitting the core business logic, database, or OpenAI API, an Express middleware intercepts the request and POSTs the token to Cloudflare's `/siteverify` endpoint. Reused, missing, or forged tokens result in an immediate `403 Forbidden`.
*   **Recursive WAF Sanitization:** Once verified as human, the payload is recursively scrubbed by a custom Web Application Firewall (WAF) script to neutralize SQLi and XSS vectors before executing CRM writes.

### 4. AI Cognition Pipeline & Context Compaction

LLM-based chat interfaces inherently risk exponential token bloat and prompt-injection attacks. This architecture bounds memory consumption while ensuring UI safety and fault tolerance.

![AI Cognition and Sanitization](./assets/SanitizationAndAICognition.png)
![Chat Zero Trust](./assets/ChatZeroTrustIntercept.png)

*   **Token Bounding (Memory Compaction):** To prevent unbounded context windows from spiking API costs, the system monitors message count. Once a thread exceeds 6 messages, a background process distills the older history into a rolling 150-token active summary, keeping memory linear.
*   **Fault-Tolerant Fetching:** Third-party LLM APIs can experience severe latency. The outbound fetch to OpenAI is wrapped in a strict 20-second `AbortController`. If the API hangs, the socket is severed with a `504 Gateway Timeout`, preventing suspended requests from starving the Node.js event loop.
*   **Safe UI Injection & UX:** To neutralize prompt injection attacks attempting to force client-side XSS, the frontend strictly binds the AI response using `.textContent` rather than `.innerHTML`. An artificial 900ms delay is injected before rendering to mimic human response latency.

---

## Tech Stack

*   **Frontend:** Vanilla JS, Vite, Firebase Hosting
*   **Backend:** Node.js, Express, Render
*   **Database:** Firestore (NoSQL)
*   **Security:** Cloudflare Turnstile (WAF & Zero-Trust)
*   **Payments:** Stripe Billing & Webhooks
*   **AI:** OpenAI API (with recursive context compaction)

## Local Setup

To run this environment locally, you must provide your own environment variables. 

1. Clone the repository.
2. Navigate to `/frontend` and `/backend` to duplicate the `.env.example` files into `.env`.
3. Provide your own Stripe, Cloudflare, and OpenAI test keys.
4. Run `npm install` and `npm run dev` in both directories.

# Barnegon — AI Chat & Lead Generation Infrastructure

A production ready, SaaS platform built for service businesses. This repository contains the frontend and backend architecture, featuring zero-trust bot defense, dynamic domain provisioning, and webhook security.

## System Architecture

### 1. The Onboarding (Auth, Billing & Webhook Security)


The onboarding begins when a business owner signs up using Google Sign-In. They are routed to a Stripe paywall to activate their 30-day free trial. They input their credit card, and Stripe takes over. Once the payment succeeds, an ⁠isActive⁠:True signal is sent to Firebase, granting them access to the platform.
This handoff between third-party payment processors and the database requires guarding against spoofed requests and network retries (replay attacks). This sequence ensures that a user is activated after a cryptographically verified, single-process payment.


![Stripe Webhook Security](./assets/FirstTimeSignupAndWebhookSecurity.png)

*   **Identity Injection:** When a user starts checkout, their Firebase UID is embedded into the Stripe Checkout metadata, coupling the transaction to their auth state.
*   **Cryptographic Verification:** The inbound `/webhook` endpoint intercepts the raw request buffer and mathematically verifies the HMAC signature against a local environment secret. Invalid signatures are instantly dropped.
*   **Database-Level Idempotency Lock:** Race conditions or duplicate webhook deliveries may trigger double activations; therefore, to prevent this, the backend attempts to `.create()` a Firestore document using the single Stripe `event.id`. 
*   **Graceful Failures:** If the document already exists, it means the webhook is a duplicate. The system catches the error, terminates the activation logic, but still returns a `200 OK` to satisfy Stripe's retry mechanism.

#### Manage/Cancel Billing
![Manage Billing Flow](./assets/ManageBilling.png)

### 2. The First-Time Setup (Dynamic Domain Provisioning)


Once the account is activated, the business owner opens a first-time setup screen. They input their core business details, most importantly, their website's domain name. This domain is whitelisted so the Barnegon chat widget can operate on their site. The domain is saved in Firestore and pushed into Cloudflare's Turnstile system for botnet defense.
Cloudflare Turnstile enforces a limit of 10 allowed domains per widget sitekey; therefore, this scalable SaaS architecture needs a dynamic provisioning algorithm so no manual intervention is needed.


![Domain Provisioning](./assets/DomainProvisioning.png)

*   **Capacity Polling:** When a new client adds a domain via the dashboard, the backend checks the database for a widget with a `domainCount` under 10.
*   **Dynamic Appending:** If there is an open slot (1-9 domains), the backend uses Cloudflare's Management API to add the new domain to the existing widget and increases the database counter.
*   **Autonomous Minting:** If all existing widgets are full (10/10), it automatically executes a `POST` request to Cloudflare to create an entirely new widget, retrieves the new Sitekey/Secret pair, stores it in the database, and begins filling the new widget.

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

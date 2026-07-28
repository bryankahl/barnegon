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

### 3. The Defense (Zero-Trust & Lead Verification)


The custom chatbot is now embedded live on the client's website after injecting their script. Every time a visitor tries to submit a custom lead form or interact with the AI, the zero-trust security model activates. The system runs invisible mathematics in the background to verify the user is human before any data touches the database.
Public-facing lead forms and AI chat interfaces are prime targets for botnets and XSS injections. This architecture assumes all inbound traffic is malicious until cryptographically proven otherwise.


![Zero Trust Security](./assets/TurnstileTokenAndSiteverify.png)
![Dynamic UI Rendering](./assets/DynamicLeadAndUIRendering.png)

*   **The Frontend Bouncer:** Cloudflare Turnstile executes a silent challenge in the browser. If passed, it issues a single-use cryptographic token.
*   **Backend Verification:** Before hitting the core business logic, database, or OpenAI API, an Express middleware intercepts the request and POSTs this token to Cloudflare's `/siteverify` endpoint. Reused, missing, or forged tokens result in an immediate `403 Forbidden`.
*   **Recursive WAF Sanitization:** Once verified as human, the payload is scrubbed by a custom Web Application Firewall (WAF) script to neutralize malicious scripts before executing CRM writes.

### 4. The AI Pipeline


With the visitor verified and the prompt sanitized, the request is sent to the OpenAI API. The AI processes the business context and responds to the user.
However, chat interfaces inherently risk exponential token bloat and prompt-injection attacks. This architecture demonstrates memory consumption while ensuring UI safety and fault tolerance during those conversations.


![AI Cognition and Sanitization](./assets/SanitizationAndAICognition.png)
![Chat Zero Trust](./assets/ChatZeroTrustIntercept.png)

*   **Token Bounding (Memory Compaction):** To prevent limitless context windows from causing huge API costs, the system monitors message count. Once a thread exceeds 6 messages, a background process creates the older history into a 150-token active summary, keeping memory linear.
*   **Fault-Tolerant Fetching:** LLM APIs can have extreme latency. The outbound fetch to OpenAI is wrapped in a 20-second `AbortController`. If the API hangs, the socket is cut with a `504 Gateway Timeout`, preventing suspended requests from wasting the Node.js event loop.
*   **Safe UI Injection & UX:** To minimize prompt injection attacks trying to force client-side XSS, the frontend binds the AI response using `.textContent` rather than `.innerHTML`. A 900ms delay is added before rendering to mimic human response delay.

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

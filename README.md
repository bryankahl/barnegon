# Barnegon — AI Chat & Lead Generation Infrastructure

A production-ready SaaS platform built for service businesses. This repository contains the frontend and backend architecture, featuring zero-trust bot defense, dynamic domain provisioning, and webhook security.

## System Architecture

### 1. The Onboarding (Auth, Billing & Webhook Security)


The onboarding begins when a business owner signs up using Google Sign-In. The vulnerability here is that if you let the frontend code confirm that a payment was successful, a hacker can easily fake a "success" message and get a free account. The solution is a split process. The frontend handles sending the user to a Stripe paywall to activate their 30-day free trial, but only the backend is allowed to activate the account.


![Stripe Webhook Security](./assets/FirstTimeSignupAndWebhookSecurity.png)

*   **First Time Sign Up:** When a new user signs up, the backend first checks their Firebase token to make sure they are a real, logged-in user.
*   **Metadata Tag:** The server asks Stripe to create a checkout page. Crucially, the server takes the user's Firebase ID and attaches it to the checkout session as hidden data (metadata). This invisible tag is how the server remembers exactly which database profile to activate after the user finishes paying on Stripe's website.
*   **Webhook Security:** Because the server's ⁠`/webhook⁠` URL has to be public to receive messages from Stripe, the threat is that anyone can try to send a fake JSON message saying a payment succeeded. Stripe signs all real messages with a secret mathematical key. When a message hits the server, it checks this signature; if the math doesn't perfectly match our server's secret key, the request is instantly deleted. Fake payments never even reach the database.
*   **Database Lock:** What if a hacker (or a network glitch) intercepts a real Stripe message and sends it to the server 100 times to crash the system? Every single Stripe message has a unique ID number. Before doing anything, the server tries to save this ID in the database. Firestore uses an atomic write (`.create()`), meaning if that ID is already there, it instantly throws an error. The server sees the error, knows it's a duplicate message, and safely ignores it.
*   **Activating the Account:** Once the webhook passes the signature check and the duplicate check, the server reads that hidden Firebase ID we saved back in Step 1. It goes to the ⁠`businesses⁠` collection, updates the user's profile to active, and saves their newly created Stripe Customer ID. Access is granted, and the user is now officially inside the app.

#### Manage/Cancel Billing
![Manage Billing Flow](./assets/ManageBilling.png)

When an existing user wants to view their subscription or cancel, they click "Manage Billing". Because the platform features no stored credit cards, the frontend asks the server for a portal link. The server grabs that Stripe Customer ID we saved earlier and asks Stripe for a secure, temporary link. The user is sent to Stripe's hosted portal to cancel or update their card. If they cancel, Stripe sends another verified webhook back to our server to turn their access off.

### 2. The First-Time Setup (Dynamic Domain Provisioning)


Once the account is activated, the business owner opens a first-time setup screen. They input their core business details, most importantly, their website's domain name. This domain must be whitelisted so the custom chat widget can operate on their site. The goal is to deploy Cloudflare Turnstile to protect our entire SaaS platform from advanced botnets.
The constraint is that Cloudflare restricts Turnstile widgets to a maximum of 10 custom domains. The bottleneck is that the 11th client registration will fail without manual DevOps intervention. To solve this and support unlimited client websites, the architecture utilizes an automated layer to scale domains infinitely.


![Domain Provisioning](./assets/DomainProvisioning.png)

*   **The Router (`turnstile.js`):** Sanitizes inputs by stripping `https://` and `www.` to prevent Cloudflare API crashes.
*   **Zombie Interceptor (`turnstile.js`):** Detects when a client changes domains and flags the old domain for deletion.
*   **The Orchestrator (`turnstileService.js`):** Executes O(1) database queries to find open ⁠< 10⁠ slots.
*   **Dynamic Minting (`turnstileService.js`):** Automatically fires POST requests to Cloudflare to mint new widgets when slots are full.

### 3. The Defense (Zero-Trust & Lead Verification)

The custom chatbot is now embedded live on the client's website. Traditional firewalls rely on blocking static IP addresses, but "IP Blocking" is completely useless against modern botnets. Modern exploits use "Residential Proxy Networks" where the IP address changes every millisecond. Therefore, we use Turnstile on the frontend to build a "Zero Trust" pipeline.

![Zero Trust Security](./assets/TurnstileTokenAndSiteverify.png)
![Dynamic UI Rendering](./assets/DynamicLeadAndUIRendering.png)

*   **Frontend Security:** Turnstile runs an invisible background check and searches for a cryptographic token from the user's OS. It forces the computer to solve a math problem; a human solves this instantly, but a spammer with 10,000 IPs will crash their own server attempting the math.
*   **The Coat Check:** Turnstile issues a one-time cryptographic token after completing the human check.
*   **Middleware Shield (`verifyTurnstile.js`):** We never trust the frontend, because hackers can forge "passed" requests via API. This middleware acts as a universal shield for all secure routes. The backend authenticates the token directly with Cloudflare via ⁠`siteverify⁠` validation.
*   **Web Application Firewall (WAF):** Turnstile stops bots, but it does not stop a human from manually inputting a malicious script into the form. Turnstile verifies the messenger, but it does not verify the message. To prevent Stored XSS and Database Poisoning for no cost, a Custom Node.js WAF sanitizes the payload. To protect the Node.js CPU from resource exhaustion as traffic scales, payload inspection will eventually be offloaded to Cloudflare's Enterprise WAF (Payload Inspection).


### 4. The AI Pipeline


Directly connecting user inputs to the OpenAI API is a massive security and financial risk. To prevent server crashes and drained API budgets, the architecture executes a strict two-phase Zero-Trust pipeline: verifying the messenger, and then verifying the message.

![Chat Zero Trust](./assets/ChatZeroTrustIntercept.png)
![AI Cognition and Sanitization](./assets/SanitizationAndAICognition.png)

*   **Verifying the Messenger (Frontend Bouncer):** Turnstile widgets evaluate a user’s browser environment, mouse movements, and IP behavior. If a bot is detected, it fails at the browser level—no API call is made to the backend, saving server resources. If a human is verified, the widget issues a one-time-use cryptographic token (⁠`cf_token`⁠).
*   **Backend Zero-Trust Check:** The frontend sends the ⁠`cf_token⁠` and the chat message to the Node.js `/api/ai/chat⁠` endpoint. Because automated scripts (like Postman or Python) can bypass the frontend to send forged requests, the server does not blindly trust the token. It makes a direct call to Cloudflare's ⁠`/siteverify⁠` API. If forged, the backend drops the request (⁠403 Forbidden⁠). If valid, it proceeds to the inner sanctum.
*   **Decontamination (DIY WAF):** Cloudflare verifies the user is human, but humans can still be malicious. If a user types a JavaScript payload into the chat, the Node.js server intercepts it and passes it through a custom ⁠`xss()⁠` function. This scrubs every nested string, ensuring that when the message is logged to Firestore, it doesn’t trigger a Stored XSS attack on the client's dashboard.
*   **Context Assembly:** OpenAI starts with a blank slate and knows nothing about the specific SaaS clients. The backend queries Firestore for the specific business ID, pulls that business's hours, services, and custom instructions (e.g., "Do not offer discounts"), and injects them directly into the System Prompt.
*   **Token Optimization (Memory Condensation):** Without optimization, an entire chat thread gets sent to OpenAI on every call, burning through the API budget as the conversation grows. The system monitors message count; if a thread exceeds 6 messages, a background call to ⁠`gpt-4o⁠` condenses the history into a 150-token active summary, replacing the bulky history and preventing AI hallucinations.
*   **Guarded Fetch:** The server makes the HTTP request to OpenAI to generate a reply, but the fetch is wrapped in an ⁠`AbortController⁠`. If OpenAI's servers hang and don't respond within 20 seconds, the server forcefully severs the connection (⁠504 Gateway Timeout⁠). This prevents the Render server threads from crashing due to resource exhaustion.
*   **Return Trip & Safe Render:** The frontend takes over once the AI response makes it back down the pipeline. Because hallucinated AI code could break the site, the frontend binds the response as strict text (⁠`.textContent`⁠), neutralizing all scripts. Finally, an artificial 900ms delay is injected before rendering to mimic natural human typing latency.

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

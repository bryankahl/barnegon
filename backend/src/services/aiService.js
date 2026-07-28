import fetch from "node-fetch";

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 20000);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper: Fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = OPENAI_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

// Helper: Standardized OpenAI call
async function callOpenAI(endpoint, body) {
  const res = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`openai_error ${res.status}`, errText);
    throw new Error(`OpenAI error: ${res.status}`);
  }

  return res.json();
}

/**
 * Generates a summary of the user's side of the conversation.
 * @param {Array} messages - Array of message objects { role, content }
 * @returns {Promise<string>} - The summary text
 */
export async function generateSummary(messages) {
  const userMessages = (messages || []).filter((m) => m.role === "user");

  const data = await callOpenAI("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: `
Generate a memory summary based only on the user's messages.

Include: names, interests, needs, concerns, questions, tone/personality.
Avoid: assistant responses, repeating wording, assumptions.

Write detailed paragraphs up to 150 tokens.
`.trim(),
      },
      ...userMessages,
    ],
  });

  return data.choices?.[0]?.message?.content?.trim() || "";
}

/**
 * Orchestrates the chat flow:
 * 1. Checks if summary is needed (history >= 6 messages).
 * 2. Generates summary if needed.
 * 3. Constructs the system prompt with business info.
 * 4. Calls OpenAI for the final reply.
 * * @param {Array} messages - Full conversation history
 * @param {Object} biz - Business configuration object
 * @returns {Promise<string>} - The assistant's reply
 */
export async function generateChatReply(messages, biz) {
  const recentHistory = messages.slice(0, -1);
  const latestUserMessage = messages[messages.length - 1];

  // 1. Generate Summary if history is long
  let summary = "";
  if (recentHistory.length >= 6) {
    // We use a specific prompt for internal chat context summarization
    const summaryData = await callOpenAI("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `
You are summarizing only the user's side of the conversation with an AI assistant.

Capture:
- any personal info they mentioned (name, relationships, role),
- goals/needs/interests,
- questions asked,
- what they care about.

Rules:
- DO NOT mention assistant replies.
- DO NOT repeat their wording.
- DO NOT assume intent.

Write 1–2 concise neutral sentences.
`.trim(),
        },
        ...recentHistory,
      ],
    });
    summary = summaryData.choices?.[0]?.message?.content?.trim() || "";
  }

  // 2. Construct System Prompt
  const greetingEnabled = biz?.greetingEnabled === true;
  const greetingText = greetingEnabled && biz?.greeting ? biz.greeting.trim() : "";

  const systemPrompt = `
You are an emotionally intelligent AI assistant for a small business.

HARD RULES:
- Do NOT ask the user for contact info.
- Do NOT claim you will confirm/check availability/schedule/dispatch/follow up later.
- Keep everything inside this chat. No promises of offline actions.

SAME-DAY / URGENT REQUESTS:
- You cannot confirm availability.
- Suggest contacting the business via phone/email (do not ask the user for theirs).

IF THE USER VOLUNTEERS CONTACT INFO:
- Acknowledge politely, but do NOT promise anyone will reach out.
- Do NOT repeat/request their info.

Language rules:
- Detect the user's language and reply entirely in it.

If a user replies "yes"/"sure"/vague, assume they are responding to the greeting:
"${greetingText || "No greeting was shown"}"
Never repeat the exact greeting text again—advance the conversation with one clear next question.

Memory summary:
${summary || "No memory yet."}

Business Info:
- Name: ${biz?.name}
- Services: ${biz?.services}
- Hours: ${biz?.hours}
- Pricing: ${biz?.pricing}
- Phone: ${biz?.phone}
- Email: ${biz?.email}
- Areas: ${biz?.areas}

Instructions: ${biz?.customInstructions || "Friendly, concise, helpful"}

Be short, warm, human.
`.trim();

  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...recentHistory.slice(-6),
    latestUserMessage,
  ];

  // 3. Generate Reply
  const data = await callOpenAI("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4o",
    temperature: 0.7,
    messages: finalMessages,
  });

  return data.choices?.[0]?.message?.content || "Sorry, I didn't catch that.";
}
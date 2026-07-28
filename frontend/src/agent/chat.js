import { db, businessId } from "./config.js";
import { collection, addDoc, doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { sendWidgetChat, getWidgetChatSummary } from "../js/api/apiClient.js";
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.5/dist/purify.es.mjs';

export let hasStartedChat = false;
export const chatHistory = [];
export let currentThreadId = null;
export let summaryUpdating = false;
export let currentSummary = "";

export const botSound = new Audio("https://ai-agent-demo-9fe52.web.app/notificationOne.mp3");

export async function trackChatStarted() {
  try {
    const metricsRef = doc(db, "metrics", businessId);
    await setDoc(metricsRef, { chatStarted: increment(1) }, { merge: true });
    console.log("📈 chatStarted incremented");
  } catch (err) {
    console.error("❌ Failed to track chatStarted:", err.message);
  }
}

export function appendBotMessage(text) {
  const container = document.getElementById("chat-messages");
  if (!container) return;
  const msg = document.createElement("div");
  msg.className = "message bot";

  msg.innerHTML = DOMPurify.sanitize(text, { ADD_ATTR: ['target'] });

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

export function appendMessage(sender, text) {
  const container = document.getElementById("chat-messages");
  if (!container) return;
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("message", sender);

  const messageText = document.createElement("div");
  messageText.textContent = text;

  const timestamp = document.createElement("div");
  timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  timestamp.style.fontSize = "11px";
  timestamp.style.color = "#888";
  timestamp.style.marginTop = "4px";
  timestamp.style.textAlign = "right";

  messageWrapper.appendChild(messageText);
  messageWrapper.appendChild(timestamp);

  container.appendChild(messageWrapper);
  container.scrollTop = container.scrollHeight;

  if (sender === "bot") {
    botSound.play().catch(() => {});
  }
}

export function showTypingIndicator() {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;
  const typing = document.createElement("div");
  typing.className = "message bot";
  typing.id = "typing-indicator";
  typing.innerHTML = `
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `;
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function removeTypingIndicator() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

export async function logMessageToThread(role, content) {
  if (!currentThreadId || !content) return;
  try {
    const ref = collection(db, `businesses/${businessId}/chatThreads/${currentThreadId}/messages`);
    await addDoc(ref, { role, content, timestamp: Date.now() });
    console.log(`💬 Logged message to thread (${role})`);
  } catch (err) {
    console.error("❌ Failed to log message:", err.message);
  }
}

export async function updateSummary() {
  if (summaryUpdating) return;
  summaryUpdating = true;
  
  try {
    const summaryPrompt = chatHistory.slice(-8);
    const data = await getWidgetChatSummary(summaryPrompt, businessId);
    if (data) {
      currentSummary = data.summary || "";
    }
  } catch (err) {
    console.error("❌ Summary update failed:", err.message);
  } finally {
    summaryUpdating = false;
  }
}

export async function sendMessage(biz) {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (text === "") return;

  input.disabled = true;

  if (!hasStartedChat) {
    hasStartedChat = true;
    trackChatStarted();
  }  
  appendMessage("user", text); 
  showTypingIndicator();       
  chatHistory.push({ role: "user", content: text });
  input.value = "";
  
  if (!currentThreadId) {
    try {
      const now = new Date();
      const dateLabel = now.toISOString().split("T")[0];
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const threadRef = await addDoc(
        collection(db, `businesses/${businessId}/chatThreads`),
        { startedAt: Date.now(), dateLabel, timeLabel, userAgent: navigator.userAgent, referrer: document.referrer || null }
      );
      currentThreadId = threadRef.id;
      console.log("🧵 New chat thread created:", currentThreadId);

      if (biz.greetingEnabled && biz.greeting) {
        await logMessageToThread("assistant", biz.greeting);
        chatHistory.push({ role: "assistant", content: biz.greeting });
      }
    } catch (err) {
      console.error("❌ Failed to create chat thread:", err.message);
    }
  }

  logMessageToThread("user", text).catch(err => console.error("Failed to log user message:", err));

  if (chatHistory.length % 5 === 0) {
    setTimeout(() => updateSummary(), 4000);
  }
  
  const messages = [...chatHistory.slice(-8), { role: "user", content: text }];

  try {
    const data = await sendWidgetChat(messages, biz, businessId);
    const reply = data.reply;

    await new Promise(res => setTimeout(res, 900)); 
    removeTypingIndicator();

    appendMessage("bot", reply); 
    chatHistory.push({ role: "assistant", content: reply });

    logMessageToThread("assistant", reply).catch(err => console.error("Failed to log assistant message:", err));
    input.disabled = false;
    input.focus();

  } catch (err) {
    console.error(err);
    removeTypingIndicator();

    if (err.message.includes("Too many requests")) {
      appendMessage("bot", "Whoa, you're moving a bit too fast! Please wait a few seconds before sending another message.");
    } else if (err.message.includes("Security")) {
      appendMessage("bot", "Security check failed. Please refresh the page and try again.");
    } else {
      appendMessage("bot", "There was an error connecting to the AI. Please try again.");
    }

    input.disabled = false;
    input.focus();
  }
}
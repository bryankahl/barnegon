import { db, businessId } from "./agent/config.js";
import { isMobile, setAgentRealVh, bindViewportListeners } from "./agent/ui.js";
import { sendMessage, appendMessage, appendBotMessage, chatHistory, logMessageToThread } from "./agent/chat.js";
import { renderCustomLeadForm, renderCustomLeadFormMobile, openLeadFormOverlay, closeLeadFormOverlay, openCalendarOverlay, closeCalendarOverlay, submitLeadFromForm } from "./agent/leads.js";
import { injectStyles, getAgentHTML } from "./agent/template.js";

import {
  doc,
  getDoc,
  collection,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
  increment,
  FieldPath
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { loadTurnstile } from "./utils/security.js";

(async () => {

  try {
    await loadTurnstile('0x4AAAAAACnywfP5IFkTR43X');
  } catch (err) {
    console.error("Failed to load security clearance", err);
  }

  let bubbleBindings = {};

  async function fetchBubbleBindings() {
    try {
      const ref = doc(db, "businesses", businessId);
      const snap = await getDoc(ref);
      bubbleBindings = snap.data()?.bubbleBindings || {};
      console.log("✅ bubbleBindings loaded:", bubbleBindings);

      if (typeof renderPresetBubbles === "function") {
        renderPresetBubbles(); 
      }
    } catch (err) {
      console.error("❌ Failed to fetch bubbleBindings:", err.message);
    }
  }

// STEP 3: Fetch business profile
const docRef = doc(db, "businesses", businessId);
const docSnap = await getDoc(docRef);

if (!docSnap.exists()) {
  console.error(`No business found with ID '${businessId}'`);
  throw new Error("Business profile not found");
}

const biz = docSnap.data();

// ✅ BLOCK agent from rendering if isActive is false
if (biz.isActive !== true) {
  console.warn("⛔ This business is not active — chat agent disabled.");
  return;
}
const textColor = biz.textColor || "#ffffff";
injectStyles(biz);

// STEP 5: Inject UI
const wrapper = document.createElement("div");
wrapper.id = "homebase-agent";
// Initialize the real viewport var on the wrapper before injecting markup
setAgentRealVh(wrapper);
bindViewportListeners(wrapper);
// Keep overlay height synced to the visual viewport (keyboard open/close, rotations)
(function bindVisualViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const onVV = () => setAgentRealVh(wrapper);
  vv.addEventListener('resize', onVV);
  vv.addEventListener('scroll', onVV);
})();

// -------- Mobile typing smoothness (keep input and last messages visible) --------
const getChatMessagesEl = () => document.querySelector("#homebase-agent #chat-messages");
const getChatInputEl    = () => document.querySelector("#homebase-agent #chat-input");

function scrollMessagesToBottom() {
  const m = getChatMessagesEl();
  if (!m) return;
  requestAnimationFrame(() => { m.scrollTop = m.scrollHeight; });
}

function onInputFocus() {
  setAgentRealVh(wrapper);
  const box = chatBoxEl();
  if (box && box.classList.contains("half-open")) {
    openChatFull();
  }
}

function onViewportChange() {
  // Fires as iOS URL bar and keyboard animate
  setAgentRealVh(wrapper);
  if (document.activeElement === getChatInputEl()) {
    scrollMessagesToBottom();
  }
}

getChatInputEl()?.addEventListener("focus", onInputFocus, { passive: true });
getChatInputEl()?.addEventListener("input", () => scrollMessagesToBottom(), { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", onViewportChange);
  window.visualViewport.addEventListener("scroll", onViewportChange);
}

// Reduce page "jumping" when scrolling message history on iOS
getChatMessagesEl()?.addEventListener("touchmove", (e) => {
  e.stopPropagation();
}, { passive: true });

wrapper.style.opacity = 0;
wrapper.style.transition = 'opacity 0.3s ease';
wrapper.innerHTML = getAgentHTML(biz);

console.log("✅ businessId in use:", businessId);

async function trackPresetClick(key) {
  try {
    const ref = doc(db, "metrics", businessId);
    await setDoc(ref, {
      presetClicks: { [key]: increment(1) }
    }, { merge: true });
    console.log(`📈 presetClick '${key}' incremented.`);
  } catch (err) {
    console.error(`❌ Failed to track presetClick '${key}':`, err.message);
  }
}

async function trackCalendarClick() {
  try {
    const ref = doc(db, "metrics", businessId);
    await setDoc(ref, {
      calendarClicks: increment(1)
    }, { merge: true });
    console.log("📅 calendarClick incremented.");
  } catch (err) {
    console.error("❌ Failed to track calendarClick:", err.message);
  }
}

async function handlePresetClick(id) {
  const box = chatBoxEl?.();
  if (box && box.classList.contains("half-open")) openChatFull();
  trackPresetClick(id);

  const binding = bubbleBindings[id];

  if (binding?.type === "form") {
    if (isMobile()) {
      await renderCustomLeadFormMobile(binding.id, biz);
      // Ensure the first input is visible within the overlay after open
      setTimeout(() => {
        document.querySelector('#custom-lead-form-mobile input, #custom-lead-form-mobile textarea')?.scrollIntoView({ block: 'center' });
      }, 0);
      openLeadFormOverlay();
    } else {
      await renderCustomLeadForm(binding.id, biz);
      document.getElementById("lead-form").classList.add("active");
      document.getElementById("chat-messages").style.display = "none";
      document.getElementById("chat-input-container").style.display = "none";
      document.getElementById("preset-bubbles").style.display = "none";
    }
    return;
  }
  

  if (binding?.type === "calendar") {
    const calRef = doc(db, "businesses", businessId, "calendars", binding.id);
    const calSnap = await getDoc(calRef);
    const calendarURL = calSnap.exists() ? calSnap.data().url : null;
  
    if (!calendarURL?.startsWith("http")) {
      // Keep your inline error behavior
      const calendarView = document.getElementById("calendar-view");
      calendarView.innerHTML = "<p style='color: red;'>⚠️ No calendar link found.</p>";
      return;
    }
  
    if (isMobile()) {
      // ✅ MOBILE: open full-screen keyboard-safe overlay
      openCalendarOverlay(calendarURL);
      trackCalendarClick(businessId);
      return;
    }
  
    // ✅ DESKTOP/TABLET: keep your existing inline view (unchanged)
    document.getElementById("lead-form").classList.remove("active");
    document.getElementById("chat-messages").style.display = "none";
    document.getElementById("chat-input-container").style.display = "none";
    document.getElementById("preset-bubbles").style.display = "none";
  
    const calendarView = document.getElementById("calendar-view");
    calendarView.innerHTML = "";
    calendarView.classList.add("active");
  
    const iframe = document.createElement("iframe");
    iframe.src = calendarURL.includes("?") ? calendarURL + "&embed=1" : calendarURL + "?embed=1";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.setAttribute("allow", "payment");
    trackCalendarClick(businessId);

    // Back Button
    const backButton = document.createElement("div");
    backButton.textContent = "← Back";
    backButton.style.padding = "6px 12px";
    backButton.style.fontSize = "13px";
    backButton.style.fontWeight = "500";
    backButton.style.borderRadius = "9999px";
    backButton.style.border = `1px solid ${biz.color || "#2c3e50"}`;
    backButton.style.background = "white";
    backButton.style.color = biz.color || "#2c3e50";
    backButton.style.cursor = "pointer";
    backButton.style.transition = "all 0.2s ease";

    // hover
    backButton.addEventListener("mouseenter", function () {
      backButton.style.background = biz.color || "#2c3e50";
      backButton.style.color = textColor || "#ffffff";
    });
    backButton.addEventListener("mouseleave", function () {
      backButton.style.background = "white";
      backButton.style.color = biz.color || "#2c3e50";
    });

    // logic
    backButton.addEventListener("click", () => {
      calendarView.classList.remove("active");
      document.getElementById("chat-messages").style.display = "block";
      document.getElementById("chat-input-container").style.display = "flex";
      document.getElementById("preset-bubbles").style.display = "flex";
    });

    // Actions bar (just the Back button)
    const actionsBar = document.createElement("div");
    actionsBar.style.display = "flex";
    actionsBar.style.justifyContent = "center";
    actionsBar.style.alignItems = "center";
    actionsBar.style.gap = "8px";
    actionsBar.style.marginTop = "12px";
    actionsBar.appendChild(backButton);

    // Append to calendar view
    calendarView.appendChild(iframe);
    calendarView.appendChild(actionsBar);
    return;

  }
}

function handleStaticBubbleClick(key) {
  const box = chatBoxEl?.();
  if (box && box.classList.contains("half-open")) openChatFull();
  trackPresetClick(key); // already defined

  if (key === "contact") {
    const phone = biz.phone ? formatPhonePretty(biz.phone) : "N/A";
    const email = biz.email || "N/A";
  
    const contactText = `
      Phone: ${phone}<br>
      Email: <a href="mailto:${email}" style="color:${biz.color || "#007bff"}; text-decoration:underline; display:inline-block; transition:all 0.2s ease;"
        onmouseover="this.style.transform='scale(1.05)'; this.style.color='#004080';"
        onmouseout="this.style.transform='scale(1)'; this.style.color='${biz.color || "#007bff"}';"
      >${email}</a>
    `;
  
    appendBotMessage(contactText);
  }  
  
  if (key === "about") {
    const aboutText = biz.aboutMessage?.trim() || "We're a trusted local business that takes pride in great service.";
    appendBotMessage(`About Us:\n${aboutText}`);
    return;
  }  
  
  if (key === "reviews") {
    const link = biz.reviewsLink || "https://www.google.com";
    appendBotMessage(`Google Reviews: <a href="${link}" target="_blank"
      style="
        color: ${biz.color || '#007bff'};
        text-decoration: underline;
        display: inline-block;
        transition: transform 0.2s ease, color 0.2s ease;
      "
      onmouseover="this.style.transform='scale(1.05)'; this.style.color='#004080';"
      onmouseout="this.style.transform='scale(1)'; this.style.color='${biz.color || '#007bff'}';"
    >${link}</a>`);
  }  

  if (key === "areas") {
    const areas = biz.areas || "our local region.";
    appendBotMessage(`We serve: ${areas}`);
  }  
  
}


function renderPresetBubbles() {
  const container = document.querySelector("#homebase-agent #preset-bubbles");
  if (!container) return;

  container.innerHTML = "";

  const hasCustom = bubbleBindings && Object.keys(bubbleBindings).length > 0;
  const hasStatic = Array.isArray(biz.selectedBubbles) && biz.selectedBubbles.length > 0;

  if (!hasCustom && !hasStatic) {
    container.innerHTML = "<p style='color: #777;'>No chat buttons yet.</p>";
    return;
  }

  // Render custom bubbles
  Object.entries(bubbleBindings).forEach(([id]) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = id.charAt(0).toUpperCase() + id.slice(1);
    btn.dataset.id = id;
    btn.addEventListener("click", () => handlePresetClick(id));
    container.appendChild(btn);
  });

  // Render static bubbles (you can also call renderStaticBubbles() here if preferred)
  renderStaticBubbles();
}


function renderStaticBubbles() {
  const selected = biz.selectedBubbles || [];
  const container = document.getElementById("preset-bubbles");

  const staticBubbles = {
    contact: "Contact Info",
    about: "About Us",
    reviews: "Google Reviews",
    areas: "Areas We Serve"
  };

  selected.forEach(key => {
    if (["contact", "about", "reviews", "areas"].includes(key)) {
      const btn = document.createElement("button");
      btn.className = "preset-btn";
      btn.textContent = staticBubbles[key];
      btn.onclick = () => handleStaticBubbleClick(key);
      container.appendChild(btn);
    }
  });
}


const preview = document.getElementById("agent-preview-container");
if (preview) {
  preview.appendChild(wrapper);
} else {
  document.body.appendChild(wrapper); // fallback for public sites
}

// Smooth fade-in
requestAnimationFrame(() => {
  wrapper.style.opacity = 1;
});



let awaitingGreetingResponse = false;

await fetchBubbleBindings();

// STEP 7: Auto-open with greeting if set (desktop/tablet only)
setTimeout(() => {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) {
    console.warn("⚠️ chat-box not found. Skipping greeting.");
    return;
  }

  if (biz.greetingEnabled && biz.greeting && !isMobile()) {
    // 1) Actually show the half popup first
    openChatHalf(); // half-open on larger screens

    // 2) Clean up any closing animation class
    chatBox.classList.remove("fade-down");

    // 3) Restart the fade-up animation reliably
    chatBox.classList.remove("auto-open"); // in case it’s lingering
    void chatBox.offsetWidth;              // force reflow to restart CSS anim
    chatBox.classList.add("auto-open");

    // 4) Remove the class after it runs so future opens aren't affected
    chatBox.addEventListener("animationend", () => {
      chatBox.classList.remove("auto-open");
    }, { once: true });

    // 5) Proceed with greeting message
    appendMessage("bot", biz.greeting);
    awaitingGreetingResponse = true;
  }
}, 2000);



// STEP 6: Chat logic
// ---- Backdrop, scroll-lock, and robust open/close ----
const chatBoxEl   = () => document.getElementById("chat-box");
const backdropEl  = () => document.querySelector("#homebase-agent #chat-backdrop");
const closeEl     = () => document.querySelector("#homebase-agent .chat-close");
const inputEl     = () => document.querySelector("#homebase-agent #chat-input");

function getFocusable() {
  const root = chatBoxEl();
  if (!root) return [];
  return Array.from(root.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

function focusTrap(e) {
  if (e.key !== 'Tab') return;
  const focusables = getFocusable();
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last  = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openChat() {
  const box = chatBoxEl();
  const back = backdropEl();
  if (!box || !back) return;

  wrapper.classList.add('chat-open');        // enables backdrop
  box.classList.add('auto-open');
  box.classList.add('fade-down');
  box.classList.remove('hidden');            // show but still faded
  void box.offsetHeight;                     // ✨ force reflow to enable transition
  box.classList.remove('fade-down');         // animate in

  
  setAgentRealVh(wrapper);                   // sync height on open

  // a11y: move focus into the dialog
  setTimeout(() => {
    (inputEl() || closeEl() || box).focus();
  }, 0);

  document.addEventListener('keydown', onEscape, { passive: true });
  box.addEventListener('keydown', focusTrap);
}

function closeChat() {
  const box = chatBoxEl();
  if (!box) return;

  document.removeEventListener('keydown', onEscape);
  box.removeEventListener('keydown', focusTrap);

  // 1) Lock current height so it doesn't "snap" taller during fade
  const h = getComputedStyle(box).height;
  box.style.height = h;
  // 2) Fade out (keep size class until after animation)
  box.classList.add('fade-down');

  setTimeout(() => {
    wrapper.classList.remove('chat-open');
    box.classList.add('hidden');
    box.classList.remove('fade-down');
    // 3) Now safe to clear size classes and inline styles
    box.classList.remove('auto-open', 'half-open');
    box.style.height = '';
  }, 400);
}

function openChatHalf() {
  const box = chatBoxEl();
  const back = backdropEl();
  if (!box || !back) return;

  wrapper.classList.add('chat-open');           // enable backdrop & scroll-lock
  box.classList.remove('hidden', 'fade-down', 'auto-open');
  box.classList.add('half-open');

  setAgentRealVh(wrapper);
  setTimeout(() => {
    (inputEl() || closeEl() || box).focus();
  }, 0);

  document.addEventListener('keydown', onEscape, { passive: true });
  box.addEventListener('keydown', focusTrap);
}

function openChatFull() {
  const box = chatBoxEl();
  const back = backdropEl();
  if (!box || !back) return;

  wrapper.classList.add('chat-open');
  box.classList.remove('hidden', 'fade-down', 'half-open');
  box.classList.add('auto-open');

  setAgentRealVh(wrapper);
  setTimeout(() => {
    (inputEl() || closeEl() || box).focus();
  }, 0);

  document.addEventListener('keydown', onEscape, { passive: true });
  box.addEventListener('keydown', focusTrap);
}


function onEscape(e) {
  if (e.key === 'Escape') closeChat();
}

// Toggle via bubble button
document.getElementById("chat-button").addEventListener("click", () => {
  const box = chatBoxEl();
  if (!box) return;
  if (box.classList.contains("hidden")) openChat();
  else closeChat();
});

// X close (click or key)
closeEl()?.addEventListener("click", () => {
  closeLeadFormOverlay();  
  closeCalendarOverlay(); 
  closeChat();
});

// --- FIX: prevent page jump when closing half-open greeting ---
(() => {
  const btn = closeEl();
  if (!btn) return;

  let _scrollBefore = 0;

  // Prevent the pre-click focus/scroll behavior
  btn.addEventListener('mousedown', (e) => {
    _scrollBefore = window.scrollY || document.documentElement.scrollTop || 0;
    e.preventDefault();              // <-- stops browser from shifting focus/scroll
  }, { passive: false });

  // Close without scrolling the page to the top
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // your existing close calls
    closeLeadFormOverlay();
    closeCalendarOverlay();
    closeChat();

    // restore original scroll position after close kicks off
    requestAnimationFrame(() => window.scrollTo(0, _scrollBefore));
  });
})();

// --- MOBILE FIRST-INTERACTION ANTI-JUMP (one-time only) ---
(() => {
  const isMobile = typeof window !== 'undefined' && matchMedia('(max-width: 768px)').matches;
  if (!isMobile) return;

  let armed = true;

  // find your launcher/closer using existing getters if present, with fallbacks
  const resolve = (getter, sel) => {
    try { const n = getter?.(); if (n) return n; } catch {}
    return document.querySelector(sel);
  };

  const launcher =
    resolve(typeof openButtonEl === 'function' ? openButtonEl : null,
            '[data-chat-launcher], .chat-launcher, #chat-launcher, .barnegon-chat-bubble');

  const closer =
    resolve(typeof closeEl === 'function' ? closeEl : null,
            '.chat-close, [data-chat-close]');

  const armAntiJump = () => {
    if (!armed) return;
    armed = false;

    const y = window.scrollY || document.documentElement.scrollTop || 0;
    let active = true;

    // if the page moves, snap it back for a short window
    const restore = () => {
      if (!active) return;
      if (Math.abs((window.scrollY || document.documentElement.scrollTop) - y) > 1) {
        // snap back immediately
        window.scrollTo(0, y);
      }
    };

    // run a few times during the interaction window
    const tick = () => {
      restore();
      if (active) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // also listen to scroll events (Safari/iOS weirdness)
    const onScroll = () => restore();
    window.addEventListener('scroll', onScroll, { passive: true });

    // stop after ~300ms so we don't interfere with normal usage
    setTimeout(() => {
      active = false;
      window.removeEventListener('scroll', onScroll);
    }, 320);
  };

  // arm on the very first user interaction (open OR close), but don't block default behavior
  const wire = (el) => {
    if (!el) return;
    const handler = () => armAntiJump();
    el.addEventListener('touchstart', handler, { passive: true, once: true });
    el.addEventListener('mousedown',   handler, { passive: true, once: true });
  };

  wire(launcher);
  wire(closer);
})();



closeEl()?.addEventListener("keydown", (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    closeChat();
  }
});

// Backdrop closes the chat
backdropEl()?.addEventListener("click", closeChat);
// Mobile overlay back button
document.getElementById("lfo-back")?.addEventListener("click", () => {
  closeLeadFormOverlay();
});

document.getElementById("co-back")?.addEventListener("click", () => {
  closeCalendarOverlay();
});


// Tap header or empty content area to dismiss the keyboard
document.querySelector("#lead-form-overlay .lfo-header")?.addEventListener("click", () => {
  if (document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
    document.activeElement.blur();
  }
});

document.getElementById("lfo-content")?.addEventListener("click", (e) => {
  // If tap isn't on an input-ish element, blur the focused field
  const t = e.target;
  const isField = t.closest?.("input, textarea, label, [role='textbox']");
  if (!isField && document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
    document.activeElement.blur();
  }
}, { passive: true });


document.getElementById("send-button").addEventListener("click", () => {
  const box = chatBoxEl?.();
  if (box && box.classList.contains("half-open")) openChatFull();
  sendMessage(biz);
});

document.getElementById("chat-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const box = chatBoxEl?.();
    if (box && box.classList.contains("half-open")) openChatFull();
    sendMessage(biz);
  }
});

document.getElementById("lead-submit").addEventListener("click", async (event) => {
  event.preventDefault();

  // HONEYPOT GUARD (desktop)
  const _hp = (document.getElementById("hp_middle")?.value || "").trim();
  if (_hp) { console.info("Lead dropped (honeypot, desktop)"); return; }

  try {
    await submitLeadFromForm(document.getElementById("custom-lead-form"), biz);
    document.getElementById("lead-form").classList.remove("active");
    document.getElementById("chat-messages").style.display = "block";
    document.getElementById("chat-input-container").style.display = "flex";
    document.getElementById("preset-bubbles").style.display = "flex";
    document.getElementById("chat-messages").innerHTML = "";
    appendMessage("bot", "Thanks for your info! We'll follow up with you shortly.");
  } catch (_) {
  }
});

document.getElementById("lead-submit-mobile").addEventListener("click", async (event) => {
  event.preventDefault();

  // HONEYPOT GUARD (mobile)
  const _hp = (document.getElementById("hp_middle_mobile")?.value || "").trim();
  if (_hp) { console.info("Lead dropped (honeypot, mobile)"); return; }

  try {
    await submitLeadFromForm(document.getElementById("custom-lead-form-mobile"), biz);
    closeLeadFormOverlay();
    appendMessage("bot", "Thanks for your info! We'll follow up with you shortly.");
  } catch (_) {
  }
});



const startLeadBtn = document.getElementById("start-lead");
if (startLeadBtn) {
  startLeadBtn.addEventListener("click", () => {
    leadState = {
      inProgress: true,
      step: 0,
      responses: {}
    };
    appendMessage("bot", "Awesome! What’s your name?");
  });
}

function formatPhonePretty(e164) {
  try {
    const phoneNumber = libphonenumber.parsePhoneNumber(e164);
    return phoneNumber.formatInternational(); // e.g. +1 609 709 0793 or +44 7123 456789
  } catch (err) {
    return e164; // fallback to raw if invalid or unparsable
  }
}

})();

import { db, businessId } from "./config.js";
import { setAgentRealVh } from "./ui.js";
import { appendMessage } from "./chat.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export let activeLeadFormId = null;

export async function renderCustomLeadForm(formId = "default", biz) {
  const form = document.getElementById("custom-lead-form");
  activeLeadFormId = formId; 
  if (!form) return;

  const scrollY = window.scrollY;
  const textColor = biz.textColor || "#ffffff";

  try {
    const snap = await getDocs(collection(db, `businesses/${businessId}/leadForms/${formId}/fields`));
    const fields = [];
    snap.forEach(doc => fields.push({ id: doc.id, ...doc.data() }));
    fields.sort((a, b) => a.order - b.order);

    const newForm = document.createElement("div");

    fields.forEach(field => {
      const wrapper = document.createElement("div");
      wrapper.style.margin = "16px 16px 20px 16px";

      const label = document.createElement("label");
      label.setAttribute("for", field.id); 
      label.textContent = field.label;
      label.style.display = "block";
      label.style.marginBottom = "8px";
      label.style.fontSize = "15px";
      label.style.fontWeight = "600";
      label.style.color = "#111";
      wrapper.appendChild(label);

      let input;

      if (field.type === "text" || field.type === "paragraph") {
        input = document.createElement(field.type === "text" ? "input" : "textarea");
        input.name = field.id;
        input.id = field.id;
        input.placeholder = field.label;
        if (field.required) input.dataset.required = "true";
        input.style.width = "100%";
        input.style.padding = "12px";
        input.style.borderRadius = "10px";
        input.style.border = "1px solid #ccc";
        input.style.background = "#fff";
        input.style.fontSize = "14px";
        input.style.boxSizing = "border-box";
      }
      else if (["dropdown", "checkbox"].includes(field.type)) {
        input = document.createElement("div");
        input.style.display = "grid";
        input.style.gridTemplateColumns = "repeat(auto-fill, minmax(140px, 1fr))";
        input.style.gap = "8px";

        (field.options || []).forEach(option => {
          const optWrapper = document.createElement("label");
          optWrapper.style.display = "flex";
          optWrapper.style.alignItems = "center";
          optWrapper.style.gap = "8px";
          optWrapper.style.padding = "10px";
          optWrapper.style.border = "1px solid #ccc";
          optWrapper.style.borderRadius = "10px";
          optWrapper.style.background = "#f7f7f7";
          optWrapper.style.cursor = "pointer";
          optWrapper.style.fontSize = "14px";
          optWrapper.style.color = "#222";

          const el = document.createElement("input");
          el.name = field.id;
          el.value = option;
          el.style.margin = "0";
          if (field.required) el.dataset.required = "true";
          el.type = field.type === "dropdown" ? "radio" : "checkbox";

          optWrapper.appendChild(el);
          optWrapper.appendChild(document.createTextNode(option));
          input.appendChild(optWrapper);
        });
      }

      if (input) wrapper.appendChild(input);
      newForm.appendChild(wrapper);
    });

    const actionsBar = document.createElement("div");
    actionsBar.style.display = "flex";
    actionsBar.style.flexDirection = "row";
    actionsBar.style.justifyContent = "space-between";
    actionsBar.style.alignItems = "center";
    actionsBar.style.gap = "8px";
    actionsBar.style.position = "sticky";
    actionsBar.style.bottom = "0";
    actionsBar.style.zIndex = "10";
    actionsBar.style.background = "#fafafa";
    actionsBar.style.padding = "8px 16px";
    actionsBar.style.borderTop = "1px solid #eee";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.textContent = "← Back";
    backButton.style.flex = "1";
    backButton.style.padding = "12px 0";
    backButton.style.textAlign = "center";
    backButton.style.fontSize = "15px";
    backButton.style.fontWeight = "500";
    backButton.style.borderRadius = "9999px";
    backButton.style.border = `2px solid ${biz.color || "#2c3e50"}`;
    backButton.style.background = "white";
    backButton.style.color = biz.color || "#2c3e50";
    backButton.style.cursor = "pointer";
    backButton.style.transition = "all 0.2s ease";
    backButton.addEventListener("mouseenter", () => {
      backButton.style.background = biz.color || "#2c3e50";
      backButton.style.color = textColor;
    });
    backButton.addEventListener("mouseleave", () => {
      backButton.style.background = "white";
      backButton.style.color = biz.color || "#2c3e50";
    });
    backButton.addEventListener("click", () => {
      document.getElementById("lead-form").classList.remove("active");
      document.getElementById("chat-messages").style.display = "block";
      document.getElementById("chat-input-container").style.display = "flex";
      document.getElementById("preset-bubbles").style.display = "flex";
    });
    actionsBar.appendChild(backButton);

    const existingSubmitButton = document.getElementById("lead-submit");
    existingSubmitButton.style.flex = "1";
    existingSubmitButton.style.padding = "12px 0";
    existingSubmitButton.style.textAlign = "center";
    existingSubmitButton.style.fontSize = "15px";
    existingSubmitButton.style.fontWeight = "600";
    existingSubmitButton.style.borderRadius = "9999px";
    existingSubmitButton.style.border = "none";
    existingSubmitButton.style.background = biz.color || "#2c3e50";
    existingSubmitButton.style.color = textColor;
    existingSubmitButton.style.cursor = "pointer";
    existingSubmitButton.style.transition = "transform 0.2s ease, background 0.2s ease";
    existingSubmitButton.addEventListener("mouseenter", () => {
      existingSubmitButton.style.transform = "scale(1.05)";
    });
    existingSubmitButton.addEventListener("mouseleave", () => {
      existingSubmitButton.style.transform = "scale(1)";
    });
    actionsBar.appendChild(existingSubmitButton);

    newForm.appendChild(actionsBar);
    form.replaceChildren(...newForm.children);

    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    });

  } catch (err) {
    console.error("Error loading lead form fields:", err);
    form.innerHTML = "<p style='color: red;'>⚠️ Could not load form fields.</p>";
  }
}

export async function renderCustomLeadFormMobile(formId = "default") {
  const form = document.getElementById("custom-lead-form-mobile");
  activeLeadFormId = formId;
  if (!form) return;

  try {
    const snap = await getDocs(collection(db, `businesses/${businessId}/leadForms/${formId}/fields`));
    const fields = [];
    snap.forEach(doc => fields.push({ id: doc.id, ...doc.data() }));
    fields.sort((a, b) => a.order - b.order);

    const newForm = document.createElement("div");

    fields.forEach(field => {
      const wrapper = document.createElement("div");
      wrapper.style.margin = "16px 12px 18px 12px";

      const label = document.createElement("label");
      label.setAttribute("for", field.id);
      label.textContent = field.label;
      label.style.display = "block";
      label.style.marginBottom = "8px";
      label.style.fontSize = "15px";
      label.style.fontWeight = "600";
      label.style.color = "#111";
      wrapper.appendChild(label);

      let input;

      if (field.type === "text" || field.type === "paragraph") {
        input = document.createElement(field.type === "text" ? "input" : "textarea");
        input.name = field.id;
        input.id = field.id;
        input.placeholder = field.label;
        if (field.required) input.dataset.required = "true";
        input.style.width = "100%";
        input.style.padding = "12px";
        input.style.borderRadius = "10px";
        input.style.border = "1px solid #ccc";
        input.style.background = "#fff";
        input.style.fontSize = "16px";
        input.style.boxSizing = "border-box";
        if (input.tagName === "TEXTAREA") {
          input.style.minHeight = "80px";
          input.style.resize = "vertical";
        }
      } else if (["dropdown", "checkbox"].includes(field.type)) {
        input = document.createElement("div");
        input.style.display = "grid";
        input.style.gridTemplateColumns = "repeat(auto-fill, minmax(140px, 1fr))";
        input.style.gap = "8px";

        (field.options || []).forEach(option => {
          const optWrapper = document.createElement("label");
          optWrapper.style.display = "flex";
          optWrapper.style.alignItems = "center";
          optWrapper.style.gap = "8px";
          optWrapper.style.padding = "10px";
          optWrapper.style.border = "1px solid #ccc";
          optWrapper.style.borderRadius = "10px";
          optWrapper.style.background = "#f7f7f7";
          optWrapper.style.cursor = "pointer";
          optWrapper.style.fontSize = "14px";
          optWrapper.style.color = "#222";

          const el = document.createElement("input");
          el.name = field.id;
          el.value = option;
          el.style.margin = "0";
          if (field.required) el.dataset.required = "true";
          el.type = field.type === "dropdown" ? "radio" : "checkbox";

          optWrapper.appendChild(el);
          optWrapper.appendChild(document.createTextNode(option));
          input.appendChild(optWrapper);
        });
      }

      if (input) wrapper.appendChild(input);
      newForm.appendChild(wrapper);
    });

    form.replaceChildren(...newForm.children);
  } catch (err) {
    console.error("Error loading mobile lead form fields:", err);
    form.innerHTML = "<p style='color:red;'>⚠️ Could not load form fields.</p>";
  }
}

const _preventTouch = (e) => {
  const inScrollable = e.target.closest?.('#lead-form-overlay #lfo-content');
  if (inScrollable) return; 
  e.preventDefault();
};

let _vvSync = null;
let _lfoScrollY = 0;

function syncOverlayToVV() {
  const ov = document.getElementById('lead-form-overlay');
  const vv = window.visualViewport;
  if (!ov || !vv) return;
  ov.style.top = vv.offsetTop + 'px';
  ov.style.left = vv.offsetLeft + 'px';
  ov.style.width = vv.width + 'px';
  ov.style.height = vv.height + 'px';
}

export function openLeadFormOverlay() {
  const overlay = document.getElementById("lead-form-overlay");
  const wrapper = document.getElementById("homebase-agent");
  if (!overlay) return;

  _lfoScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.classList.add("lfo-body-lock");
  document.body.style.top = (-_lfoScrollY) + "px";
  document.getElementById("chat-box")?.setAttribute("aria-hidden", "true");

  overlay.classList.add("active");

  if(wrapper) setAgentRealVh(wrapper);

  if (window.visualViewport) {
    syncOverlayToVV();
    _vvSync = () => syncOverlayToVV();
    window.visualViewport.addEventListener('resize', _vvSync);
    window.visualViewport.addEventListener('scroll', _vvSync);
  }

  document.documentElement.style.overflow = 'hidden';
  overlay.addEventListener('touchmove', _preventTouch, { passive: false });
  document.addEventListener('touchmove', _preventTouch, { passive: false });
}

export function closeLeadFormOverlay() {
  const overlay = document.getElementById("lead-form-overlay");
  if (!overlay || !overlay.classList.contains("active")) return; 

  overlay.classList.remove("active");
  document.body.classList.remove("lfo-body-lock");
  document.body.style.top = "";
  window.scrollTo(0, _lfoScrollY || 0);
  document.documentElement.style.overflow = '';
  document.getElementById("chat-box")?.removeAttribute("aria-hidden");

  if (window.visualViewport && _vvSync) {
    window.visualViewport.removeEventListener('resize', _vvSync);
    window.visualViewport.removeEventListener('scroll', _vvSync);
    _vvSync = null;
  }
  overlay.style.top = overlay.style.left = overlay.style.width = overlay.style.height = "";
  overlay.removeEventListener('touchmove', _preventTouch, { passive: false });
  document.removeEventListener('touchmove', _preventTouch, { passive: false });
}

const _preventTouchCalendar = (e) => {
  const inScrollable = e.target.closest?.('#calendar-overlay #co-content');
  if (inScrollable) return;
  e.preventDefault();
};

let _calVVSync = null;
let _calendarScrollY = 0;

function syncCalendarToVV() {
  const ov = document.getElementById('calendar-overlay');
  const vv = window.visualViewport;
  if (!ov || !vv) return;
  ov.style.top = vv.offsetTop + 'px';
  ov.style.left = vv.offsetLeft + 'px';
  ov.style.width = vv.width + 'px';
  ov.style.height = vv.height + 'px';
}

export function openCalendarOverlay(calendarURL) {
  const overlay = document.getElementById("calendar-overlay");
  const content = document.getElementById("co-content");
  const wrapper = document.getElementById("homebase-agent");
  if (!overlay || !content) return;

  content.innerHTML = "";
  const iframe = document.createElement("iframe");
  const src = calendarURL.includes("?") ? calendarURL + "&embed=1" : calendarURL + "?embed=1";
  iframe.src = src;
  iframe.setAttribute("allow", "payment");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  content.appendChild(iframe);

  _calendarScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.classList.add("co-body-lock");
  document.body.style.top = (-_calendarScrollY) + "px";
  document.getElementById("chat-box")?.setAttribute("aria-hidden", "true");

  overlay.style.display = "flex";

  if(wrapper) setAgentRealVh(wrapper);

  if (window.visualViewport) {
    syncCalendarToVV();
    _calVVSync = () => syncCalendarToVV();
    window.visualViewport.addEventListener('resize', _calVVSync);
    window.visualViewport.addEventListener('scroll', _calVVSync);
  }

  document.documentElement.style.overflow = 'hidden';
  overlay.addEventListener('touchmove', _preventTouchCalendar, { passive: false });
  document.addEventListener('touchmove', _preventTouchCalendar, { passive: false });
}

export function closeCalendarOverlay() {
  const overlay = document.getElementById("calendar-overlay");
  if (!overlay || overlay.style.display === "none") return;

  overlay.style.display = "none";
  document.body.classList.remove("co-body-lock");
  document.body.style.top = "";
  window.scrollTo(0, _calendarScrollY || 0);
  document.documentElement.style.overflow = '';
  document.getElementById("chat-box")?.removeAttribute("aria-hidden");

  if (window.visualViewport && _calVVSync) {
    window.visualViewport.removeEventListener('resize', _calVVSync);
    window.visualViewport.removeEventListener('scroll', _calVVSync);
    _calVVSync = null;
  }
  overlay.style.top = overlay.style.left = overlay.style.width = overlay.style.height = "";
  overlay.removeEventListener('touchmove', _preventTouchCalendar, { passive: false });
  document.removeEventListener('touchmove', _preventTouchCalendar, { passive: false });
}

export async function submitLeadFromForm(formRootElement, biz) {
  const form = formRootElement;
  const data = { timestamp: new Date().toISOString() };

  let valid = true;
  let firstInvalid = null;
  const formElements = Array.from(form.elements);

  for (const el of formElements) {
    if (!el.name) continue;

    const isRequired = el.dataset.required === "true";
    let fieldValid = true;
    let fieldLabel = el.placeholder || el.name;

    try {
      const labelSnap = await getDoc(doc(db, `businesses/${businessId}/leadForms/${activeLeadFormId}/fields/${el.name}`));
      if (labelSnap.exists()) {
        fieldLabel = labelSnap.data().label || fieldLabel;
      }
    } catch (err) {
      console.warn(`⚠️ Failed to fetch label for field ${el.name}:`, err.message);
    }

    if (el.type === "checkbox") {
      if (!data[el.name]) data[el.name] = { label: fieldLabel, value: [] };
      if (el.checked) data[el.name].value.push(el.value);
    } else if (el.type === "radio") {
      if (el.checked) {
        data[el.name] = { label: fieldLabel, value: el.value };
      }
    } else {
      if (isRequired && !el.value.trim()) {
        fieldValid = false;
        el.classList.add("invalid-input");
      } else {
        el.classList.remove("invalid-input");
      }
      data[el.name] = { label: fieldLabel, value: el.value.trim() };
    }

    if (["checkbox", "radio"].includes(el.type)) {
      const group = form.querySelectorAll(`[name="${el.name}"]`);
      const oneChecked = Array.from(group).some(input => input.checked);
      if (isRequired && !oneChecked) {
        group.forEach(input => {
          input.classList.add("invalid-input");
          input.closest("label")?.classList.add("invalid-input");
        });
        if (!firstInvalid) {
          firstInvalid = el;
          valid = false;
        }
      } else {
        group.forEach(input => {
          input.classList.remove("invalid-input");
          input.closest("label")?.classList.remove("invalid-input");
        });
      }
    }

    if (!fieldValid && !firstInvalid && !["checkbox", "radio"].includes(el.type)) {
      firstInvalid = el;
      valid = false;
    }
  }

  if (!valid) {
    appendMessage("bot", "Please fill out all required fields.");
    firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    throw new Error("Invalid form");
  }

  if (activeLeadFormId) {
    data.formId = activeLeadFormId;
  }

  // Retrieve the Turnstile token. Adjust the selector/variable based on where 
  // you store the token globally in your secure chat instance.
  const turnstileToken = window.turnstileToken || document.querySelector('[name="cf-turnstile-response"]')?.value;

  if (!turnstileToken) {
    appendMessage("bot", "Security check failed. Please ensure you are verified as human.");
    throw new Error("Missing Turnstile token");
  }

  // Send payload to protected backend endpoint
  const response = await fetch("https://homebase-stripe-backend-clean.onrender.com/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId,
      leadData: data,
      token: turnstileToken // This satisfies verifyTurnstile.js
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    appendMessage("bot", errorData?.error?.message || "Failed to save details securely.");
    throw new Error("Backend lead submission failed");
  }

  const result = await response.json();
  const leadDoc = { id: result.leadId }; // Mock the doc object so the webhook relay below still gets the ID

  // Tell Cloudflare to generate a fresh token for the next action (like chatting)
  if (window.turnstile) {
    window.turnstile.reset();
    window.turnstileToken = null; // Clear out the used token so your UI waits for the new one
  }

  try {
    if (biz?.crmWebhookUrl) {
      const fieldsKV = {};
      for (const [key, obj] of Object.entries(data)) {
        if (key === "timestamp" || key === "formId") continue;
        if (obj && typeof obj === "object" && "label" in obj) {
          fieldsKV[obj.label || key] = Array.isArray(obj.value) ? obj.value.join(", ") : obj.value;
        }
      }
      const payload = {
        source: "barnegon",
        event: "lead.created",
        businessId,
        businessName: biz.name || "",
        leadId: leadDoc.id,
        formId: data.formId || activeLeadFormId || null,
        submittedAt: data.timestamp,
        fieldsDetailed: data,
        fields: fieldsKV
      };
      await postToWebhook(biz.crmWebhookUrl, payload);
    }
  } catch (e) {
    console.warn("Webhook send failed:", e);
  }

  return true;
}

export async function postToWebhook(_ignoredUrlFromBizDoc, payload) {
  try {
    await fetch("https://homebase-stripe-backend-clean.onrender.com/webhook/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, payload })
    });
  } catch (e) {
    console.warn("relay call failed:", e.message);
  }
}
import { doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getCurrentFormId } from "./leadForms.js";
import { whitelistDomain } from "../api/apiClient.js";

let iti;
let formChanged = false;

export function initSettings(user, docRef, data) {
  const phoneInput = document.getElementById("biz-phone");
  if (phoneInput && window.intlTelInput) {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: "auto",
      nationalMode: false,
      formatOnDisplay: true,
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
      geoIpLookup: function (callback) {
        fetch("https://ipapi.co/json").then(res => res.json()).then(d => callback(d.country_code)).catch(() => callback("US"));
      },
    });
  }

  const nameInput = document.getElementById("biz-name");
  // NEW: Grab the website input
  const websiteInput = document.getElementById("biz-website"); 
  const servicesInput = document.getElementById("biz-services");
  const hoursInput = document.getElementById("biz-hours");
  const pricingInput = document.getElementById("biz-pricing");
  const trainingInput = document.getElementById("biz-training");
  const emailInput = document.getElementById("biz-email");
  const greetingInput = document.getElementById("biz-greeting");
  const colorInput = document.getElementById("biz-color");
  const colorLabel = document.getElementById("color-label");
  const greetingToggle = document.getElementById("enable-greeting");
  const textColorInput = document.getElementById("biz-text-color");
  const reviewsInput = document.getElementById("reviewsInput");
  const areasInput = document.getElementById("areasInput");
  const aboutInput = document.getElementById("biz-about");
  const notifyEmailToggle = document.getElementById("notify-email");
  const notifySmsToggle = document.getElementById("notify-sms");
  const crmWebhookInput = document.getElementById("crm-webhook");
  const neonToggle = document.getElementById("biz-neon");
  const chatBgInput = document.getElementById("biz-chat-bg");
  const fontSelect = document.getElementById("biz-font");
  const fontPreview = document.getElementById("font-preview");

  if (data) {
    if (colorInput) colorInput.value = data.color || "#2c3e50";
    if (textColorInput) textColorInput.value = data.textColor || "#ffffff";
    if (nameInput) nameInput.value = data.name || "";
    // NEW: Populate the website input with existing database data
    if (websiteInput) websiteInput.value = data.website || ""; 
    if (servicesInput) servicesInput.value = data.services || "";
    if (hoursInput) hoursInput.value = data.hours || "";
    if (pricingInput) pricingInput.value = data.pricing || "";
    if (trainingInput) trainingInput.value = data.customInstructions || "";
    if (data.phone && iti) iti.setNumber(data.phone);
    if (emailInput) emailInput.value = data.email || "";
    if (greetingInput) greetingInput.value = data.greeting || "";
    if (greetingToggle) greetingToggle.checked = data.greetingEnabled === true;
    if (reviewsInput) reviewsInput.value = data.reviewsLink || "";
    if (areasInput) areasInput.value = data.areas || "";
    if (aboutInput) aboutInput.value = data.aboutMessage || "";
    if (notifyEmailToggle) notifyEmailToggle.checked = data.notifyEmail !== false;
    if (notifySmsToggle) notifySmsToggle.checked = data.notifySMS === true;
    if (crmWebhookInput) crmWebhookInput.value = data.crmWebhookUrl || "";
    if (neonToggle) neonToggle.checked = data.neonGlow === true;
    if (chatBgInput) chatBgInput.value = data.chatBg || "#fafafa";
    if (fontSelect) {
      const savedFont = data.chatFont || "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      fontSelect.value = savedFont;
      if (fontPreview) fontPreview.style.fontFamily = savedFont;
    }
  }

  // NEW: Add websiteInput to the array so the "Save" listener knows when it changes
  const inputs = [nameInput, websiteInput, servicesInput, hoursInput, pricingInput, trainingInput, phoneInput, emailInput, greetingInput, colorInput];
  inputs.forEach(input => {
    if (input) input.addEventListener("input", () => { formChanged = true; });
  });
  if (greetingToggle) greetingToggle.addEventListener("change", () => { formChanged = true; });
  if (colorInput && colorLabel) colorInput.addEventListener("input", () => { colorLabel.textContent = colorInput.value; });
  if (fontSelect) fontSelect.addEventListener("change", () => {
    if (fontPreview) fontPreview.style.fontFamily = fontSelect.value;
  });

  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.onclick = async () => {
      
      // NEW: Grab the website value AND original database website
      const websiteVal = websiteInput?.value?.trim() || "";
      const originalWebsite = data?.website || ""; 

      // NEW: Fire off the Turnstile Update if the domain changed OR was deleted
      if (websiteVal !== originalWebsite) {
        try {
          console.log("Updating domain with Cloudflare Turnstile...");
          await whitelistDomain(websiteVal, originalWebsite);
        } catch (err) {
          console.error("Non-fatal error: Failed to update domain in Turnstile", err);
        }
      }

      await setDoc(docRef, {
        name: nameInput?.value || "",
        website: websiteVal, // NEW: Save to database
        services: servicesInput?.value || "",
        hours: hoursInput?.value || "",
        pricing: pricingInput?.value || "",
        customInstructions: trainingInput?.value || "",
        phone: iti ? iti.getNumber() : (phoneInput?.value || ""),
        email: emailInput?.value || "",
        greeting: greetingInput?.value || "",
        greetingEnabled: greetingToggle?.checked || false,
        color: colorInput?.value || "#2c3e50",
        textColor: textColorInput?.value || "#ffffff",
        reviewsLink: reviewsInput?.value || "",
        areas: areasInput?.value || "",
        aboutMessage: aboutInput?.value || "",
        activeLeadForm: getCurrentFormId(),
        notifyEmail: notifyEmailToggle?.checked !== false,
        notifySMS: notifySmsToggle?.checked || false,
        crmWebhookUrl: crmWebhookInput?.value || "",
        neonGlow: neonToggle?.checked || false,
        chatBg: chatBgInput?.value || "#fafafa",
        chatFont: fontSelect?.value || "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
      }, { merge: true });

      formChanged = false;
      
      const activeBtn = document.querySelector(".tab-btn.active");
      if (activeBtn) sessionStorage.setItem("activeTab", activeBtn.dataset.tab);
      sessionStorage.setItem("scrollY", window.scrollY.toString());

      showSaveToast();
      setTimeout(() => window.location.reload(), 1200);
    };
  }

  window.addEventListener("beforeunload", function (e) {
    if (formChanged) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

export function initSetupOverlay(user, docRef) {
  const btn = document.getElementById("complete-setup-btn");
  if (!btn) return;
  
  btn.onclick = async function() {
    const nameVal = document.getElementById("setup-name").value.trim();
    const websiteVal = document.getElementById("setup-website").value.trim();
    const phoneVal = document.getElementById("setup-phone").value.trim();
    const emailVal = document.getElementById("setup-email").value.trim();
    const areaVal = document.getElementById("setup-area").value.trim();
    const servicesVal = document.getElementById("setup-services").value.trim();

    if (!nameVal) {
      document.getElementById("setup-error").classList.remove("hidden");
      return;
    }

    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
      if (websiteVal) {
        console.log("Whitelisting domain in Turnstile...");
        await whitelistDomain(websiteVal);
      }

      await updateDoc(docRef, {
        name: nameVal, 
        website: websiteVal, 
        phone: phoneVal,
        email: emailVal, 
        areas: areaVal, 
        services: servicesVal,
        needsSetup: false,
        onboardingCompletedAt: serverTimestamp()
      });
      
      window.location.reload(); 
    } catch (err) {
      console.error("Setup save error:", err);
      btn.innerText = "Error - Try Again";
      btn.disabled = false;
    }
  };
}

function showSaveToast() {
  const toast = document.createElement("div");
  toast.textContent = "Saving Changes...";
  toast.style.position = "fixed";
  toast.style.top = "24px";
  toast.style.left = "24px";
  toast.style.background = "#00ffd1";
  toast.style.color = "#111";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "9999";
  toast.style.transition = "opacity 0.4s ease";
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => toast.style.opacity = "1");
  
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 1200);
}
import { auth, db } from "./js/config/firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  writeBatch,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  collection,
  orderBy,
  getCountFromServer,
  addDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { createCheckoutSession, createBillingPortalSession, sendDashboardChat } from "./js/api/apiClient.js";
import { initCalendars } from "./js/dashboard/calendars.js";
import { initBubbles, loadBubbleBindings } from "./js/dashboard/bubbles.js";
import { initInsights } from "./js/dashboard/insights.js";
import { initLeadForms, getCurrentFormId } from "./js/dashboard/leadForms.js";
import { initLeads } from "./js/dashboard/leads.js";
import { initSettings, initSetupOverlay } from "./js/dashboard/settings.js";

// ✅ Restore tab and scroll after reload
window.addEventListener("DOMContentLoaded", () => {
  const savedTab = sessionStorage.getItem("activeTab");
  if (savedTab) {
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
    if (tabBtn) tabBtn.click();
    sessionStorage.removeItem("activeTab");
  }

  const savedScroll = sessionStorage.getItem("scrollY");
  if (savedScroll !== null) {
    window.scrollTo(0, parseInt(savedScroll));
    sessionStorage.removeItem("scrollY");
  }
});

const logoutBtn = document.getElementById("logout-btn");
const currentPath = window.location.pathname;
const protectedPages = ["/dashboard.html", "/terms.html", "/privacy.html"];

// ✅ MODIFIED: Gating Logic with Onboarding Overlay
if (protectedPages.includes(currentPath)) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      return (window.location.href = "/login.html");
    }

    const docRef = doc(db, "businesses", user.uid);
    let docSnap = await getDoc(docRef);
    let data = docSnap.exists() ? docSnap.data() : null;

    // 1️⃣ HANDLE NEW USER: Create doc immediately if missing
    if (!data) {
      data = {
        isActive: false,      // Default to false until stripe confirms
        needsSetup: true,     // ✅ Force setup immediately
        name: "", phone: "", email: user.email || "", 
        services: "", hours: "", pricing: "", areas: "",
        createdAt: serverTimestamp()
      };
      await setDoc(docRef, data);
      console.log("📦 New business doc created immediately.");
    }

    // 2️⃣ CHECK SUBSCRIPTION
    if (data.isActive !== true) {
      console.warn("⛔ User not subscribed.");
      return (window.location.href = "/index.html");
    }

    // 3️⃣ CHECK SETUP STATUS
    const needsSetup = data.needsSetup === true || (typeof data.needsSetup === 'undefined' && !data.name);

    if (needsSetup) {
      // 🛑 SHOW OVERLAY & HIDE LOADERS
      document.getElementById("gatekeeper")?.remove();
      document.getElementById("dashboard-loading")?.remove(); // Remove spinner
      document.getElementById("main-nav")?.classList.add("hidden");
      
      const overlay = document.getElementById("setup-overlay");
      if (overlay) {
        overlay.classList.remove("hidden");
        overlay.classList.add("flex");

        // Pre-fill email
        const emailField = document.getElementById("setup-email");
        if (emailField && !emailField.value && user.email) emailField.value = user.email;

        // HANDLE SUBMIT
        initSetupOverlay(user, docRef);
      }
      return; // ⛔ STOP HERE: Do not let the rest of the script reveal the dashboard
    }

    // ✅ SETUP COMPLETE: Unlock Dashboard
    document.getElementById("gatekeeper")?.remove();
  });
}


logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "login.html"; // 👈 send them to login page
};

const navLogout = document.getElementById("nav-logout");
if (navLogout) {
  navLogout.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}


onAuthStateChanged(auth, async user => {
  if (user) {

    const docRef = doc(db, "businesses", user.uid);
    const docSnap = await getDoc(docRef);
    

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        isActive: false,
        needsSetup: true,
        name: "",
        services: "",
        hours: "",
        pricing: "",
        customInstructions: "",
        phone: "",
        email: "",
        greeting: "",
        color: "#2c3e50",
        reviewsLink: "",
        areas: "",
      });
      console.log("📦 New business doc created.");
    }    
    
    if (docSnap.exists()) {
      const data = docSnap.data();

      // 🛑 NEW CODE: STOP EVERYTHING IF SETUP IS NEEDED
      // This prevents the Agent, Metrics, and Forms from loading/creating.
      const needsSetup = data.needsSetup === true || (typeof data.needsSetup === 'undefined' && !data.name);
      if (needsSetup) {
        console.log("⚠️ Setup needed. Halting dashboard initialization.");
        return; 
      }
    
      // ✅ Continue loading rest of fields
     // ✅ Continue loading rest of fields via Module
     initSettings(user, docRef, data);
      
    }

await initBubbles(user);
await initInsights(user);
await initLeadForms(user);
await initLeads(user);

await initCalendars(user, async () => {
  await loadBubbleBindings(user);
});

    // Embed script generator
    const embedCode = `<script type="module" src="https://ai-agent-demo-9fe52.web.app/agent-v2.js" biz="${user.uid}"></script>`;
    const embedCodeEl = document.getElementById("embed-code");
    const copyBtn = document.getElementById("copy-btn");

    if (embedCodeEl && copyBtn) {
      embedCodeEl.textContent = embedCode;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(embedCode);
        showToast("Embed script copied to clipboard!");
      };
    } else {
      console.warn("⚠️ Embed elements not found. Make sure you're on the embed tab.");
    }

    
    const previewContainer = document.getElementById("agent-preview-container");
    previewContainer.innerHTML = ""; // Clear any old previews
    
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ai-agent-demo-9fe52.web.app/agent-v2.js";
    script.setAttribute("biz", user.uid);
    previewContainer.appendChild(script);
    document.getElementById("dashboard-loading")?.remove();
  } else {
    window.location.href = "login.html";
  }
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(`tab-${target}`).classList.add("active");
  });
});

document.getElementById("copy-btn")?.addEventListener("click", () => {
  const code = document.getElementById("embed-code").innerText.trim();
  navigator.clipboard.writeText(code).then(() => {
    document.getElementById("copy-btn").textContent = "Copied!";
    setTimeout(() => {
      document.getElementById("copy-btn").textContent = "Copy";
    }, 1500);
  });
});

// Toggle hamburger menu in dashboard
const hamburger = document.getElementById("hamburger");
const dropdown = document.getElementById("dropdown");

if (hamburger && dropdown) {
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (!dropdown.classList.contains("hidden") && !dropdown.contains(e.target) && e.target !== hamburger) {
      dropdown.classList.add("hidden");
    }
  });

  // Close on Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dropdown.classList.add("hidden");
  });
}

async function startTrialCheckout() {
  const user = auth.currentUser;
  if (!user) return alert("Please log in first.");

  try {
    const idToken = await user.getIdToken();
    const data = await createCheckoutSession(user.uid, idToken);
    
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No URL returned from Stripe.");
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Something went wrong starting your trial.");
  }
}
window.startTrialCheckout = startTrialCheckout;

const manageBillingBtn = document.getElementById("manageBillingBtn");

if (manageBillingBtn) {
  manageBillingBtn.addEventListener("click", async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

      const idToken = await user.getIdToken();
      const data = await createBillingPortalSession(idToken);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to open billing portal");
      }
    } catch (err) {
      console.error("Billing portal error:", err);
      alert("Something went wrong. Try again.");
    }
  });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.left = "24px";
  toast.style.background = "#4F46E5"; // green-600
  toast.style.color = "white";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "8px";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 1500);
}

window.addEventListener("load", () => {
  const activeTab = localStorage.getItem("activeTabId");
  const savedScrollY = localStorage.getItem("savedScrollY");

  if (activeTab) {
    const tabButton = document.querySelector(`[data-tab="${activeTab}"]`);
    if (tabButton) tabButton.click(); // ✅ simulate tab switch

    setTimeout(() => {
      if (savedScrollY !== null) {
        window.scrollTo(0, parseInt(savedScrollY));
        localStorage.removeItem("savedScrollY");
        localStorage.removeItem("activeTabId");
      }
    }, 200);
  }
});
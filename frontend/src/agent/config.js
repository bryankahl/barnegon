import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. Look for a global variable first (Vite CANNOT delete this during build)
let detectedBizId = window.BARNEGON_BIZ_ID;

// 2. Fallback: If no global variable, scan ALL scripts for 'biz' or 'data-biz'
if (!detectedBizId) {
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const attr = scripts[i].getAttribute('biz') || scripts[i].getAttribute('data-biz');
    if (attr && attr !== "YOUR_ID_HERE") {
      detectedBizId = attr;
      break;
    }
  }
}

export const businessId = detectedBizId;

if (!businessId) {
  console.error("⛔ CRITICAL: Missing business ID. The Barnegon Agent cannot initialize.");
  throw new Error("Missing business ID");
}

const firebaseConfig = {
  apiKey: "AIzaSyDk2r-uT-iNV6GJAlMB0gm8asAoRr-JG90",
  authDomain: "ai-agent-demo-9fe52.firebaseapp.com",
  projectId: "ai-agent-demo-9fe52",
  storageBucket: "ai-agent-demo-9fe52.firebasestorage.app",
  messagingSenderId: "1028319770796",
  appId: "1:1028319770796:web:e25a0deb2f9dfbf1ce4709"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
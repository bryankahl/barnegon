// public/js/config/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDk2r-uT-iNV6GJAlMB0gm8asAoRr-JG90",
  authDomain: "ai-agent-demo-9fe52.firebaseapp.com",
  projectId: "ai-agent-demo-9fe52",
  storageBucket: "ai-agent-demo-9fe52.firebasestorage.app",
  messagingSenderId: "1028319770796",
  appId: "1:1028319770796:web:e25a0deb2f9dfbf1ce4709"
};

const app = initializeApp(firebaseConfig);

// Export these so any other module can just import { auth, db }
export const auth = getAuth(app);
export const db = getFirestore(app);
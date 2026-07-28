import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDk2r-uT-iNV6GJAlMB0gm8asAoRr-JG90",
  authDomain: "ai-agent-demo-9fe52.firebaseapp.com",
  projectId: "ai-agent-demo-9fe52",
  storageBucket: "ai-agent-demo-9fe52.firebasestorage.app",
  messagingSenderId: "1028319770796",
  appId: "1:1028319770796:web:e25a0deb2f9dfbf1ce4709"
};

const DEV_EMAILS = ["bryankahl28@gmail.com", "pledgehomeservices@gmail.com"];
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const signInButton = document.getElementById("googleSignInButton") || document.getElementById("google-signin");
if (signInButton) {
  signInButton.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (DEV_EMAILS.includes(user.email)) {
        window.location.href = "dashboard.html";
        return;
      }

      const bizRef = doc(db, "businesses", user.uid);
      let bizSnap = await getDoc(bizRef);

      if (!bizSnap.exists()) {
        await setDoc(bizRef, {
          createdAt: serverTimestamp(),
          isActive: false
        });

        const idToken = await user.getIdToken();

        const res = await fetch("https://homebase-stripe-backend-clean.onrender.com/api/stripe/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            uid: user.uid,
            success_url: window.location.origin + "/dashboard.html",
            cancel_url: window.location.origin + "/index.html"
          })
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert("Something went wrong while redirecting to checkout.");
          console.error("Stripe error:", data);
        }
        return;
      }

      const data = bizSnap.data();
      const isActive = data.isActive === true;

      if (isActive) {
        window.location.href = "dashboard.html";
      } else {
        const idToken = await user.getIdToken();

        const res = await fetch("https://homebase-stripe-backend-clean.onrender.com/api/stripe/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            uid: user.uid,
            success_url: window.location.origin + "/dashboard.html",
            cancel_url: window.location.origin + "/index.html"
          })
        });

        const data2 = await res.json();
        if (data2.url) {
          window.location.href = data2.url;
        } else {
          alert("Something went wrong while redirecting to checkout.");
          console.error("Stripe error:", data2);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong during sign-in. Please try again.");
    }
  });
}

const runCountups = () => {
  document.querySelectorAll("[data-countup]").forEach(el => {
    const target = parseInt(el.getAttribute("data-countup"), 10);
    if (el.dataset.done) return;
    el.dataset.done = "1";
    let cur = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(interval); }
      el.textContent = cur.toLocaleString();
    }, 16);
  });
};

const onScrollVisible = () => {
  const section = document.querySelector('[data-countup]');
  if (!section) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) runCountups(); });
  }, { threshold: 0.3 });
  document.querySelectorAll("[data-countup]").forEach(el => observer.observe(el));
};
onScrollVisible();

if (window.AOS) {
  window.AOS.init({ duration: 800, once: true, offset: 100 });
}

const startTrialBtn = document.getElementById("start-trial-btn");
if (startTrialBtn) {
  startTrialBtn.addEventListener("click", () => {
    const hero = document.getElementById("hero");
    if (hero) {
      const top = hero.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });
}
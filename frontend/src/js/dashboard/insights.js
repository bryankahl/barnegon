import { db } from "../config/firebase-config.js";
import { doc, getDoc, collection, getDocs, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function initInsights(user) {
  try {
    const metricsRef = doc(db, "metrics", user.uid);
    const metricsSnap = await getDoc(metricsRef);

    if (metricsSnap.exists()) {
      const data = metricsSnap.data();
      document.getElementById("metric-chats").innerText = data.chatStarted ?? 0;
      document.getElementById("metric-calendar").innerText = data.calendarClicks ?? 0;

      try {
        const threadsRef = collection(db, `businesses/${user.uid}/chatThreads`);
        const threadSnap = await getDocs(threadsRef);
        let totalMessages = 0;
        for (const threadDoc of threadSnap.docs) {
          const messagesRef = collection(db, `businesses/${user.uid}/chatThreads/${threadDoc.id}/messages`);
          const msgSnap = await getDocs(messagesRef);
          totalMessages += msgSnap.size;
        }
        document.getElementById("metric-faqs").innerText = totalMessages;
      } catch (err) {
        console.error("Error counting messages:", err);
        document.getElementById("metric-faqs").innerText = "0";
      }

      const clicks = data.presetClicks || {};
      const labels = { contact: "Contact Info", about: "About Us", reviews: "Google Reviews", areas: "Areas We Serve" };
      const container = document.getElementById("metric-preset");
      if (container) {
        container.innerHTML = "";
        Object.entries(clicks)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([key, count]) => {
            const div = document.createElement("div");
            div.className = "flex justify-between text-sm border-b py-1";
            div.innerHTML = `<span class="font-medium text-gray-800">${labels[key] || key}</span><span class="text-gray-600">${count}</span>`;
            container.appendChild(div);
          });
      }

      const allPresetBtn = document.getElementById("viewAllPresetBtn");
      const allPresetModal = document.getElementById("allPresetModal");
      const allPresetList = document.getElementById("allPresetList");
      const closePresetModal = document.getElementById("closePresetModal");

      if (allPresetBtn && allPresetModal && allPresetList && closePresetModal) {
        allPresetBtn.onclick = () => {
          allPresetList.innerHTML = "";
          Object.entries(clicks)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, count]) => {
              const item = document.createElement("li");
              item.className = "flex justify-between border-b py-1";
              item.innerHTML = `<span class="text-gray-800 font-medium">${labels[key] || key}</span><span class="text-gray-500">${count}</span>`;
              allPresetList.appendChild(item);
            });
          allPresetModal.classList.remove("hidden");
        };
        closePresetModal.onclick = () => allPresetModal.classList.add("hidden");
      }
    }
  } catch (err) {
    console.error("Error loading metrics:", err);
  }

  try {
    const leadsRef = collection(db, `businesses/${user.uid}/leads`);
    const snapshot = await getCountFromServer(leadsRef);
    const leadsElement = document.getElementById("metric-leads");
    if (leadsElement) leadsElement.textContent = snapshot.data().count.toString();
  } catch (err) {
    console.error("Failed to fetch leads count:", err);
  }

  await loadChatThreads(user);
}

async function loadChatThreads(user) {
  const threadList = document.getElementById("thread-list");
  if (!threadList) return;

  const threadsRef = collection(db, `businesses/${user.uid}/chatThreads`);
  const snapshot = await getDocs(threadsRef);

  const threads = [];
  snapshot.forEach(doc => threads.push({ id: doc.id, ...doc.data() }));
  threads.sort((a, b) => b.startedAt - a.startedAt);

  if (threads.length === 0) {
    threadList.innerHTML = `<p class="text-sm text-gray-500 italic">No conversations yet.</p>`;
    return;
  }

  threadList.innerHTML = "";
  threads.forEach(thread => {
    const div = document.createElement("div");
    div.className = "bg-white rounded-xl border border-gray-200 shadow p-4 flex justify-between items-center";

    // Sanitize the User-Agent to prevent Blind XSS from spoofed HTTP headers
    const rawUserAgent = thread.userAgent?.slice(0, 50) || "Unknown device";
    const safeUserAgent = window.DOMPurify ? window.DOMPurify.sanitize(rawUserAgent) : rawUserAgent.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    div.innerHTML = `
      <div>
        <p class="font-medium text-gray-800">${thread.dateLabel || "Unknown Date"} — ${thread.timeLabel || ""}</p>
        <p class="text-sm text-gray-500">${safeUserAgent}</p>
      </div>
      <button data-thread="${thread.id}" class="view-thread-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">View</button>
    `;
    threadList.appendChild(div);
  });

  document.querySelectorAll(".view-thread-btn").forEach(btn => {
    btn.onclick = async () => {
      const threadId = btn.dataset.thread;
      const messagesRef = collection(db, `businesses/${user.uid}/chatThreads/${threadId}/messages`);
      const msgSnap = await getDocs(messagesRef);

      const messages = [];
      msgSnap.forEach(doc => messages.push(doc.data()));
      messages.sort((a, b) => a.timestamp - b.timestamp);

      const modal = document.getElementById("conversationModal");
      const container = document.getElementById("conversationMessages");
      container.innerHTML = "";
      messages.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.className = `max-w-[85%] px-4 py-2 rounded-lg text-sm leading-snug whitespace-pre-wrap ${msg.role === "user" ? "bg-indigo-100 text-indigo-900 self-end rounded-br-none" : "bg-gray-100 text-gray-800 self-start rounded-bl-none"}`;
        bubble.textContent = msg.content;
        container.appendChild(bubble);
      });

      modal.classList.remove("hidden");
      requestAnimationFrame(() => {
        document.getElementById("conversationPanel").classList.remove("-translate-x-full");
      });
    };
  });

  document.getElementById("closeConversationModal")?.addEventListener("click", () => {
    const modal = document.getElementById("conversationModal");
    const panel = document.getElementById("conversationPanel");
    panel.classList.add("-translate-x-full");
    setTimeout(() => modal.classList.add("hidden"), 300);
  });
}
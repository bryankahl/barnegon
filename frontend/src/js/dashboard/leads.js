// public/js/dashboard/leads.js
import { db } from "../config/firebase-config.js";
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getCurrentFormId } from "./leadForms.js";

export async function initLeads(user) {
  const leadsList = document.getElementById("leads-list");
  if (!leadsList) return;
  
  leadsList.innerHTML = "";

  const leadsRef = collection(db, `businesses/${user.uid}/leads`);
  const leadsQuery = query(leadsRef, orderBy("timestamp", "desc"));
  const leadsSnap = await getDocs(leadsQuery);
  
  const noLeadsMsg = document.getElementById("no-leads-msg");
  if (leadsSnap.empty) {
    noLeadsMsg?.classList.remove("hidden");
    return; // Stop here if no leads
  } else {
    noLeadsMsg?.classList.add("hidden");
  }

  // Safely get the current form ID to fetch labels
  const formId = getCurrentFormId();
  const fieldLabels = {};

  if (formId) {
    try {
      const fieldsSnap = await getDocs(collection(db, `businesses/${user.uid}/leadForms/${formId}/fields`));
      fieldsSnap.forEach(doc => {
        fieldLabels[doc.id] = doc.data().label;
      });
    } catch (err) {
      console.warn("Could not fetch field labels for leads:", err);
    }
  }

  // Loop through and render leads
  for (const docSnap of leadsSnap.docs) {
    const lead = docSnap.data();
    const card = document.createElement("div");
    card.className = "lead-card rounded-xl border border-gray-200 bg-white shadow-md p-5 space-y-3 transition hover:shadow-lg opacity-0";

    const timestamp = new Date(lead.timestamp).toLocaleString();
    let inner = `
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-indigo-700">Lead Details</h3>
        <span class="text-sm text-gray-400 italic">${timestamp}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-[15px] text-gray-700">
    `;

    for (let [key, field] of Object.entries(lead)) {
      if (["timestamp", "formId"].includes(key)) continue;
    
      const rawLabel = field.label || fieldLabels[key] || key;
      const safeLabel = window.DOMPurify ? window.DOMPurify.sanitize(rawLabel) : rawLabel;
    
      let rawValue = field.value;
      if (Array.isArray(rawValue)) {
        rawValue = rawValue.join(", ");
      }
    
      const safeValue = window.DOMPurify ? window.DOMPurify.sanitize(rawValue) : rawValue;
    
      inner += `<div><span class="font-medium text-gray-600">${safeLabel}:</span> ${safeValue}</div>`;
    }

    inner += "</div>";
    card.innerHTML = inner;
    leadsList.appendChild(card);

    // Trigger smooth fade-in after render
    requestAnimationFrame(() => {
      card.classList.add("transition", "duration-500", "opacity-100");
    });
  }

  // Hook up the search bar
  const searchInput = document.getElementById("lead-search");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const term = e.target.value.toLowerCase();
      const cards = document.querySelectorAll("#leads-list .lead-card");
    
      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? "block" : "none";
      });
    });
  }
}
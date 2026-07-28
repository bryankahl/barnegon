import { db } from "../config/firebase-config.js";
import { doc, getDoc, getDocs, collection, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function loadBubbleBindings(user) {
  const bubbleBindingsUI = document.getElementById("bubbleBindingsUI");
  if (!bubbleBindingsUI) return;
  bubbleBindingsUI.innerHTML = "";

  const bindingsRef = doc(db, "businesses", user.uid);
  const bizSnap = await getDoc(bindingsRef);
  const bubbleBindings = bizSnap.data()?.bubbleBindings || {};

  const formSnap = await getDocs(collection(db, `businesses/${user.uid}/leadForms`));
  const formMap = {};
  formSnap.forEach(d => { formMap[d.id] = d.data().displayName || d.id; });

  const calendarsRef = collection(db, `businesses/${user.uid}/calendars`);
  const calendarSnap = await getDocs(calendarsRef);
  const calendarMap = {};
  calendarSnap.forEach(d => { calendarMap[d.id] = d.data().name || d.id; });

  for (const [key, binding] of Object.entries(bubbleBindings)) {
    const wrapper = document.createElement("div");
    wrapper.className = "space-y-2 border p-4 rounded-md bg-white shadow";
    wrapper.dataset.key = key;

    wrapper.innerHTML = `
      <div class="space-y-1">
        <label class="block text-sm font-semibold text-gray-700">Bubble Name</label>
        <input type="text" class="bubble-key w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" value="${key}" placeholder="e.g. Book Now" />
      </div>
      <div class="space-y-1">
        <label class="block text-sm font-semibold text-gray-700">Target Type</label>
        <select class="bubble-type w-40 rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
          <option value="">Select type</option>
          <option value="form" ${binding.type === "form" ? "selected" : ""}>Lead Form</option>
          <option value="calendar" ${binding.type === "calendar" ? "selected" : ""}>Calendar</option>
        </select>
      </div>
      <div class="space-y-1">
        <label class="block text-sm font-semibold text-gray-700">Target ID</label>
        <select class="bubble-id w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
          <option value="">Select target</option>
        </select>
      </div>
      <div class="pt-2">
        <button class="remove-bubble text-red-600 hover:text-white hover:bg-red-600 border border-red-500 px-4 py-1 rounded-md text-sm font-medium transition">Remove</button>
      </div>
    `;

    const typeSelect = wrapper.querySelector(".bubble-type");
    const targetSelect = wrapper.querySelector(".bubble-id");

    const loadOptions = (type) => {
      targetSelect.innerHTML = `<option value="">Select target</option>`;
      if (type === "form") {
        Object.entries(formMap).forEach(([id, name]) => {
          const opt = document.createElement("option"); opt.value = id; opt.textContent = name; targetSelect.appendChild(opt);
        });
      } else if (type === "calendar") {
        Object.entries(calendarMap).forEach(([id, name]) => {
          const opt = document.createElement("option"); opt.value = id; opt.textContent = name; targetSelect.appendChild(opt);
        });
      }
      targetSelect.value = binding.id;
    };

    loadOptions(binding.type);
    typeSelect.addEventListener("change", () => loadOptions(typeSelect.value));
    wrapper.querySelector(".remove-bubble").addEventListener("click", () => wrapper.remove());
    bubbleBindingsUI.appendChild(wrapper);
  }
}

export async function initBubbles(user) {
  const bindingsRef = doc(db, "businesses", user.uid);
  
  const bizSnap = await getDoc(bindingsRef);
  const data = bizSnap.exists() ? bizSnap.data() : {};

  setTimeout(() => {
    const bubbleCheckboxes = document.querySelectorAll(".bubble-checkbox");
    bubbleCheckboxes.forEach(checkbox => {
      checkbox.checked = data.selectedBubbles?.includes(checkbox.value);
      checkbox.addEventListener("change", async () => {
        const selected = Array.from(document.querySelectorAll(".bubble-checkbox"))
          .filter(c => c.checked).map(c => c.value);
        try {
          await updateDoc(bindingsRef, { selectedBubbles: selected });
        } catch (err) {
          console.error("Error updating selectedBubbles:", err);
        }
      });
    });
  }, 0);

  const addBubbleBtn = document.getElementById("addBubbleBtn");
  if (addBubbleBtn) {
    addBubbleBtn.addEventListener("click", async () => {
      const wrapper = document.createElement("div");
      wrapper.className = "space-y-2 border p-4 rounded-md bg-white shadow";
      wrapper.innerHTML = `
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-gray-700">Bubble Name</label>
          <input type="text" class="bubble-key w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Bubble ID (e.g. support)" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-gray-700">Target Type</label>
          <select class="bubble-type w-40 rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
            <option value="">Select type</option>
            <option value="form">Lead Form</option>
            <option value="calendar">Calendar</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-gray-700">Target ID</label>
          <select class="bubble-id w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
            <option value="">Select target</option>
          </select>
        </div>
        <div class="pt-2">
          <button class="remove-bubble text-red-600 hover:text-white hover:bg-red-600 border border-red-500 px-4 py-1 rounded-md text-sm font-medium transition">Remove</button>
        </div>
      `;

      wrapper.querySelector(".bubble-type").addEventListener("change", async (e) => {
        const select = wrapper.querySelector(".bubble-id");
        select.innerHTML = "<option value=''>Select target</option>";
        const type = e.target.value;
        if (!type) return;
        const snap = await getDocs(collection(db, `businesses/${user.uid}/${type === "form" ? "leadForms" : "calendars"}`));
        snap.forEach(d => {
          const dData = d.data();
          const opt = document.createElement("option");
          opt.value = d.id;
          opt.textContent = dData.displayName || dData.name || d.id;
          select.appendChild(opt);
        });
      });

      wrapper.querySelector(".remove-bubble").addEventListener("click", () => wrapper.remove());
      document.getElementById("bubbleBindingsUI").appendChild(wrapper);
    });
  }

  const saveBubbleBtn = document.getElementById("saveBubbleBindings");
  if (saveBubbleBtn) {
    saveBubbleBtn.addEventListener("click", async () => {
      const allWrappers = document.querySelectorAll("#bubbleBindingsUI > div");
      const bubbleBindings = {};
      for (const wrapper of allWrappers) {
        const key = wrapper.querySelector(".bubble-key")?.value.trim();
        const type = wrapper.querySelector(".bubble-type")?.value;
        const id = wrapper.querySelector(".bubble-id")?.value;
        if (key && type && id) {
          bubbleBindings[key] = { type, id };
        }
      }
      localStorage.setItem("activeTabId", "bubbles");
      localStorage.setItem("savedScrollY", window.scrollY.toString());
      await updateDoc(bindingsRef, { bubbleBindings });
      setTimeout(() => location.reload(), 200);
    });
  }

  await loadBubbleBindings(user);
}
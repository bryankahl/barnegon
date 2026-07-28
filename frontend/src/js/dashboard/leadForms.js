import { db } from "../config/firebase-config.js";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let currentFormId = "";

export function getCurrentFormId() {
  return currentFormId;
}

export async function initLeadForms(user) {
  const formBuilder = document.getElementById("custom-form-builder");
  const addFieldBtn = document.getElementById("add-form-field");

  async function loadLeadFormFields() {
    if (!formBuilder || !user || !currentFormId) return;

    formBuilder.classList.add("fade", "fade-out");

    setTimeout(async () => {
      const activeElement = document.activeElement;
      formBuilder.innerHTML = "";

      const fieldsSnapshot = await getDocs(collection(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields`));
      const fields = [];
      fieldsSnapshot.forEach(doc => fields.push({ id: doc.id, ...doc.data() }));
      fields.sort((a, b) => a.order - b.order);

      fields.forEach(field => {
        const wrapper = document.createElement("div");
        wrapper.className = "biz-field draggable-field hover:shadow-lg cursor-grab transition border border-gray-300 rounded-xl";
        wrapper.setAttribute("data-id", field.id);

        wrapper.innerHTML = `
          <div class="rounded-xl border border-gray-300 bg-white shadow-md p-6 space-y-6 transition duration-300 hover:shadow-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Field Label</label>
                <input type="text" class="w-full px-4 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" value="${field.label}" placeholder="e.g. Phone Number" data-id="${field.id}" data-type="label" />
                <p class="text-sm text-gray-400 mt-1">This is the question shown to users.</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Field Type</label>
                <select data-id="${field.id}" data-type="type" class="w-full px-4 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:cursor-pointer transition">
                  <option value="text" ${field.type === "text" ? "selected" : ""}>Text</option>
                  <option value="paragraph" ${field.type === "paragraph" ? "selected" : ""}>Paragraph</option>
                  <option value="dropdown" ${field.type === "dropdown" ? "selected" : ""}>Single Choice (Bubbles)</option>
                  <option value="checkbox" ${field.type === "checkbox" ? "selected" : ""}>Multiple Options (Checkboxes)</option>
                </select>
                <p class="text-sm text-gray-400 mt-1">Choose how users will answer this field.</p>
              </div>
            </div>

            <div class="options-section ${["dropdown", "checkbox"].includes(field.type) ? "" : "hidden"}" data-id="${field.id}">
              <label class="block text-sm font-semibold text-gray-700 mb-1 mt-2">Options</label>
              <ul id="sortable-${field.id}" class="sortable-options list-none space-y-2 mb-2" data-id="${field.id}">
                ${(field.options || []).map(opt => `
                  <li class="draggable-tag bg-indigo-100 text-indigo-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between gap-2 transition hover:bg-indigo-200" draggable="true">
                    <span>${opt}</span>
                    <button class="remove-tag text-red-500 hover:text-red-700 font-bold" data-opt="${opt}" data-id="${field.id}">×</button>
                  </li>
                `).join("")}
              </ul>
              <input type="text" class="add-option-input w-full px-4 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Type option and press Enter" data-id="${field.id}" />
            </div>

            <div class="flex flex-wrap items-center justify-between pt-2">
              <label class="flex items-center gap-2 text-sm text-gray-700 font-medium hover:cursor-pointer transition hover:text-indigo-600">
                <input type="checkbox" ${field.required ? "checked" : ""} data-id="${field.id}" data-type="required" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 hover:cursor-pointer"/>
                Required
              </label>
              <button data-id="${field.id}" class="delete-field text-red-600 hover:text-white hover:bg-red-600 border border-red-500 px-3 py-1 rounded-md font-medium transition">Delete Field</button>
            </div>
          </div>
        `;
        formBuilder.appendChild(wrapper);
      });

      if (typeof Sortable !== 'undefined') {
        Sortable.create(formBuilder, {
          animation: 200,
          ghostClass: "opacity-50",
          handle: ".draggable-field",
          onEnd: async function () {
            const newOrder = Array.from(formBuilder.querySelectorAll(".draggable-field")).map((el, index) => ({ id: el.dataset.id, order: index }));
            const batch = writeBatch(db);
            newOrder.forEach(({ id, order }) => {
              const ref = doc(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields/${id}`);
              batch.update(ref, { order });
            });
            await batch.commit();
          }
        });

        document.querySelectorAll(".sortable-options").forEach(container => {
          const fieldId = container.dataset.id;
          Sortable.create(container, {
            animation: 200,
            ghostClass: "opacity-50",
            onEnd: async function () {
              const newOptions = Array.from(container.querySelectorAll(".draggable-tag span")).map(el => el.textContent.trim()).filter(Boolean);
              const ref = doc(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields/${fieldId}`);
              await updateDoc(ref, { options: newOptions });
            }
          });
        });
      }

      if (activeElement && activeElement.scrollIntoView) {
        requestAnimationFrame(() => activeElement.scrollIntoView({ block: "center", behavior: "instant" }));
      }

      formBuilder.classList.remove("fade-out");
      formBuilder.classList.add("fade-in");
    }, 150);
  }

  addFieldBtn?.addEventListener("click", async () => {
    const ref = collection(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields`);
    await addDoc(ref, { label: "New Field", type: "text", required: false, options: [], order: Date.now() });
    loadLeadFormFields();
  });

  formBuilder?.addEventListener("change", async (e) => {
    const id = e.target.dataset.id;
    const type = e.target.dataset.type;
    if (!id || !type) return;

    const ref = doc(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields/${id}`);
    const updates = {};
    if (type === "label") updates.label = e.target.value;
    if (type === "required") updates.required = e.target.checked;
    if (type === "type") updates.type = e.target.value;
    if (type === "options") updates.options = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
    
    await updateDoc(ref, updates);
    if (type === "type") loadLeadFormFields();
  });

  formBuilder?.addEventListener("keypress", async (e) => {
    if (e.target.classList.contains("add-option-input") && e.key === "Enter") {
      e.preventDefault();
      const value = e.target.value.trim();
      const id = e.target.dataset.id;
      if (!value || !id) return;
      const ref = doc(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields/${id}`);
      const docSnap = await getDoc(ref);
      if (!docSnap.exists()) return;
      const existing = docSnap.data().options || [];
      if (existing.includes(value)) return;
      await updateDoc(ref, { options: [...existing, value] });
      loadLeadFormFields();
    }
  });

  formBuilder?.addEventListener("click", async (e) => {
    if (e.target.classList.contains("remove-tag")) {
      const scrollY = window.scrollY;
      const fieldId = e.target.dataset.id;
      const optionToRemove = e.target.dataset.opt;
      const ref = doc(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields/${fieldId}`);
      const snap = await getDoc(ref);
      const newOptions = (snap.data().options || []).filter(opt => opt !== optionToRemove);
      await updateDoc(ref, { options: newOptions });
      await loadLeadFormFields();
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "instant" }));
    }
    if (e.target.classList.contains("delete-field")) {
      const id = e.target.dataset.id;
      await deleteDoc(doc(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields/${id}`));
      loadLeadFormFields();
    }
  });

  async function loadFormSelector(selectedId = null) {
    const selector = document.getElementById("form-selector");
    if (!selector) return;

    const formsRef = collection(db, `businesses/${user.uid}/leadForms`);
    const formsSnap = await getDocs(formsRef);
    selector.innerHTML = "";

    const formIds = [];
    formsSnap.forEach(doc => formIds.push(doc.id));

    if (formIds.length === 0) {
      const starterId = "new-form";
      await setDoc(doc(db, `businesses/${user.uid}/leadForms/${starterId}`), { createdAt: serverTimestamp(), displayName: "New Form" });
      return loadFormSelector();
    }

    const sortedForms = [];
    formsSnap.forEach(docSnap => sortedForms.push({ id: docSnap.id, displayName: docSnap.data().displayName || docSnap.id }));
    sortedForms.sort((a, b) => a.displayName.localeCompare(b.displayName));

    sortedForms.forEach(({ id, displayName }, index) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = displayName;
      if (selectedId ? id === selectedId : index === 0) opt.selected = true;
      selector.appendChild(opt);
    });

    selector.dispatchEvent(new Event("change"));
  }

  document.getElementById("form-selector")?.addEventListener("change", e => {
    currentFormId = e.target.value;
    if (!currentFormId) return;
    loadLeadFormFields();
  });

  await loadFormSelector();

  const setupModal = (btnId, modalId, cancelId) => {
    document.getElementById(btnId)?.addEventListener("click", () => document.getElementById(modalId).classList.remove("hidden"));
    document.getElementById(cancelId)?.addEventListener("click", () => document.getElementById(modalId).classList.add("hidden"));
  };

  setupModal("new-form-btn", "newFormModal", "cancelFormBtn");
  document.getElementById("confirmFormBtn")?.addEventListener("click", async () => {
    const displayInput = document.getElementById("form-display-name");
    const displayName = displayInput.value.trim();
    if (!displayName) return alert("Please enter a display name.");
    const formId = displayName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 40);
    try {
      await setDoc(doc(db, `businesses/${user.uid}/leadForms/${formId}`), { createdAt: serverTimestamp(), displayName });
      currentFormId = formId;
      document.getElementById("newFormModal").classList.add("hidden");
      await loadFormSelector(formId);
      await loadLeadFormFields();
    } catch (err) {
      alert("Something went wrong.");
    }
  });

  document.getElementById("rename-form-btn")?.addEventListener("click", () => {
    if (!currentFormId) return alert("No form selected.");
    document.getElementById("rename-static-id").textContent = currentFormId;
    document.getElementById("rename-display-input").value = "";
    document.getElementById("renameFormModal").classList.remove("hidden");
  });
  document.getElementById("cancelRenameBtn")?.addEventListener("click", () => document.getElementById("renameFormModal").classList.add("hidden"));
  document.getElementById("confirmRenameBtn")?.addEventListener("click", async () => {
    const newDisplay = document.getElementById("rename-display-input").value.trim();
    if (!newDisplay) return alert("Enter a new name.");
    await updateDoc(doc(db, `businesses/${user.uid}/leadForms/${currentFormId}`), { displayName: newDisplay });
    document.getElementById("renameFormModal").classList.add("hidden");
    await loadFormSelector();
  });

  document.getElementById("delete-form-btn")?.addEventListener("click", () => {
    if (!currentFormId) return alert("No form selected.");
    document.getElementById("delete-form-id-label").textContent = currentFormId;
    document.getElementById("deleteFormModal").classList.remove("hidden");
  });
  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => document.getElementById("deleteFormModal").classList.add("hidden"));
  document.getElementById("confirmDeleteBtn")?.addEventListener("click", async () => {
    const fieldsSnap = await getDocs(collection(db, `businesses/${user.uid}/leadForms/${currentFormId}/fields`));
    const batch = writeBatch(db);
    fieldsSnap.forEach(docSnap => batch.delete(docSnap.ref));
    await batch.commit();
    await deleteDoc(doc(db, `businesses/${user.uid}/leadForms/${currentFormId}`));
    currentFormId = "";
    document.getElementById("deleteFormModal").classList.add("hidden");
    await loadFormSelector();
  });

  document.getElementById("refreshPageBtn")?.addEventListener("click", () => {
    sessionStorage.setItem("activeTab", "form");
    sessionStorage.setItem("scrollY", window.scrollY.toString());
    localStorage.setItem("activeTabId", "form");
    localStorage.setItem("savedScrollY", window.scrollY.toString());
    setTimeout(() => location.reload(), 200);
  });
}
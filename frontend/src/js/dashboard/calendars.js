import { db } from "../config/firebase-config.js";
import { collection, doc, setDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function initCalendars(user, refreshBubblesCallback) {
  const calendarList = document.getElementById("calendarList");
  const calendarNameInput = document.getElementById("calendarName");
  const calendarUrlInput = document.getElementById("calendarUrl");
  const addCalendarBtn = document.getElementById("addCalendarBtn");
  const refreshCalendarsBtn = document.getElementById("refreshCalendarsBtn");
  const calendarNameError = document.getElementById("calendarNameError");
  const calendarUrlError = document.getElementById("calendarUrlError");

  const loadCalendars = async () => {
    calendarList.innerHTML = "";
    const querySnap = await getDocs(collection(db, `businesses/${user.uid}/calendars`));

    querySnap.forEach(docSnap => {
      const { name, url } = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.className = "border p-2 rounded";
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <div>
            <p class="font-semibold">${name}</p>
            <a href="${url}" target="_blank" class="text-blue-500 underline">${url}</a>
          </div>
          <button class="delete-calendar text-red-500 hover:underline" data-id="${id}">Delete</button>
        </div>
      `;
      calendarList.appendChild(div);
    });

    document.querySelectorAll(".delete-calendar").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        await deleteDoc(doc(db, `businesses/${user.uid}/calendars/${id}`));
        console.log("Deleted calendar:", id);
        loadCalendars();
      });
    });
  };

  if (addCalendarBtn) {
    addCalendarBtn.onclick = async () => {
      const name = calendarNameInput.value.trim();
      const url = calendarUrlInput.value.trim();
      let hasError = false;

      if (calendarNameError) calendarNameError.classList.add("hidden");
      if (calendarUrlError) calendarUrlError.classList.add("hidden");

      if (!name) {
        if (calendarNameError) calendarNameError.classList.remove("hidden");
        hasError = true;
      }
      if (!url) {
        if (calendarUrlError) calendarUrlError.classList.remove("hidden");
        hasError = true;
      }

      if (hasError) return;

      await setDoc(doc(collection(db, `businesses/${user.uid}/calendars`)), { name, url });

      calendarNameInput.value = "";
      calendarUrlInput.value = "";
      await loadCalendars();
      
      if (refreshBubblesCallback) await refreshBubblesCallback();
    };
  }

  if (refreshCalendarsBtn) {
    refreshCalendarsBtn.onclick = () => {
      sessionStorage.setItem("activeTab", "calendars");
      sessionStorage.setItem("scrollY", window.scrollY.toString());
      localStorage.setItem("activeTabId", "calendars");
      localStorage.setItem("savedScrollY", window.scrollY.toString());
      setTimeout(() => location.reload(), 200);
    };
  }

  await loadCalendars();
}
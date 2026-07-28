import { auth } from "../config/firebase-config.js";

const platformSelect = document.getElementById("platform-select");
const instructions = document.getElementById("platform-instructions");

const instructionMap = {
  wordpress: `
    <h3 class="text-lg font-semibold text-indigo-700 mb-1">WordPress Instructions</h3>
    <ol class="list-decimal list-inside space-y-1 text-gray-700">
      <li>Install the free plugin <strong>Insert Headers and Footers</strong>.</li>
      <li>Go to <strong>Settings → Header & Footer</strong>.</li>
      <li>Paste the embed script into the <strong>Footer</strong> box and click Save.</li>
    </ol>
  `,
  wix: `
    <h3 class="text-lg font-semibold text-indigo-700 mb-1">Wix Instructions</h3>
    <ol class="list-decimal list-inside space-y-1 text-gray-700">
      <li>Go to <strong>Settings → Custom Code</strong> in your Wix dashboard.</li>
      <li>Click <strong>+ Add Custom Code</strong>.</li>
      <li>Paste your embed script, choose “Body - end”, and apply to all pages.</li>
      <li>Click Save.</li>
    </ol>
  `,
  squarespace: `
    <h3 class="text-lg font-semibold text-indigo-700 mb-1">Squarespace Instructions</h3>
    <ol class="list-decimal list-inside space-y-1 text-gray-700">
      <li>Go to <strong>Settings → Advanced → Code Injection</strong>.</li>
      <li>Paste your embed script in the <strong>Footer</strong> section.</li>
      <li>Save and refresh your site.</li>
    </ol>
  `,
  webflow: `
    <h3 class="text-lg font-semibold text-indigo-700 mb-1">Webflow Instructions</h3>
    <ol class="list-decimal list-inside space-y-1 text-gray-700">
      <li>Go to your <strong>Project Settings → Custom Code</strong> tab.</li>
      <li>Paste the embed script into the <strong>Footer Code</strong> section.</li>
      <li>Click Save and publish your site.</li>
    </ol>
  `,
  shopify: `
    <h3 class="text-lg font-semibold text-indigo-700 mb-1">Shopify Instructions</h3>
    <ol class="list-decimal list-inside space-y-1 text-gray-700">
      <li>From your Shopify Admin, go to <strong>Online Store → Themes</strong>.</li>
      <li>Click <strong>Actions → Edit Code</strong>.</li>
      <li>In the <strong>Layout</strong> folder, open <code>theme.liquid</code>.</li>
      <li>Paste your embed script just before <code class="bg-yellow-100 px-1 py-0.5 rounded text-red-500">&lt;/body&gt;</code>.</li>
      <li>Click <strong>Save</strong>.</li>
      <li class="mt-2"><em>Optional:</em> For Shopify 2.0 themes, you can also inject via the <strong>“App Embed”</strong> section under <strong>“Customize → Theme Settings”</strong>.</li>
    </ol>
  `,
  godaddy: `
    <h3 class="text-lg font-semibold text-indigo-700 mb-1">GoDaddy Instructions</h3>
    <ol class="list-decimal list-inside space-y-1 text-gray-700">
      <li>Log in to your GoDaddy account and open your site editor.</li>
      <li>Click <strong>Settings → Site Settings → Sitewide Code</strong>.</li>
      <li>Paste your embed script into the <strong>Footer Code</strong> box.</li>
      <li>Click <strong>Publish</strong>.</li>
    </ol>
  `,
  other: `
    <h3 class="text-lg font-semibold text-indigo-700 mb-1">Manual Installation</h3>
    <ol class="list-decimal list-inside space-y-1 text-gray-700">
      <li>Open your site’s HTML files.</li>
      <li>Paste the embed code just before the <code class="bg-yellow-100 px-1 py-0.5 rounded text-red-500">&lt;/body&gt;</code> tag.</li>
      <li>Save and publish your site.</li>
    </ol>
  `
};

function updateInstructions() {
  if (!platformSelect || !instructions) return;
  const selected = platformSelect.value;
  instructions.innerHTML = instructionMap[selected] || '';
}

if (platformSelect) {
  platformSelect.addEventListener("change", updateInstructions);
  updateInstructions(); // Run on load
}

const saveDock   = document.getElementById("save-dock");
const saveBtn    = document.getElementById("save-btn");
const saveBadge  = document.getElementById("save-badge");
const infoTab    = document.getElementById("tab-info");
let formChanged  = false;

function pinBottomLeft() {
  if (!saveDock) return;
  saveDock.style.top = "";            
  saveDock.style.right = "";          
  saveDock.style.left = "1.5rem";     
  saveDock.style.bottom = "calc(1rem + env(safe-area-inset-bottom))";
}
pinBottomLeft();
window.addEventListener("resize", pinBottomLeft);

function showDock() {
  pinBottomLeft();
  saveDock?.classList.remove("opacity-0", "pointer-events-none");
}
function hideDock() {
  saveDock?.classList.add("opacity-0", "pointer-events-none");
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'text-indigo-600', 'border-b-2', 'border-indigo-600'));
    btn.classList.add('active', 'text-indigo-600', 'border-b-2', 'border-indigo-600');

    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    if (tab === "info") showDock(); else hideDock();
  });
});

const initialTab = document.querySelector('.tab-btn.active')?.dataset.tab ?? "info";
if (initialTab === "info") showDock(); else hideDock();

function markDirtyUI() {
  formChanged = true;
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.classList.add("ring-2", "ring-indigo-300");
  }
  saveBadge?.classList.remove("hidden");
  showDock();
}

if (infoTab) {
  infoTab.querySelectorAll('input, textarea, select, [contenteditable="true"]').forEach(el => {
    el.addEventListener('input', markDirtyUI);
    el.addEventListener('change', markDirtyUI);
  });
}

saveBtn?.addEventListener("click", async () => {
  formChanged = false;
  saveBtn?.classList.remove("ring-2","ring-indigo-300");
  saveBadge?.classList.add("hidden");

  const preview = document.getElementById("agent-preview-container");
  if (preview) {
    preview.innerHTML = "";
    const script = document.createElement("script");
    script.setAttribute("type", "module");
    script.setAttribute("src", "/src/agent-v2.js");
    script.setAttribute("biz", auth.currentUser?.uid || "");
    preview.appendChild(script);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // --- Lead Form Dock ---
  const leadTab = document.getElementById('tab-form');
  const addLeadBtn = document.getElementById('add-form-field');
  const saveLeadBtn = document.getElementById('refreshPageBtn');
  
  if (leadTab && addLeadBtn && saveLeadBtn) {
    const leadDock = document.createElement('div');
    leadDock.id = 'leadform-dock';
    leadDock.style.position = 'fixed';
    leadDock.style.left = '24px';
    leadDock.style.bottom = '24px';
    leadDock.style.zIndex = '9999';
    leadDock.style.display = 'block';

    leadDock.innerHTML = `
      <div class="rounded-xl bg-white bg-opacity-90 backdrop-blur border border-gray-200 shadow px-3 py-3 flex flex-col gap-2"></div>
    `;
    document.body.appendChild(leadDock);

    const commonBtnClass = 'px-3 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400';
    addLeadBtn.className = commonBtnClass;
    saveLeadBtn.className = commonBtnClass;

    const leadInner = leadDock.firstElementChild;
    leadInner.appendChild(addLeadBtn);
    leadInner.appendChild(saveLeadBtn);

    const updateLeadDock = () => {
      const hidden = leadTab.classList.contains('hidden') || leadTab.offsetParent === null;
      leadDock.style.display = hidden ? 'none' : 'block';
    };
    updateLeadDock();

    const mo1 = new MutationObserver(updateLeadDock);
    mo1.observe(leadTab, { attributes: true, attributeFilter: ['class', 'style'] });
    document.addEventListener('click', () => setTimeout(updateLeadDock, 0));
  }

  const bubblesTab = document.getElementById('tab-bubbles');
  const addBubbleBtn = document.getElementById('addBubbleBtn');
  const saveBubbleBtn = document.getElementById('saveBubbleBindings');
  
  if (bubblesTab && addBubbleBtn && saveBubbleBtn) {
    const bubbleDock = document.createElement('div');
    bubbleDock.id = 'bubbles-dock';
    bubbleDock.style.position = 'fixed';
    bubbleDock.style.left = '24px';
    bubbleDock.style.bottom = '24px';
    bubbleDock.style.zIndex = '9999';
    bubbleDock.style.display = 'block';

    bubbleDock.innerHTML = `
      <div class="rounded-xl bg-white bg-opacity-90 backdrop-blur border border-gray-200 shadow px-3 py-3 flex flex-col gap-2"></div>
    `;
    document.body.appendChild(bubbleDock);

    const commonBtnClass = 'px-3 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow focus:outline-none focus:ring-2 focus:ring-indigo-400';
    addBubbleBtn.className = commonBtnClass;
    saveBubbleBtn.className = commonBtnClass;

    const bubbleInner = bubbleDock.firstElementChild;
    bubbleInner.appendChild(addBubbleBtn);
    bubbleInner.appendChild(saveBubbleBtn);

    const updateBubbleDock = () => {
      const hidden = bubblesTab.classList.contains('hidden') || bubblesTab.offsetParent === null;
      bubbleDock.style.display = hidden ? 'none' : 'block';
    };
    updateBubbleDock();

    const mo2 = new MutationObserver(updateBubbleDock);
    mo2.observe(bubblesTab, { attributes: true, attributeFilter: ['class', 'style'] });
    document.addEventListener('click', () => setTimeout(updateBubbleDock, 0));
  }
});
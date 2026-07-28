import{getApps as Ve,getApp as Me,initializeApp as je}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";import{getFirestore as De,addDoc as Ce,collection as Z,doc as j,setDoc as ne,increment as se,getDoc as K,getDocs as Te}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";import{s as Oe,g as Ne,l as Pe}from"./assets/apiClient-Bg2yaDw5.js";import We from"https://cdn.jsdelivr.net/npm/dompurify@3.1.5/dist/purify.es.mjs";let re=window.BARNEGON_BIZ_ID;if(!re){const e=document.getElementsByTagName("script");for(let o=0;o<e.length;o++){const n=e[o].getAttribute("biz")||e[o].getAttribute("data-biz");if(n&&n!=="YOUR_ID_HERE"){re=n;break}}}const w=re;if(!w)throw console.error("⛔ CRITICAL: Missing business ID. The Barnegon Agent cannot initialize."),new Error("Missing business ID");const qe={apiKey:"AIzaSyDk2r-uT-iNV6GJAlMB0gm8asAoRr-JG90",authDomain:"ai-agent-demo-9fe52.firebaseapp.com",projectId:"ai-agent-demo-9fe52",storageBucket:"ai-agent-demo-9fe52.firebasestorage.app",messagingSenderId:"1028319770796",appId:"1:1028319770796:web:e25a0deb2f9dfbf1ce4709"},ze=Ve().length?Me():je(qe),A=De(ze),ee=()=>window.matchMedia("(max-width: 500px)").matches;function F(e){const o=window.visualViewport,n=o?Math.round(o.height):window.innerHeight;e.style.setProperty("--agent-real-vh",n+"px");let c=0;o&&(c=Math.max(0,Math.round(window.innerHeight-o.height-o.offsetTop))),e.style.setProperty("--agent-vv-bottom",c+"px")}function Re(e){const o=()=>F(e);window.visualViewport&&(window.visualViewport.addEventListener("resize",o),window.visualViewport.addEventListener("scroll",o)),window.addEventListener("resize",o),window.addEventListener("orientationchange",o)}let we=!1;const P=[];let z=null,te=!1,He="";const _e=new Audio("https://ai-agent-demo-9fe52.web.app/notificationOne.mp3");async function Ye(){try{const e=j(A,"metrics",w);await ne(e,{chatStarted:se(1)},{merge:!0}),console.log("📈 chatStarted incremented")}catch(e){console.error("❌ Failed to track chatStarted:",e.message)}}function U(e){const o=document.getElementById("chat-messages");if(!o)return;const n=document.createElement("div");n.className="message bot",n.innerHTML=We.sanitize(e,{ADD_ATTR:["target"]}),o.appendChild(n),o.scrollTop=o.scrollHeight}function C(e,o){const n=document.getElementById("chat-messages");if(!n)return;const c=document.createElement("div");c.classList.add("message",e);const a=document.createElement("div");a.textContent=o;const r=document.createElement("div");r.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),r.style.fontSize="11px",r.style.color="#888",r.style.marginTop="4px",r.style.textAlign="right",c.appendChild(a),c.appendChild(r),n.appendChild(c),n.scrollTop=n.scrollHeight,e==="bot"&&_e.play().catch(()=>{})}function Ue(){const e=document.getElementById("chat-messages");if(!e)return;const o=document.createElement("div");o.className="message bot",o.id="typing-indicator",o.innerHTML=`
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `,e.appendChild(o),e.scrollTop=e.scrollHeight}function ke(){const e=document.getElementById("typing-indicator");e&&e.remove()}async function oe(e,o){if(!(!z||!o))try{const n=Z(A,`businesses/${w}/chatThreads/${z}/messages`);await Ce(n,{role:e,content:o,timestamp:Date.now()}),console.log(`💬 Logged message to thread (${e})`)}catch(n){console.error("❌ Failed to log message:",n.message)}}async function Ge(){if(!te){te=!0;try{const e=P.slice(-8),o=await Ne(e,w);o&&(He=o.summary||"")}catch(e){console.error("❌ Summary update failed:",e.message)}finally{te=!1}}}async function Ee(e){const o=document.getElementById("chat-input"),n=o.value.trim();if(n==="")return;if(o.disabled=!0,we||(we=!0,Ye()),C("user",n),Ue(),P.push({role:"user",content:n}),o.value="",!z)try{const a=new Date,r=a.toISOString().split("T")[0],d=a.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});z=(await Ce(Z(A,`businesses/${w}/chatThreads`),{startedAt:Date.now(),dateLabel:r,timeLabel:d,userAgent:navigator.userAgent,referrer:document.referrer||null})).id,console.log("🧵 New chat thread created:",z),e.greetingEnabled&&e.greeting&&(await oe("assistant",e.greeting),P.push({role:"assistant",content:e.greeting}))}catch(a){console.error("❌ Failed to create chat thread:",a.message)}oe("user",n).catch(a=>console.error("Failed to log user message:",a)),P.length%5===0&&setTimeout(()=>Ge(),4e3);const c=[...P.slice(-8),{role:"user",content:n}];try{const r=(await Oe(c,e,w)).reply;await new Promise(d=>setTimeout(d,900)),ke(),C("bot",r),P.push({role:"assistant",content:r}),oe("assistant",r).catch(d=>console.error("Failed to log assistant message:",d)),o.disabled=!1,o.focus()}catch(a){console.error(a),ke(),a.message.includes("Too many requests")?C("bot","Whoa, you're moving a bit too fast! Please wait a few seconds before sending another message."):a.message.includes("Security")?C("bot","Security check failed. Please refresh the page and try again."):C("bot","There was an error connecting to the AI. Please try again."),o.disabled=!1,o.focus()}}let W=null;async function Ke(e="default",o){const n=document.getElementById("custom-lead-form");if(W=e,!n)return;const c=window.scrollY,a=o.textColor||"#ffffff";try{const r=await Te(Z(A,`businesses/${w}/leadForms/${e}/fields`)),d=[];r.forEach(f=>d.push({id:f.id,...f.data()})),d.sort((f,I)=>f.order-I.order);const v=document.createElement("div");d.forEach(f=>{const I=document.createElement("div");I.style.margin="16px 16px 20px 16px";const l=document.createElement("label");l.setAttribute("for",f.id),l.textContent=f.label,l.style.display="block",l.style.marginBottom="8px",l.style.fontSize="15px",l.style.fontWeight="600",l.style.color="#111",I.appendChild(l);let x;f.type==="text"||f.type==="paragraph"?(x=document.createElement(f.type==="text"?"input":"textarea"),x.name=f.id,x.id=f.id,x.placeholder=f.label,f.required&&(x.dataset.required="true"),x.style.width="100%",x.style.padding="12px",x.style.borderRadius="10px",x.style.border="1px solid #ccc",x.style.background="#fff",x.style.fontSize="14px",x.style.boxSizing="border-box"):["dropdown","checkbox"].includes(f.type)&&(x=document.createElement("div"),x.style.display="grid",x.style.gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))",x.style.gap="8px",(f.options||[]).forEach(T=>{const b=document.createElement("label");b.style.display="flex",b.style.alignItems="center",b.style.gap="8px",b.style.padding="10px",b.style.border="1px solid #ccc",b.style.borderRadius="10px",b.style.background="#f7f7f7",b.style.cursor="pointer",b.style.fontSize="14px",b.style.color="#222";const L=document.createElement("input");L.name=f.id,L.value=T,L.style.margin="0",f.required&&(L.dataset.required="true"),L.type=f.type==="dropdown"?"radio":"checkbox",b.appendChild(L),b.appendChild(document.createTextNode(T)),x.appendChild(b)})),x&&I.appendChild(x),v.appendChild(I)});const i=document.createElement("div");i.style.display="flex",i.style.flexDirection="row",i.style.justifyContent="space-between",i.style.alignItems="center",i.style.gap="8px",i.style.position="sticky",i.style.bottom="0",i.style.zIndex="10",i.style.background="#fafafa",i.style.padding="8px 16px",i.style.borderTop="1px solid #eee";const u=document.createElement("button");u.type="button",u.textContent="← Back",u.style.flex="1",u.style.padding="12px 0",u.style.textAlign="center",u.style.fontSize="15px",u.style.fontWeight="500",u.style.borderRadius="9999px",u.style.border=`2px solid ${o.color||"#2c3e50"}`,u.style.background="white",u.style.color=o.color||"#2c3e50",u.style.cursor="pointer",u.style.transition="all 0.2s ease",u.addEventListener("mouseenter",()=>{u.style.background=o.color||"#2c3e50",u.style.color=a}),u.addEventListener("mouseleave",()=>{u.style.background="white",u.style.color=o.color||"#2c3e50"}),u.addEventListener("click",()=>{document.getElementById("lead-form").classList.remove("active"),document.getElementById("chat-messages").style.display="block",document.getElementById("chat-input-container").style.display="flex",document.getElementById("preset-bubbles").style.display="flex"}),i.appendChild(u);const m=document.getElementById("lead-submit");m.style.flex="1",m.style.padding="12px 0",m.style.textAlign="center",m.style.fontSize="15px",m.style.fontWeight="600",m.style.borderRadius="9999px",m.style.border="none",m.style.background=o.color||"#2c3e50",m.style.color=a,m.style.cursor="pointer",m.style.transition="transform 0.2s ease, background 0.2s ease",m.addEventListener("mouseenter",()=>{m.style.transform="scale(1.05)"}),m.addEventListener("mouseleave",()=>{m.style.transform="scale(1)"}),i.appendChild(m),v.appendChild(i),n.replaceChildren(...v.children),requestAnimationFrame(()=>{window.scrollTo({top:c,behavior:"auto"})})}catch(r){console.error("Error loading lead form fields:",r),n.innerHTML="<p style='color: red;'>⚠️ Could not load form fields.</p>"}}async function Je(e="default"){const o=document.getElementById("custom-lead-form-mobile");if(W=e,!!o)try{const n=await Te(Z(A,`businesses/${w}/leadForms/${e}/fields`)),c=[];n.forEach(r=>c.push({id:r.id,...r.data()})),c.sort((r,d)=>r.order-d.order);const a=document.createElement("div");c.forEach(r=>{const d=document.createElement("div");d.style.margin="16px 12px 18px 12px";const v=document.createElement("label");v.setAttribute("for",r.id),v.textContent=r.label,v.style.display="block",v.style.marginBottom="8px",v.style.fontSize="15px",v.style.fontWeight="600",v.style.color="#111",d.appendChild(v);let i;r.type==="text"||r.type==="paragraph"?(i=document.createElement(r.type==="text"?"input":"textarea"),i.name=r.id,i.id=r.id,i.placeholder=r.label,r.required&&(i.dataset.required="true"),i.style.width="100%",i.style.padding="12px",i.style.borderRadius="10px",i.style.border="1px solid #ccc",i.style.background="#fff",i.style.fontSize="16px",i.style.boxSizing="border-box",i.tagName==="TEXTAREA"&&(i.style.minHeight="80px",i.style.resize="vertical")):["dropdown","checkbox"].includes(r.type)&&(i=document.createElement("div"),i.style.display="grid",i.style.gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))",i.style.gap="8px",(r.options||[]).forEach(u=>{const m=document.createElement("label");m.style.display="flex",m.style.alignItems="center",m.style.gap="8px",m.style.padding="10px",m.style.border="1px solid #ccc",m.style.borderRadius="10px",m.style.background="#f7f7f7",m.style.cursor="pointer",m.style.fontSize="14px",m.style.color="#222";const f=document.createElement("input");f.name=r.id,f.value=u,f.style.margin="0",r.required&&(f.dataset.required="true"),f.type=r.type==="dropdown"?"radio":"checkbox",m.appendChild(f),m.appendChild(document.createTextNode(u)),i.appendChild(m)})),i&&d.appendChild(i),a.appendChild(d)}),o.replaceChildren(...a.children)}catch(n){console.error("Error loading mobile lead form fields:",n),o.innerHTML="<p style='color:red;'>⚠️ Could not load form fields.</p>"}}const J=e=>{var n,c;(c=(n=e.target).closest)!=null&&c.call(n,"#lead-form-overlay #lfo-content")||e.preventDefault()};let D=null,ie=0;function Le(){const e=document.getElementById("lead-form-overlay"),o=window.visualViewport;!e||!o||(e.style.top=o.offsetTop+"px",e.style.left=o.offsetLeft+"px",e.style.width=o.width+"px",e.style.height=o.height+"px")}function Xe(){var n;const e=document.getElementById("lead-form-overlay"),o=document.getElementById("homebase-agent");e&&(ie=window.scrollY||document.documentElement.scrollTop||0,document.body.classList.add("lfo-body-lock"),document.body.style.top=-ie+"px",(n=document.getElementById("chat-box"))==null||n.setAttribute("aria-hidden","true"),e.classList.add("active"),o&&F(o),window.visualViewport&&(Le(),D=()=>Le(),window.visualViewport.addEventListener("resize",D),window.visualViewport.addEventListener("scroll",D)),document.documentElement.style.overflow="hidden",e.addEventListener("touchmove",J,{passive:!1}),document.addEventListener("touchmove",J,{passive:!1}))}function G(){var o;const e=document.getElementById("lead-form-overlay");!e||!e.classList.contains("active")||(e.classList.remove("active"),document.body.classList.remove("lfo-body-lock"),document.body.style.top="",window.scrollTo(0,ie||0),document.documentElement.style.overflow="",(o=document.getElementById("chat-box"))==null||o.removeAttribute("aria-hidden"),window.visualViewport&&D&&(window.visualViewport.removeEventListener("resize",D),window.visualViewport.removeEventListener("scroll",D),D=null),e.style.top=e.style.left=e.style.width=e.style.height="",e.removeEventListener("touchmove",J,{passive:!1}),document.removeEventListener("touchmove",J,{passive:!1}))}const X=e=>{var n,c;(c=(n=e.target).closest)!=null&&c.call(n,"#calendar-overlay #co-content")||e.preventDefault()};let O=null,le=0;function Be(){const e=document.getElementById("calendar-overlay"),o=window.visualViewport;!e||!o||(e.style.top=o.offsetTop+"px",e.style.left=o.offsetLeft+"px",e.style.width=o.width+"px",e.style.height=o.height+"px")}function Ze(e){var d;const o=document.getElementById("calendar-overlay"),n=document.getElementById("co-content"),c=document.getElementById("homebase-agent");if(!o||!n)return;n.innerHTML="";const a=document.createElement("iframe"),r=e.includes("?")?e+"&embed=1":e+"?embed=1";a.src=r,a.setAttribute("allow","payment"),a.setAttribute("referrerpolicy","strict-origin-when-cross-origin"),n.appendChild(a),le=window.scrollY||document.documentElement.scrollTop||0,document.body.classList.add("co-body-lock"),document.body.style.top=-le+"px",(d=document.getElementById("chat-box"))==null||d.setAttribute("aria-hidden","true"),o.style.display="flex",c&&F(c),window.visualViewport&&(Be(),O=()=>Be(),window.visualViewport.addEventListener("resize",O),window.visualViewport.addEventListener("scroll",O)),document.documentElement.style.overflow="hidden",o.addEventListener("touchmove",X,{passive:!1}),document.addEventListener("touchmove",X,{passive:!1})}function ae(){var o;const e=document.getElementById("calendar-overlay");!e||e.style.display==="none"||(e.style.display="none",document.body.classList.remove("co-body-lock"),document.body.style.top="",window.scrollTo(0,le||0),document.documentElement.style.overflow="",(o=document.getElementById("chat-box"))==null||o.removeAttribute("aria-hidden"),window.visualViewport&&O&&(window.visualViewport.removeEventListener("resize",O),window.visualViewport.removeEventListener("scroll",O),O=null),e.style.top=e.style.left=e.style.width=e.style.height="",e.removeEventListener("touchmove",X,{passive:!1}),document.removeEventListener("touchmove",X,{passive:!1}))}async function Ie(e,o){var f,I;const n=e,c={timestamp:new Date().toISOString()};let a=!0,r=null;const d=Array.from(n.elements);for(const l of d){if(!l.name)continue;const x=l.dataset.required==="true";let T=!0,b=l.placeholder||l.name;try{const L=await K(j(A,`businesses/${w}/leadForms/${W}/fields/${l.name}`));L.exists()&&(b=L.data().label||b)}catch(L){console.warn(`⚠️ Failed to fetch label for field ${l.name}:`,L.message)}if(l.type==="checkbox"?(c[l.name]||(c[l.name]={label:b,value:[]}),l.checked&&c[l.name].value.push(l.value)):l.type==="radio"?l.checked&&(c[l.name]={label:b,value:l.value}):(x&&!l.value.trim()?(T=!1,l.classList.add("invalid-input")):l.classList.remove("invalid-input"),c[l.name]={label:b,value:l.value.trim()}),["checkbox","radio"].includes(l.type)){const L=n.querySelectorAll(`[name="${l.name}"]`),R=Array.from(L).some(g=>g.checked);x&&!R?(L.forEach(g=>{var $;g.classList.add("invalid-input"),($=g.closest("label"))==null||$.classList.add("invalid-input")}),r||(r=l,a=!1)):L.forEach(g=>{var $;g.classList.remove("invalid-input"),($=g.closest("label"))==null||$.classList.remove("invalid-input")})}!T&&!r&&!["checkbox","radio"].includes(l.type)&&(r=l,a=!1)}if(!a)throw C("bot","Please fill out all required fields."),r==null||r.scrollIntoView({behavior:"smooth",block:"center"}),new Error("Invalid form");W&&(c.formId=W);const v=window.turnstileToken||((f=document.querySelector('[name="cf-turnstile-response"]'))==null?void 0:f.value);if(!v)throw C("bot","Security check failed. Please ensure you are verified as human."),new Error("Missing Turnstile token");const i=await fetch("https://homebase-stripe-backend-clean.onrender.com/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({businessId:w,leadData:c,token:v})});if(!i.ok){const l=await i.json();throw C("bot",((I=l==null?void 0:l.error)==null?void 0:I.message)||"Failed to save details securely."),new Error("Backend lead submission failed")}const m={id:(await i.json()).leadId};window.turnstile&&(window.turnstile.reset(),window.turnstileToken=null);try{if(o!=null&&o.crmWebhookUrl){const l={};for(const[T,b]of Object.entries(c))T==="timestamp"||T==="formId"||b&&typeof b=="object"&&"label"in b&&(l[b.label||T]=Array.isArray(b.value)?b.value.join(", "):b.value);const x={source:"barnegon",event:"lead.created",businessId:w,businessName:o.name||"",leadId:m.id,formId:c.formId||W||null,submittedAt:c.timestamp,fieldsDetailed:c,fields:l};await Qe(o.crmWebhookUrl,x)}}catch(l){console.warn("Webhook send failed:",l)}return!0}async function Qe(e,o){try{await fetch("https://homebase-stripe-backend-clean.onrender.com/webhook/relay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({businessId:w,payload:o})})}catch(n){console.warn("relay call failed:",n.message)}}function et(e){const o=e.textColor||"#ffffff",n=e.neonGlow===!0,c=e.chatBg||"#fafafa",a=((e==null?void 0:e.chatFont)||"Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif").trim();(function(){const i=["Inter","Poppins","Rubik","Nunito"].find(m=>a.startsWith(m));if(!i)return;const u=document.createElement("link");u.rel="stylesheet",u.href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(i)}:wght@400;600;700&display=swap`,document.head.appendChild(u)})();const r=document.createElement("style");r.textContent=`
      #homebase-agent #chat-button {
      position: fixed;
      bottom: calc(24px + env(safe-area-inset-bottom));
      right: calc(24px + env(safe-area-inset-right));
      background: ${e.color||"#00d4ab"};
      border-radius: 9999px;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      transition: transform 0.2s ease;
      animation: float 2.5s ease-in-out infinite;
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
      ${n?`box-shadow: 0 0 12px ${e.color||"#2c3e50"}, 0 10px 24px rgba(0,0,0,0.25);`:""}
    }
    
    
    
      #homebase-agent #chat-button:hover {
        transform: scale(1.1); 
      }
    
    
      #homebase-agent #chat-box {
      position: fixed;
      bottom: calc(100px + env(safe-area-inset-bottom));
        right: calc(20px + env(safe-area-inset-right));
      width: 400px;
      height: calc(var(--agent-real-vh, 100vh) - 150px);
      background: rgba(255, 255, 255, 0.75);
      border: 3px solid ${e.color||"#2c3e50"};
        border-radius: 24px;
        backdrop-filter: blur(24px);
        ${n?`box-shadow:
               0 0 18px ${e.color||"#2c3e50"},
               0 0 40px ${e.color||"#2c3e50"}80,
               0 12px 50px rgba(0,0,0,0.35);`:`box-shadow:
               0 20px 50px rgba(0, 0, 0, 0.2);`}
        display: flex;
        flex-direction: column;
        font-family: ${a};
        z-index: 10000;
        overflow: hidden;
    }
    
    
      #homebase-agent #chat-box.hidden { display: none; }
    
    /* ==== BARNEGON UNISON WAVE — BIZ COLOR DOMINANT ==== */
    #homebase-agent #chat-header {
      position: relative;
      z-index: 1;
      flex-shrink: 0;
      padding: calc(14px + env(safe-area-inset-top)) 18px 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    
      /* Base header is the biz color (not white) */
      background: ${e.color||"#4f46e5"};
      border-bottom: 1px solid rgba(0,0,0,0.12);
      box-shadow: 0 6px 16px rgba(0,0,0,0.18);
      overflow: hidden;
    }
    
    /* One slow subtle wave of lighter/darker shades of the biz color */
    #homebase-agent #chat-header::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        120deg,
        ${e.color||"#4f46e5"} 0%,
        ${e.color||"#4f46e5"}cc 40%,   /* slightly lighter */
        ${e.color||"#4f46e5"} 80%
      );
      background-size: 200% 200%;
      animation: barnegonWaveShift 40s ease-in-out infinite alternate;
      z-index: 0;
    }
    
    /* Title text — always readable with plate */
    #homebase-agent #chat-business-name {
      position: relative;
      color: ${o} !important;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.02em;
      z-index: 1;
    }
    #homebase-agent #chat-business-name::before {
      content: "";
      position: absolute;
      inset: -6px -10px;
      border-radius: 12px;
      background: rgba(0,0,0,0.15);   /* subtle dark plate */
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: -1;
    }
    
    /* Close button */
    #homebase-agent #chat-header .chat-close {
      color: ${o};
      font-size: 18px;
      opacity: 0.9;
      cursor: pointer;
      transition: transform .18s ease, opacity .18s ease, background .18s ease;
      z-index: 1;
      /* Make the tap target at least 44x44pt on mobile */
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      margin-right: max(env(safe-area-inset-right), 0px);
      border-radius: 12px;
      -webkit-tap-highlight-color: transparent;
    }
    #homebase-agent #chat-header .chat-close:hover {
      opacity: 1;
      transform: scale(1.05);
      background: rgba(0,0,0,0.12);
    }
    
    /* Subtle slow wave effect */
    @keyframes barnegonWaveShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    /* Always-on pulsing green status dot */
    #homebase-agent #chat-header .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 9999px;
      background: #22c55e; /* green */
      box-shadow: 0 0 8px 2px rgba(34,197,94,0.6);
      display: inline-block;
      animation: pulseGreen 1.5s infinite;
    }
    
    @keyframes pulseGreen {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    
    
      #homebase-agent #chat-status {
        font-size: 12px;
        color: #d0fbe8;
      }
    
      #homebase-agent #preset-bubbles {
      flex-shrink: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px;
      border-bottom: 1px solid #eee;
      background: ${c};
      justify-content: center; /* ⬅️ center align bubbles */
    }
    
    /* --- Barnegon Buttons (rounded squares) --- */
    #homebase-agent .preset-btn {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;                  /* squared-round, not pill */
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #111;
      cursor: pointer;
      transition: box-shadow .18s ease, transform .12s ease, background .18s ease, color .18s ease, border-color .18s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,.04);
    }
    
    #homebase-agent .preset-btn:hover {
      background: ${e.color||"#4f46e5"};
      color: #fff;
      border-color: ${e.color||"#4f46e5"};
      box-shadow: 0 8px 18px rgba(0,0,0,.10);
      transform: translateY(-1px);
    }
    
    #homebase-agent .preset-btn:active {
      transform: translateY(0);
      box-shadow: inset 0 2px 6px rgba(0,0,0,.08);
    }
    
    
    
      #homebase-agent #chat-messages {
        flex: 1 1 auto;
        padding: 12px;
        overflow-y: auto;
        overflow-x: hidden;
        font-size: 14px;
        /* Subtle pro-looking background: overlay gradient + your chosen color */
        background:
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.06)),
          ${c};
        background-attachment: local, local;  /* prevents weird scroll parallax */
        background-blend-mode: normal, normal;
        flex-grow: 1; 
      }
    
      @keyframes slideFadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    
      #homebase-agent #chat-messages .message {
        max-width: 80%;
        margin: 6px 0;
        padding: 10px 14px;
        border-radius: 16px;
        line-height: 1.4;
        font-size: 14px;
        word-wrap: break-word;
        animation: slideFadeIn 0.3s ease-out;
      }
    
      #homebase-agent #chat-messages .user {
      align-self: flex-end;
      background: linear-gradient(145deg, ${e.color||"#00d4ab"}, ${e.textColor||"#1f2f3f"});
      color: white;
      margin-left: auto;
      border-bottom-right-radius: 4px;
    }

      .message.bot a {
        color: var(--theme-color, #007bff);
        text-decoration: underline;
        display: inline-block;
        transition: transform 0.2s ease, color 0.2s ease;
      }

      .message.bot a:hover {
        transform: scale(1.05);
        color: #004080;
      }
    
      #homebase-agent #chat-messages .bot {
      align-self: flex-start;
      background: linear-gradient(145deg, #ffffff, #f9f9f9);
      border: 1px solid #ddd;
      color: #222;
      margin-right: auto;
      border-radius: 18px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    
    
      #homebase-agent #chat-input-container {
        flex-shrink: 0;
        display: flex;
        flex-direction: row;     /* keep in one row */
        align-items: center;     /* vertically center */
        flex-wrap: nowrap;       /* ⬅️ never wrap to next line (Safari fix) */
        gap: 8px;
        padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
        border-top: 1px solid #eee;
        background: ${c};
      }
    
      #homebase-agent #chat-input {
        /* The critical Safari fixes are min-width:0 and a real basis */
        flex: 1 1 0%;
        min-width: 0;            /* ⬅️ allow shrinking in Safari */
        width: 1%;               /* ⬅️ helps Safari compute shrink correctly */
        max-width: 100%;
    
        padding: 12px 14px;
        font-size: 16px;         /* prevent iOS zoom-on-focus */
        line-height: 1.35;
        min-height: 44px;
        border: 1px solid #ccc;
        border-radius: 12px;
        outline: none;
        background: #f9f9f9;
        color: black;
        -webkit-appearance: none;
      }
    
      #homebase-agent #chat-input:focus {
        border-color: ${e.color||"#2c3e50"};
        box-shadow: 0 0 0 2px ${e.color||"#2c3e50"}33;
      }
    
    
      #homebase-agent #send-button {
      display: inline-flex;     /* ⬅️ auto-size button content, don’t stretch */
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;           /* stay beside input */
        width: auto !important;   /* ⬅️ override any past mobile full-width */
        white-space: nowrap;
      background-color: ${e.color||"#2c3e50"};
      color: ${o};
      border: none;
      padding: 10px 14px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 16px;          /* iOS no-zoom */
      min-height: 44px;
      transition: transform 0.15s ease-in-out;
    }
    
      #homebase-agent #send-button:hover { transform: scale(1.05); }
    
      #homebase-agent #lead-form {
      flex: 1 1 auto;
      display: none;
      flex-direction: column;
      justify-content: flex-start;
      background: #fafafa;
      height: 100%;
      overflow-y: auto;
      box-sizing: border-box;
      position: relative;
    }
    
    #homebase-agent #lead-form.active {
      display: flex;
    }
    
    #homebase-agent #lead-form input,
    #homebase-agent #lead-form textarea,
    #homebase-agent #lead-form button {
      font-family: 'Inter', sans-serif;
      width: 100%;
      margin-bottom: 12px;
      padding: 12px;
      font-size: 14px;
      border-radius: 10px;
      border: 1px solid #ccc;
      background: white;
      color: black;
      box-sizing: border-box;
    }
    
    #homebase-agent #lead-form input::placeholder,
    #homebase-agent #lead-form textarea::placeholder {
      color: #888;
    }
    
    #homebase-agent #lead-form textarea {
      resize: vertical;
      min-height: 60px;
    }
    
    #homebase-agent #lead-form button {
      background-color: ${e.color||"#2c3e50"};
      color: ${o};
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
    
    #homebase-agent #lead-form button:hover {
      opacity: 0.9;
    }
    
    #homebase-agent #back-button {
      cursor: pointer;
      margin-bottom: 8px;
      font-weight: bold;
      color: black;
    }
    
    
      #homebase-agent iframe {
        width: 100%;
        max-width: 100%;
        border: none;
        display: block;
        overflow-x: hidden;
      }
    
      #homebase-agent #chat-footer-branding {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 12px;
      color: #888;
      padding: 8px;
      border-top: 1px solid #eee;
    }
    
    
      #homebase-agent #chat-footer-branding img {
        height: 20px;
        width: auto;
      }
    
      #homebase-agent #chat-footer-branding a {
        display: flex;
        align-items: center;
        gap: 4px;
        text-decoration: none;
        color: inherit;
        transition: opacity 0.2s ease;
      }
    
      #homebase-agent #chat-footer-branding a:hover {
      opacity: 0.75;
      transform: scale(1.05);
      cursor: pointer;
    }
    
    
      @media (max-width: 500px) {
      #homebase-agent #chat-box {
        width: calc(100% - (2.5% * 2));
        right: 2.5%;
        bottom: calc(80px + env(safe-area-inset-bottom));
        height: calc(var(--agent-real-vh, 100vh) - 80px);
      }
    
      #homebase-agent iframe {
        height: calc(var(--agent-real-vh, 100vh) * 0.75) !important;
      }
    
      #homebase-agent #chat-footer-branding {
        display: none;
      }
    
      /* KEEP input + send button on one row on mobile */
      #homebase-agent #chat-input-container {
        flex-direction: row;    /* don’t switch to column on phones */
        align-items: center;
        flex-wrap: nowrap;      /* ⬅️ keep single line on small screens too */
        gap: 8px;
      }
      #homebase-agent #send-button {
        width: auto !important; /* ensure not full-width */
        flex: 0 0 auto;
      }
    }
    
    
      .invalid-email {
      border: 2px solid red !important;
      color: red;
    }
    
    .invalid-input {
      border: 2px solid red !important;
      background: #ffeef0 !important;
      color: #b00020 !important;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    
    #homebase-agent #typing-indicator {
      display: flex;
      gap: 4px;
      align-items: center;
      justify-content: flex-start;
    }
    
    #homebase-agent #typing-indicator .dot {
      width: 6px;
      height: 6px;
      background: #555;
      border-radius: 50%;
      animation: blink 1s infinite ease-in-out;
    }
    
    #homebase-agent #typing-indicator .dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    #homebase-agent #typing-indicator .dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes blink {
      0%, 80%, 100% {
        opacity: 0;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    #homebase-agent .calendar-fallback {
      position: sticky;
      bottom: 0;
      z-index: 10;
      background: white;
      padding: 8px 0;
    }
    
    #homebase-agent #calendar-view {
      flex: 1 1 auto;
      display: none;
      flex-direction: column;
      justify-content: flex-start;
      padding: 16px;
      background: #fafafa;
      height: 100%;
      overflow-y: auto;
      box-sizing: border-box;
    }
    
    #homebase-agent #calendar-view.active {
      display: flex !important;
    }
    
    #homebase-agent #calendar-view a:hover {
      transform: scale(1.05);
    }
    
    /* Lead Form Field Labels */
    #homebase-agent #custom-lead-form label {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 9999px;
      background: #f0f0f0;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      color: #333;
      border: none;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    
    #homebase-agent #custom-lead-form label:hover {
      background: #e6e6e6;
      transform: translateY(-2px);
    }
    
    #homebase-agent #custom-lead-form input[type="checkbox"],
    #homebase-agent #custom-lead-form input[type="radio"] {
      width: 20px;
      height: 20px;
      accent-color: ${e.color||"#2c3e50"};
      flex-shrink: 0;
    }
    
    #homebase-agent #custom-lead-form div {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    
    /* Text Inputs + Textareas — Clean, Underlined Style */
    #homebase-agent #lead-form input[type="text"],
    #homebase-agent #lead-form textarea {
      border: none;
      border-bottom: 2px solid #ccc;
      border-radius: 0;
      padding: 10px 2px;
      background: transparent;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    
    #homebase-agent #lead-form input[type="text"]:focus,
    #homebase-agent #lead-form textarea:focus {
      border-color: ${e.color||"#2c3e50"};
    }
    
    #homebase-agent #lead-form textarea {
      min-height: 70px;
      resize: vertical;
    }
    
    /* Section Labels (like "Which Products?") — Bold & Clean */
    #homebase-agent #custom-lead-form > div > label:first-child {
      background: transparent;
      padding: 0;
      border-radius: 0;
      cursor: default;
      font-size: 16px;
      font-weight: 600;
      color: #111;
      transform: none;
    }
    
    /* Mobile Tweaks */
    @media (max-width: 480px) {
      #homebase-agent #custom-lead-form label {
        font-size: 16px;
        padding: 12px 16px;
      }
      #homebase-agent #lead-form input[type="text"],
      #homebase-agent #lead-form textarea {
        font-size: 17px;
      }
    }
    
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    #homebase-agent #chat-box.auto-open {
      animation: fadeUp 0.5s ease-out;
    }
    
    @keyframes fadeDown {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(10px);
      }
    }
    
    #homebase-agent #chat-box.fade-down {
      animation: fadeDown 0.4s ease-out forwards;
    }
    
    #homebase-agent * {
      scrollbar-width: thin;
      scrollbar-color: ${e.color||"#2c3e50"} #f3f4f6;
    }
    
    #homebase-agent *::-webkit-scrollbar {
      width: 8px;
    }
    
    #homebase-agent *::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 8px;
    }
    
    #homebase-agent *::-webkit-scrollbar-thumb {
      background: ${e.color||"#2c3e50"};
      border-radius: 8px;
      border: 2px solid white;
    }
    
    #homebase-agent *::-webkit-scrollbar-thumb:hover {
      background: ${e.textColor||e.color||"#1f2f3f"};
    }
    
    /* Provide a default for the custom viewport var */
    #homebase-agent { --agent-real-vh: 100vh; }
    
    /* Backdrop overlay for closing the chat by tapping outside */
    /* BACKDROP: disable visual dim + interactions */
    #homebase-agent #chat-backdrop {
      position: fixed;
      inset: 0;
      height: var(--agent-real-vh, 100vh);
      background: transparent;   /* no dim */
      opacity: 0;                /* always invisible */
      pointer-events: none;      /* don't block page */
      transition: none;          /* no fade needed */
      z-index: 9998;
      display: none;             /* don't render at all */
    }
    
    
    /* When chat is open, enable the backdrop */
    /* When chat is open, still keep backdrop off */
    #homebase-agent.chat-open #chat-backdrop {
      opacity: 0;
      pointer-events: none;
      display: none;
    }
    
    
    /* Prevent accidental horizontal scroll inside the agent */
    #homebase-agent, #homebase-agent * {
      max-width: 100%;
      box-sizing: border-box;
      overscroll-behavior: contain;
    }
    
    /* iOS text scaling + gesture hygiene, scoped to the agent */
    #homebase-agent {
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      touch-action: manipulation; /* reduce accidental double-tap zoom */
    }
    
    /* Ensure ALL form controls inside the agent stay >=16px (no zoom) */
    #homebase-agent input,
    #homebase-agent textarea,
    #homebase-agent select {
      font-size: 16px;
    }
    
    /* Smooth scrolling areas; contain overscroll so the page doesn’t “jump” */
    #homebase-agent #chat-messages,
    #homebase-agent #calendar-view,
    #homebase-agent #lead-form {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    
    /* Keep the fixed chat layer composited to reduce iOS repaint jank */
    #homebase-agent #chat-box {
      transform: translateZ(0);
      will-change: transform;
    }
    
    /* Provide default and iOS text-scaling hygiene */
    #homebase-agent {
      --agent-real-vh: 100vh;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      touch-action: manipulation;
    }
    
    /* Smooth scroll inside internal panes; avoid page “jump” on iOS */
    #homebase-agent #chat-messages,
    #homebase-agent #calendar-view,
    #homebase-agent #lead-form {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    
    /* Keep fixed chat composited to reduce repaint jank on iOS */
    #homebase-agent #chat-box {
      transform: translateZ(0);
      will-change: transform;
    }
    
    /* Make the close control a proper touch target */
    #homebase-agent #chat-header .chat-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Half-open state: ~50% of the real viewport height on non-mobile */
    #homebase-agent #chat-box.half-open {
      height: calc(var(--agent-real-vh) * 0.5);
    }
    
    /* Smooth open/close + height resize */
    #homebase-agent #chat-box {
      transition: height 280ms ease, opacity 220ms ease, transform 220ms ease;
      will-change: height, opacity, transform;
    }
    
    /* Reuse fade-down for both close and pre-open */
    #homebase-agent #chat-box.fade-down {
      opacity: 0;
      transform: translateY(8px);
    }
    
    /* Accessibility: respect reduced motion */
    @media (prefers-reduced-motion: reduce) {
      #homebase-agent #chat-box {
        transition: none;
      }
    }
    
    #homebase-agent #lead-form-overlay {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--agent-real-vh, 100vh);
      width: 100%;
      background: #ffffff;
      z-index: 10001;
      display: none;
      flex-direction: column;
      overscroll-behavior: contain;
      touch-action: none;
      overflow: hidden; /* ⬅️ prevents any peek-through while keyboard animates */
    }
    
    
    #homebase-agent #lead-form-overlay.active { display: flex; }
    
    /* Header */
    #homebase-agent #lead-form-overlay .lfo-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: calc(10px + env(safe-area-inset-top)) 12px 10px 12px;
      background: ${e.color||"#4f46e5"};
      color: ${o};
      box-shadow: 0 2px 10px rgba(0,0,0,.15);
    }
    
    #homebase-agent #lead-form-overlay .lfo-title {
      font-weight: 700;
      font-size: 16px;
    }
    
    /* Back button (touch target 44x44) */
    #homebase-agent #lead-form-overlay .lfo-back {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      height: 44px;
      padding: 0 12px;
      border-radius: 12px;
      border: 2px solid rgba(255,255,255,.6);
      background: transparent;
      color: ${o};
      font-weight: 600;
      cursor: pointer;
    }
    
    /* Scrollable content area */
    #homebase-agent #lead-form-overlay #lfo-content {
      flex: 1 1 auto;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 16px;
      background: #fafafa;
    }
    
    /* Sticky actions (Submit) */
    #homebase-agent #lead-form-overlay .lfo-actions {
      position: sticky;
      bottom: 0;
      flex-shrink: 0;
      background: #fff;
      border-top: 1px solid #eee;
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
      display: flex;
      gap: 10px;
    }
    
    #homebase-agent #lead-form-overlay #lead-submit-mobile {
      flex: 1;
      background: ${e.color||"#2c3e50"};
      color: ${o};
      border: none;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 16px;
      min-height: 44px;
      cursor: pointer;
    }
    
    /* The overlay ONLY exists on small screens */
    @media (min-width: 501px) {
      #homebase-agent #lead-form-overlay { display: none !important; }
    }
    
    /* When overlay is open, prevent page scroll under it */
    .lfo-body-lock { position: fixed !important; width: 100%; overflow: hidden; }
    
    /* Extra guard: keep scroll from chaining past the form content */
    #homebase-agent #lead-form-overlay #lfo-content { overscroll-behavior: contain; }
    
    /* ===== Calendar Overlay (mobile only) ===== */
    #homebase-agent #calendar-overlay {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: var(--agent-real-vh, 100vh);
      width: 100%;
      background: #ffffff;
      z-index: 10001;
      display: none;           /* closed by default */
      flex-direction: column;
      overscroll-behavior: contain;
      touch-action: none;
      overflow: hidden;        /* prevents gaps while keyboard animates */
    }
    
    /* Header */
    #homebase-agent #calendar-overlay .co-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: calc(10px + env(safe-area-inset-top)) 12px 10px 12px;
      background: ${e.color||"#4f46e5"};
      color: ${o};
      box-shadow: 0 2px 10px rgba(0,0,0,.15);
    }
    
    #homebase-agent #calendar-overlay .co-title {
      font-weight: 700;
      font-size: 16px;
    }
    
    /* Back button (44x44 touch target) */
    #homebase-agent #calendar-overlay .co-back {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      height: 44px;
      padding: 0 12px;
      border-radius: 12px;
      border: 2px solid rgba(255,255,255,.6);
      background: transparent;
      color: ${o};
      font-weight: 600;
      cursor: pointer;
    }
    
    /* Scrollable content area */
    #homebase-agent #calendar-overlay #co-content {
      flex: 1 1 auto;
      overflow: hidden;                /* the iframe fills this */
      -webkit-overflow-scrolling: touch;
      padding: 0;                      /* no padding so iframe can be 100% */
      background: #fafafa;
    }
    
    /* The iframe fills available height */
    #homebase-agent #calendar-overlay #co-content iframe {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: 0;
    }
    
    /* Sticky actions (optional) */
    #homebase-agent #calendar-overlay .co-actions {
      position: sticky;
      bottom: 0;
      flex-shrink: 0;
      background: #fff;
      border-top: 1px solid #eee;
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
      display: flex;
      justify-content: center;
      gap: 10px;
    }
    
    /* Mobile only */
    @media (min-width: 501px) {
      #homebase-agent #calendar-overlay { display: none !important; }
    }
    
    /* When overlay is open, prevent page scroll under it */
    .co-body-lock { position: fixed !important; width: 100%; overflow: hidden; }
    
    /* Honeypot: off-screen but still visible to bots */
    #homebase-agent .hp-field {
      position: absolute !important;
      left: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    
    `,document.head.appendChild(r)}function tt(e){const o=e.textColor||"#ffffff";return`
      <div id="chat-button">
      <svg xmlns="http://www.w3.org/2000/svg"
           fill="${o}"
           viewBox="0 0 24 24"
           width="28"
           height="28">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
      </svg>
    </div>
    
    
      <!-- Backdrop (click to close) -->
      <div id="chat-backdrop" aria-hidden="true"></div>
    
      <div id="chat-box" class="hidden" role="dialog" aria-modal="true" aria-label="Barnegon chat">
        <div id="chat-header">
          <div id="chat-business-name" style="color: ${o};">
            ${e.name||"Live Agent"}
            <span class="status-dot"></span>
          </div>
          <div class="chat-close" role="button" tabindex="0" aria-label="Close chat">✕</div>
        </div>
    
    
    
        <div id="preset-bubbles"></div>
    
    
        <div id="lead-form" class="hidden">
          <form id="custom-lead-form">
          <!-- Honeypot (bots will fill this; humans won't see it) -->
            <input
              type="text"
              id="hp_middle"
              name="middle"
              class="hp-field"
              autocomplete="new-password"
              tabindex="-1"
              inputmode="none"
              aria-hidden="true"
            />
          </form>
          <button id="lead-submit">Submit</button>
        </div>
    
        <div id="calendar-view" class="hidden">
          <div class="calendar-actions">
            <div id="back-button">← Back</div>
            <!-- The "Confirm Booking Button" goes here -->
          </div>
          <!-- Calendar iframe will be inserted dynamically here -->
        </div>
    
    
        <div id="chat-messages"></div> 
    
        <div id="chat-input-container">
          <input type="text" id="chat-input" placeholder="Type your message..." />
          <button id="send-button">➤</button>
        </div>
    
        <div id="chat-footer-branding">
          <span>Powered by</span>
          <a href="https://ai-agent-demo-9fe52.web.app" target="_blank" id="powered-link">
            <img src="https://ai-agent-demo-9fe52.web.app/Images/BarnegonFullWordLogo.png" alt="Barnegon" />
          </a>
        </div>
    
    
    
      </div>
    
      <!-- Full-screen Lead Form Overlay (mobile only) -->
      <div id="lead-form-overlay" aria-hidden="true">
        <div class="lfo-header">
          <button id="lfo-back" class="lfo-back" type="button">← Back</button>
          <div class="lfo-title">${e.name||"Live Agent"}</div>
          <div style="width:44px" aria-hidden="true"></div>
        </div>
        <div id="lfo-content">
          <form id="custom-lead-form-mobile">
          <!-- Honeypot (bots will fill this; humans won't see it) -->
            <input
              type="text"
              id="hp_middle"
              name="middle"
              class="hp-field"
              autocomplete="new-password"
              tabindex="-1"
              inputmode="none"
              aria-hidden="true"
            />
          </form>
        </div>
        <div class="lfo-actions">
          <button id="lead-submit-mobile" type="button">Submit</button>
        </div>
      </div>
    
        <!-- Full-screen Calendar Overlay (mobile only) -->
      <div id="calendar-overlay" aria-hidden="true">
        <div class="co-header">
          <button id="co-back" class="co-back" type="button">← Back</button>
          <div class="co-title">${e.name||"Live Agent"}</div>
          <div style="width:44px" aria-hidden="true"></div>
        </div>
        <div id="co-content"><!-- iframe injected here --></div>
        <div class="co-actions"><!-- reserved (e.g., “Done”) --></div>
      </div>
    
    `}(async()=>{var de,pe,me,ue,fe,he,be,ge,ye,xe;try{await Pe("0x4AAAAAACnywfP5IFkTR43X")}catch(t){console.error("Failed to load security clearance",t)}let e={};async function o(){var t;try{const s=j(A,"businesses",w);e=((t=(await K(s)).data())==null?void 0:t.bubbleBindings)||{},console.log("✅ bubbleBindings loaded:",e),typeof b=="function"&&b()}catch(s){console.error("❌ Failed to fetch bubbleBindings:",s.message)}}const n=j(A,"businesses",w),c=await K(n);if(!c.exists())throw console.error(`No business found with ID '${w}'`),new Error("Business profile not found");const a=c.data();if(a.isActive!==!0){console.warn("⛔ This business is not active — chat agent disabled.");return}const r=a.textColor||"#ffffff";et(a);const d=document.createElement("div");d.id="homebase-agent",F(d),Re(d),function(){const s=window.visualViewport;if(!s)return;const p=()=>F(d);s.addEventListener("resize",p),s.addEventListener("scroll",p)}();const v=()=>document.querySelector("#homebase-agent #chat-messages"),i=()=>document.querySelector("#homebase-agent #chat-input");function u(){const t=v();t&&requestAnimationFrame(()=>{t.scrollTop=t.scrollHeight})}function m(){F(d);const t=g();t&&t.classList.contains("half-open")&&q()}function f(){F(d),document.activeElement===i()&&u()}(de=i())==null||de.addEventListener("focus",m,{passive:!0}),(pe=i())==null||pe.addEventListener("input",()=>u(),{passive:!0}),window.visualViewport&&(window.visualViewport.addEventListener("resize",f),window.visualViewport.addEventListener("scroll",f)),(me=v())==null||me.addEventListener("touchmove",t=>{t.stopPropagation()},{passive:!0}),d.style.opacity=0,d.style.transition="opacity 0.3s ease",d.innerHTML=tt(a),console.log("✅ businessId in use:",w);async function I(t){try{const s=j(A,"metrics",w);await ne(s,{presetClicks:{[t]:se(1)}},{merge:!0}),console.log(`📈 presetClick '${t}' incremented.`)}catch(s){console.error(`❌ Failed to track presetClick '${t}':`,s.message)}}async function l(){try{const t=j(A,"metrics",w);await ne(t,{calendarClicks:se(1)},{merge:!0}),console.log("📅 calendarClick incremented.")}catch(t){console.error("❌ Failed to track calendarClick:",t.message)}}async function x(t){const s=g==null?void 0:g();s&&s.classList.contains("half-open")&&q(),I(t);const p=e[t];if((p==null?void 0:p.type)==="form"){ee()?(await Je(p.id),setTimeout(()=>{var h;(h=document.querySelector("#custom-lead-form-mobile input, #custom-lead-form-mobile textarea"))==null||h.scrollIntoView({block:"center"})},0),Xe()):(await Ke(p.id,a),document.getElementById("lead-form").classList.add("active"),document.getElementById("chat-messages").style.display="none",document.getElementById("chat-input-container").style.display="none",document.getElementById("preset-bubbles").style.display="none");return}if((p==null?void 0:p.type)==="calendar"){const h=j(A,"businesses",w,"calendars",p.id),k=await K(h),S=k.exists()?k.data().url:null;if(!(S!=null&&S.startsWith("http"))){const Y=document.getElementById("calendar-view");Y.innerHTML="<p style='color: red;'>⚠️ No calendar link found.</p>";return}if(ee()){Ze(S),l();return}document.getElementById("lead-form").classList.remove("active"),document.getElementById("chat-messages").style.display="none",document.getElementById("chat-input-container").style.display="none",document.getElementById("preset-bubbles").style.display="none";const M=document.getElementById("calendar-view");M.innerHTML="",M.classList.add("active");const E=document.createElement("iframe");E.src=S.includes("?")?S+"&embed=1":S+"?embed=1",E.style.width="100%",E.style.height="100%",E.style.border="none",E.style.borderRadius="12px",E.setAttribute("allow","payment"),l();const y=document.createElement("div");y.textContent="← Back",y.style.padding="6px 12px",y.style.fontSize="13px",y.style.fontWeight="500",y.style.borderRadius="9999px",y.style.border=`1px solid ${a.color||"#2c3e50"}`,y.style.background="white",y.style.color=a.color||"#2c3e50",y.style.cursor="pointer",y.style.transition="all 0.2s ease",y.addEventListener("mouseenter",function(){y.style.background=a.color||"#2c3e50",y.style.color=r}),y.addEventListener("mouseleave",function(){y.style.background="white",y.style.color=a.color||"#2c3e50"}),y.addEventListener("click",()=>{M.classList.remove("active"),document.getElementById("chat-messages").style.display="block",document.getElementById("chat-input-container").style.display="flex",document.getElementById("preset-bubbles").style.display="flex"});const B=document.createElement("div");B.style.display="flex",B.style.justifyContent="center",B.style.alignItems="center",B.style.gap="8px",B.style.marginTop="12px",B.appendChild(y),M.appendChild(E),M.appendChild(B);return}}function T(t){var p;const s=g==null?void 0:g();if(s&&s.classList.contains("half-open")&&q(),I(t),t==="contact"){const h=a.phone?Fe(a.phone):"N/A",k=a.email||"N/A",S=`
      Phone: ${h}<br>
      Email: <a href="mailto:${k}" style="color:${a.color||"#007bff"}; text-decoration:underline; display:inline-block; transition:all 0.2s ease;"
        onmouseover="this.style.transform='scale(1.05)'; this.style.color='#004080';"
        onmouseout="this.style.transform='scale(1)'; this.style.color='${a.color||"#007bff"}';"
      >${k}</a>
    `;U(S)}if(t==="about"){const h=((p=a.aboutMessage)==null?void 0:p.trim())||"We're a trusted local business that takes pride in great service.";U(`About Us:
${h}`);return}if(t==="reviews"){const h=a.reviewsLink||"https://www.google.com";U(`Google Reviews: <a href="${h}" target="_blank"
      style="
        color: ${a.color||"#007bff"};
        text-decoration: underline;
        display: inline-block;
        transition: transform 0.2s ease, color 0.2s ease;
      "
      onmouseover="this.style.transform='scale(1.05)'; this.style.color='#004080';"
      onmouseout="this.style.transform='scale(1)'; this.style.color='${a.color||"#007bff"}';"
    >${h}</a>`)}if(t==="areas"){const h=a.areas||"our local region.";U(`We serve: ${h}`)}}function b(){const t=document.querySelector("#homebase-agent #preset-bubbles");if(!t)return;t.innerHTML="";const s=e&&Object.keys(e).length>0,p=Array.isArray(a.selectedBubbles)&&a.selectedBubbles.length>0;if(!s&&!p){t.innerHTML="<p style='color: #777;'>No chat buttons yet.</p>";return}Object.entries(e).forEach(([h])=>{const k=document.createElement("button");k.className="preset-btn",k.textContent=h.charAt(0).toUpperCase()+h.slice(1),k.dataset.id=h,k.addEventListener("click",()=>x(h)),t.appendChild(k)}),L()}function L(){const t=a.selectedBubbles||[],s=document.getElementById("preset-bubbles"),p={contact:"Contact Info",about:"About Us",reviews:"Google Reviews",areas:"Areas We Serve"};t.forEach(h=>{if(["contact","about","reviews","areas"].includes(h)){const k=document.createElement("button");k.className="preset-btn",k.textContent=p[h],k.onclick=()=>T(h),s.appendChild(k)}})}const R=document.getElementById("agent-preview-container");R?R.appendChild(d):document.body.appendChild(d),requestAnimationFrame(()=>{d.style.opacity=1}),await o(),setTimeout(()=>{const t=document.getElementById("chat-box");if(!t){console.warn("⚠️ chat-box not found. Skipping greeting.");return}a.greetingEnabled&&a.greeting&&!ee()&&($e(),t.classList.remove("fade-down"),t.classList.remove("auto-open"),t.offsetWidth,t.classList.add("auto-open"),t.addEventListener("animationend",()=>{t.classList.remove("auto-open")},{once:!0}),C("bot",a.greeting))},2e3);const g=()=>document.getElementById("chat-box"),$=()=>document.querySelector("#homebase-agent #chat-backdrop"),V=()=>document.querySelector("#homebase-agent .chat-close"),Q=()=>document.querySelector("#homebase-agent #chat-input");function Se(){const t=g();return t?Array.from(t.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(s=>!s.hasAttribute("disabled")&&!s.getAttribute("aria-hidden")):[]}function H(t){if(t.key!=="Tab")return;const s=Se();if(s.length===0)return;const p=s[0],h=s[s.length-1];t.shiftKey&&document.activeElement===p?(t.preventDefault(),h.focus()):!t.shiftKey&&document.activeElement===h&&(t.preventDefault(),p.focus())}function Ae(){const t=g(),s=$();!t||!s||(d.classList.add("chat-open"),t.classList.add("auto-open"),t.classList.add("fade-down"),t.classList.remove("hidden"),t.offsetHeight,t.classList.remove("fade-down"),F(d),setTimeout(()=>{(Q()||V()||t).focus()},0),document.addEventListener("keydown",_,{passive:!0}),t.addEventListener("keydown",H))}function N(){const t=g();if(!t)return;document.removeEventListener("keydown",_),t.removeEventListener("keydown",H);const s=getComputedStyle(t).height;t.style.height=s,t.classList.add("fade-down"),setTimeout(()=>{d.classList.remove("chat-open"),t.classList.add("hidden"),t.classList.remove("fade-down"),t.classList.remove("auto-open","half-open"),t.style.height=""},400)}function $e(){const t=g(),s=$();!t||!s||(d.classList.add("chat-open"),t.classList.remove("hidden","fade-down","auto-open"),t.classList.add("half-open"),F(d),setTimeout(()=>{(Q()||V()||t).focus()},0),document.addEventListener("keydown",_,{passive:!0}),t.addEventListener("keydown",H))}function q(){const t=g(),s=$();!t||!s||(d.classList.add("chat-open"),t.classList.remove("hidden","fade-down","half-open"),t.classList.add("auto-open"),F(d),setTimeout(()=>{(Q()||V()||t).focus()},0),document.addEventListener("keydown",_,{passive:!0}),t.addEventListener("keydown",H))}function _(t){t.key==="Escape"&&N()}document.getElementById("chat-button").addEventListener("click",()=>{const t=g();t&&(t.classList.contains("hidden")?Ae():N())}),(ue=V())==null||ue.addEventListener("click",()=>{G(),ae(),N()}),(()=>{const t=V();if(!t)return;let s=0;t.addEventListener("mousedown",p=>{s=window.scrollY||document.documentElement.scrollTop||0,p.preventDefault()},{passive:!1}),t.addEventListener("click",p=>{p.preventDefault(),p.stopPropagation(),G(),ae(),N(),requestAnimationFrame(()=>window.scrollTo(0,s))})})(),(()=>{if(!(typeof window<"u"&&matchMedia("(max-width: 768px)").matches))return;let s=!0;const p=(E,y)=>{try{const B=E==null?void 0:E();if(B)return B}catch{}return document.querySelector(y)},h=p(typeof openButtonEl=="function"?openButtonEl:null,"[data-chat-launcher], .chat-launcher, #chat-launcher, .barnegon-chat-bubble"),k=p(typeof V=="function"?V:null,".chat-close, [data-chat-close]"),S=()=>{if(!s)return;s=!1;const E=window.scrollY||document.documentElement.scrollTop||0;let y=!0;const B=()=>{y&&Math.abs((window.scrollY||document.documentElement.scrollTop)-E)>1&&window.scrollTo(0,E)},Y=()=>{B(),y&&requestAnimationFrame(Y)};requestAnimationFrame(Y);const ve=()=>B();window.addEventListener("scroll",ve,{passive:!0}),setTimeout(()=>{y=!1,window.removeEventListener("scroll",ve)},320)},M=E=>{if(!E)return;const y=()=>S();E.addEventListener("touchstart",y,{passive:!0,once:!0}),E.addEventListener("mousedown",y,{passive:!0,once:!0})};M(h),M(k)})(),(fe=V())==null||fe.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),N())}),(he=$())==null||he.addEventListener("click",N),(be=document.getElementById("lfo-back"))==null||be.addEventListener("click",()=>{G()}),(ge=document.getElementById("co-back"))==null||ge.addEventListener("click",()=>{ae()}),(ye=document.querySelector("#lead-form-overlay .lfo-header"))==null||ye.addEventListener("click",()=>{document.activeElement&&/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)&&document.activeElement.blur()}),(xe=document.getElementById("lfo-content"))==null||xe.addEventListener("click",t=>{var h;const s=t.target;!((h=s.closest)==null?void 0:h.call(s,"input, textarea, label, [role='textbox']"))&&document.activeElement&&/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)&&document.activeElement.blur()},{passive:!0}),document.getElementById("send-button").addEventListener("click",()=>{const t=g==null?void 0:g();t&&t.classList.contains("half-open")&&q(),Ee(a)}),document.getElementById("chat-input").addEventListener("keypress",t=>{if(t.key==="Enter"){const s=g==null?void 0:g();s&&s.classList.contains("half-open")&&q(),Ee(a)}}),document.getElementById("lead-submit").addEventListener("click",async t=>{var p;if(t.preventDefault(),(((p=document.getElementById("hp_middle"))==null?void 0:p.value)||"").trim()){console.info("Lead dropped (honeypot, desktop)");return}try{await Ie(document.getElementById("custom-lead-form"),a),document.getElementById("lead-form").classList.remove("active"),document.getElementById("chat-messages").style.display="block",document.getElementById("chat-input-container").style.display="flex",document.getElementById("preset-bubbles").style.display="flex",document.getElementById("chat-messages").innerHTML="",C("bot","Thanks for your info! We'll follow up with you shortly.")}catch{}}),document.getElementById("lead-submit-mobile").addEventListener("click",async t=>{var p;if(t.preventDefault(),(((p=document.getElementById("hp_middle_mobile"))==null?void 0:p.value)||"").trim()){console.info("Lead dropped (honeypot, mobile)");return}try{await Ie(document.getElementById("custom-lead-form-mobile"),a),G(),C("bot","Thanks for your info! We'll follow up with you shortly.")}catch{}});const ce=document.getElementById("start-lead");ce&&ce.addEventListener("click",()=>{leadState={inProgress:!0,step:0,responses:{}},C("bot","Awesome! What’s your name?")});function Fe(t){try{return libphonenumber.parsePhoneNumber(t).formatInternational()}catch{return t}}})();

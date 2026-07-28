export function injectStyles(biz) {
    const textColor = biz.textColor || "#ffffff";
    const neonGlow = biz.neonGlow === true;
    const chatBg   = biz.chatBg || "#fafafa";
    const chatFont = (biz?.chatFont || "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif").trim();
  
    (function maybeLoadGoogleFont() {
      const googleFamilies = ["Inter", "Poppins", "Rubik", "Nunito"];
      const chosen = googleFamilies.find(f => chatFont.startsWith(f));
      if (!chosen) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(chosen)}:wght@400;600;700&display=swap`;
      document.head.appendChild(link);
    })();
  
    const style = document.createElement("style");
    
    style.textContent = `
      #homebase-agent #chat-button {
      position: fixed;
      bottom: calc(24px + env(safe-area-inset-bottom));
      right: calc(24px + env(safe-area-inset-right));
      background: ${biz.color || '#00d4ab'};
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
      ${neonGlow ? `box-shadow: 0 0 12px ${biz.color || '#2c3e50'}, 0 10px 24px rgba(0,0,0,0.25);` : ``}
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
      border: 3px solid ${biz.color || '#2c3e50'};
        border-radius: 24px;
        backdrop-filter: blur(24px);
        ${neonGlow
          ? `box-shadow:
               0 0 18px ${biz.color || '#2c3e50'},
               0 0 40px ${biz.color || '#2c3e50'}80,
               0 12px 50px rgba(0,0,0,0.35);`
          : `box-shadow:
               0 20px 50px rgba(0, 0, 0, 0.2);`}
        display: flex;
        flex-direction: column;
        font-family: ${chatFont};
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
      background: ${biz.color || '#4f46e5'};
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
        ${biz.color || '#4f46e5'} 0%,
        ${biz.color || '#4f46e5'}cc 40%,   /* slightly lighter */
        ${biz.color || '#4f46e5'} 80%
      );
      background-size: 200% 200%;
      animation: barnegonWaveShift 40s ease-in-out infinite alternate;
      z-index: 0;
    }
    
    /* Title text — always readable with plate */
    #homebase-agent #chat-business-name {
      position: relative;
      color: ${textColor} !important;
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
      color: ${textColor};
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
      background: ${chatBg};
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
      background: ${biz.color || '#4f46e5'};
      color: #fff;
      border-color: ${biz.color || '#4f46e5'};
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
          ${chatBg};
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
      background: linear-gradient(145deg, ${biz.color || '#00d4ab'}, ${biz.textColor || '#1f2f3f'});
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
        background: ${chatBg};
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
        border-color: ${biz.color || "#2c3e50"};
        box-shadow: 0 0 0 2px ${biz.color || "#2c3e50"}33;
      }
    
    
      #homebase-agent #send-button {
      display: inline-flex;     /* ⬅️ auto-size button content, don’t stretch */
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;           /* stay beside input */
        width: auto !important;   /* ⬅️ override any past mobile full-width */
        white-space: nowrap;
      background-color: ${biz.color || '#2c3e50'};
      color: ${textColor};
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
      background-color: ${biz.color || '#2c3e50'};
      color: ${textColor};
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
      accent-color: ${biz.color || '#2c3e50'};
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
      border-color: ${biz.color || '#2c3e50'};
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
      scrollbar-color: ${biz.color || '#2c3e50'} #f3f4f6;
    }
    
    #homebase-agent *::-webkit-scrollbar {
      width: 8px;
    }
    
    #homebase-agent *::-webkit-scrollbar-track {
      background: #f3f4f6;
      border-radius: 8px;
    }
    
    #homebase-agent *::-webkit-scrollbar-thumb {
      background: ${biz.color || '#2c3e50'};
      border-radius: 8px;
      border: 2px solid white;
    }
    
    #homebase-agent *::-webkit-scrollbar-thumb:hover {
      background: ${biz.textColor || biz.color || '#1f2f3f'};
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
      background: ${biz.color || '#4f46e5'};
      color: ${textColor};
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
      color: ${textColor};
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
      background: ${biz.color || '#2c3e50'};
      color: ${textColor};
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
      background: ${biz.color || '#4f46e5'};
      color: ${textColor};
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
      color: ${textColor};
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
    
    `;
  
    document.head.appendChild(style);
  }
  
  export function getAgentHTML(biz) {
    const textColor = biz.textColor || "#ffffff";
    
    return `
      <div id="chat-button">
      <svg xmlns="http://www.w3.org/2000/svg"
           fill="${textColor || '#ffffff'}"
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
          <div id="chat-business-name" style="color: ${textColor};">
            ${biz.name || "Live Agent"}
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
          <div class="lfo-title">${biz.name || "Live Agent"}</div>
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
          <div class="co-title">${biz.name || "Live Agent"}</div>
          <div style="width:44px" aria-hidden="true"></div>
        </div>
        <div id="co-content"><!-- iframe injected here --></div>
        <div class="co-actions"><!-- reserved (e.g., “Done”) --></div>
      </div>
    
    `;
  }
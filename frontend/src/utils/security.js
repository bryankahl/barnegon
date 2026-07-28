let turnstileWidgetId = null;
let currentToken = null;
let tokenTimestamp = 0;
let tokenResolvers = []; 

export function loadTurnstile(siteKey) {
  return new Promise((resolve, reject) => {
    if (document.getElementById('turnstile-script')) return resolve();

    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      const widgetDiv = document.createElement('div');
      widgetDiv.id = 'barnegon-turnstile-widget';
      widgetDiv.style.display = 'none';
      document.body.appendChild(widgetDiv);

      turnstileWidgetId = turnstile.render('#barnegon-turnstile-widget', {
        sitekey: siteKey,
        callback: function(token) {
          if (tokenResolvers.length > 0) {
            // Resolve the oldest waiting request with the fresh token
            const resolveFn = tokenResolvers.shift();
            resolveFn(token);
            
            // If there are STILL requests waiting (e.g., rapid double-clicks),
            // trigger another reset to get a unique token for the next one.
            if (tokenResolvers.length > 0) {
              turnstile.reset(turnstileWidgetId);
            }
          } else {
            // Cache the token and record EXACTLY when it was generated
            currentToken = token;
            tokenTimestamp = Date.now();
          }
        },
        'error-callback': function(error) {
          console.error("Turnstile error:", error);
          // Prevent the UI from hanging infinitely if CF goes down
          while(tokenResolvers.length > 0) {
             tokenResolvers.shift()(null); 
          }
        }
      });
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
}

export function requestSecurityToken() {
  return new Promise((resolve) => {
    // Cloudflare tokens die at 5 minutes. We consider it stale at 4 minutes (240,000ms).
    const isFresh = currentToken !== null && (Date.now() - tokenTimestamp < 240000);

    if (isFresh) {
      const t = currentToken;
      currentToken = null; 
      turnstile.reset(turnstileWidgetId); 
      resolve(t);
    } else {
      // The token is expired (or missing). Add this request to the queue.
      tokenResolvers.push(resolve);
      
      // If this is the only thing in the queue, trigger a fresh token generation.
      if (tokenResolvers.length === 1) {
        turnstile.reset(turnstileWidgetId);
      }
    }
  });
}
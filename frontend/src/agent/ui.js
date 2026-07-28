export const isMobile = () => window.matchMedia("(max-width: 500px)").matches;

export function setAgentRealVh(rootEl) {
  const vv = window.visualViewport;
  const h = vv ? Math.round(vv.height) : window.innerHeight;
  rootEl.style.setProperty('--agent-real-vh', h + 'px');

  let bottomInset = 0;
  if (vv) {
    bottomInset = Math.max(0, Math.round((window.innerHeight - vv.height - vv.offsetTop)));
  }
  rootEl.style.setProperty('--agent-vv-bottom', bottomInset + 'px');
}

export function bindViewportListeners(rootEl) {
  const update = () => setAgentRealVh(rootEl);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
  }
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
}
// Helper to safely navigate using wouter's setLocation without spamming the History API
let lastNavTs = 0;
const NAV_THROTTLE_MS = 500; // ignore navigations within 500ms

export function safeNavigate(setLocation: (path: string) => void, path: string) {
  try {
    const now = Date.now();
    if (now - lastNavTs < NAV_THROTTLE_MS) return;
    lastNavTs = now;
    setLocation(path);
  } catch (e) {
    // Some environments can throw (sandboxed iframes / insecure operation). Swallow and log.
    console.warn('safeNavigate failed:', e);
  }
}

export function resetNavigationThrottle() {
  lastNavTs = 0;
}

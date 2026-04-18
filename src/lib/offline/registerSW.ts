// Service worker registration guarded against Lovable's preview iframe.
// PWA features only activate in the published/standalone app.

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname === "localhost");

export const registerServiceWorker = async (): Promise<void> => {
  if (typeof window === "undefined") return;

  if (isInIframe || isPreviewHost) {
    // Unregister any leftover SWs that might serve stale content in preview
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
      regs.forEach((r) => r.unregister().catch(() => {}));
    }
    return;
  }

  // Dynamic import so the virtual module isn't pulled into preview builds
  try {
    const mod = await import("virtual:pwa-register");
    mod.registerSW({ immediate: true });
  } catch {
    // virtual module unavailable in dev — ignore
  }
};

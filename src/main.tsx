import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (typeof window !== "undefined") {
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com");

  const defer =
    "requestIdleCallback" in window
      ? window.requestIdleCallback.bind(window)
      : (cb: IdleRequestCallback) => window.setTimeout(() => cb({
          didTimeout: false,
          timeRemaining: () => 0,
        } as IdleDeadline), 1);

  defer(() => {
    import("@/lib/sentry")
      .then(({ initSentry }) => initSentry())
      .catch(() => {});

    if (!isPreviewHost) {
      import("@/lib/offline/sync")
        .then(({ installSyncEngine }) => installSyncEngine())
        .catch(() => {});
      import("@/lib/offline/registerSW")
        .then(({ registerServiceWorker }) => registerServiceWorker())
        .catch(() => {});
    }
  });
}


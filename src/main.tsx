import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installSyncEngine } from "@/lib/offline/sync";
import { registerServiceWorker } from "@/lib/offline/registerSW";

// Boot offline sync (safe in all envs — uses IndexedDB only)
installSyncEngine();

// Register PWA service worker (no-op in preview iframe / localhost)
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

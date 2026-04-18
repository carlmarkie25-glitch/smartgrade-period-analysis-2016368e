import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "lumini:install-prompt-dismissed";
const DISMISS_DAYS = 14;

/**
 * Global, dismissible PWA install prompt.
 * - Listens for `beforeinstallprompt` (Chrome/Edge/Android).
 * - Hides if the app is already in standalone mode or recently dismissed.
 * - Stays out of the way on desktop (only renders on viewports < 768px).
 */
export const PWAInstallPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed → skip
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((window.navigator as any).standalone) return;

    // Recently dismissed → skip
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (days < DISMISS_DAYS) return;
      }
    } catch {}

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  if (!visible || !deferred) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-card border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Download className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Install Lumini</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add to home screen for offline access and a faster, app-like experience.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleInstall} className="gap-1.5">
              <Download className="size-3.5" /> Install
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

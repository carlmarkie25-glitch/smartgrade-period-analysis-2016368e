import { useEffect, useState } from "react";
import { Smartphone, Download, Wifi, CheckCircle2, Apple, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10">
            <Smartphone className="size-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Install Lumini on your phone</h1>
          <p className="text-muted-foreground">
            Get a native-app feel, work offline, and skip the browser bar.
          </p>
        </div>

        {installed ? (
          <Card className="p-6 flex items-center gap-4 border-primary/30 bg-primary/5">
            <CheckCircle2 className="size-8 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">Lumini is installed</h3>
              <p className="text-sm text-muted-foreground">
                You can launch it from your home screen anytime.
              </p>
            </div>
          </Card>
        ) : deferred ? (
          <Card className="p-6 text-center space-y-4">
            <h3 className="font-semibold">Ready to install</h3>
            <Button size="lg" onClick={handleInstall} className="gap-2">
              <Download className="size-4" /> Install Lumini
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <Apple className="size-5" /> iPhone / iPad
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open this page in <strong>Safari</strong></li>
                <li>Tap the <strong>Share</strong> button</li>
                <li>Choose <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong></li>
              </ol>
            </Card>
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <Chrome className="size-5" /> Android
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open this page in <strong>Chrome</strong></li>
                <li>Tap the <strong>⋮ menu</strong></li>
                <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
                <li>Confirm</li>
              </ol>
            </Card>
          </div>
        )}

        <Card className="p-5 flex items-start gap-3 bg-muted/40">
          <Wifi className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>Works offline.</strong> Once installed and signed in, attendance,
            grades, and your roster stay available without internet. Changes sync
            automatically when you reconnect.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Install;

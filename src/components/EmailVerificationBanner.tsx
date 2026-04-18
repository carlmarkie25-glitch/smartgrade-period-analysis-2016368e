import { useState } from "react";
import { MailWarning, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show when authenticated AND email not verified
  if (!user || !user.email || dismissed) return null;
  if (user.email_confirmed_at || (user as any).confirmed_at) return null;

  const handleResend = async () => {
    if (!user.email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSending(false);
    if (error) {
      toast.error("Could not send verification email", { description: error.message });
    } else {
      toast.success("Verification email sent", { description: `Check ${user.email}` });
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 flex items-center gap-3 text-sm">
      <MailWarning className="h-4 w-4 shrink-0" />
      <div className="flex-1">
        <span className="font-medium">Verify your email</span>{" "}
        <span className="text-amber-800/80 dark:text-amber-200/80">
          We sent a link to <span className="font-mono">{user.email}</span>. Some features may be limited until you confirm.
        </span>
      </div>
      <Button size="sm" variant="outline" onClick={handleResend} disabled={sending} className="h-7 border-amber-500/40">
        {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Resend"}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

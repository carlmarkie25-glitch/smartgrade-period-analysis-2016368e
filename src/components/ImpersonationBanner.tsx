import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { impersonation } from "@/lib/impersonation";

export const ImpersonationBanner = () => {
  const [active, setActive] = useState(impersonation.get());
  const navigate = useNavigate();

  useEffect(() => {
    const onChange = () => setActive(impersonation.get());
    window.addEventListener("impersonation-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("impersonation-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (!active) return null;
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm text-amber-950 dark:text-amber-100">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          Viewing as <strong>{active.name || active.id.slice(0, 8)}</strong> — read-only
          impersonation. Mutations may bypass RLS as super admin; act with care.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1"
        onClick={() => {
          impersonation.clear();
          navigate("/super-admin");
        }}
      >
        <X className="h-3 w-3" /> Exit
      </Button>
    </div>
  );
};

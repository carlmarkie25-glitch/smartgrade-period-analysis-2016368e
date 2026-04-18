import { CloudOff, Cloud, RefreshCw, CloudUpload } from "lucide-react";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const SyncStatusIndicator = () => {
  const { online, syncing, pendingOps, lastSyncAt, lastError, syncNow } = useSyncStatus();

  let icon = <Cloud className="size-4" />;
  let label = "Synced";
  let color = "text-emerald-600";

  if (!online) {
    icon = <CloudOff className="size-4" />;
    label = "Offline";
    color = "text-amber-600";
  } else if (syncing) {
    icon = <RefreshCw className="size-4 animate-spin" />;
    label = "Syncing…";
    color = "text-sky-600";
  } else if (pendingOps > 0) {
    icon = <CloudUpload className="size-4" />;
    label = `${pendingOps} pending`;
    color = "text-amber-600";
  } else if (lastError) {
    label = "Sync error";
    color = "text-destructive";
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => syncNow()}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium hover:bg-muted/60 transition-colors",
            color,
          )}
          aria-label={label}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-0.5">
          <div>Status: {online ? "Online" : "Offline"}</div>
          <div>Pending: {pendingOps}</div>
          {lastSyncAt && <div>Last sync: {new Date(lastSyncAt).toLocaleTimeString()}</div>}
          {lastError && <div className="text-destructive">{lastError}</div>}
          <div className="opacity-60 pt-1">Click to sync now</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

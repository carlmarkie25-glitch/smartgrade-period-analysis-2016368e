import { useEffect, useState } from "react";
import { getSyncState, subscribeSync, syncNow, SyncState } from "@/lib/offline/sync";

export const useSyncStatus = () => {
  const [state, setState] = useState<SyncState>(getSyncState());

  useEffect(() => {
    return subscribeSync(setState);
  }, []);

  return {
    ...state,
    syncNow,
  };
};

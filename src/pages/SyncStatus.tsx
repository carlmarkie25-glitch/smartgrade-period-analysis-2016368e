import AppShell from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { offlineDB, SYNCED_TABLES } from "@/lib/offline/db";
import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, Trash2, AlertTriangle, CheckCircle2, RotateCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface OutboxRow {
  id?: number;
  table: string;
  op: string;
  client_ts: number;
  attempts: number;
  last_error?: string | null;
  payload: any;
}

interface TableMeta {
  table: string;
  cachedRows: number;
  lastPull: string | null;
}

const SyncStatusPage = () => {
  const { online, syncing, pendingOps, lastSyncAt, lastError, syncNow } = useSyncStatus();
  const { toast } = useToast();
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [tableMeta, setTableMeta] = useState<TableMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const ob = await offlineDB.outbox.orderBy("client_ts").toArray();
    setOutbox(ob as OutboxRow[]);

    const meta: TableMeta[] = [];
    for (const t of SYNCED_TABLES) {
      const count = await (offlineDB as any)[t].count();
      const m = await offlineDB.meta.get(`lastPull:${t}`);
      meta.push({ table: t, cachedRows: count, lastPull: m?.value ?? null });
    }
    setTableMeta(meta);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 3000);
    return () => clearInterval(i);
  }, [pendingOps, syncing, lastSyncAt]);

  const handleSync = async () => {
    await syncNow();
    refresh();
  };

  const handleClearEntry = async (id: number) => {
    await offlineDB.outbox.delete(id);
    refresh();
    toast({ title: "Removed pending change" });
  };

  const handleClearAll = async () => {
    if (!confirm("Discard all pending offline changes? This cannot be undone.")) return;
    await offlineDB.outbox.clear();
    refresh();
    toast({ title: "Outbox cleared" });
  };

  const handleRetryEntry = async (id: number) => {
    // Reset attempts so the sync engine doesn't keep deferring
    await offlineDB.outbox.update(id, { attempts: 0, last_error: null });
    await syncNow();
    refresh();
    toast({ title: "Retrying change…" });
  };

  const conflicts = outbox.filter((r) => r.attempts >= 3 || (r.last_error && r.attempts > 0));
  const totalCached = tableMeta.reduce((s, m) => s + m.cachedRows, 0);

  return (
    <AppShell activeTab="dashboard">
      <div className="py-4 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sync Status</h1>
            <p className="text-sm text-muted-foreground">
              Offline cache, pending changes, and sync activity.
            </p>
          </div>
          <Button onClick={handleSync} disabled={!online || syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
        </div>

        {/* Status cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Connection</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                {online ? (
                  <><Cloud className="h-5 w-5 text-emerald-600" /> Online</>
                ) : (
                  <><CloudOff className="h-5 w-5 text-amber-600" /> Offline</>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending changes</CardDescription>
              <CardTitle className="text-xl">{pendingOps}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cached rows</CardDescription>
              <CardTitle className="text-xl">{totalCached.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last sync</CardDescription>
              <CardTitle className="text-xl">
                {lastSyncAt ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true }) : "Never"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {lastError && (
          <Card className="border-destructive/50">
            <CardContent className="py-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Last sync error</div>
                <div className="text-muted-foreground">{lastError}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conflicts (failed entries) */}
        {conflicts.length > 0 && (
          <Card className="border-destructive/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Sync conflicts ({conflicts.length})
              </CardTitle>
              <CardDescription>
                These changes failed after multiple attempts. Retry once the issue is resolved, or discard to drop them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {conflicts.map((c) => (
                <div
                  key={`conflict-${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">{c.table}</Badge>
                      <Badge variant="outline">{c.op}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.client_ts), "MMM d, HH:mm")}
                      </span>
                      <span className="text-xs text-amber-600">{c.attempts} attempts</span>
                    </div>
                    <div className="text-xs text-destructive mt-1 truncate">{c.last_error}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => c.id && handleRetryEntry(c.id)}
                      disabled={!online || syncing}
                    >
                      <RotateCw className="h-3.5 w-3.5 mr-1" /> Retry
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => c.id && handleClearEntry(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-lg">Pending changes ({outbox.length})</CardTitle>
              <CardDescription>
                Edits queued while offline. They are sent in order on the next sync.
              </CardDescription>
            </div>
            {outbox.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-1" /> Discard all
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : outbox.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Everything is up to date.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queued</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outbox.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(row.client_ts), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.table}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.op}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.attempts > 0 ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                            {row.attempts}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-xs truncate">
                        {row.last_error ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {row.attempts > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => row.id && handleRetryEntry(row.id)}
                              disabled={!online || syncing}
                              title="Retry"
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => row.id && handleClearEntry(row.id)}
                            title="Discard"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Cached tables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cached tables</CardTitle>
            <CardDescription>
              Rows available offline and the cursor used for incremental pulls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead className="text-right">Cached rows</TableHead>
                  <TableHead>Last pull</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableMeta.map((m) => (
                  <TableRow key={m.table}>
                    <TableCell className="font-mono text-xs">{m.table}</TableCell>
                    <TableCell className="text-right">{m.cachedRows.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.lastPull ? format(new Date(m.lastPull), "MMM d, yyyy HH:mm:ss") : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default SyncStatusPage;

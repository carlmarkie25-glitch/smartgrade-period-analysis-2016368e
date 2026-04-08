import AppShell from "@/components/AppShell";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, Calendar, UserPlus, Megaphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const typeIcons: Record<string, any> = {
  calendar: Calendar,
  student_added: UserPlus,
  announcement: Megaphone,
  general: Info,
};

const Notifications = () => {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <AppShell activeTab="notifications">
      <div className="py-4">
        <div className="neu-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="neu-card p-8 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="neu-card p-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcons[n.type] || Info;
              return (
                <div
                  key={n.id}
                  className={`neu-card p-4 flex items-start gap-4 cursor-pointer transition-all ${
                    !n.is_read ? "border-l-4 border-l-primary" : "opacity-75"
                  }`}
                  onClick={() => {
                    if (!n.is_read) markAsRead.mutate(n.id);
                  }}
                >
                  <div className={`p-2 rounded-xl ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-5 w-5 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-semibold truncate ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </h3>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(new Date(n.created_at), "MMM dd, yyyy · h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                        {n.target_role === "all" ? "Everyone" : n.target_role}
                      </span>
                      {!n.is_read && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">New</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Notifications;

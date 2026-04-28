import { useState, useEffect } from "react";
import { Bell, Check, AlertTriangle, Info, Shield, RefreshCw } from "lucide-react";

type NType = "alert" | "system" | "info";

const typeStyles: Record<NType, { icon: typeof Bell; color: string }> = {
  alert: { icon: AlertTriangle, color: "text-risk-high" },
  system: { icon: Shield, color: "text-primary" },
  info: { icon: Info, color: "text-glow-cyan" },
};

const severityClass: Record<string, string> = {
  Critical: "risk-critical",
  High: "risk-high",
  Medium: "risk-medium",
  Low: "risk-low",
  Info: "bg-primary/10 text-primary border-primary/20",
};

interface Notification {
  id: number;
  type: NType;
  title: string;
  time: string;
  severity: string;
  read: boolean;
  location?: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const raw: Notification[] = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: (n.type as NType) || "alert",
          title: n.title,
          time: n.time,
          severity: n.severity || "Medium",
          read: false,
          location: n.location || "",
        }));
        setNotifications(raw);
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
      setLastFetched(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-heading font-semibold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">{unreadCount} new</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
          <span className="text-xs text-muted-foreground">{lastFetched && `Updated ${lastFetched}`}</span>
          <button
            onClick={fetchNotifications}
            className="p-1.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              <Check className="h-3 w-3" />Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="glass-card divide-y divide-border">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No notifications yet. Alerts sent via the system will appear here.
          </div>
        ) : (
          notifications.map((n) => {
            const TypeIcon = typeStyles[n.type]?.icon || AlertTriangle;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
              >
                <TypeIcon className={`h-4 w-4 mt-0.5 shrink-0 ${typeStyles[n.type]?.color || "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {n.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{n.time}</span>
                    {n.location && <span className="text-xs text-muted-foreground">• {n.location}</span>}
                    <span className={`risk-badge text-[10px] ${severityClass[n.severity] || "risk-medium"}`}>
                      {n.severity}
                    </span>
                  </div>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Alert Preferences */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold text-foreground">Alert Preferences</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {["Flood Alerts", "Cyclone Alerts", "Wildfire Alerts", "Earthquake Alerts", "System Updates", "Weekly Reports"].map((pref) => (
            <label key={pref} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <span className="text-sm text-foreground">{pref}</span>
              <div className="w-9 h-5 rounded-full bg-primary/30 relative cursor-pointer">
                <div className="absolute top-0.5 left-4 w-4 h-4 rounded-full bg-primary transition-all" />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

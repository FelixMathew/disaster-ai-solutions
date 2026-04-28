type Severity = "Critical" | "High" | "Medium" | "Low";

const severityClass: Record<Severity, string> = {
  Critical: "risk-critical",
  High: "risk-high",
  Medium: "risk-medium",
  Low: "risk-low",
};

const alerts = [
  { id: 1, title: "Flood warning — Mumbai coastal region", severity: "Critical" as Severity, time: "2 min ago" },
  { id: 2, title: "Cyclone approach detected — Bay of Bengal", severity: "High" as Severity, time: "15 min ago" },
  { id: 3, title: "Wildfire risk elevated — Uttarakhand", severity: "Medium" as Severity, time: "1 hr ago" },
  { id: 4, title: "Seismic activity — Himalayan fault line", severity: "Low" as Severity, time: "3 hr ago" },
  { id: 5, title: "Flash flood potential — Kerala backwaters", severity: "High" as Severity, time: "4 hr ago" },
];

const AlertsFeed = () => (
  <div className="glass-card p-5">
    <h3 className="font-heading font-semibold text-foreground mb-4">Recent Alerts</h3>
    <div className="space-y-3">
      {alerts.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/20 transition-colors"
        >
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-sm text-foreground truncate">{a.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
          </div>
          <span className={`risk-badge ${severityClass[a.severity]} shrink-0`}>{a.severity}</span>
        </div>
      ))}
    </div>
  </div>
);

export default AlertsFeed;

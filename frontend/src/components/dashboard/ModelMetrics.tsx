const metrics = [
  { label: "Accuracy", value: 94.7, color: "from-primary to-glow-cyan" },
  { label: "Precision", value: 91.2, color: "from-primary to-glow-cyan" },
  { label: "Recall", value: 89.8, color: "from-primary to-glow-cyan" },
  { label: "F1 Score", value: 90.5, color: "from-primary to-glow-cyan" },
];

const ModelMetrics = () => (
  <div className="glass-card p-5">
    <h3 className="font-heading font-semibold text-foreground mb-4">Model Performance</h3>
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((m) => (
        <div key={m.label}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">{m.label}</span>
            <span className="text-foreground font-medium">{m.value}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${m.color} rounded-full`}
              style={{ width: `${m.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ModelMetrics;

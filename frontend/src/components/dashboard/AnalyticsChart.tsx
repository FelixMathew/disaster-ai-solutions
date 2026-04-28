const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const data = [
  { floods: 45, cyclones: 20, wildfires: 30, earthquakes: 15 },
  { floods: 52, cyclones: 35, wildfires: 25, earthquakes: 18 },
  { floods: 38, cyclones: 28, wildfires: 55, earthquakes: 12 },
  { floods: 65, cyclones: 42, wildfires: 48, earthquakes: 22 },
  { floods: 78, cyclones: 55, wildfires: 35, earthquakes: 16 },
  { floods: 60, cyclones: 38, wildfires: 42, earthquakes: 20 },
];

const maxVal = 80;

const colors = [
  { label: "Floods", class: "bg-primary" },
  { label: "Cyclones", class: "bg-glow-cyan" },
  { label: "Wildfires", class: "bg-risk-high" },
  { label: "Earthquakes", class: "bg-risk-medium" },
];

const AnalyticsChart = () => (
  <div className="glass-card p-5">
    <h3 className="font-heading font-semibold text-foreground mb-4">Prediction Analytics</h3>

    <div className="flex items-end gap-3 h-48">
      {months.map((m, i) => {
        const d = data[i];
        return (
          <div key={m} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 h-40 w-full">
              {[d.floods, d.cyclones, d.wildfires, d.earthquakes].map((v, j) => (
                <div
                  key={j}
                  className={`flex-1 rounded-t ${colors[j].class} opacity-80 hover:opacity-100 transition-opacity`}
                  style={{ height: `${(v / maxVal) * 100}%` }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{m}</span>
          </div>
        );
      })}
    </div>

    <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
      {colors.map((c) => (
        <span key={c.label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${c.class}`} />
          {c.label}
        </span>
      ))}
    </div>
  </div>
);

export default AnalyticsChart;

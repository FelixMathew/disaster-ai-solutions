import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, Brain, BarChart3, Activity, Download, RefreshCw } from "lucide-react";
import axios from "axios";

const timeRanges = ["7D", "30D", "90D", "1Y"] as const;
type TimeRange = typeof timeRanges[number];

const metricIcons = [TrendingUp, Brain, BarChart3, Activity];
const metricLabels = ["Accuracy", "Precision", "Recall", "F1 Score"];
const metricKeys = ["accuracy", "precision", "recall", "f1_score"];

const COLORS = ["#3b82f6", "#06b6d4", "#f97316", "#f59e0b"];

const AnalyticsPage = () => {
  const [range, setRange] = useState<TimeRange>("30D");
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [confidenceData, setConfidenceData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    accuracy: 94.7, precision: 91.8, recall: 89.5, f1_score: 90.6,
  });

  const fetchAnalytics = useCallback(async (r: TimeRange) => {
    setLoading(true);
    try {
      const [analyticsRes, forecastRes] = await Promise.all([
        axios.get(`/api/analytics?range=${r}`),
        axios.get("/api/forecast").catch(() => ({ data: { data: [] } })),
      ]);

      const d = analyticsRes.data;
      if (d.status === "success") {
        // Trend: use period as x-axis label
        const trend = (d.trend || []).map((t: any) => ({
          period: t.period,
          floods: t.floods || 0,
          cyclones: t.cyclones || 0,
          wildfires: t.wildfires || 0,
          earthquakes: t.earthquakes || 0,
        }));
        setTrendData(trend);

        // Confidence
        const conf = (d.confidence_trend || []).map((c: any) => ({
          period: c.period,
          confidence: c.confidence,
        }));
        setConfidenceData(conf);

        // Pie
        const pie = (d.pie || []).map((p: any) => ({
          name: p.name,
          value: p.value,
          color: p.color,
        }));
        setPieData(pie);

        // Metrics
        if (d.metrics) setMetrics(d.metrics);
      }

      setForecast(forecastRes.data.data || []);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  const exportCSV = () => {
    const header = "Period,Floods,Cyclones,Wildfires,Earthquakes\n";
    const rows = trendData.map((d) =>
      `${d.period},${d.floods},${d.cyclones},${d.wildfires},${d.earthquakes}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `disasterai_analytics_${range}.csv`;
    a.click();
  };

  const modelMetrics = metricKeys.map((key, i) => ({
    label: metricLabels[i],
    value: (metrics as any)[key] ?? 0,
    icon: metricIcons[i],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold text-foreground">Analytics &amp; Insights</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 border border-border">
            {timeRanges.map((t) => (
              <button
                key={t}
                onClick={() => setRange(t)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  range === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchAnalytics(range)}
            className="p-1.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* ML Model Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {modelMetrics.map((m) => (
          <div key={m.label} className="glass-card p-4 relative">
            {loading && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-xl">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <m.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-green-400">Live</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{m.value.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Disaster Frequency Bar Chart */}
      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-foreground mb-1">Disaster Frequency Trends</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {range === "7D" ? "Last 7 days (daily)" : range === "30D" ? "Last 30 days (daily)" : range === "90D" ? "Last 90 days (weekly)" : "Last 12 months"}
        </p>
        {trendData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {loading ? "Loading..." : "No alert data in this period. Use 'Generate Test Alert' to add data."}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trendData} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="floods" name="Floods" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cyclones" name="Cyclones" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="wildfires" name="Wildfires" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="earthquakes" name="Earthquakes" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Model Confidence Area Chart */}
      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">Model Confidence Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={confidenceData.length > 0 ? confidenceData : [{ period: "—", confidence: metrics.accuracy }]}>
            <defs>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <RechartsTooltip
              contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
              formatter={(v: any) => [`${v}%`, "Confidence"]}
            />
            <Area type="monotone" dataKey="confidence" stroke="#6366f1" strokeWidth={2.5} fill="url(#confidenceGrad)" dot={{ fill: "#6366f1", r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 7-Day AI Forecast (real randomised from backend) */}
      {forecast.length > 0 && (
        <div className="glass-card p-6 border-blue-500/20">
          <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            7-Day AI Risk Forecast
          </h3>
          <div className="h-64 w-full cursor-crosshair">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWildfire" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCyclone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} domain={[0, 100]} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", borderRadius: "8px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Area type="monotone" name="Flood Risk %" dataKey="flood_probability" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFlood)" />
                <Area type="monotone" name="Wildfire Risk %" dataKey="wildfire_probability" stroke="#f97316" fillOpacity={1} fill="url(#colorWildfire)" />
                <Area type="monotone" name="Cyclone Risk %" dataKey="cyclone_probability" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCyclone)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Disaster Breakdown Pie */}
      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">Disaster Type Distribution</h3>
        {pieData.every((p) => p.value === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data for this period.</p>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 w-full md:w-auto">
              {pieData.map((d: any, i: number) => (
                <div key={d.name} className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;

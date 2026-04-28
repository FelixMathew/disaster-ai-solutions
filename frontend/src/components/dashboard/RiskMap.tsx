import { MapPin } from "lucide-react";

const RiskMap = () => (
  <div className="glass-card p-5">
    <h3 className="font-heading font-semibold text-foreground mb-4">Risk Map</h3>
    <div className="relative h-64 rounded-lg bg-secondary/50 border border-border overflow-hidden flex items-center justify-center">
      {/* Simulated map grid */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`h-${i}`} className="absolute w-full border-t border-primary/30" style={{ top: `${(i + 1) * 12.5}%` }} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`v-${i}`} className="absolute h-full border-l border-primary/30" style={{ left: `${(i + 1) * 12.5}%` }} />
        ))}
      </div>

      {/* Risk markers */}
      <div className="absolute top-[25%] left-[30%] w-3 h-3 rounded-full bg-risk-critical animate-pulse-glow" />
      <div className="absolute top-[45%] left-[55%] w-3 h-3 rounded-full bg-risk-high animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
      <div className="absolute top-[60%] left-[40%] w-2.5 h-2.5 rounded-full bg-risk-medium animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="absolute top-[35%] left-[70%] w-2 h-2 rounded-full bg-risk-low animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="flex flex-col items-center gap-2 text-muted-foreground z-10">
        <MapPin className="h-8 w-8" />
        <p className="text-sm">Geospatial map integration ready</p>
        <p className="text-xs">Mapbox / Leaflet compatible</p>
      </div>
    </div>

    {/* Legend */}
    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-risk-critical" />Critical</span>
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-risk-high" />High</span>
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-risk-medium" />Medium</span>
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-risk-low" />Low</span>
    </div>
  </div>
);

export default RiskMap;

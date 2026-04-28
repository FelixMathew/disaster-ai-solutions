import { useState } from "react";
import { Droplets, Wind, Flame, Mountain, X } from "lucide-react";

type RiskLevel = "Critical" | "High" | "Medium" | "Low";

interface Disaster {
  type: string;
  icon: any;
  risk: RiskLevel;
  confidence: number;
  indicators: string[];
  explanation: string;
  precautions: string[];
}

const riskClass: Record<RiskLevel, string> = {
  Critical: "risk-critical",
  High: "risk-high",
  Medium: "risk-medium",
  Low: "risk-low",
};

const disasters: Disaster[] = [
  {
    type: "Flood",
    icon: Droplets,
    risk: "Critical",
    confidence: 92,
    indicators: ["Rainfall: 180mm/24h", "River Level: 8.2m", "Soil Saturation: 94%"],
    explanation: "Heavy monsoon rainfall combined with saturated soil and rising river levels indicate imminent flood risk in low-lying areas.",
    precautions: ["Evacuate low-lying areas", "Prepare emergency kits", "Monitor official channels"],
  },
  {
    type: "Cyclone",
    icon: Wind,
    risk: "High",
    confidence: 87,
    indicators: ["Wind Speed: 145 km/h", "Pressure: 965 hPa", "Sea Temp: 29°C"],
    explanation: "Tropical depression intensifying with warm sea surface temperatures. Expected to make landfall within 48 hours.",
    precautions: ["Secure loose objects", "Stock supplies for 72h", "Identify nearest shelter"],
  },
  {
    type: "Wildfire",
    icon: Flame,
    risk: "Medium",
    confidence: 74,
    indicators: ["Temp: 42°C", "Humidity: 12%", "Wind: 35 km/h"],
    explanation: "Extreme heat and low humidity create favorable conditions for wildfire ignition and spread in forested regions.",
    precautions: ["Clear vegetation near structures", "Prepare evacuation route", "Monitor air quality"],
  },
  {
    type: "Earthquake",
    icon: Mountain,
    risk: "Low",
    confidence: 61,
    indicators: ["Seismic Activity: 2.1 ML", "Depth: 15km", "Frequency: Normal"],
    explanation: "Minor seismic activity detected within normal baseline parameters. No significant risk elevation at this time.",
    precautions: ["Review emergency plan", "Secure heavy furniture", "Check building integrity"],
  },
];

const DisasterCards = () => {
  const [selected, setSelected] = useState<Disaster | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disasters.map((d) => (
          <div key={d.type} className="glass-card-hover p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <d.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{d.type}</h3>
              </div>
              <span className={`risk-badge ${riskClass[d.risk]}`}>{d.risk}</span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Confidence</span>
                <span className="text-foreground font-medium">{d.confidence}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${d.confidence}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              {d.indicators.map((ind) => (
                <p key={ind} className="text-xs text-muted-foreground">• {ind}</p>
              ))}
            </div>

            <button
              onClick={() => setSelected(d)}
              className="text-sm text-primary hover:underline"
            >
              View Details →
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-card max-w-lg w-full p-6 relative animate-fade-in">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <selected.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground">{selected.type} Prediction</h2>
                <span className={`risk-badge ${riskClass[selected.risk]} mt-1 inline-block`}>{selected.risk} Risk</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Environmental Factors</h4>
                <div className="space-y-1">
                  {selected.indicators.map((i) => (
                    <p key={i} className="text-sm text-muted-foreground">• {i}</p>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Risk Explanation</h4>
                <p className="text-sm text-muted-foreground">{selected.explanation}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Recommended Precautions</h4>
                <div className="space-y-1">
                  {selected.precautions.map((p) => (
                    <p key={p} className="text-sm text-muted-foreground">• {p}</p>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full mt-5 py-2 rounded-lg gradient-primary-btn text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DisasterCards;

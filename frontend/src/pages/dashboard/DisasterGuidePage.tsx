import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Info, Phone } from "lucide-react";

const GUIDES: Record<string, {
  emoji: string; color: string; bg: string;
  title: string; description: string;
  dos: string[]; donts: string[];
  fact: string; emergency: string;
}> = {
  flood: {
    emoji: "🌊", color: "#60a5fa", bg: "rgba(96,165,250,0.1)",
    title: "Flood Safety Guide",
    description: "Flash floods can occur within minutes of heavy rain. Know what to do.",
    dos: ["Move to higher ground immediately", "Follow official evacuation orders", "Stay away from floodwater", "Disconnect electrical appliances", "Keep emergency kit ready"],
    donts: ["Walk through moving water", "Drive through flooded roads", "Touch wet electrical equipment", "Return before all-clear", "Ignore weather alerts"],
    fact: "6 inches of moving water can knock a person down.",
    emergency: "112",
  },
  fire: {
    emoji: "🔥", color: "#f87171", bg: "rgba(248,113,113,0.1)",
    title: "Fire Safety Guide",
    description: "In case of fire, every second counts. Act fast.",
    dos: ["Activate nearest fire alarm", "Evacuate immediately via stairs", "Crawl low under smoke", "Close doors to slow fire", "Call 101 once safe"],
    donts: ["Use elevators during fire", "Re-enter a burning building", "Open hot doors", "Waste time on belongings", "Ignore fire alarm"],
    fact: "Smoke inhalation kills more people than flames.",
    emergency: "101",
  },
  earthquake: {
    emoji: "🌍", color: "#a78bfa", bg: "rgba(167,139,250,0.1)",
    title: "Earthquake Safety Guide",
    description: "Drop, Cover, and Hold On. Know the protocol.",
    dos: ["Drop, cover, and hold on", "Stay away from windows", "Move to open ground if outdoors", "Expect aftershocks", "Check for gas leaks after"],
    donts: ["Run outside during shaking", "Use matches or lighters", "Stand in doorways (myth)", "Use elevators", "Ignore aftershock risk"],
    fact: "Most injuries occur when people try to move or run.",
    emergency: "112",
  },
  landslide: {
    emoji: "⛰️", color: "#4ade80", bg: "rgba(74,222,128,0.1)",
    title: "Landslide Safety Guide",
    description: "Stay alert to warning signs like unusual sounds and cracking ground.",
    dos: ["Evacuate immediately if warned", "Move away from landslide path", "Stay alert during heavy rain", "Listen for unusual sounds", "Contact authorities"],
    donts: ["Stay in low-lying areas", "Cross rivers near landslides", "Ignore evacuation warnings", "Return to damaged area", "Build near unstable slopes"],
    fact: "Landslides can travel faster than 55 mph.",
    emergency: "112",
  },
  storm: {
    emoji: "🌪️", color: "#38bdf8", bg: "rgba(56,189,248,0.1)",
    title: "Storm Safety Guide",
    description: "Thunderstorms and cyclones require immediate shelter action.",
    dos: ["Seek shelter indoors", "Stay away from windows", "Unplug electronics", "Have emergency kit ready", "Monitor weather radio"],
    donts: ["Shelter under trees", "Use corded phones in lightning", "Ignore storm warnings", "Venture out during storm", "Touch downed power lines"],
    fact: "Wind speeds in severe storms can exceed 200 mph.",
    emergency: "112",
  },
  cyclone: {
    emoji: "🌀", color: "#fb923c", bg: "rgba(251,146,60,0.1)",
    title: "Cyclone Safety Guide",
    description: "Cyclones bring violent winds, heavy rain, and storm surges.",
    dos: ["Secure your home in advance", "Stock 72-hour emergency supplies", "Evacuate coastal areas early", "Follow official orders", "Stay indoors until all-clear"],
    donts: ["Go out during the eye of cyclone", "Ignore official warnings", "Stay near coastlines", "Leave home unsecured", "Use candles (fire risk)"],
    fact: "The eye of a cyclone is deceptively calm — the worst winds follow.",
    emergency: "112",
  },
  tsunami: {
    emoji: "🌊", color: "#2563eb", bg: "rgba(37,99,235,0.1)",
    title: "Tsunami Safety Guide",
    description: "A series of massive ocean waves typically caused by underwater earthquakes.",
    dos: ["Move to high ground immediately", "Follow official evacuation routes", "Stay away from the beach", "Wait for the official all-clear", "Grab your emergency kit"],
    donts: ["Wait to see the wave", "Return to coastal areas early", "Ignore warning sirens", "Assume one wave means it's over", "Stay in low-lying buildings"],
    fact: "Tsunami waves can travel at the speed of a jet plane in deep water.",
    emergency: "112",
  },
  accident: {
    emoji: "🚗", color: "#64748b", bg: "rgba(100,116,139,0.1)",
    title: "Traffic Accident Guide",
    description: "In a road emergency, personal safety and securing the scene are top priorities.",
    dos: ["Check for injuries immediately", "Move to a safe area if possible", "Call emergency services", "Set up warning triangles", "Document the scene if safe"],
    donts: ["Leave the scene of the accident", "Move severely injured people", "Admit liability at the scene", "Stand on the active roadway", "Ignore leaking fluids"],
    fact: "Moving an injured person incorrectly can cause severe spinal damage.",
    emergency: "112",
  },
  heatwave: {
    emoji: "☀️", color: "#ef4444", bg: "rgba(239,68,68,0.1)",
    title: "Heatwave Safety Guide",
    description: "Extreme heat can be deadly. Stay cool and hydrated to prevent heatstroke.",
    dos: ["Drink plenty of water", "Stay in air-conditioned spaces", "Wear light, loose clothing", "Check on elderly neighbors", "Take cool showers"],
    donts: ["Leave children/pets in cars", "Do strenuous workouts outdoors", "Drink heavy alcohol or caffeine", "Ignore signs of heat exhaustion", "Walk barefoot on hot pavement"],
    fact: "Heatwaves are the deadliest weather-related hazard globally.",
    emergency: "112",
  },
  chemical: {
    emoji: "☣️", color: "#eab308", bg: "rgba(234,179,8,0.1)",
    title: "Chemical Spill Guide",
    description: "Industrial accidents and chemical spills release toxic hazardous materials.",
    dos: ["Evacuate the area immediately", "Move crosswind, not downwind", "Cover your mouth and nose", "Follow HazMat instructions", "Wash exposed skin thoroughly"],
    donts: ["Walk near the spilled substance", "Breathe in fumes or smoke", "Return to get personal items", "Touch unknown containers", "Drink tap water unverified"],
    fact: "Many toxic industrial gases are heavier than air and sink to low areas.",
    emergency: "112",
  },
};

const DisasterGuidePage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  if (!type) {
    return (
      <div className="px-4 pt-4 pb-2 min-h-full slide-up" style={{ background: "var(--bg)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 transition-all active:scale-95" style={{color: "var(--text-2)"}}>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-black mb-1" style={{color: "var(--text-1)"}}>Disaster Guides</h1>
          <p className="text-xs focus:outline-none" style={{color: "var(--text-2)"}}>Select a disaster to view critical safety protocols, survival DOs and DON'Ts, and emergency contacts.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 pb-8">
          {Object.entries(GUIDES).map(([key, guide]) => (
            <button key={key} onClick={() => navigate(`/dashboard/disaster-guide/${key}`)}
              className="flex items-center gap-4 p-4 rounded-2xl w-full text-left transition-transform active:scale-95 shadow-sm hover:shadow-md"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl text-3xl shrink-0" style={{background: guide.bg, border: `1px solid ${guide.color}30`}}>
                {guide.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-0.5" style={{color: "var(--text-1)"}}>{guide.title}</h3>
                <p className="text-xs" style={{color: "var(--text-2)", lineHeight: 1.4}}>{guide.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const guide = GUIDES[type] || GUIDES.flood;

  return (
    <div className="px-4 pt-4 pb-2 min-h-full" style={{ background: "var(--bg)" }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 transition-all active:scale-95" style={{color: "var(--text-2)"}}>
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      {/* Hero */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: guide.bg, border: `1px solid ${guide.color}30` }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{guide.emoji}</span>
          <div>
            <h1 className="text-lg font-black" style={{color: "var(--text-1)"}}>{guide.title}</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{guide.description}</p>
          </div>
        </div>
      </div>

      {/* DOs */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-black text-green-400 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> DO's
        </h3>
        <div className="space-y-2">
          {guide.dos.map((d, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(74,222,128,0.15)" }}>
                <CheckCircle className="w-3 h-3 text-green-400" />
              </div>
              <p className="text-xs leading-relaxed" style={{color: "var(--text-2)"}}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DON'Ts */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-black text-red-400 mb-3 flex items-center gap-2">
          <XCircle className="w-4 h-4" /> DON'Ts
        </h3>
        <div className="space-y-2">
          {guide.donts.map((d, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(248,113,113,0.15)" }}>
                <XCircle className="w-3 h-3 text-red-400" />
              </div>
              <p className="text-xs leading-relaxed" style={{color: "var(--text-2)"}}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Fact */}
      <div className="rounded-2xl p-4 mb-3 flex items-start gap-3" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Key Fact</p>
          <p className="text-xs" style={{color: "var(--text-2)"}}>{guide.fact}</p>
        </div>
      </div>

      {/* Emergency */}
      <a href={`tel:${guide.emergency}`}
        className="flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 mb-2"
        style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}>
        <Phone className="w-5 h-5" />
        Call Emergency: {guide.emergency}
      </a>
    </div>
  );
};

export default DisasterGuidePage;

import { useState, useEffect } from "react";
import { AlertTriangle, Flame, Zap, Wind, Info, CheckCircle, Filter } from "lucide-react";

const ALERTS = [
  {
    id:1, title:"Flash Flood Warning", severity:"danger",
    desc:"Severe flash flooding expected in low-lying areas. Move to higher ground immediately.",
    time:"2 min ago", color:"#f87171", bg:"rgba(239,68,68,0.1)", border:"rgba(239,68,68,0.25)",
    Icon: AlertTriangle,
  },
  {
    id:2, title:"Fire Alert — Zone Alpha", severity:"danger",
    desc:"Wildfire spreading rapidly. Evacuation order issued for Zones A, B, and C.",
    time:"8 min ago", color:"#f87171", bg:"rgba(239,68,68,0.1)", border:"rgba(239,68,68,0.25)",
    Icon: Flame,
  },
  {
    id:3, title:"Earthquake Advisory", severity:"warning",
    desc:"M4.2 earthquake detected 80 km away. Stay alert for possible aftershocks.",
    time:"23 min ago", color:"#fbbf24", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.25)",
    Icon: Zap,
  },
  {
    id:4, title:"Cyclone Watch", severity:"warning",
    desc:"Cyclone Nivar likely to make landfall within 48 hours. Prepare emergency kit now.",
    time:"1 hr ago", color:"#fbbf24", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.25)",
    Icon: Wind,
  },
  {
    id:5, title:"Safety Tip", severity:"info",
    desc:"Keep a 72-hour emergency kit: water, non-perishable food, first aid & important documents.",
    time:"3 hr ago", color:"#60a5fa", bg:"rgba(59,130,246,0.1)", border:"rgba(59,130,246,0.25)",
    Icon: Info,
  },
  {
    id:6, title:"Storm Surge Alert", severity:"danger",
    desc:"Storm surge of 2–4 meters expected along the coast. Evacuate coastal areas immediately.",
    time:"5 hr ago", color:"#f87171", bg:"rgba(239,68,68,0.1)", border:"rgba(239,68,68,0.25)",
    Icon: Wind,
  },
];

const FILTERS = ["All", "Danger", "Warning", "Info"];

const AlertsPage = () => {
  const [filter, setFilter] = useState("All");
  const [read, setRead]     = useState<number[]>([]);

  const visible = ALERTS.filter(a =>
    filter === "All" || a.severity.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div style={{ background:"var(--bg)", minHeight:"100%" }}>

      {/* Header */}
      <div style={{ padding:"20px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h1 style={{ fontSize:22, fontWeight:900, color:"var(--text-1)", margin:0 }}>Alerts</h1>
          <button
            onClick={() => setRead(ALERTS.map(a => a.id))}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:100, background:"var(--bg-card)", border:"1px solid var(--border)", cursor:"pointer", fontSize:12, fontWeight:700, color:"var(--text-2)" }}
          >
            <CheckCircle style={{ width:13, height:13 }}/> Mark all read
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:16 }} className="scrollbar-none">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding:"9px 18px", borderRadius:100, fontSize:12, fontWeight:700,
                border:"none", cursor:"pointer", flexShrink:0, transition:"all 200ms",
                background: filter===f ? "var(--yellow)" : "var(--bg-card)",
                color: filter===f ? "#000" : "var(--text-3)",
                boxShadow: filter===f ? "0 4px 14px rgba(255,193,7,0.3)" : "0 1px 4px rgba(0,0,0,0.2)",
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ padding:"0 20px 12px" }}>
        <p style={{ fontSize:11, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
          {visible.length} alert{visible.length!==1?"s":""} · {read.filter(id=>visible.find(a=>a.id===id)).length} read
        </p>
      </div>

      {/* Alert Cards */}
      <div style={{ padding:"0 16px 24px", display:"flex", flexDirection:"column", gap:10 }}>
        {visible.map((a, i) => {
          const isRead = read.includes(a.id);
          return (
            <button key={a.id}
              onClick={() => setRead(prev => prev.includes(a.id) ? prev.filter(x=>x!==a.id) : [...prev, a.id])}
              className="fade-up"
              style={{
                animationDelay:`${i * 0.05}s`,
                padding:"16px", borderRadius:20,
                background: isRead ? "var(--bg-card)" : a.bg,
                border: `1px solid ${isRead ? "var(--border)" : a.border}`,
                display:"flex", alignItems:"flex-start", gap:14,
                cursor:"pointer", textAlign:"left", width:"100%",
                transition:"all 200ms",
                opacity: isRead ? 0.5 : 1,
                boxShadow: isRead ? "none" : "0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              {/* Icon */}
              <div style={{
                width:44, height:44, borderRadius:14, flexShrink:0,
                background: isRead ? "var(--bg-elevated)" : a.bg,
                border: `1px solid ${isRead ? "var(--border)" : a.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <a.Icon style={{ width:18, height:18, color: isRead ? "var(--text-3)" : a.color }} />
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <p style={{ fontSize:14, fontWeight:800, color:isRead?"var(--text-3)":a.color, margin:0, flex:1 }}>
                    {a.title}
                  </p>
                  {!isRead && (
                    <div style={{ width:8, height:8, borderRadius:"50%", background:a.color, flexShrink:0, boxShadow:`0 0 6px ${a.color}` }} />
                  )}
                </div>
                <p style={{ fontSize:12, color:isRead?"var(--text-3)":"var(--text-2)", margin:"0 0 6px", lineHeight:1.5, fontWeight:500 }}>
                  {a.desc}
                </p>
                <p style={{ fontSize:10, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>
                  {a.time}
                </p>
              </div>
            </button>
          );
        })}

        {visible.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text-3)" }}>
            <p style={{ fontSize:32, marginBottom:8 }}>✅</p>
            <p style={{ fontSize:15, fontWeight:700 }}>No {filter.toLowerCase()} alerts</p>
            <p style={{ fontSize:12, marginTop:4 }}>You're all clear right now</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;

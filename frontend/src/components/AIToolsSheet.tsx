import { useState, useEffect, useRef } from "react";
import { X, Image, Video, Radio, ChevronRight, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TOOLS = [
  {
    id:"image-ai", label:"Image AI", icon: Image,
    desc:"Analyze disaster imagery", color:"#a78bfa", bg:"rgba(167,139,250,0.12)", border:"rgba(167,139,250,0.25)",
    route:"/dashboard/image-ai",
  },
  {
    id:"video-ai", label:"Video AI", icon: Video,
    desc:"Process live video feeds", color:"#60a5fa", bg:"rgba(96,165,250,0.12)", border:"rgba(96,165,250,0.25)",
    route:"/dashboard/video-ai",
  },
  {
    id:"drone", label:"Drone Control", icon: Radio,
    desc:"Mission planning & telemetry", color:"#34d399", bg:"rgba(52,211,153,0.12)", border:"rgba(52,211,153,0.25)",
    route:"/dashboard/drone",
  },
];

const AIToolsSheet = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const [dark, setDark] = useState(() => (localStorage.getItem("theme") || "dark") === "dark");

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    // Also trigger a custom event so other components (like ProfilePage) can sync
    window.dispatchEvent(new Event("themeChange"));
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setDark((localStorage.getItem("theme") || "dark") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);
  
  // Position state (persisted)
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_tools_pos");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 16, y: 96 }; // Initial: left 16, bottom 96
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (open) return; // Don't drag if open
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    // We update x (left) and y (bottom - inverted)
    // dy is positive downwards, so to move "up" (increase bottom), we subtract dy
    setPos({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY - dy,
    });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    localStorage.setItem("ai_tools_pos", JSON.stringify(pos));
  };

  return (
    <>
      {/* Floating Grid Button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => { if (!isDragging) setOpen(!open); }}
        style={{
          position:"absolute", bottom:pos.y, left:pos.x, zIndex:150,
          width:44, height:44, borderRadius:14,
          background: open ? "var(--yellow)" : "var(--bg-card)",
          border:`1px solid ${open ? "transparent" : "var(--border)"}`,
          boxShadow:`0 4px 18px rgba(0,0,0,0.35)${open ? ", 0 0 20px rgba(255,193,7,0.3)" : ""}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor: isDragging ? "grabbing" : "pointer", 
          transition: isDragging ? "none" : "all 250ms, bottom 0ms, left 0ms",
          transform: open ? "rotate(45deg)" : "rotate(0)",
          touchAction: "none", // Prevent scrolling while dragging
        }}
      >
        <svg
          viewBox="0 0 24 24" width={18} height={18}
          stroke={open ? "#000" : "var(--text-2)"} strokeWidth={2.2}
          fill="none" strokeLinecap="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", zIndex:160 }}
        />
      )}

      {/* Bottom Sheet */}
      {open && (
        <div
          className="slide-up"
          style={{
            position:"absolute", bottom:"var(--nav-h)", left:0, right:0, zIndex:170,
            background:"var(--bg-card)",
            borderTop:"1px solid var(--border-2)",
            borderRadius:"24px 24px 0 0",
            padding:"20px 16px 24px",
            boxShadow:"0 -8px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
            <div style={{ width:36, height:4, borderRadius:100, background:"var(--border-2)" }} />
          </div>

          {/* Title row */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:"var(--text-1)", margin:"0 0 2px" }}>AI Tools</p>
              <p style={{ fontSize:11, color:"var(--text-3)", margin:0 }}>Powered by DisasterAI</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={toggleDark}
                style={{ width:32, height:32, borderRadius:10, background:"var(--bg-elevated)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                {dark ? <Sun style={{ width:14, height:14, color:"var(--yellow)" }} /> : <Moon style={{ width:14, height:14, color:"#f97316" }} />}
              </button>
              <button onClick={()=>setOpen(false)}
                style={{ width:32, height:32, borderRadius:10, background:"var(--bg-elevated)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <X style={{ width:14, height:14, color:"var(--text-2)" }} />
              </button>
            </div>
          </div>

          {/* Tool cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {TOOLS.map(t => (
              <button key={t.id}
                onClick={() => { setOpen(false); navigate(t.route); }}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                  borderRadius:18, background:t.bg, border:`1px solid ${t.border}`,
                  cursor:"pointer", textAlign:"left", width:"100%",
                  transition:"transform 150ms, box-shadow 150ms",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="scale(1.01)"; (e.currentTarget as HTMLElement).style.boxShadow="0 6px 20px rgba(0,0,0,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow=""; }}
              >
                <div style={{ width:46, height:46, borderRadius:14, background:`${t.color}18`, border:`1px solid ${t.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <t.icon style={{ width:20, height:20, color:t.color }} />
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:800, color:"var(--text-1)", margin:0 }}>{t.label}</p>
                  <p style={{ fontSize:11, color:"var(--text-3)", margin:"2px 0 0" }}>{t.desc}</p>
                </div>
                <ChevronRight style={{ width:16, height:16, color:t.color, flexShrink:0 }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AIToolsSheet;

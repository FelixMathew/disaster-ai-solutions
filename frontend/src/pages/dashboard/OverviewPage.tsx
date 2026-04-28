import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShieldCheck, Thermometer, Droplets, Wind, Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

/* ─── Live Weather ─── */
interface WeatherData {
  temp: number; humidity: number; wind: number;
  condition: string; city: string;
  status: "idle" | "loading" | "done" | "error";
  safe: boolean; lat: number; lng: number;
}

const WMO: Record<number, string> = {
  0:"Clear Sky",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",
  45:"Foggy",48:"Rime Fog",51:"Light Drizzle",53:"Drizzle",55:"Heavy Drizzle",
  61:"Light Rain",63:"Rain",65:"Heavy Rain",
  71:"Light Snow",73:"Snow",75:"Heavy Snow",77:"Snow Grains",
  80:"Showers",81:"Rain Showers",82:"Violent Showers",
  85:"Snow Showers",86:"Heavy Snow Showers",
  95:"Thunderstorm",96:"Thunderstorm + Hail",99:"Thunderstorm + Heavy Hail",
};

const useWeather = () => {
  const [w, setW] = useState<WeatherData>({
    temp:0, humidity:0, wind:0, condition:"", city:"", status:"idle", safe:true, lat:0, lng:0
  });

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setW(prev => ({ ...prev, status: "loading" }));
    try {
      const [geoR, wR] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=auto`),
      ]);
      const geo = await geoR.json();
      const wj  = await wR.json();
      const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || "Your Area";
      const code = wj.current.weather_code ?? 0;
      const isHazard = code >= 95 || wj.current.wind_speed_10m > 60;
      setW({
        temp: Math.round(wj.current.temperature_2m),
        humidity: Math.round(wj.current.relative_humidity_2m),
        wind: Math.round(wj.current.wind_speed_10m),
        condition: WMO[code] ?? "Clear",
        city, status: "done", safe: !isHazard,
        lat, lng: lon,
      });
    } catch {
      setW(prev => ({ ...prev, status: "error", condition: "Unavailable", city: "Error" }));
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { fetchWeather(12.9716, 77.5946); return; }
    navigator.geolocation.getCurrentPosition(
      p => fetchWeather(p.coords.latitude, p.coords.longitude),
      _  => fetchWeather(12.9716, 77.5946),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [fetchWeather]);

  return w;
};

/* ─── Constants ─── */
const QUOTES = [
  "Safety is a way of life, not just a set of rules.",
  "The storms of life reveal the strength we didn't know we had.",
  "Prepared communities save lives every single day.",
  "Early warnings save thousands — stay alert.",
  "Together, we are stronger than any disaster.",
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return ["Good Night", "🌙"];
  if (h < 12) return ["Good Morning", "☀️"];
  if (h < 17) return ["Good Afternoon", "🌤️"];
  if (h < 21) return ["Good Evening", "🌆"];
  return ["Good Night", "🌙"];
};

const DISASTER_CATS = [
  { type:"flood",      label:"Flood",       emoji:"🌊", icon:"💧", color:"#3b82f6", bg:"rgba(59,130,246,0.12)" },
  { type:"fire",       label:"Fire",         emoji:"🔥", icon:"🔥", color:"#ef4444", bg:"rgba(239,68,68,0.12)" },
  { type:"earthquake", label:"Earthquake",   emoji:"📡", icon:"📡", color:"#8b5cf6", bg:"rgba(139,92,246,0.12)" },
  { type:"landslide",  label:"Landslide",    emoji:"⛰️",  icon:"🏔️", color:"#10b981", bg:"rgba(16,185,129,0.12)" },
  { type:"storm",      label:"Storm",        emoji:"🌪️",  icon:"🌪️", color:"#0ea5e9", bg:"rgba(14,165,233,0.12)" },
  { type:"cyclone",    label:"Cyclone",      emoji:"🌀",  icon:"🌀", color:"#f97316", bg:"rgba(249,115,22,0.12)" },
];

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

/* ─── Component ─── */
const OverviewPage = () => {
  const navigate = useNavigate();
  const weather  = useWeather();
  const [qIdx, setQIdx] = useState(0);
  const [qVis, setQVis] = useState(true);
  const [search, setSearch] = useState("");
  const [greeting] = useState(getGreeting);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserProfile(res.data);
        // Sync local storage with latest backend data (excluding huge avatars if they exist, but here they are optimized)
        localStorage.setItem("disasterai_profile", JSON.stringify({
          name: res.data.username,
          phone: res.data.phone,
          avatar: res.data.avatar,
          email: res.data.email
        }));
      } catch (err) {
        console.error("Dashboard profile fetch failed", err);
      }
    };
    fetchFullProfile();
  }, []);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAJkxVflV2ETtoOYBRIjR_xPHcN1BRP7g4",
    libraries,
  });

  const [realCenters, setRealCenters] = useState<any[]>([]);

  useEffect(() => {
    if (isLoaded && weather.status === "done" && weather.lat !== 0 && window.google) {
      const service = new window.google.maps.places.PlacesService(document.createElement("div"));
      service.nearbySearch({
        location: { lat: weather.lat, lng: weather.lng },
        radius: 8000,
        keyword: "school OR hospital OR community center OR shelter"
      }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
          };
          const formatted = results.slice(0, 3).map(r => ({
            name: r.name,
            dist: r.geometry?.location ? getDist(weather.lat, weather.lng, r.geometry.location.lat(), r.geometry.location.lng()) + " km" : "2.5 km",
            open: r.business_status !== "CLOSED_TEMPORARILY" && r.business_status !== "CLOSED_PERMANENTLY"
          }));
          formatted.sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));
          setRealCenters(formatted);
        }
      });
    }
  }, [isLoaded, weather.status, weather.lat, weather.lng]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.toLowerCase().trim();
    if (!query) return;

    if (query.includes("location") || query.includes("map") || query.includes("evac")) {
      navigate("/dashboard/map");
    } else if (query.includes("sos") || query.includes("emergency") || query.includes("help") || query.includes("112")) {
      navigate("/dashboard/sos");
    } else if (query.includes("alert") || query.includes("warn") || query.includes("notify")) {
      navigate("/dashboard/alerts");
    } else if (query.includes("profile") || query.includes("setting") || query.includes("account")) {
      navigate("/dashboard/profile");
    } else if (query.includes("predict") || query.includes("image") || query.includes("scan")) {
      navigate("/dashboard/predict");
    } else if (query.includes("video") || query.includes("camera") || query.includes("cctv")) {
      navigate("/dashboard/video-ai");
    } else if (query.includes("drone") || query.includes("aerial")) {
      navigate("/dashboard/drone");
    } else if (query.includes("analytic") || query.includes("data") || query.includes("trend") || query.includes("graph")) {
      navigate("/dashboard/analytics");
    } else {
      const disasters = ["flood", "fire", "earthquake", "landslide", "storm", "cyclone", "tsunami", "accident", "heatwave", "chemical"];
      const matched = disasters.find(d => query.includes(d));
      if (matched) {
        navigate(`/dashboard/disaster-guide/${matched}`);
      } else if (query.includes("guide") || query.includes("safe") || query.includes("disaster")) {
        navigate("/dashboard/disaster-guide");
      } else {
        // Fallback for unhandled queries
        navigate("/dashboard/alerts");
      }
    }
  };

  const userName = (() => {
    if (userProfile?.username) return userProfile.username.split(" ")[0];
    try {
      const p = JSON.parse(localStorage.getItem("disasterai_profile") || "{}");
      return p.name?.split(" ")[0] || localStorage.getItem("user_email")?.split("@")[0] || "User";
    } catch { return "User"; }
  })();

  const initial = (userName[0] || "U").toUpperCase();

  useEffect(() => {
    const t = setInterval(() => {
      setQVis(false);
      setTimeout(() => { setQIdx(i => (i+1) % QUOTES.length); setQVis(true); }, 500);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background:"var(--bg)", minHeight:"100%" }}>

      {/* ── HEADER: Avatar + Name + Bell ── */}
      <div style={{ padding:"16px 20px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }} className="fade-up">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {/* Avatar */}
          <div style={{
            width:44, height:44, borderRadius:14,
            background:"linear-gradient(135deg, #FFC107, #FF8F00)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:18, color:"#000",
            boxShadow:"0 4px 14px rgba(255,193,7,0.3)",
            flexShrink:0,
            overflow:"hidden"
          }}>
            {(() => {
              // 1. Try local state from the backend fetch
              if (userProfile?.avatar) return <img src={userProfile.avatar} alt="User Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />;
              
              // 2. Fallback to localStorage for instant display while loading
              try {
                const storedProfile = JSON.parse(localStorage.getItem("disasterai_profile") || "{}");
                if (storedProfile.avatar) return <img src={storedProfile.avatar} alt="User Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />;
              } catch {}

              // 3. Last fallback: Initials
              return initial;
            })()}
          </div>
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:"var(--yellow)", margin:0, lineHeight:1.2 }}>{greeting[0]}</p>
            <h2 style={{ fontSize:17, fontWeight:800, color:"var(--text-1)", margin:0, lineHeight:1.2 }}>{userName}</h2>
          </div>
        </div>
        {/* Bell */}
        <button
          onClick={() => navigate("/dashboard/alerts")}
          style={{ width:40, height:40, borderRadius:13, background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}
        >
          <svg viewBox="0 0 16 20" height={18} width={14} fill="var(--text-2)">
            <path d="M15.0294 12.4902L14.0294 10.8302C13.8194 10.4602 13.6294 9.76016 13.6294 9.35016V6.82016C13.6282 5.70419 13.3111 4.61137 12.7147 3.66813C12.1183 2.72489 11.267 1.96978 10.2594 1.49016C10.0022 1.0335 9.62709 0.654303 9.17324 0.392195C8.71939 0.130087 8.20347 -0.00530784 7.6794 0.000159243C6.5894 0.000159243 5.6094 0.590159 5.0894 1.52016C3.1394 2.49016 1.7894 4.50016 1.7894 6.82016V9.35016C1.7894 9.76016 1.5994 10.4602 1.3894 10.8202L0.379396 12.4902C-0.0206039 13.1602 -0.110604 13.9002 0.139396 14.5802C0.379396 15.2502 0.949396 15.7702 1.6894 16.0202C3.6294 16.6802 5.6694 17.0002 7.7094 17.0002C9.7494 17.0002 11.7894 16.6802 13.7294 16.0302C14.4294 15.8002 14.9694 15.2702 15.2294 14.5802C15.4894 13.8902 15.4194 13.1302 15.0294 12.4902Z"/>
          </svg>
          <div style={{ position:"absolute", top:8, right:8, width:9, height:9, borderRadius:"50%", background:"#ef4444", border:"2px solid var(--bg-card)" }} />
        </button>
      </div>

      {/* ── QUOTE CARD ── */}
      <div style={{ padding:"0 20px 12px" }} className="fade-up d1">
        <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22, color:"var(--yellow)", fontWeight:900, lineHeight:1, flexShrink:0 }}>"</span>
          <p style={{
            fontSize:13, fontWeight:500, color:"var(--text-2)", margin:0, flex:1,
            lineHeight:1.5, transition:"opacity 0.5s",
            opacity: qVis ? 1 : 0,
            fontStyle:"italic",
          }}>
            {QUOTES[qIdx]}
          </p>
        </div>
      </div>

      {/* ── WEATHER CARD ── */}
      <div style={{ padding:"0 20px 16px" }} className="fade-up d2">
        <div style={{
          borderRadius:20, padding:"18px 20px",
          background: weather.status === "done"
            ? "linear-gradient(135deg, #FF8C00 0%, #FFC107 50%, #FFD54F 100%)"
            : "var(--bg-card)",
          position:"relative", overflow:"hidden",
          border: weather.status === "done" ? "none" : "1px solid var(--border)",
          minHeight:120,
        }}>
          {/* Decorative orb */}
          {weather.status === "done" && (
            <div style={{
              position:"absolute", right:-20, top:"50%", transform:"translateY(-50%)",
              width:140, height:140, borderRadius:"50%",
              background:"rgba(255,255,255,0.18)",
              filter:"blur(2px)",
            }} />
          )}

          {/* Top row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, position:"relative" }}>
            <span className={weather.safe ? "badge-safe" : "badge-danger"} style={{ fontSize:10 }}>
              <ShieldCheck style={{ width:10, height:10 }} />{weather.safe ? "SAFE" : "ALERT"}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:600, color: weather.status === "done" ? "rgba(0,0,0,0.6)" : "var(--text-3)" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:weather.status==="done"?"#22c55e":"#6e7681", boxShadow:weather.status==="done"?"0 0 6px #22c55e":undefined }} />
              {weather.status === "loading" ? "Detecting…" : weather.city || "Fetching location…"}
            </div>
          </div>

          {/* Loading skeleton */}
          {weather.status === "loading" && (
            <div>
              <div className="skeleton" style={{ height:28, width:"55%", marginBottom:8 }} />
              <div className="skeleton" style={{ height:14, width:"40%", marginBottom:14 }} />
              <div style={{ display:"flex", gap:16 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:12, width:60 }} />)}
              </div>
            </div>
          )}

          {/* Data */}
          {weather.status === "done" && (
            <div style={{ position:"relative" }}>
              <h2 style={{ fontSize:28, fontWeight:900, color:"#fff", margin:"0 0 2px", textShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>
                {weather.condition}, {weather.temp}°C
              </h2>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.8)", margin:"0 0 14px" }}>
                Humidity {weather.humidity}% · Wind {weather.wind} km/h
              </p>
              <div style={{ display:"flex", gap:18 }}>
                {[
                  { Icon:Thermometer, val:`${weather.temp}°C` },
                  { Icon:Droplets,    val:`${weather.humidity}%` },
                  { Icon:Wind,        val:`${weather.wind} km/h` },
                ].map(({ Icon, val }) => (
                  <div key={val} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Icon style={{ width:13, height:13, color:"rgba(255,255,255,0.9)" }} />
                    <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weather.status === "error" && (
            <p style={{ color:"var(--text-2)", fontSize:13, marginTop:8 }}>⚠️ Weather unavailable. Check your connection.</p>
          )}
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div style={{ padding:"0 20px 16px" }} className="fade-up d2">
        <form onSubmit={handleSearchSubmit} style={{
          background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14,
          display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
        }}>
          <Search style={{ width:15, height:15, color:"var(--text-3)", flexShrink:0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search disasters, locations, status..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:13, color:"var(--text-1)", fontFamily:"Inter, sans-serif" }} />
          <button type="submit" style={{ display: "none" }} />
          <SlidersHorizontal style={{ width:15, height:15, color:"var(--yellow)", flexShrink:0 }} />
        </form>
      </div>

      {/* ── DISASTER GUIDE ── */}
      <div style={{ padding:"0 20px 8px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text-1)", margin:0 }}>Disaster Guide</h3>
          <button onClick={() => navigate("/dashboard/disaster-guide")} style={{ fontSize:13, fontWeight:700, color:"var(--yellow)", background:"none", border:"none", cursor:"pointer" }}>See all</button>
        </div>
        <div className="fade-up d3" style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginBottom:20 }}>
          {DISASTER_CATS.map(cat => (
            <button key={cat.type} onClick={() => navigate(`/dashboard/disaster-guide/${cat.type}`)}
              style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:8,
                padding:"14px 6px",
                background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:18,
                cursor:"pointer", transition:"transform 150ms, box-shadow 150ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 8px 24px rgba(0,0,0,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform=""; (e.currentTarget as HTMLElement).style.boxShadow=""; }}
            >
              <div style={{ width:52, height:52, borderRadius:16, background:cat.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>
                {cat.emoji}
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--text-2)" }}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── NEARBY INCIDENTS ── */}
      <div style={{ padding:"0 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text-1)", margin:0 }}>Nearby Incidents</h3>
          <button onClick={() => navigate("/dashboard/map")} style={{ fontSize:13, fontWeight:700, color:"var(--yellow)", background:"none", border:"none", cursor:"pointer" }}>View Map</button>
        </div>

        {/* Embedded mini map preview */}
        <div className="fade-up d4" onClick={() => navigate("/dashboard/map")} style={{
          background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:18, overflow:"hidden", cursor:"pointer",
          height:160, position:"relative", marginBottom:20,
        }}>
          {/* Real Google Map overlay */}
          {isLoaded && weather.status === "done" ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%", pointerEvents: "none" }}
              center={{ lat: weather.lat, lng: weather.lng }}
              zoom={13}
              options={{ 
                disableDefaultUI: true, keyboardShortcuts: false, gestureHandling: "none",
                styles: localStorage.getItem("theme") === "light" ? [] : [
                  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
                ]
              }}
            >
              <Marker position={{ lat: weather.lat, lng: weather.lng }} icon={{ url: "https://maps.google.com/mapfiles/ms/icons/red-pushpin.png" }} />
            </GoogleMap>
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--bg-card)" }} />
          )}

          {/* Fallback gradient background */}
          <div style={{ position:"absolute", inset:0, background: localStorage.getItem("theme") === "light" ? "linear-gradient(135deg, transparent, rgba(255,255,255,0.4))" : "linear-gradient(135deg, transparent, rgba(0,0,0,0.4))", zIndex:0 }}>
            {!isLoaded && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <p style={{ color:"var(--text-3)", fontSize:12, fontWeight:600 }}>Loading Map Data...</p>
            </div>}
          </div>
          {/* Overlay label */}
          <div style={{
            position:"absolute", bottom:10, left:10,
            background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)",
            borderRadius:10, padding:"6px 12px",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444", boxShadow:"0 0 6px #ef4444" }} />
            <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>Live tracking active</span>
          </div>
          <div style={{ position:"absolute", bottom:10, right:10, background:"rgba(255,193,7,0.9)", borderRadius:8, padding:"4px 10px" }}>
            <span style={{ fontSize:10, fontWeight:800, color:"#000" }}>VIEW FULL MAP →</span>
          </div>
        </div>

        {/* Evacuation Centers */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text-1)", margin:0 }}>Evacuation Centers</h3>
          <button onClick={() => navigate("/dashboard/map")} style={{ fontSize:13, fontWeight:700, color:"var(--yellow)", background:"none", border:"none", cursor:"pointer" }}>See all</button>
        </div>

        <div className="card fade-up" style={{ overflow:"hidden", marginBottom:24 }}>
          {realCenters.length > 0 ? realCenters.map((c, i) => (
            <button key={i} onClick={() => navigate("/dashboard/map")}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:12,
                padding:"14px 16px", background:"transparent", border:"none", cursor:"pointer",
                borderBottom: i < realCenters.length-1 ? "1px solid var(--border)" : "none",
                transition:"background 150ms", textAlign:"left",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="var(--bg-elevated)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}
            >
              <div style={{ width:40, height:40, borderRadius:12, background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:18 }}>🏫</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:700, color:"var(--text-1)", margin:0 }}>{c.name}</p>
                <p style={{ fontSize:11, color:"var(--text-3)", margin:"2px 0 0" }}>{c.dist} away</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <span className={c.open ? "badge-safe" : "badge-warning"}>{c.open ? "Open" : "Closed"}</span>
                <ChevronRight style={{ width:14, height:14, color:"var(--text-3)" }} />
              </div>
            </button>
          )) : (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "20px" }}>Loading nearby real-time evacuation centers...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
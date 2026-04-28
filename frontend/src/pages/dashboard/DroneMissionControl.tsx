import { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker
} from "@react-google-maps/api";
import {
  Shield, 
  Wifi, 
  Battery, 
  Navigation, 
  Activity, 
  Play, 
  Square, 
  RotateCcw, 
  Upload, 
  Settings,
  AlertCircle,
  Cpu,
  Map as MapIcon,
  Maximize2
} from "lucide-react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = "AIzaSyAJkxVflV2ETtoOYBRIjR_xPHcN1BRP7g4";
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];
const DEFAULT_COORDS = { lat: 26.1, lng: 91.7 };

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface StreamEvent {
  second: number;
  prediction: string;
  confidence: number;
  risk: string;
  gps?: { lat: number; lng: number };
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function DroneMissionControl() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Simulated Telemetry
  const [battery, setBattery] = useState(98);
  const [signal, setSignal] = useState(100);
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState(() => (localStorage.getItem("theme") || "dark") === "dark");

  useEffect(() => {
    const handleTheme = () => setIsDark((localStorage.getItem("theme") || "dark") === "dark");
    window.addEventListener("themeChange", handleTheme);
    return () => window.removeEventListener("themeChange", handleTheme);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  // Simulate drift
  useEffect(() => {
    if (isStreaming) {
      const t = setInterval(() => {
        setBattery(b => Math.max(0, b - 0.05));
        setSignal(s => Math.min(100, Math.max(85, s + (Math.random() - 0.5) * 5)));
        setAltitude(a => Math.max(10, a + (Math.random() - 0.5) * 2));
        setSpeed(v => Math.max(5, v + (Math.random() - 0.5) * 3));
      }, 2000);
      return () => clearInterval(t);
    } else {
      setAltitude(0);
      setSpeed(0);
    }
  }, [isStreaming]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setEvents([]);
    setBattery(98);
  };

  const startStream = async () => {
    if (!file) return;
    setIsStreaming(true);
    setEvents([]);
    setAltitude(45);
    setSpeed(12.5);
    
    controllerRef.current = new AbortController();
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/predict-stream", {
        method: "POST",
        body: fd,
        signal: controllerRef.current.signal
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      videoRef.current?.play().catch(() => {});

      let buffer = "";
      while (true) {
        const result = await reader?.read();
        if (!result || result.done) break;

        buffer += decoder.decode(result.value);
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (let part of parts) {
          if (!part.startsWith("data:")) continue;
          const data = JSON.parse(part.replace("data: ", ""));
          if (data.status === "completed") {
            setIsStreaming(false);
            return;
          }
          setEvents(prev => [...prev, data]);
        }
      }
    } catch (err) {
      if ((err as any).name !== 'AbortError') console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    controllerRef.current?.abort();
    setIsStreaming(false);
    videoRef.current?.pause();
  };

  const latest = events[events.length - 1];
  const coords = latest?.gps 
    ? { lat: latest.gps.lat, lng: latest.gps.lng } 
    : DEFAULT_COORDS;

  // Auto-pan map
  useEffect(() => {
    if (mapRef.current && latest?.gps) {
      mapRef.current.panTo({ lat: latest.gps.lat, lng: latest.gps.lng });
    }
  }, [latest?.gps]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── MISSION HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 border-l-4 border-l-primary">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <h1 className="text-xl font-heading font-black tracking-tighter text-foreground uppercase">
              Mission Control
            </h1>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            DisasterAI // Aerial Response System
          </p>
        </div>

        {/* VITALS GRID */}
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-foreground font-mono font-bold text-sm">
              <Battery className={`w-4 h-4 ${battery < 20 ? 'text-red-500 animate-bounce' : 'text-green-500'}`} />
              {battery.toFixed(1)}%
            </div>
            <span className="text-[9px] text-muted-foreground uppercase font-bold">Battery</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-foreground font-mono font-bold text-sm">
              <Wifi className={`w-4 h-4 ${signal < 50 ? 'text-yellow-500' : 'text-blue-500'}`} />
              {signal.toFixed(0)}%
            </div>
            <span className="text-[9px] text-muted-foreground uppercase font-bold">Signal</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-foreground font-mono font-bold text-sm">
              <Navigation className="w-4 h-4 text-primary" />
              LOCK
            </div>
            <span className="text-[9px] text-muted-foreground uppercase font-bold">GPS</span>
          </div>
        </div>
      </div>

      {/* ── CORE HUD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* VIDEO HUD (Main View) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative glass-card overflow-hidden bg-black aspect-video border-2 border-border/50 group">
            
            {/* Corner Brackets */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary/50" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary/50" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-primary/50" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-primary/50" />

            {/* Scanning Line Effect */}
            {isStreaming && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-1 bg-primary/10 absolute top-[-10%] animate-[scan_4s_linear_infinite]" 
                     style={{ boxShadow: "0 0 15px var(--primary)" }} />
              </div>
            )}

            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                muted
                playsInline
                loop
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <div className="p-4 rounded-full bg-secondary/30">
                  <Upload className="w-8 h-8 text-primary/40" />
                </div>
                <p className="text-sm font-mono tracking-widest uppercase opacity-40">Awaiting Mission Data</p>
              </div>
            )}

            {/* AI HUD OVERLAY */}
            {latest && (
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md p-3 border border-white/10 rounded-lg">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1 tracking-tighter">AI Analysis</p>
                  <p className={`text-xl font-heading font-black leading-none ${latest.prediction === 'DAMAGE' ? 'text-red-500' : 'text-green-500'}`}>
                    {latest.prediction}
                  </p>
                  <div className="mt-2 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${latest.confidence * 100}%` }} />
                  </div>
                </div>

                <div className="bg-black/60 backdrop-blur-md p-3 border border-white/10 rounded-lg text-right">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1 tracking-tighter">Confidence</p>
                  <p className="text-xl font-heading font-black leading-none text-white">
                    {(latest.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex gap-2">
                 <button className="p-2 bg-black/60 rounded-md border border-white/20 text-white hover:bg-primary transition-colors">
                    <Maximize2 className="w-4 h-4" />
                 </button>
               </div>
               <div className="bg-black/60 px-3 py-1.5 rounded-md border border-white/20 font-mono text-[10px] text-white">
                 LAT: {coords.lat.toFixed(4)} | LNG: {coords.lng.toFixed(4)}
               </div>
            </div>
          </div>

          {/* TELEMETRY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'ALTITUDE', value: `${altitude.toFixed(1)}m`, icon: <Activity className="w-4 h-4" /> },
              { label: 'SPEED', value: `${speed.toFixed(1)}km/h`, icon: <Navigation className="w-4 h-4" /> },
              { label: 'TEMP', value: '32°C', icon: <Cpu className="w-4 h-4" /> },
              { label: 'STATUS', value: isStreaming ? 'ACTIVE' : 'IDLE', icon: <Shield className="w-4 h-4" /> },
            ].map((card, i) => (
              <div key={i} className="glass-card p-3 border-border/40">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest">{card.label}</span>
                  {card.icon}
                </div>
                <div className="text-base font-heading font-black text-foreground">{card.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SIDEBAR CONTROLS & MAP ── */}
        <div className="space-y-6">
          
          {/* CONTROL PANEL */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Mission Params
            </h3>
            
            <div className="space-y-3">
              <label className="block p-3 border border-border border-dashed rounded-xl cursor-pointer hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{file ? file.name : 'Load Footage'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">MP4 / MKV / AVI</p>
                  </div>
                </div>
                <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
              </label>

              <div className="grid grid-cols-2 gap-2">
                {!isStreaming ? (
                  <button
                    onClick={startStream}
                    disabled={!file}
                    className="flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:opacity-90 disabled:opacity-30 transition-all"
                  >
                    <Play className="w-4 h-4" /> PRESET
                  </button>
                ) : (
                  <button
                    onClick={stopStream}
                    className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  >
                    <Square className="w-4 h-4" /> ABORT
                  </button>
                )}
                <button 
                   onClick={() => { setFile(null); setVideoUrl(null); setEvents([]); }}
                   className="flex items-center justify-center gap-2 py-3 bg-secondary/50 text-foreground rounded-xl font-bold text-xs hover:bg-secondary transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> RESET
                </button>
              </div>
            </div>
          </div>

          {/* GOOGLE MAP MINI-WIDGET */}
          <div className="glass-card overflow-hidden border-border/50">
            <div className="p-3 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <MapIcon className="w-3.5 h-3.5" /> Payload Pos
              </h3>
              <span className="text-[9px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">LIVE</span>
            </div>
            
            <div style={{ height: "200px", width: "100%", position: "relative" }}>
              {!isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={coords}
                  zoom={14}
                  onLoad={m => mapRef.current = m}
                  options={{
                    disableDefaultUI: true,
                    gestureHandling: 'none',
                    styles: isDark ? [
                      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
                    ] : []
                  }}
                >
                  <Marker 
                    position={coords} 
                    icon={{
                      path: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z", // Simple drone/arrow shape
                      fillColor: "#FFC107",
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: "#000",
                      scale: 1.5,
                      anchor: new google.maps.Point(12, 12),
                      rotation: speed > 0 ? 0 : 0 // Could rotate based on heading if available
                    }}
                  />
                </GoogleMap>
              )}
            </div>
          </div>

          {/* LOG FEED */}
          <div className="glass-card p-5 h-56 flex flex-col">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
              <AlertCircle className="w-3.5 h-3.5" /> Mission Logs
            </h3>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 no-scrollbar pr-2">
              {events.length === 0 ? (
                <div className="text-muted-foreground opacity-30 italic">No activity registered...</div>
              ) : (
                events.map((e, i) => (
                  <div key={i} className="flex gap-2 leading-relaxed">
                    <span className="text-muted-foreground opacity-50">[{e.second}S]</span>
                    <span className={e.prediction === 'DAMAGE' ? 'text-red-500 font-bold' : 'text-green-500'}>
                      SCAN_RESULT: {e.prediction} ({(e.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
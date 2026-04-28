import { useEffect, useRef, useState, useCallback } from "react";
import { Locate, Navigation, X, MapPin, ChevronDown, Search } from "lucide-react";
import { GoogleMap, useLoadScript, Marker, Circle, DirectionsRenderer, InfoWindow, Polyline } from "@react-google-maps/api";

const USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const GOOGLE_MAPS_API_KEY = "AIzaSyAJkxVflV2ETtoOYBRIjR_xPHcN1BRP7g4";
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

/* All 28 States + 8 UTs of India */
const INDIA_STATES = [
  { name:"Andhra Pradesh",          capital:"Amaravati",         lat:16.5062, lng:80.6480 },
  { name:"Arunachal Pradesh",       capital:"Itanagar",          lat:27.0844, lng:93.6053 },
  { name:"Assam",                   capital:"Dispur",            lat:26.1433, lng:91.7898 },
  { name:"Bihar",                   capital:"Patna",             lat:25.5941, lng:85.1376 },
  { name:"Chhattisgarh",            capital:"Raipur",            lat:21.2514, lng:81.6296 },
  { name:"Goa",                     capital:"Panaji",            lat:15.4989, lng:73.8278 },
  { name:"Gujarat",                 capital:"Gandhinagar",       lat:23.2156, lng:72.6369 },
  { name:"Haryana",                 capital:"Chandigarh",        lat:30.7333, lng:76.7794 },
  { name:"Himachal Pradesh",        capital:"Shimla",            lat:31.1048, lng:77.1734 },
  { name:"Jharkhand",               capital:"Ranchi",            lat:23.3441, lng:85.3096 },
  { name:"Karnataka",               capital:"Bengaluru",         lat:12.9716, lng:77.5946 },
  { name:"Kerala",                  capital:"Thiruvananthapuram",lat:8.5241,  lng:76.9366 },
  { name:"Madhya Pradesh",          capital:"Bhopal",            lat:23.2599, lng:77.4126 },
  { name:"Maharashtra",             capital:"Mumbai",            lat:19.0760, lng:72.8777 },
  { name:"Manipur",                 capital:"Imphal",            lat:24.8170, lng:93.9368 },
  { name:"Meghalaya",               capital:"Shillong",          lat:25.5788, lng:91.8933 },
  { name:"Mizoram",                 capital:"Aizawl",            lat:23.7271, lng:92.7176 },
  { name:"Nagaland",                capital:"Kohima",            lat:25.6751, lng:94.1086 },
  { name:"Odisha",                  capital:"Bhubaneswar",       lat:20.2961, lng:85.8189 },
  { name:"Punjab",                  capital:"Chandigarh",        lat:30.7333, lng:76.7794 },
  { name:"Rajasthan",               capital:"Jaipur",            lat:26.9124, lng:75.7873 },
  { name:"Sikkim",                  capital:"Gangtok",           lat:27.3314, lng:88.6138 },
  { name:"Tamil Nadu",              capital:"Chennai",           lat:13.0827, lng:80.2707 },
  { name:"Telangana",               capital:"Hyderabad",         lat:17.3850, lng:78.4867 },
  { name:"Tripura",                 capital:"Agartala",          lat:23.8315, lng:91.2868 },
  { name:"Uttar Pradesh",           capital:"Lucknow",           lat:26.8467, lng:80.9462 },
  { name:"Uttarakhand",             capital:"Dehradun",          lat:30.3165, lng:78.0322 },
  { name:"West Bengal",             capital:"Kolkata",           lat:22.5726, lng:88.3639 },
  { name:"Andaman & Nicobar",       capital:"Port Blair",        lat:11.6234, lng:92.7265 },
  { name:"Chandigarh (UT)",         capital:"Chandigarh",        lat:30.7333, lng:76.7794 },
  { name:"Dadra & Nagar Haveli",    capital:"Silvassa",          lat:20.2667, lng:73.0167 },
  { name:"Delhi",                   capital:"New Delhi",         lat:28.6139, lng:77.2090 },
  { name:"Jammu & Kashmir",         capital:"Srinagar",          lat:34.0837, lng:74.7973 },
  { name:"Ladakh",                  capital:"Leh",               lat:34.1526, lng:77.5771 },
  { name:"Lakshadweep",             capital:"Kavaratti",         lat:10.5667, lng:72.6417 },
  { name:"Puducherry",              capital:"Pondicherry",       lat:11.9416, lng:79.8083 },
];

type Tab = "monitor" | "route";

const LiveMapPage = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [tab, setTab] = useState<Tab>("monitor");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [originText, setOriginText] = useState("Detecting…");

  // Arrays
  const [earthquakes, setEarthquakes] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  
  // Interactions
  const [activePlace, setActivePlace] = useState<any>(null);

  // Routings
  const [destState, setDestState] = useState<typeof INDIA_STATES[0] | null>(null);
  const [stateSearch, setStateSearch] = useState("");
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [routing, setRouting] = useState(false);
  const [directionsResp, setDirectionsResp] = useState<google.maps.DirectionsResult | null>(null);
  const [fallbackRoute, setFallbackRoute] = useState<{lat:number, lng:number}[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ dist: string; eta: string } | null>(null);

  const filteredStates = INDIA_STATES.filter(s =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
    s.capital.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const [isDark, setIsDark] = useState(() => (localStorage.getItem("theme") || "dark") === "dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark((localStorage.getItem("theme") || "dark") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  /* 1. Fetch Location & Earthquakes */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserPos({ lat, lng });
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        const city = d.address?.city || d.address?.town || d.address?.village || "Your Location";
        setOriginText(city);
      } catch {
        setOriginText("Your Location");
      }
    }, () => {}, { enableHighAccuracy: true });

    fetch(USGS_URL).then(r => r.json()).then(data => {
      const qs = data.features.slice(0, 100).map((f: any) => {
        const [lng, lat] = f.geometry.coordinates;
        const mag = f.properties.mag;
        const col = mag >= 5 ? "#ef4444" : mag >= 3 ? "#f97316" : "#3b82f6";
        return { lat, lng, mag, color: col, place: f.properties.place };
      }).filter((q: any) => q.lat && q.lng);
      setEarthquakes(qs);
    }).catch(() => {});
  }, []);

  /* 2. Fetch Nearby Safe Places once map loaded and pos found */
  useEffect(() => {
    if (isLoaded && userPos && window.google) {
      const service = new window.google.maps.places.PlacesService(document.createElement("div"));
      const pArr: any[] = [];
      let pending = 2;

      const finish = () => {
        if (pending === 0) setPlaces(pArr);
      };

      // Search Hospitals
      service.nearbySearch({
        location: userPos,
        radius: 8000,
        type: "hospital"
      }, (res) => {
        if (res) pArr.push(...res.slice(0,5).map(r => ({ ...r, category: "hospital" })));
        pending--; finish();
      });

      // Search Police
      service.nearbySearch({
        location: userPos,
        radius: 8000,
        type: "police"
      }, (res) => {
        if (res) pArr.push(...res.slice(0,5).map(r => ({ ...r, category: "police" })));
        pending--; finish();
      });
    }
  }, [isLoaded, userPos]);

  /* 3. Build Route natively via DirectionsService, with OSRM fallback */
  const buildRoute = useCallback(() => {
    if (!destState || !userPos || !window.google) return;
    setRouting(true);
    setDirectionsResp(null);
    setFallbackRoute(null);
    setRouteInfo(null);

    const service = new window.google.maps.DirectionsService();
    service.route({
      origin: userPos,
      destination: { lat: destState.lat, lng: destState.lng },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      setRouting(false);
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        setDirectionsResp(result);
        const leg = result.routes[0]?.legs[0];
        if (leg) {
          setRouteInfo({ dist: leg.distance?.text || "", eta: leg.duration?.text || "" });
        }
      } else {
        console.warn("Google Directions API failed/disabled (" + status + "). Falling back to AI OSRM router...");
        fetch(`https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${destState.lng},${destState.lat}?overview=full&geometries=geojson`)
          .then(r => r.json())
          .then(json => {
            if (json.routes && json.routes.length > 0) {
              const route = json.routes[0];
              const coords = route.geometry.coordinates.map(([lng, lat]: number[]) => ({lat, lng}));
              setFallbackRoute(coords);
              const distKm = (route.distance / 1000).toFixed(0);
              const etaHours = Math.floor(route.duration / 3600);
              const etaMins = Math.ceil((route.duration % 3600) / 60);
              setRouteInfo({ dist: `${distKm} km`, eta: etaHours > 0 ? `${etaHours}h ${etaMins}m` : `${etaMins} min` });
              if (mapRef.current) mapRef.current.panTo({ lat: destState.lat, lng: destState.lng });
            } else {
              alert("Routing completely failed (" + status + " & OSRM Down).");
            }
          }).catch(() => alert("Routing network failure."));
      }
    });
  }, [destState, userPos]);

  const clearRoute = () => {
    setDirectionsResp(null);
    setFallbackRoute(null);
    setRouteInfo(null);
    setDestState(null);
    setStateSearch("");
  };

  if (loadError) return <div style={{color:"red", padding:20}}>Error loading maps. Check connection.</div>;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:"var(--bg)", minHeight:"calc(100svh - 80px)" }}>

      {/* ── Header ── */}
      <div style={{ padding:"16px 20px 12px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h1 style={{ fontSize:22, fontWeight:900, color:"var(--text-1)", margin:0 }}>Live Map</h1>

          {/* Tab toggle */}
          <div style={{ display:"flex", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:100, padding:4, gap:4 }}>
            {(["monitor","route"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding:"8px 14px", borderRadius:100, fontSize:12, fontWeight:700, border:"none", cursor:"pointer",
                  background: tab===t ? "var(--yellow)" : "transparent",
                  color: tab===t ? "#000" : "var(--text-3)", transition:"all 200ms",
                }}>
                {t==="monitor" ? "Monitor" : "Evacuation Route"}
              </button>
            ))}
          </div>
        </div>

        {/* Monitor status label */}
        {tab === "monitor" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ef4444", boxShadow:"0 0 6px #ef4444" }} />
            <span style={{ fontSize:12, fontWeight:700, color:"#ef4444" }}>LIVE</span>
            <span style={{ fontSize:12, color:"var(--text-3)" }}>Real‑time monitoring · {earthquakes.length} events · {places.length} safe zones</span>
          </div>
        )}
      </div>

      {/* ── Evacuation Route Panel ── */}
      {tab === "route" && (
        <div style={{ padding:"0 16px 12px", flexShrink:0, borderBottom:"1px solid var(--border)" }}>
          {/* AI Routing label */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--yellow)" strokeWidth={2} strokeLinecap="round">
              <path d="m3 11 19-9-9 19-2-8-8-2z"/>
            </svg>
            <span style={{ fontSize:13, fontWeight:800, color:"var(--text-1)" }}>AI Safe Path Routing</span>
            <div style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,193,7,0.12)", border:"1px solid rgba(255,193,7,0.2)", borderRadius:100, padding:"3px 10px" }}>
              <span style={{ fontSize:10, fontWeight:700, color:"var(--yellow)" }}>Powered by Google Maps</span>
            </div>
          </div>

          {/* Origin */}
          <div style={{ marginBottom:10 }}>
            <p className="section-label" style={{ marginBottom:6 }}>Current Location (Source)</p>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1, position:"relative" }}>
                <input className="input-dark" value={originText} onChange={e => setOriginText(e.target.value)}
                  placeholder="Your location or city name" style={{ paddingRight:14, borderRadius:14 }} />
              </div>
              <button
                onClick={() => { if (userPos && mapRef.current) mapRef.current.panTo(userPos); }}
                style={{
                  width:48, height:48, borderRadius:14, flexShrink:0,
                  background:"var(--yellow-dim)", border:"1.5px solid rgba(255,193,7,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
                }}
              >
                <Locate style={{ width:18, height:18, color:"var(--yellow)" }} />
              </button>
            </div>
          </div>

          {/* Destination */}
          <div style={{ marginBottom:12 }}>
            <p className="section-label" style={{ marginBottom:6 }}>Safe Haven (Destination — State)</p>
            <button
              onClick={() => setShowStatePicker(true)}
              style={{
                width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"14px 16px", borderRadius:14, border:"1px solid var(--border)",
                background:"var(--bg-elevated)", cursor:"pointer",
              }}
            >
              {destState
                ? <div style={{ display:"flex", alignItems:"center", gap:8, textAlign:"left" }}>
                    <span style={{ fontSize:18 }}>📍</span>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:"var(--text-1)", margin:0 }}>{destState.name}</p>
                      <p style={{ fontSize:11, color:"var(--text-3)", margin:0 }}>Capital: {destState.capital}</p>
                    </div>
                  </div>
                : <span style={{ fontSize:13, color:"var(--text-3)", fontWeight:500 }}>Select destination state or city</span>
              }
              <ChevronDown style={{ width:16, height:16, color:"var(--text-3)", flexShrink:0 }} />
            </button>
          </div>

          {/* Generate Button */}
          <button className="btn-yellow" onClick={buildRoute}
            disabled={routing || !destState || !userPos}
            style={{ width:"100%", padding:"15px", fontSize:15, gap:10 }}>
            <Navigation style={{ width:16, height:16 }} />
            {routing ? "Calculating Google Maps Route…" : "Generate Safe Route"}
          </button>

          {/* Route Info */}
          {routeInfo && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12 }}>
              <div style={{ background:"rgba(255,193,7,0.08)", border:"1px solid rgba(255,193,7,0.15)", borderRadius:14, padding:"12px 16px", textAlign:"center" }}>
                <p style={{ fontSize:22, fontWeight:900, color:"var(--yellow)", margin:0 }}>{routeInfo.dist}</p>
                <p style={{ fontSize:11, color:"var(--text-3)", margin:"3px 0 0", fontWeight:600 }}>Distance</p>
              </div>
              <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:14, padding:"12px 16px", textAlign:"center" }}>
                <p style={{ fontSize:22, fontWeight:900, color:"#4ade80", margin:0 }}>{routeInfo.eta}</p>
                <p style={{ fontSize:11, color:"var(--text-3)", margin:"3px 0 0", fontWeight:600 }}>Est. Drive Time</p>
              </div>
            </div>
          )}

          {routeInfo && (
            <button onClick={clearRoute}
              style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:100, padding:"8px 16px", cursor:"pointer", marginTop:10, color:"#f87171", fontWeight:700, fontSize:12 }}>
              <X style={{ width:12, height:12 }} /> Clear Route
            </button>
          )}
        </div>
      )}

      {/* ── MAP — Full Remaining Space ── */}
      <div style={{ flex:1, position:"relative", minHeight:280 }}>
        {!isLoaded && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"var(--bg)", zIndex:10 }}>
            <div style={{ width:32, height:32, border:"3px solid var(--yellow)", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", marginBottom:12 }} />
            <p style={{ fontSize:13, color:"var(--text-3)", fontWeight:600 }}>Loading Google Maps…</p>
          </div>
        )}

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
            center={userPos || { lat: 20.5, lng: 78.9 }}
            zoom={userPos ? 12 : 5}
            onLoad={m => mapRef.current = m}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: isDark ? [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
              ] : []
            }}
          >
            {/* Locate Me Pin */}
            {userPos && window.google && (
              <Marker
                position={userPos}
                icon={{ path: window.google.maps.SymbolPath.CIRCLE, fillColor: "#3b82f6", fillOpacity: 1, strokeWeight: 2, strokeColor: "#fff", scale: 8 }}
                onClick={() => { setActivePlace({ name: originText, category: "you" }); }}
              />
            )}

            {/* Earthquakes */}
            {tab === "monitor" && window.google && earthquakes.map((q, i) => (
              <Marker 
                key={i} 
                position={{ lat: q.lat, lng: q.lng }}
                icon={{ path: window.google.maps.SymbolPath.CIRCLE, fillColor: q.color, fillOpacity: 0.7, strokeWeight: 1, strokeColor: "#fff", scale: q.mag * 2 }}
                onClick={() => setActivePlace({ name: q.place, category: "quake", mag: q.mag, color: q.color })}
              />
            ))}

            {/* Places (Hospitals / Police) */}
            {tab === "monitor" && places.map((p, i) => (
              <Marker
                key={`p${i}`}
                position={p.geometry?.location}
                icon={{ url: p.category === "hospital" ? "https://maps.google.com/mapfiles/ms/icons/red-pushpin.png" : "https://maps.google.com/mapfiles/ms/icons/blue-pushpin.png" }}
                onClick={() => setActivePlace({ name: p.name, category: p.category, address: p.vicinity })}
              />
            ))}

            {/* AI Directions Route (Google) */}
            {directionsResp && (
              <DirectionsRenderer 
                directions={directionsResp} 
                options={{ polylineOptions: { strokeColor: "#FFC107", strokeWeight: 6, strokeOpacity: 0.8 }, markerOptions: { visible: false } }} 
              />
            )}

            {/* AI Directions Route (Fallback OSRM) */}
            {fallbackRoute && (
              <>
                <Polyline path={fallbackRoute} options={{ strokeColor: "#FFC107", strokeWeight: 6, strokeOpacity: 0.8 }} />
                <Marker position={{ lat: destState?.lat || 0, lng: destState?.lng || 0 }} icon={{ url: "https://maps.google.com/mapfiles/ms/icons/green-pushpin.png" }} />
              </>
            )}
            
            {/* Active Place InfoWindow overlay */}
            {activePlace && (
               userPos && activePlace.category === "you" 
                 ? <InfoWindow position={userPos} onCloseClick={() => setActivePlace(null)}><div style={{color:"black", fontWeight:"bold"}}>📍 {activePlace.name}</div></InfoWindow>
                 : activePlace.category === "quake" 
                 ? <InfoWindow position={{ lat: earthquakes.find(q=>q.place===activePlace.name)?.lat, lng: earthquakes.find(q=>q.place===activePlace.name)?.lng }} onCloseClick={() => setActivePlace(null)}><div style={{color:"black"}}><b>🚨 M{activePlace.mag.toFixed(1)} Earthquake</b><br/>{activePlace.name}</div></InfoWindow>
                 : <InfoWindow position={places.find(p=>p.name===activePlace.name)?.geometry.location} onCloseClick={() => setActivePlace(null)}><div style={{color:"black"}}><b>{activePlace.category==='hospital'?'🏥':'🚔'} {activePlace.name}</b><br/>{activePlace.address}</div></InfoWindow>
            )}

          </GoogleMap>
        )}

        {/* Floating Locate Me button */}
        <button onClick={() => { if (userPos && mapRef.current) mapRef.current.panTo(userPos); }}
          style={{
            position:"absolute", bottom:16, left:16, zIndex:5,
            width:44, height:44, borderRadius:13, background:"var(--bg-card)", border:"1px solid var(--border-2)",
            boxShadow:"0 4px 14px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          }}>
          <MapPin style={{ width:18, height:18, color:"var(--yellow)" }} />
        </button>
      </div>

      {/* ── Legend ── */}
      <div style={{ padding:"10px 16px", background:"var(--bg-card)", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", gap:14, flexShrink:0, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Legend:</span>
        {[
          ["#3b82f6","📍 You"],
          ["#ef4444","Quake/Hospital"],
          ["#2563eb","Police/Safe Station"],
        ].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:c, flexShrink:0 }} />
            <span style={{ fontSize:10, fontWeight:600, color:"var(--text-3)" }}>{l}</span>
          </div>
        ))}
      </div>

      {/* ── State Picker Modal ── */}
      {showStatePicker && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"flex-end" }} onClick={() => setShowStatePicker(false)}>
          <div className="slide-up" style={{ background:"var(--bg-card)", borderRadius:"24px 24px 0 0", width:"100%", maxHeight:"75%", display:"flex", flexDirection:"column", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyCenter:"center", padding:"12px 0 0" }}>
              <div style={{ width:36, height:4, borderRadius:100, background:"var(--border-2)", margin:"0 auto" }} />
            </div>
            <div style={{ padding:"12px 16px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text-1)", margin:0 }}>Select Destination State</h3>
              <button onClick={() => setShowStatePicker(false)} style={{ width:32, height:32, borderRadius:10, background:"var(--bg-elevated)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <X style={{ width:14, height:14, color:"var(--text-2)" }} />
              </button>
            </div>
            <div style={{ padding:"12px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:12, padding:"10px 14px" }}>
                <Search style={{ width:14, height:14, color:"var(--text-3)", flexShrink:0 }} />
                <input value={stateSearch} onChange={e => setStateSearch(e.target.value)} placeholder="Search states or capitals…" autoFocus style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:14, color:"var(--text-1)", fontFamily:"Inter,sans-serif" }} />
              </div>
            </div>
            <div style={{ overflowY:"auto", padding:"0 8px 20px", flex:1 }}>
              {filteredStates.map(s => (
                <button key={s.name} onClick={() => { setDestState(s); setShowStatePicker(false); setStateSearch(""); }}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"12px 12px", borderRadius:14, border:"none", background:"transparent", cursor:"pointer", transition:"background 150ms", textAlign:"left", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,193,7,0.1)", border:"1px solid rgba(255,193,7,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MapPin style={{ width:16, height:16, color:"var(--yellow)" }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:"var(--text-1)", margin:0 }}>{s.name}</p>
                    <p style={{ fontSize:11, color:"var(--text-3)", margin:"2px 0 0" }}>Capital: {s.capital}</p>
                  </div>
                  {destState?.name === s.name && <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--yellow)", flexShrink:0 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMapPage;
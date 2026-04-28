import { useState, useRef, useCallback, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker, Polyline, Circle } from "@react-google-maps/api";
import { Navigation, MapPin, Clock, Route, AlertCircle, Crosshair, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyAJkxVflV2ETtoOYBRIjR_xPHcN1BRP7g4";

const INDIA_CITIES = [
  { name: "Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Mumbai", lat: 19.076, lon: 72.877 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  { name: "Surat", lat: 21.1702, lon: 72.8311 },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { name: "Patna", lat: 25.5941, lon: 85.1376 },
  { name: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185 },
  { name: "Guwahati", lat: 26.1445, lon: 91.7362 },
  { name: "Bhubaneswar", lat: 20.2961, lon: 85.8245 },
  { name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
  { name: "Srinagar", lat: 34.0837, lon: 74.7973 },
  { name: "Dehradun", lat: 30.3165, lon: 78.0322 },
];

const HAZARD_ZONES = [
  { lat: 26.0, lon: 91.7, label: "Assam Flood Zone", risk: "CRITICAL", radius: 100000, color: "#3b82f6" },
  { lat: 19.5, lon: 73.5, label: "Maharashtra Flood Zone", risk: "HIGH", radius: 80000, color: "#ef4444" },
  { lat: 14.0, lon: 77.5, label: "Andhra Drought/Flood", risk: "HIGH", radius: 90000, color: "#f59e0b" },
  { lat: 23.5, lon: 87.0, label: "Bengal Cyclone Region", risk: "CRITICAL", radius: 80000, color: "#8b5cf6" },
  { lat: 30.3, lon: 78.0, label: "Uttarakhand Landslide", risk: "HIGH", radius: 60000, color: "#f97316" },
];

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f4c75" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3b82f6" }, { lightness: -40 }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#475569" }, { weight: 1.5 }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
];

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const EvacuationPage = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [source, setSource] = useState("Delhi");
  const [destination, setDestination] = useState("Chennai");
  const [routePath, setRoutePath] = useState<{lat: number, lng: number}[] | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; steps: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useGPS, setUseGPS] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 22.0, lng: 79.0 });
  const [mapZoom, setMapZoom] = useState(5);
  const [panelOpen, setPanelOpen] = useState(true);
  const [stepsOpen, setStepsOpen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Auto-detect user GPS on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setGpsCoords(loc);
          setMapCenter(loc);
          setMapZoom(11);
          setUseGPS(true);
          if (mapRef.current) mapRef.current.panTo(loc);
          if (window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: loc }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                setGpsAddress(results[0].formatted_address);
              } else {
                setGpsAddress(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
              }
            });
          }
        },
        () => {},
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, [isLoaded]);

  const handleGetGPS = () => {
    setGpsLoading(true);
    setError("");
    if (!navigator.geolocation) { setError("Geolocation not supported."); setGpsLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setUserLocation({ lat: latitude, lng: longitude });
        setUseGPS(true);
        setGpsLoading(false);
        if (mapRef.current) mapRef.current.panTo({ lat: latitude, lng: longitude });
        if (window.google) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              setGpsAddress(results[0].formatted_address);
            } else {
              setGpsAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          });
        }
      },
      () => { setError("GPS access denied. Please allow location access."); setGpsLoading(false); }
    );
  };

  const handleGenerateRoute = useCallback(async () => {
    setLoading(true);
    setError("");
    setRoutePath(null);
    setRouteSteps([]);
    setRouteInfo(null);

    const dstCity = INDIA_CITIES.find((c) => c.name === destination);
    let originLat: number, originLng: number;

    if (useGPS && gpsCoords) {
      originLat = gpsCoords.lat;
      originLng = gpsCoords.lng;
    } else {
      const srcCity = INDIA_CITIES.find((c) => c.name === source);
      if (!srcCity) { setError("Source city not found."); setLoading(false); return; }
      originLat = srcCity.lat;
      originLng = srcCity.lon;
    }

    if (!dstCity) { setError("Destination city not found."); setLoading(false); return; }

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${dstCity.lon},${dstCity.lat}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        setError("Could not find a valid route using OSRM.");
        setLoading(false);
        return;
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((coord: number[]) => ({
        lat: coord[1], lng: coord[0]
      }));

      setRoutePath(coordinates);
      setRouteInfo({
        distance: `${(route.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(route.duration / 60)} mins`,
        steps: route.legs[0].steps.length,
      });
      setRouteSteps(route.legs[0].steps);

      // Fit map to show the full route
      if (mapRef.current && coordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        coordinates.forEach((c: any) => bounds.extend(c));
        mapRef.current.fitBounds(bounds, 60);
      }

      setLoading(false);
      setStepsOpen(true);
    } catch {
      setError("Routing calculation failed.");
      setLoading(false);
    }
  }, [source, destination, useGPS, gpsCoords]);

  const srcCity = INDIA_CITIES.find((c) => c.name === source);
  const dstCity = INDIA_CITIES.find((c) => c.name === destination);

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-[600px] glass-card">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
      </div>
    </div>
  );

  return (
    <div className="relative" style={{ height: "calc(100vh - 80px)", minHeight: "600px" }}>

      {/* Full-screen map */}
      <GoogleMap
        mapContainerStyle={{ height: "100%", width: "100%", borderRadius: "12px" }}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        }}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {/* Hazard zone overlays */}
        {HAZARD_ZONES.map((zone, i) => (
          <Circle key={i}
            center={{ lat: zone.lat, lng: zone.lon }}
            radius={zone.radius}
            options={{
              fillColor: zone.color, fillOpacity: 0.12,
              strokeColor: zone.color, strokeOpacity: 0.5, strokeWeight: 1.5,
            }}
          />
        ))}

        {/* User location blue dot */}
        {userLocation && (
          <>
            <Circle center={userLocation} radius={300}
              options={{ fillColor: "#3b82f6", fillOpacity: 0.25, strokeColor: "#3b82f6", strokeOpacity: 0.7, strokeWeight: 2 }} />
            <Marker position={userLocation}
              icon={{ url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", scaledSize: new window.google.maps.Size(36, 36) }}
              title="Your Location"
              animation={google.maps.Animation.BOUNCE}
            />
          </>
        )}

        {/* Source marker (manual city) */}
        {!useGPS && srcCity && (
          <Marker position={{ lat: srcCity.lat, lng: srcCity.lon }}
            icon={{ url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", scaledSize: new window.google.maps.Size(40, 40) }}
            title={`Source: ${srcCity.name}`}
          />
        )}

        {/* Destination marker */}
        {dstCity && (
          <Marker position={{ lat: dstCity.lat, lng: dstCity.lon }}
            icon={{ url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png", scaledSize: new window.google.maps.Size(40, 40) }}
            title={`Destination: ${dstCity.name}`}
          />
        )}

        {/* Route polyline */}
        {routePath && (
          <Polyline path={routePath}
            options={{ strokeColor: "#3b82f6", strokeWeight: 6, strokeOpacity: 0.85 }}
          />
        )}
      </GoogleMap>

      {/* ── Floating Route Panel (left) ─────────────── */}
      <div className="absolute top-3 left-3 z-10 w-72">
        <div className="glass-card shadow-2xl overflow-hidden">
          {/* Panel header */}
          <button
            className="w-full flex items-center justify-between p-4 border-b border-border"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground text-sm">AI Evacuation Route</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[9px] font-bold">OSRM</span>
            </div>
            {panelOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {panelOpen && (
            <div className="p-4 space-y-3">
              {/* Source */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From (Source)</label>
                {useGPS ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 truncate flex items-center gap-1.5">
                      <Crosshair className="h-3 w-3 shrink-0" />
                      {gpsAddress || "GPS Location"}
                    </div>
                    <button onClick={() => { setUseGPS(false); setGpsCoords(null); setGpsAddress(""); }}
                      className="px-2 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <select value={source} onChange={(e) => setSource(e.target.value)}
                      className="flex-1 px-2 py-2 rounded-lg bg-secondary/50 border border-border text-xs focus:ring-1 focus:ring-primary/50 outline-none">
                      {INDIA_CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
                    </select>
                    <button onClick={handleGetGPS} disabled={gpsLoading}
                      className="px-2 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 flex items-center gap-1 text-xs whitespace-nowrap">
                      {gpsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crosshair className="h-3 w-3" />}
                      GPS
                    </button>
                  </div>
                )}
              </div>

              {/* Destination */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To (Safe Haven)</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg bg-secondary/50 border border-border text-xs focus:ring-1 focus:ring-primary/50 outline-none">
                  {INDIA_CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>

              {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}

              <button onClick={handleGenerateRoute} disabled={loading || (!useGPS && source === destination)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculating...</> : <><Route className="h-3.5 w-3.5" /> Generate Safe Route</>}
              </button>

              {/* Route summary */}
              {routeInfo && (
                <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-1 text-xs text-blue-400 font-semibold">
                    <Route className="h-3.5 w-3.5" /> Route Summary
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary/30 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Distance</p>
                      <p className="text-sm font-bold text-foreground">{routeInfo.distance}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Est. Time</p>
                      <p className="text-sm font-bold text-foreground">{routeInfo.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3 text-blue-400" />
                    <span>{useGPS ? "Your GPS" : source}</span>
                    <span className="text-primary mx-1">→</span>
                    <MapPin className="h-3 w-3 text-green-400" />
                    <span>{destination}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Turn-by-Turn steps (collapsible, bottom) ── */}
      {routeSteps.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="glass-card shadow-2xl overflow-hidden">
            <button className="w-full flex items-center justify-between p-3 border-b border-border"
              onClick={() => setStepsOpen(!stepsOpen)}>
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" /> Turn-by-Turn Navigation
                <span className="text-xs text-muted-foreground">({routeSteps.length} steps)</span>
              </span>
              {stepsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
            </button>
            {stepsOpen && (
              <div className="max-h-48 overflow-y-auto">
                {routeSteps.map((step, i) => {
                  const modifier = step.maneuver.modifier ? ` (${step.maneuver.modifier})` : "";
                  const action = `${step.maneuver.type}${modifier}`;
                  const name = step.name ? ` onto ${step.name}` : "";
                  return (
                    <div key={i} className="flex items-start gap-3 p-2.5 hover:bg-secondary/30 border-b border-border/50 last:border-0">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground capitalize">{action}{name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Route className="h-2.5 w-2.5" />{(step.distance / 1000).toFixed(2)} km</span>
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{Math.round(step.duration / 60)} min</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
          <Navigation className="h-3 w-3 text-blue-400" /> Evacuation Router
          {userLocation && <span className="text-blue-400 ml-1">📍 GPS Active</span>}
        </div>
      </div>
    </div>
  );
};

export default EvacuationPage;

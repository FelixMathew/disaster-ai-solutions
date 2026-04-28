import { useState, useEffect } from "react";
import { Wind, Droplets, Thermometer, MapPin, RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type WeatherData = {
  city: string;
  country: string;
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  wind_speed: number;
  icon: string;
  safety_status: "SAFE" | "WARNING" | "DANGER";
};

const LiveWeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchWeather = (lat: number, lon: number) => {
    setLoading(true);
    setError("");
    fetch(`/weather?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === "success") {
          setWeather(data);
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          setError(data.message || "Failed to fetch weather");
        }
      })
      .catch(() => setError("Weather unavailable"))
      .finally(() => setLoading(false));
  };

  const detectAndFetch = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { setError("GPS denied — allow location for live weather"); setLoading(false); },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    detectAndFetch();
    const interval = setInterval(detectAndFetch, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    SAFE: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Safe Conditions", icon: <CheckCircle2 className="h-4 w-4 text-green-400" /> },
    WARNING: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Weather Warning", icon: <AlertTriangle className="h-4 w-4 text-yellow-400" /> },
    DANGER: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Dangerous Conditions", icon: <AlertTriangle className="h-4 w-4 text-red-400" /> },
  };

  const status = weather?.safety_status ? statusConfig[weather.safety_status] : null;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌤️</span>
          <h3 className="font-heading font-bold text-foreground text-sm">Live Weather</h3>
          {weather && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <button onClick={detectAndFetch} disabled={loading}
          className="p-1.5 rounded-lg bg-secondary/50 border border-border hover:border-primary/40 transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !weather && (
        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Detecting your location...
        </div>
      )}

      {error && !weather && (
        <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center space-y-2">
          <p className="text-xs text-muted-foreground">{error}</p>
          <button onClick={detectAndFetch}
            className="text-xs text-primary hover:underline">Allow GPS & retry</button>
        </div>
      )}

      {weather && (
        <>
          {/* Location + Safety Status */}
          <div className={`flex items-center justify-between p-2.5 rounded-xl border ${status?.bg}`}>
            <div className="flex items-center gap-2">
              {status?.icon}
              <span className={`text-xs font-semibold ${status?.color}`}>{status?.label}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {weather.city}{weather.country ? `, ${weather.country}` : ""}
            </div>
          </div>

          {/* Main temp + icon */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-extrabold text-foreground">{weather.temp}°C</p>
              <p className="text-xs text-muted-foreground mt-0.5">{weather.description} · Feels {weather.feels_like}°C</p>
            </div>
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              className="w-16 h-16 drop-shadow-lg"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/30 rounded-xl p-2.5 text-center">
              <Thermometer className="h-3.5 w-3.5 text-orange-400 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Feels Like</p>
              <p className="text-sm font-bold text-foreground">{weather.feels_like}°C</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-2.5 text-center">
              <Droplets className="h-3.5 w-3.5 text-blue-400 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Humidity</p>
              <p className="text-sm font-bold text-foreground">{weather.humidity}%</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-2.5 text-center">
              <Wind className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Wind</p>
              <p className="text-sm font-bold text-foreground">{weather.wind_speed} km/h</p>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground text-right">Updated {lastUpdated}</p>
          )}
        </>
      )}
    </div>
  );
};

export default LiveWeatherWidget;

import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Gauge, Droplets, Thermometer, Eye, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

const CyclonePrediction = () => {
  const [wind, setWind] = useState("100");
  const [pressure, setPressure] = useState("980");
  const [humidity, setHumidity] = useState("85");
  const [sst, setSst] = useState("28");
  const [visibility, setVisibility] = useState("5");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/predict/cyclone",
        null,
        {
          params: {
            wind_speed: parseFloat(wind),
            pressure: parseFloat(pressure),
            humidity: parseFloat(humidity),
            sst: parseFloat(sst),
            visibility: parseFloat(visibility)
          }
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error("Prediction failed", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "HIGH": return "#EF4444";
      case "MEDIUM": return "#F59E0B";
      case "LOW": return "#10B981";
      default: return "#6B7280";
    }
  };

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(12px)",
      borderRadius: "24px",
      padding: "32px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      color: "#fff",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ padding: "10px", background: "#FFC107", borderRadius: "12px" }}>
          <Activity size={24} color="#000" />
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>Cyclone Intelligence</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Input Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <InputGroup label="Wind Speed (km/h)" icon={<Wind size={18} />} value={wind} onChange={setWind} min="0" max="300" />
          <InputGroup label="Pressure (hPa)" icon={<Gauge size={18} />} value={pressure} onChange={setPressure} min="900" max="1050" />
          <InputGroup label="Humidity (%)" icon={<Droplets size={18} />} value={humidity} onChange={setHumidity} min="0" max="100" />
          <InputGroup label="SST (°C)" icon={<Thermometer size={18} />} value={sst} onChange={setSst} min="15" max="40" />
          <InputGroup label="Visibility (km)" icon={<Eye size={18} />} value={visibility} onChange={setVisibility} min="0" max="20" />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePredict}
            disabled={loading}
            style={{
              marginTop: "12px",
              padding: "16px",
              background: "#FFC107",
              border: "none",
              borderRadius: "16px",
              color: "#000",
              fontWeight: 800,
              fontSize: "16px",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255, 193, 7, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading ? "Analyzing..." : "Generate Prediction"}
          </motion.button>
        </div>

        {/* Result Section */}
        <div style={{
          background: "rgba(0,0,0,0.2)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
          position: "relative",
          overflow: "hidden"
        }}>
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center", opacity: 0.5 }}
              >
                <Activity size={48} style={{ marginBottom: "16px" }} />
                <p>Input data and run analysis to see prediction levels</p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: "100%", textAlign: "center" }}
              >
                <div style={{ 
                  fontSize: "14px", 
                  fontWeight: 800, 
                  color: getRiskColor(result.risk),
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "8px"
                }}>
                  {result.risk} RISK DETECTED
                </div>
                
                <h3 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.1 }}>
                  {result.prediction}
                </h3>

                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>Confidence</span>
                    <span>{result.confidence}%</span>
                  </div>
                  <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      transition={{ duration: 1 }}
                      style={{ height: "100%", background: getRiskColor(result.risk) }}
                    />
                  </div>
                </div>

                <div style={{ 
                  background: "rgba(255,255,255,0.05)", 
                  padding: "16px", 
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  textAlign: "left"
                }}>
                  {result.level >= 3 ? <AlertTriangle color="#EF4444" /> : <ShieldCheck color="#10B981" />}
                  <span style={{ fontSize: "13px", opacity: 0.9 }}>
                    {result.level >= 3 
                      ? "Critical conditions detected. Immediate evacuation or emergency protocols recommended."
                      : "Current metrics are within manageable ranges. Continue monitoring updates."
                    }
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon, value, onChange, min, max }: any) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, opacity: 0.8 }}>
      {icon}
      {label}
    </div>
    <div style={{ position: "relative" }}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "6px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "3px",
          appearance: "none",
          cursor: "pointer"
        }}
      />
      <div style={{
        marginTop: "8px",
        fontSize: "14px",
        fontWeight: 700,
        color: "#FFC107"
      }}>
        {value}
      </div>
    </div>
  </div>
);

export default CyclonePrediction;
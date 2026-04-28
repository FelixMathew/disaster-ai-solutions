import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle, Flame, History,
  Upload, Trash2, FileImage, Download, Video,
  PlayCircle, Camera, Link, X, RefreshCw,
  AlertTriangle, Zap
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from "recharts";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
type Prediction = {
  prediction: string;
  confidence: number;
  risk?: string;
  recommendations?: string[];
  filename?: string;
  timestamp?: string;
  sourceType?: "camera" | "gallery" | "url";
  previewUrl?: string;
};

type VideoTimelineEvent = {
  second: number;
  prediction: string;
  confidence: number;
  risk: string;
  score: number;
};

type VideoPrediction = {
  overall_prediction: string;
  overall_confidence: number;
  overall_risk: string;
  timeline: VideoTimelineEvent[];
  recommendations: string[];
  filename: string;
  timestamp: string;
};

type ImageInputMode = "gallery" | "camera" | "url";

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const getRiskUI = (pred: string) => {
  const p = pred.toUpperCase();
  if (p === "DAMAGE") return {
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30",
    icon: <Flame className="w-5 h-5 text-red-500" />,
    badge: "HIGH RISK",
    badgeCls: "bg-red-500/20 text-red-400",
    barColor: "#ef4444",
  };
  return {
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/30",
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    badge: "SAFE",
    badgeCls: "bg-green-500/20 text-green-400",
    barColor: "#22c55e",
  };
};

const HISTORY_KEY = "disasterai_predictions";
const VIDEO_HISTORY_KEY = "disasterai_video_predictions";

// ─────────────────────────────────────────
// RESULT CARD — shared between Image AI & History
// ─────────────────────────────────────────
const ResultCard = ({ r, compact = false }: { r: Prediction; compact?: boolean }) => {
  const ui = getRiskUI(r.prediction);
  const pct = Math.round((r.confidence || 0) * 100);

  return (
    <div className={`glass-card p-4 border ${ui.bg} ${compact ? "text-xs" : ""}`}>
      {/* Preview image if available */}
      {r.previewUrl && !compact && (
        <div className="mb-3 rounded-lg overflow-hidden border border-border/30 max-h-40">
          <img src={r.previewUrl} alt="analyzed" className="w-full h-40 object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {ui.icon}
          <div>
            <p className={`font-bold text-sm ${ui.color}`}>{r.prediction.toUpperCase()}</p>
            {r.filename && (
              <p className="text-xs text-muted-foreground truncate max-w-44">{r.filename}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ui.badgeCls}`}>
            {r.risk || ui.badge}
          </span>
          {r.sourceType && (
            <p className="text-[10px] text-muted-foreground mt-1 capitalize">
              {r.sourceType === "url" ? "Internet URL" : r.sourceType === "camera" ? "Live Camera" : "Photo Gallery"}
            </p>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Confidence</span>
          <span className="font-bold" style={{ color: ui.barColor }}>{pct}%</span>
        </div>
        <div className="w-full bg-secondary/50 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${ui.barColor}88, ${ui.barColor})` }}
          />
        </div>
      </div>

      {r.recommendations && r.recommendations.length > 0 && !compact && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs font-semibold text-foreground mb-1.5">Recommended Actions:</p>
          <ul className="space-y-1">
            {r.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className={`mt-0.5 ${ui.color}`}>•</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {compact && r.timestamp && (
        <p className="text-[10px] text-muted-foreground mt-2">{r.timestamp}</p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const Predict = () => {
  const location = useLocation();
  const [tab, setTab] = useState<"predict" | "video" | "history">(() => {
    if (location.pathname.includes("video-ai")) return "video";
    if (location.pathname.includes("history")) return "history";
    return "predict";
  });

  // Sync tab with URL changes (e.g. when navigating from AI Tools sheet)
  useEffect(() => {
    if (location.pathname.includes("video-ai")) setTab("video");
    else if (location.pathname.includes("image-ai")) setTab("predict");
    else if (location.pathname.includes("predict")) setTab("predict");
  }, [location.pathname]);

  const [imageMode, setImageMode] = useState<ImageInputMode>("gallery");

  // ── Gallery / multi-file state ──
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<Prediction[]>([]);

  // ── Camera state ──
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraCapture, setCameraCapture] = useState<string | null>(null);
  const [cameraFile, setCameraFile] = useState<File | null>(null);
  const videoStreamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // ── URL state ──
  const [urlInput, setUrlInput] = useState("");
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [urlValid, setUrlValid] = useState(false);

  // ── Video state ──
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [videoResult, setVideoResult] = useState<VideoPrediction | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Common ──
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [videoHistory, setVideoHistory] = useState<VideoPrediction[]>([]);

  // Load history on mount
  useEffect(() => {
    const h = localStorage.getItem(HISTORY_KEY);
    if (h) setHistory(JSON.parse(h));
    const vh = localStorage.getItem(VIDEO_HISTORY_KEY);
    if (vh) setVideoHistory(JSON.parse(vh));
  }, []);

  // ──────────────────────────────
  // CAMERA LOGIC
  // ──────────────────────────────
  const startCamera = useCallback(async (mode: "user" | "environment" = "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoStreamRef.current) {
        videoStreamRef.current.srcObject = stream;
        videoStreamRef.current.play();
      }
      setCameraActive(true);
      setCameraCapture(null);
      setCameraFile(null);
    } catch (err) {
      alert("Camera not available. Please allow camera access or use Gallery/URL mode.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const capturePhoto = () => {
    if (!videoStreamRef.current || !canvasRef.current) return;
    const video = videoStreamRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCameraCapture(dataUrl);

    // Convert dataURL to File
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const f = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
      setCameraFile(f);
    });
    stopCamera();
  };

  // Auto-start camera when mode switches to camera
  useEffect(() => {
    if (imageMode === "camera" && !cameraCapture) {
      startCamera(facingMode);
    } else if (imageMode !== "camera") {
      stopCamera();
    }
  }, [imageMode]);

  // ──────────────────────────────
  // URL LOGIC
  // ──────────────────────────────
  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setUrlPreview(null);
    setUrlValid(false);
    try {
      const url = new URL(val);
      if (url.protocol === "http:" || url.protocol === "https:") {
        setUrlPreview(val);
        setUrlValid(true);
      }
    } catch {}
  };

  // ──────────────────────────────
  // GALLERY LOGIC
  // ──────────────────────────────
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    setFiles(picked);
    setPreviews(picked.map(f => URL.createObjectURL(f)));
    setResults([]);
  };

  // ──────────────────────────────
  // PREDICTION: IMAGE
  // ──────────────────────────────
  const buildHistory = (newR: Prediction[]) => {
    const updated = [...newR, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleGalleryPredict = async () => {
    if (!files.length) return alert("Please select at least one image.");
    setLoading(true);
    const newResults: Prediction[] = [];
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append("file", files[i]);
      try {
        const res = await axios.post("/api/predict", fd);
        newResults.push({
          ...res.data,
          filename: files[i].name,
          timestamp: new Date().toLocaleString(),
          sourceType: "gallery",
          previewUrl: previews[i],
        });
      } catch {
        newResults.push({
          prediction: "Error", confidence: 0,
          filename: files[i].name,
          timestamp: new Date().toLocaleString(),
          sourceType: "gallery",
          previewUrl: previews[i],
        });
      }
    }
    setResults(newResults);
    buildHistory(newResults);
    setLoading(false);
  };

  const handleCameraPredict = async () => {
    if (!cameraFile || !cameraCapture) return alert("Take a photo first.");
    setLoading(true);
    const fd = new FormData();
    fd.append("file", cameraFile);
    try {
      const res = await axios.post("/api/predict", fd);
      const r: Prediction = {
        ...res.data,
        filename: cameraFile.name,
        timestamp: new Date().toLocaleString(),
        sourceType: "camera",
        previewUrl: cameraCapture,
      };
      setResults([r]);
      buildHistory([r]);
    } catch {
      alert("Analysis failed. Please try again.");
    }
    setLoading(false);
  };

  const handleUrlPredict = async () => {
    if (!urlValid || !urlInput) return alert("Please enter a valid image URL.");
    setLoading(true);
    try {
      const res = await axios.post("/api/predict-url", { url: urlInput });
      const r: Prediction = {
        ...res.data,
        filename: urlInput.split("/").pop()?.slice(0, 40) || "internet_image",
        timestamp: new Date().toLocaleString(),
        sourceType: "url",
        previewUrl: urlInput,
      };
      setResults([r]);
      buildHistory([r]);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Failed to analyze URL image. Make sure it's a direct image link.");
    }
    setLoading(false);
  };

  const handlePredict = () => {
    if (imageMode === "gallery") return handleGalleryPredict();
    if (imageMode === "camera") return handleCameraPredict();
    if (imageMode === "url") return handleUrlPredict();
  };

  // ──────────────────────────────
  // PREDICTION: VIDEO
  // ──────────────────────────────
  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const f = e.target.files[0];
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
    setVideoResult(null);
    setCurrentTime(0);
  };

  const handlePredictVideo = async () => {
    if (!videoFile) return alert("Please select a video file.");
    setLoading(true);
    const fd = new FormData();
    fd.append("file", videoFile);
    try {
      const res = await axios.post("/api/predict-video", fd);
      const data = res.data;
      const mappedTimeline = (data.timeline || []).map((t: any) => ({
        ...t,
        score: t.prediction?.toUpperCase() === "DAMAGE" ? 1 : 0,
      }));
      const finalResult: VideoPrediction = {
        ...data,
        overall_prediction: data.overall || data.overall_prediction || "SAFE",
        timeline: mappedTimeline,
        filename: videoFile.name,
        timestamp: new Date().toLocaleString()
      };
      setVideoResult(finalResult);
      const updated = [finalResult, ...videoHistory].slice(0, 20);
      setVideoHistory(updated);
      localStorage.setItem(VIDEO_HISTORY_KEY, JSON.stringify(updated));
    } catch (err: any) {
      console.error("Video processing error:", err);
      const msg = err?.response?.data?.detail || "Failed to process video. Large videos may take time; ensure backend is running.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(Math.floor(videoRef.current.currentTime));
  };

  // ──────────────────────────────
  // MISC
  // ──────────────────────────────
  const clearHistory = () => {
    setHistory([]); setVideoHistory([]);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(VIDEO_HISTORY_KEY);
  };

  const downloadReport = () => {
    const items = results.length ? results : history;
    if (!items.length) return;
    const lines = items.map(r =>
      `[${r.timestamp || ""}] ${r.filename || ""} — ${r.prediction} (${((r.confidence || 0) * 100).toFixed(1)}%) — Risk: ${r.risk || ""} — Source: ${r.sourceType || "gallery"}`
    );
    const blob = new Blob(["DisasterAI Real-Time Prediction Report\n\n" + lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `disasterai_report_${Date.now()}.txt`;
    a.click();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold mb-1">Second: {label}s</p>
          <p className="text-foreground">Prediction: <span className="font-semibold">{d.prediction}</span></p>
          <p className="text-muted-foreground">Confidence: {Math.round((d.confidence || 0) * 100)}%</p>
          <p className="text-risk-critical mt-1 font-semibold">Risk: {d.risk}</p>
        </div>
      );
    }
    return null;
  };

  // ─────── Determine if predict button is ready ───────
  const canPredict = (() => {
    if (loading) return false;
    if (imageMode === "gallery") return files.length > 0;
    if (imageMode === "camera") return !!cameraCapture;
    if (imageMode === "url") return urlValid;
    return false;
  })();

  return (
    <div className="min-h-[85vh] bg-background text-foreground space-y-4 pb-4">

      {/* ── TOP TABS ── */}
      <div className="flex gap-1 bg-secondary/40 rounded-xl p-1 border border-border w-fit">
        {(["predict", "video", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "predict" ? <FileImage className="h-3.5 w-3.5" /> : t === "video" ? <Video className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
            {t === "predict" ? "Image AI" : t === "video" ? "Video AI" : `History (${history.length + videoHistory.length})`}
          </button>
        ))}
        {(results.length > 0 || history.length > 0) && (
          <button onClick={downloadReport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        )}
      </div>

      {/* ══════════════════════════════════
          IMAGE AI TAB
      ══════════════════════════════════ */}
      {tab === "predict" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-5">
            <h2 className="text-base font-heading font-bold text-foreground mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Real-Time Disaster Detection
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Take a photo, upload from gallery, or paste an image URL — our AI will instantly analyze it for disaster damage.
            </p>

            {/* ── Input Mode Selector ── */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { mode: "gallery" as ImageInputMode, icon: Upload, label: "Gallery" },
                { mode: "camera" as ImageInputMode, icon: Camera, label: "Camera" },
                { mode: "url" as ImageInputMode, icon: Link, label: "URL" },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => { setImageMode(mode); setResults([]); }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    imageMode === mode
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── GALLERY MODE ── */}
            {imageMode === "gallery" && (
              <>
                <label className="block w-full border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-all group">
                  <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-muted-foreground">
                    Choose from <span className="text-primary font-semibold">Gallery</span> or drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Any disaster photo from your phone storage or downloaded from internet</p>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} capture={undefined} />
                </label>
                {previews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {previews.map((p, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                        <img src={p} alt="preview" className="w-full h-20 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-[9px] text-white text-center px-1 truncate">{files[i]?.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── CAMERA MODE ── */}
            {imageMode === "camera" && (
              <div className="space-y-3">
                {!cameraCapture ? (
                  cameraActive ? (
                    <div className="relative rounded-xl overflow-hidden border border-border bg-black">
                      <video
                        ref={videoStreamRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-64 object-cover"
                      />
                      {/* Camera HUD */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                          <span className="text-[10px] bg-black/60 text-white px-2 py-1 rounded-full font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                          <span className="text-[10px] bg-black/60 text-white px-2 py-1 rounded-full">
                            {facingMode === "environment" ? "Back Camera" : "Front Camera"}
                          </span>
                        </div>
                        {/* Focus grid */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 border-2 border-white/30 rounded-xl" />
                        </div>
                      </div>
                      {/* Camera controls */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-4">
                        <button
                          onClick={flipCamera}
                          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30"
                        >
                          <RefreshCw className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={capturePhoto}
                          className="w-14 h-14 rounded-full bg-white border-4 border-white/50 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                          <Camera className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                          onClick={stopCamera}
                          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                  ) : (
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="w-full border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center transition-all group"
                    >
                      <Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                      <p className="text-sm text-muted-foreground">Tap to open <span className="text-primary font-semibold">Live Camera</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Point at any disaster scene for instant AI analysis</p>
                    </button>
                  )
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary/40">
                    <img src={cameraCapture} alt="captured" className="w-full max-h-64 object-cover" />
                    <div className="absolute top-2 left-2 bg-primary/90 text-black text-[10px] font-bold px-2 py-1 rounded-full">
                      CAPTURED
                    </div>
                    <button
                      onClick={() => { setCameraCapture(null); setCameraFile(null); startCamera(facingMode); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}
              </div>
            )}

            {/* ── URL MODE ── */}
            {imageMode === "url" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center gap-2 bg-secondary/30 border rounded-xl px-3 py-2.5 ${urlValid ? "border-green-500/40" : "border-border"}`}>
                    <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => handleUrlChange(e.target.value)}
                      placeholder="https://example.com/flood-photo.jpg"
                      className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                    {urlInput && (
                      <button onClick={() => { setUrlInput(""); setUrlPreview(null); setUrlValid(false); }}>
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  Paste any direct image URL from internet news, satellite imagery, or social media
                </p>
                {urlPreview && (
                  <div className="rounded-xl overflow-hidden border border-border">
                    <img
                      src={urlPreview}
                      alt="url preview"
                      className="w-full max-h-48 object-cover"
                      onError={() => { setUrlValid(false); setUrlPreview(null); }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── PREDICT BUTTON ── */}
            <button
              onClick={handlePredict}
              disabled={!canPredict}
              className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
              style={{
                background: canPredict
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : undefined,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analyzing with AI...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  {imageMode === "camera" && !cameraCapture ? "Take Photo First" :
                   imageMode === "url" && !urlValid ? "Enter Valid Image URL" :
                   "Analyze for Disaster Damage"}
                </span>
              )}
            </button>
          </div>

          {/* ── RESULTS ── */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  Analysis Results
                </h3>
                <button onClick={() => setResults([])} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {results.map((r, i) => <ResultCard key={i} r={r} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          VIDEO AI TAB
      ══════════════════════════════════ */}
      {tab === "video" && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-5">
            <h2 className="text-base font-heading font-bold text-foreground mb-1 flex items-center gap-2">
              <Video className="w-4 h-4 text-pink-500" /> Frame-by-Frame Video Scan
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Upload any disaster video — from your phone, drone footage, or news clips. AI scans every second for damage.
            </p>

            <label className="block w-full border-2 border-dashed border-border hover:border-pink-500/50 rounded-xl p-6 text-center cursor-pointer transition-all group">
              <PlayCircle className="h-8 w-8 text-muted-foreground group-hover:text-pink-500 mx-auto mb-2 transition-colors" />
              <p className="text-sm text-muted-foreground">
                Select <span className="text-pink-500 font-semibold">video file</span> to scan
              </p>
              <p className="text-xs text-muted-foreground mt-1">Phone recordings, drone footage, CCTV clips — any format</p>
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
            </label>

            {videoPreview && (
              <div className="mt-3 rounded-xl overflow-hidden border border-border">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  controls
                  className="w-full max-h-72 bg-black"
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>
            )}

            <button
              onClick={handlePredictVideo}
              disabled={loading || !videoFile}
              className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
              style={{
                background: videoFile && !loading
                  ? "linear-gradient(135deg, #ec4899, #f43f5e)"
                  : undefined,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Extracting Frames & Scanning...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Video className="w-4 h-4" /> Scan Video for Disasters
                </span>
              )}
            </button>
          </div>

          {/* Video Results */}
          {videoResult && (
            <div className="glass-card p-5 animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">Video Analysis Report</h3>
                  <p className="text-xs text-muted-foreground">{videoResult.filename}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Overall</p>
                  <p className={`font-bold text-sm ${getRiskUI(videoResult.overall_prediction).color}`}>
                    {videoResult.overall_prediction.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Overall confidence bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Overall Confidence</span>
                  <span className="font-bold" style={{ color: getRiskUI(videoResult.overall_prediction).barColor }}>
                    {Math.round((videoResult.overall_confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-secondary/50 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.round((videoResult.overall_confidence || 0) * 100)}%`,
                      background: getRiskUI(videoResult.overall_prediction).barColor
                    }}
                  />
                </div>
              </div>

              {videoResult.recommendations?.length > 0 && (
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-xs font-bold text-foreground mb-2">Recommended Actions:</p>
                  <ul className="space-y-1">
                    {videoResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeline Chart */}
              {videoResult.timeline?.length > 0 && (
                <div className="h-40 w-full">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">Timeline — Damage per Second</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={videoResult.timeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="second" tick={{ fontSize: 9, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={v => v === 1 ? "DMG" : "OK"} tick={{ fontSize: 9, fill: "var(--text-3)" }} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <ReferenceLine x={currentTime} stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="score" stroke="#ef4444" fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Second-by-second chips */}
              {videoResult.timeline?.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {videoResult.timeline.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => { if (videoRef.current) videoRef.current.currentTime = img.second; }}
                      className={`shrink-0 min-w-[52px] py-1.5 px-2 rounded-lg border text-center text-[10px] font-bold transition-all ${
                        currentTime === img.second
                          ? "border-primary bg-primary/20 text-primary"
                          : img.prediction === "DAMAGE"
                            ? "border-red-500/30 bg-red-500/10 text-red-400"
                            : "border-border bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      {img.second}s<br />
                      <span className="font-normal">{img.prediction === "DAMAGE" ? "DMG" : "OK"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          HISTORY TAB
      ══════════════════════════════════ */}
      {tab === "history" && (
        <div className="glass-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-foreground">Scan History</h3>
            {(history.length > 0 || videoHistory.length > 0) && (
              <button onClick={clearHistory} className="flex items-center gap-1.5 text-xs text-destructive hover:opacity-80 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" /> Clear All
              </button>
            )}
          </div>

          {videoHistory.length > 0 && (
            <>
              <h4 className="text-xs font-bold text-muted-foreground mb-2 mt-3 uppercase tracking-wider">Video Scans</h4>
              <div className="space-y-2 mb-4">
                {videoHistory.map((r, i) => {
                  const ui = getRiskUI(r.overall_prediction);
                  return (
                    <div key={`vid-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
                      <Video className="w-5 h-5 text-pink-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${ui.color}`}>{r.overall_prediction}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.filename} · {r.timestamp}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${ui.badgeCls}`}>{r.overall_risk || ui.badge}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {history.length > 0 && (
            <>
              <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Image Scans</h4>
              <div className="space-y-3">
                {history.map((r, i) => <ResultCard key={`img-${i}`} r={r} compact />)}
              </div>
            </>
          )}

          {history.length === 0 && videoHistory.length === 0 && (
            <div className="text-center py-10">
              <FileImage className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No scans yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run an Image AI or Video AI scan to see results here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Predict;
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, Mail, Lock, Eye, EyeOff, ChevronLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/utils/api";

const QUOTES = [
  "Safety is a way of life, not just a set of rules.",
  "The storms of life reveal the strength we didn't know we had.",
  "Prepared communities save lives every single day.",
  "Early warnings save thousands — stay alert.",
  "Together, we are stronger than any disaster.",
];

const HERO_IMAGES = ["/pic1.png", "/pic2.png", "/pic.png", "/pic3.png", "/pic4.png"];

/* ══════════════════════════════════════
   SCREEN 1 — Welcome / Splash (LIGHT)
══════════════════════════════════════ */
const SplashScreen = ({ onContinue }: { onContinue: () => void }) => {
  const [qIdx, setQIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const qInterval = setInterval(() => setQIdx(i => (i + 1) % QUOTES.length), 5000);
    const iInterval = setInterval(() => setImgIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => {
      clearInterval(qInterval);
      clearInterval(iInterval);
    };
  }, []);

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      style={{
        height: "100svh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle top-right accent */}
      <div style={{
        position: "absolute", top: -60, right: -60,
        width: 220, height: 220, borderRadius: "50%",
        background: "rgba(255,193,7,0.08)", filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      {/* ── Brand bar ── */}
      <div style={{
        padding: "36px 28px 0",
        display: "flex", alignItems: "center", gap: 10,
        flexShrink: 0,
      }}>
        {/* Brand icon */}
        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, #FFC107, #FF8F00)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
              fill="rgba(0,0,0,0.8)" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontWeight: 900, fontSize: 13, color: "#111", letterSpacing: "-0.2px" }}>
          DISASTERAI
        </span>
      </div>

      {/* ── Greeting text ── */}
      <div style={{ padding: "16px 28px 4px", flexShrink: 0 }}>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: 0, lineHeight: 1.1, letterSpacing: "-0.5px" }}
        >
          Hello, Guest
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ fontSize: 11, color: "#888", fontWeight: 500, margin: "2px 0 0" }}
        >
          Your AI-powered emergency response companion
        </motion.p>
      </div>

      {/* ── Hero Image (Slideshow) ── */}
      <div style={{ 
        flex: 1, 
        minHeight: 0, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        overflow: "hidden", 
        position: "relative",
        padding: "20px"
      }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIdx}
            src={HERO_IMAGES[imgIdx]}
            alt={`DisasterAI Hero ${imgIdx + 1}`}
            initial={{ opacity: 0, scale: 1.0 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              width: "100%",
              maxWidth: 520,
              height: "90%",
              objectFit: "contain",
              display: "block",
              mixBlendMode: "multiply",
              filter: "contrast(1.02) brightness(1.02)",
            }}
          />
        </AnimatePresence>
      </div>

      {/* ── Bottom panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{
          background: "#FFFFFF",
          padding: "12px 24px 28px",
          borderTop: "1px solid rgba(0,0,0,0.05)",
          flexShrink: 0,
        }}
      >
        {/* "Get started" heading */}
        <div style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: "0 0 2px", lineHeight: 1.2 }}>
            Get started with{" "}
            <span style={{ color: "#FFC107" }}>DisasterAI</span>
          </h2>
          <p style={{ fontSize: 11, color: "#999", margin: 0, fontWeight: 500 }}>
            Real-time disaster intelligence at your fingertips
          </p>
        </div>

        {/* Quote rotator */}
        <div style={{
          background: "#F8F9FA", borderRadius: 14, padding: "12px 16px", marginBottom: 20,
          borderLeft: "3px solid #FFC107", minHeight: 50,
        }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={qIdx}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.35 }}
              style={{ fontSize: 12, color: "#555", fontStyle: "italic", fontWeight: 500, margin: 0, lineHeight: 1.6 }}
            >
              "{QUOTES[qIdx]}"
            </motion.p>
          </AnimatePresence>
          {/* dots */}
          <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
            {QUOTES.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === qIdx ? 18 : 5, opacity: i === qIdx ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                style={{ height: 4, borderRadius: 100, background: "#FFC107" }}
              />
            ))}
          </div>
        </div>

        {/* Continue button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={onContinue}
          style={{
            width: "100%",
            background: "#FFC107",
            border: "none",
            borderRadius: 18,
            padding: "17px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer",
            boxShadow: "0 6px 24px rgba(255,193,7,0.35)",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* shimmer */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 900, color: "#111", letterSpacing: "-0.2px", zIndex: 1, position: "relative" }}>
            Continue
          </span>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: "rgba(0,0,0,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1, position: "relative",
          }}>
            <ArrowRight size={16} color="#111" />
          </div>
        </motion.button>

        {/* Sign in link */}
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#999", fontWeight: 500 }}>
          Already have an account?{" "}
          <Link to="/login" onClick={onContinue} style={{ color: "#FFC107", fontWeight: 800, textDecoration: "none" }}>
            Sign In
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   SCREEN 2 — Login Form (LIGHT)
══════════════════════════════════════ */
const LoginForm = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [remember, setRemember] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const wasChecked = localStorage.getItem("rememberMe") === "true";
    if (savedEmail && wasChecked) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const res = await axios.post(apiUrl("/api/login"), form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Handle "Remember me" persistence
      if (remember) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.setItem("rememberMe", "false");
      }

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user_email", email);
      // Ensure dark theme is initialized for dashboard
      if (!localStorage.getItem("theme")) {
        localStorage.setItem("theme", "dark");
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Incorrect email or password.");
    } finally { setLoading(false); }
  };


  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "15px 18px 15px 46px",
    borderRadius: 14,
    border: "1.5px solid #E8E8E8",
    background: "#F8F9FA",
    color: "#111",
    fontSize: 14,
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 200ms, background 200ms",
  };

  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        minHeight: "100svh",
        background: "#FFFFFF",
        display: "flex", flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 260, height: 260, borderRadius: "50%",
        background: "rgba(255,193,7,0.06)", filter: "blur(60px)", pointerEvents: "none"
      }} />

      {/* Header */}
      <div style={{ padding: "52px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: "#F0F2F5", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={18} color="#555" />
        </button>
      </div>

      {/* Title */}
      <div style={{ padding: "28px 28px 32px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#111", margin: 0, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          Hop In — Log In to Your
        </h1>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FFC107", margin: "2px 0 0", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          Disaster AI Account
        </h1>
        <p style={{ fontSize: 13, color: "#999", fontWeight: 500, margin: "10px 0 0", maxWidth: 280, lineHeight: 1.5 }}>
          Access real-time alerts, AI predictions, and emergency evacuation tools.
        </p>
      </div>

      {/* Form */}
      <div
        style={{ padding: "0 24px", flex: 1 }}
        onKeyDown={e => e.key === "Enter" && !loading && handleLogin()}
      >
        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "#AAA", display: "block", marginBottom: 8 }}>
            Email
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={16} color="#BBB" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "#FFC107"; e.target.style.background = "#FFFEF7"; }}
              onBlur={e => { e.target.style.borderColor = "#E8E8E8"; e.target.style.background = "#F8F9FA"; }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "#AAA" }}>
              Password
            </label>
            <Link
              to="/forgot-password"
              style={{ fontSize: 12, fontWeight: 700, color: "#FFC107", textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={16} color="#BBB" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: 48 }}
              onFocus={e => { e.target.style.borderColor = "#FFC107"; e.target.style.background = "#FFFEF7"; }}
              onBlur={e => { e.target.style.borderColor = "#E8E8E8"; e.target.style.background = "#F8F9FA"; }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
            >
              {showPass ? <EyeOff size={16} color="#BBB" /> : <Eye size={16} color="#BBB" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setRemember(!remember)}
            style={{
              width: 20, height: 20, borderRadius: 6,
              border: `2px solid ${remember ? "#FFC107" : "#DDD"}`,
              background: remember ? "#FFC107" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, transition: "all 200ms",
            }}
          >
            {remember && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span style={{ fontSize: 13, color: "#777", fontWeight: 600 }}>Remember me</span>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ background: "#FFF1F2", border: "1px solid #FFC3C3", borderRadius: 12, padding: "10px 16px", marginBottom: 16 }}
            >
              <p style={{ color: "#DC2626", fontSize: 12, fontWeight: 700, margin: 0, textAlign: "center" }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign In Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "16px", borderRadius: 16,
            background: "#FFC107", border: "none",
            color: "#111", fontWeight: 900, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 6px 20px rgba(255,193,7,0.3)",
            fontFamily: "Inter, sans-serif",
            transition: "all 150ms",
            marginBottom: 22,
          }}
        >
          {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : (
            <>Sign In Securely <ArrowRight size={16} /></>
          )}
        </motion.button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em" }}>Or continue with</span>
          <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
        </div>

        {/* Social */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            {
              label: "Google",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              ),
            },
            {
              label: "Apple",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#111">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.82 1.5-.16 2.76.62 3.41 1.83-2.91 1.76-2.45 5.56.54 6.83-.68 1.81-1.57 3.53-2.61 4.33zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.37-1.92 4.28-3.74 4.25z"/>
                </svg>
              ),
            },
          ].map(btn => (
            <button key={btn.label}
              style={{
                padding: "13px", borderRadius: 14,
                background: "#F8F9FA", border: "1.5px solid #EBEBEB",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                cursor: "pointer", fontWeight: 700, fontSize: 13, color: "#333",
                fontFamily: "Inter, sans-serif", transition: "background 150ms",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F0F2F5"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#F8F9FA"}
            >
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "#BBB", fontWeight: 600, paddingBottom: 32 }}>
          New to DisasterAI?{" "}
          <Link to="/register" style={{ color: "#FFC107", fontWeight: 800, textDecoration: "none" }}>
            Create Account
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   Root — force light mode on login
══════════════════════════════════════ */
const LoginPage = () => {
  const [screen, setScreen] = useState<"splash" | "form">("splash");

  // Force light mode for login/register experience
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    document.body.style.background = "#FFFFFF";
  }, []);

  return (
    <div style={{ minHeight: "100svh", width: "100%", overflow: "hidden", background: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence mode="wait">
        {screen === "splash" ? (
          <SplashScreen key="splash" onContinue={() => setScreen("form")} />
        ) : (
          <LoginForm key="form" onBack={() => setScreen("splash")} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
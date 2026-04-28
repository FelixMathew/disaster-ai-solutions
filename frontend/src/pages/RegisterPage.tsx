import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2, ArrowRight, ChevronLeft, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Reusable light-theme field ── */
const LightField = ({
  id, label, type = "text", placeholder, value, onChange,
  icon: Icon, toggle, onToggle, visible, note, hasError,
}: {
  id?: string; label: string; type?: string; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: any; toggle?: boolean; onToggle?: () => void; visible?: boolean;
  note?: string; hasError?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", marginBottom: 8,
        fontSize: 11, fontWeight: 800,
        textTransform: "uppercase", letterSpacing: "0.07em",
        color: "#AAA",
      }}>
        {label}
        {note && <span style={{ marginLeft: 6, color: "#FFC107", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>{note}</span>}
      </label>
      <div style={{ position: "relative" }}>
        <Icon
          size={16}
          color={focused ? "#FFC107" : "#BBB"}
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", transition: "color 200ms" }}
        />
        <input
          id={id}
          type={toggle && visible ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={e => { setFocused(true); e.target.style.borderColor = "#FFC107"; e.target.style.background = "#FFFEF7"; }}
          onBlur={e => { setFocused(false); e.target.style.borderColor = hasError ? "#FCA5A5" : "#E8E8E8"; e.target.style.background = "#F8F9FA"; }}
          style={{
            width: "100%", padding: "15px 18px 15px 46px",
            borderRadius: 14,
            border: `1.5px solid ${hasError ? "#FCA5A5" : "#E8E8E8"}`,
            background: "#F8F9FA",
            color: "#111", fontSize: 14, fontWeight: 500,
            outline: "none", boxSizing: "border-box",
            fontFamily: "Inter, sans-serif",
            transition: "border-color 200ms, background 200ms",
            paddingRight: toggle ? 48 : 18,
          }}
        />
        {toggle && (
          <button
            type="button"
            onClick={onToggle}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}
          >
            {visible ? <EyeOff size={16} color="#BBB" /> : <Eye size={16} color="#BBB" />}
          </button>
        )}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [username, setUsername]               = useState("");
  const [email, setEmail]                     = useState("");
  const [phone, setPhone]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);
  const [agreed, setAgreed]                   = useState(false);

  // Force light mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    document.body.style.background = "#FFFFFF";
  }, []);

  const phoneInvalid = phone.trim().length > 0 && !/^[\d\s\+\-\(\)]{7,15}$/.test(phone.trim());
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) { setError("Please fill in all required fields."); return; }
    if (!phone.trim()) { setError("Phone number is required for emergency alerts."); return; }
    if (!/^[\d\s\+\-\(\)]{7,15}$/.test(phone.trim())) { setError("Enter a valid phone number (e.g. +91 98765 43210)."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!agreed) { setError("Please agree to the Terms of Service to continue."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, phone: phone.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || "Registration failed."); setLoading(false); return;
      }
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        if (!localStorage.getItem("theme")) localStorage.setItem("theme", "dark");
        navigate("/dashboard");
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err: any) {
      setError(err.message || "Network error. Check if backend is running.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100svh", background: "#FFFFFF",
      fontFamily: "'Inter', sans-serif",
      position: "relative", overflowX: "hidden",
    }}>
      {/* Soft accent */}
      <div style={{
        position: "fixed", top: -60, right: -60,
        width: 240, height: 240, borderRadius: "50%",
        background: "rgba(255,193,7,0.07)", filter: "blur(60px)", pointerEvents: "none",
      }} />

      {/* ── Sticky header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        padding: "48px 24px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
      }}>
        <Link to="/">
          <button style={{
            width: 40, height: 40, borderRadius: 12,
            background: "#F0F2F5", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <ChevronLeft size={18} color="#555" />
          </button>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #FFC107, #FF8F00)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="rgba(0,0,0,0.8)" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 900, fontSize: 13, color: "#111", letterSpacing: "-0.2px" }}>DISASTERAI</span>
        </div>
      </div>

      {/* ── Title ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ padding: "28px 28px 24px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(255,193,7,0.1)", border: "1.5px solid rgba(255,193,7,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={18} color="#FFC107" />
          </div>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,193,7,0.3), transparent)" }} />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#111", margin: 0, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          Create Your
        </h1>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FFC107", margin: "3px 0 0", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
          Disaster AI Account
        </h1>
        <p style={{ fontSize: 13, color: "#999", fontWeight: 500, margin: "10px 0 0", maxWidth: 280, lineHeight: 1.6 }}>
          Join the platform protecting communities with AI-powered real-time disaster intelligence.
        </p>
      </motion.div>

      {/* ── Success ── */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ margin: "0 24px 24px", padding: "20px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16, textAlign: "center" }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ color: "#16A34A", fontWeight: 800, fontSize: 14, margin: 0 }}>Account created!</p>
            <p style={{ color: "#999", fontSize: 12, margin: "4px 0 0", fontWeight: 500 }}>Redirecting to your dashboard…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form ── */}
      {!success && (
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          onSubmit={handleSubmit}
          style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 14 }}
        >
          <LightField id="reg-name" label="Full Name" placeholder="e.g. John Doe" value={username}
            onChange={e => setUsername(e.target.value)} icon={User} />

          <LightField id="reg-email" label="Email Address" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} icon={Mail} />

          {/* Phone */}
          <div>
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#AAA", marginBottom: 8,
            }}>
              Phone Number
              <span style={{ color: "#FFC107", fontWeight: 600, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
                · Required for emergency alerts
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <Phone size={16} color="#BBB" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                id="reg-phone" type="tel" placeholder="+91 98765 43210"
                value={phone} onChange={e => setPhone(e.target.value)}
                style={{
                  width: "100%", padding: "15px 18px 15px 46px", borderRadius: 14,
                  border: `1.5px solid ${phoneInvalid ? "#FCA5A5" : "#E8E8E8"}`,
                  background: "#F8F9FA", color: "#111", fontSize: 14, fontWeight: 500,
                  outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif",
                  transition: "border-color 200ms, background 200ms",
                }}
                onFocus={e => { e.target.style.borderColor = "#FFC107"; e.target.style.background = "#FFFEF7"; }}
                onBlur={e => { e.target.style.borderColor = phoneInvalid ? "#FCA5A5" : "#E8E8E8"; e.target.style.background = "#F8F9FA"; }}
              />
            </div>
            <AnimatePresence>
              {phoneInvalid && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ color: "#DC2626", fontSize: 11, fontWeight: 600, margin: "6px 0 0" }}>
                  ⚠ Enter a valid phone number
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <LightField id="reg-pass" label="Password" type="password" placeholder="Create a strong password"
            value={password} onChange={e => setPassword(e.target.value)} icon={Lock}
            toggle onToggle={() => setShowPassword(!showPassword)} visible={showPassword} />

          <div>
            <LightField id="reg-confirm" label="Confirm Password" type="password" placeholder="Re-enter your password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} icon={Lock}
              toggle onToggle={() => setShowConfirm(!showConfirm)} visible={showConfirm}
              hasError={!!passwordMismatch} />
            <AnimatePresence>
              {passwordMismatch && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ color: "#DC2626", fontSize: 11, fontWeight: 600, margin: "6px 0 0" }}>
                  ⚠ Passwords do not match
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Terms */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <button
              type="button"
              onClick={() => setAgreed(!agreed)}
              style={{
                width: 20, height: 20, marginTop: 1, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${agreed ? "#FFC107" : "#DDD"}`,
                background: agreed ? "#FFC107" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 200ms",
              }}
            >
              {agreed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <p style={{ fontSize: 12, color: "#777", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
              I agree to the{" "}
              <span style={{ color: "#FFC107", fontWeight: 700, cursor: "pointer" }}>Terms of Service</span>
              {" "}and{" "}
              <span style={{ color: "#FFC107", fontWeight: 700, cursor: "pointer" }}>Privacy Policy</span>
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ background: "#FFF1F2", border: "1px solid #FFC3C3", borderRadius: 12, padding: "10px 16px" }}
              >
                <p style={{ color: "#DC2626", fontSize: 12, fontWeight: 700, margin: 0, textAlign: "center" }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              position: "relative", overflow: "hidden",
              width: "100%", padding: "17px 24px", borderRadius: 16,
              background: "#FFC107", border: "none",
              color: "#111", fontWeight: 900, fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "0 6px 20px rgba(255,193,7,0.3)",
              fontFamily: "Inter, sans-serif", marginTop: 4,
            }}
          >
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              }}
            />
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 auto", position: "relative", zIndex: 1 }}>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Creating account…
              </span>
            ) : (
              <>
                <span style={{ position: "relative", zIndex: 1 }}>Create My Account</span>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(0,0,0,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", zIndex: 1,
                }}>
                  <ArrowRight size={16} color="#111" />
                </div>
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em" }}>Or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
          </div>

          {/* Social */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
              <button key={btn.label} type="button"
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

          <p style={{ textAlign: "center", fontSize: 13, color: "#BBB", fontWeight: 600, paddingBottom: 8 }}>
            Already have an account?{" "}
            <Link to="/" style={{ color: "#FFC107", fontWeight: 800, textDecoration: "none" }}>
              Sign In
            </Link>
          </p>
        </motion.form>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RegisterPage;

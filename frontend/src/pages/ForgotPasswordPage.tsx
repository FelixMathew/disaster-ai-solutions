import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";

/* ─── Force light mode ─── */
const useLightMode = () => {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
    document.body.style.background = "#FFFFFF";
  }, []);
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

const focusStyle = (el: HTMLInputElement) => {
  el.style.borderColor = "#FFC107";
  el.style.background = "#FFFEF7";
};
const blurStyle = (el: HTMLInputElement) => {
  el.style.borderColor = "#E8E8E8";
  el.style.background = "#F8F9FA";
};

/* ════════════════════════════
   STEP 1 — Enter Email
════════════════════════════ */
const StepEmail = ({ onSent }: { onSent: (email: string) => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setError("");
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/forgot-password", { email });
      onSent(email);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="step-email"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Icon */}
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "linear-gradient(135deg, #FFF8E1, #FFE082)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
      }}>
        <Mail size={28} color="#FFC107" />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        Forgot Password?
      </h1>
      <p style={{ fontSize: 13, color: "#999", fontWeight: 500, margin: "0 0 32px", lineHeight: 1.6, maxWidth: 280 }}>
        No worries! Enter your registered email and we'll send you a 6-digit reset code.
      </p>

      {/* Email field */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#AAA" }}>
          Email Address
        </label>
        <div style={{ position: "relative" }}>
          <Mail size={16} color="#BBB" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
            style={inputStyle}
            onFocus={e => focusStyle(e.target as HTMLInputElement)}
            onBlur={e => blurStyle(e.target as HTMLInputElement)}
            autoComplete="email"
          />
        </div>
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
            <p style={{ color: "#DC2626", fontSize: 12, fontWeight: 700, margin: 0 }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send code button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSend}
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
        }}
      >
        {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : (
          <>Send Reset Code <ArrowRight size={16} /></>
        )}
      </motion.button>

      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#BBB", fontWeight: 600 }}>
        Remember your password?{" "}
        <Link to="/" style={{ color: "#FFC107", fontWeight: 800, textDecoration: "none" }}>Sign In</Link>
      </p>
    </motion.div>
  );
};

/* ════════════════════════════
   STEP 2 — Enter OTP + New Password
════════════════════════════ */
const StepReset = ({ email, onDone }: { email: string; onDone: () => void }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleReset = async () => {
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    if (!newPassword) { setError("Please enter a new password."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await axios.post("/api/reset-password", { email, otp: code, new_password: newPassword });
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await axios.post("/api/forgot-password", { email });
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch { /* silent */ }
  };

  return (
    <motion.div
      key="step-reset"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Icon */}
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "linear-gradient(135deg, #FFF8E1, #FFE082)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
      }}>
        <Lock size={28} color="#FFC107" />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
        Check Your Email
      </h1>
      <p style={{ fontSize: 13, color: "#999", fontWeight: 500, margin: "0 0 8px", lineHeight: 1.6 }}>
        We sent a 6-digit code to
      </p>
      <p style={{ fontSize: 14, fontWeight: 800, color: "#FFC107", margin: "0 0 28px" }}>{email}</p>

      {/* OTP boxes */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            style={{
              width: 48, height: 56,
              borderRadius: 14,
              border: `2px solid ${digit ? "#FFC107" : "#E8E8E8"}`,
              background: digit ? "#FFFEF7" : "#F8F9FA",
              textAlign: "center",
              fontSize: 22,
              fontWeight: 900,
              color: "#111",
              fontFamily: "Inter, sans-serif",
              outline: "none",
              transition: "all 200ms",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>

      {/* Resend */}
      <div style={{ marginBottom: 20 }}>
        {resendCooldown > 0 ? (
          <p style={{ fontSize: 12, color: "#BBB", fontWeight: 600 }}>
            Resend code in <span style={{ color: "#FFC107", fontWeight: 800 }}>{resendCooldown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "#FFC107", fontWeight: 800, fontFamily: "Inter, sans-serif" }}
          >
            Resend code
          </button>
        )}
      </div>

      {/* New password */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#AAA" }}>
          New Password
        </label>
        <div style={{ position: "relative" }}>
          <Lock size={16} color="#BBB" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type={showPass ? "text" : "password"}
            placeholder="Create a new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: 48 }}
            onFocus={e => focusStyle(e.target as HTMLInputElement)}
            onBlur={e => blurStyle(e.target as HTMLInputElement)}
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
            {showPass ? <EyeOff size={16} color="#BBB" /> : <Eye size={16} color="#BBB" />}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "#AAA" }}>
          Confirm Password
        </label>
        <div style={{ position: "relative" }}>
          <Lock size={16} color="#BBB" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && handleReset()}
            style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== newPassword ? "#FCA5A5" : "#E8E8E8" }}
            onFocus={e => focusStyle(e.target as HTMLInputElement)}
            onBlur={e => blurStyle(e.target as HTMLInputElement)}
          />
        </div>
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
            <p style={{ color: "#DC2626", fontSize: 12, fontWeight: 700, margin: 0 }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleReset}
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
        }}
      >
        {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : (
          <>Reset Password <ArrowRight size={16} /></>
        )}
      </motion.button>
    </motion.div>
  );
};

/* ════════════════════════════
   STEP 3 — Success
════════════════════════════ */
const StepSuccess = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate("/"), 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <motion.div
      key="step-success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ textAlign: "center" }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        style={{
          width: 80, height: 80, borderRadius: 24,
          background: "linear-gradient(135deg, #D1FAE5, #6EE7B7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <CheckCircle size={36} color="#059669" />
      </motion.div>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 12px" }}>
        Password Reset! 🎉
      </h1>
      <p style={{ fontSize: 14, color: "#999", fontWeight: 500, lineHeight: 1.6 }}>
        Your password has been updated successfully.
        <br />Redirecting you to sign in…
      </p>

      {/* Progress bar */}
      <div style={{ marginTop: 32, height: 4, background: "#F0F0F0", borderRadius: 100, overflow: "hidden" }}>
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "linear" }}
          style={{ height: "100%", background: "#FFC107", borderRadius: 100 }}
        />
      </div>

      <Link to="/" style={{
        display: "inline-block", marginTop: 20,
        fontSize: 13, color: "#FFC107", fontWeight: 800, textDecoration: "none"
      }}>
        Sign In Now →
      </Link>
    </motion.div>
  );
};

/* ════════════════════════════
   ROOT — Forgot Password Page
════════════════════════════ */
const ForgotPasswordPage = () => {
  useLightMode();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [emailSent, setEmailSent] = useState("");

  return (
    <div style={{
      minHeight: "100svh", background: "#FFFFFF",
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden",
    }}>
      {/* Background accent */}
      <div style={{
        position: "fixed", top: -80, right: -80,
        width: 260, height: 260, borderRadius: "50%",
        background: "rgba(255,193,7,0.07)", filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: -60, left: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(255,193,7,0.05)", filter: "blur(50px)", pointerEvents: "none",
      }} />

      {/* Back button */}
      {step !== "success" && (
        <div style={{ padding: "52px 24px 0" }}>
          <button
            onClick={() => step === "reset" ? setStep("email") : navigate("/")}
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
      )}

      {/* Step indicator */}
      {step !== "success" && (
        <div style={{ padding: "20px 28px 0", display: "flex", gap: 6 }}>
          {(["email", "reset"] as const).map((s, i) => (
            <motion.div
              key={s}
              animate={{
                width: step === s ? 24 : 8,
                background: step === s ? "#FFC107" : "#E8E8E8",
              }}
              transition={{ duration: 0.3 }}
              style={{ height: 4, borderRadius: 100 }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: "32px 28px 48px" }}>
        <AnimatePresence mode="wait">
          {step === "email" && (
            <StepEmail key="email" onSent={email => { setEmailSent(email); setStep("reset"); }} />
          )}
          {step === "reset" && (
            <StepReset key="reset" email={emailSent} onDone={() => setStep("success")} />
          )}
          {step === "success" && (
            <StepSuccess key="success" />
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ForgotPasswordPage;

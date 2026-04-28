import { useState, useEffect, useRef } from "react";
import { User, Lock, Bell, Palette, LogOut, Phone, Save, CheckCircle, AlertCircle, Camera, Github, Mail, Linkedin, Send } from "lucide-react";
import { Link } from "react-router-dom";

const SettingsPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Profile picture
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem("userAvatar"));
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setName(data.username || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      localStorage.setItem("userAvatar", result);
    };
    reader.readAsDataURL(file);
  };

  const changeTheme = (mode: "dark" | "light") => {
    setTheme(mode);
    localStorage.setItem("theme", mode);
    if (mode === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: name, phone }),
      });
      if (res.ok) {
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      } else {
        const d = await res.json();
        setProfileMsg({ type: "error", text: d.detail || "Update failed" });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Network error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) { setPwdMsg({ type: "error", text: "Please fill all password fields." }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "New passwords do not match." }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: "error", text: "New password must be at least 6 characters." }); return; }
    setPwdLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const d = await res.json();
      if (res.ok) {
        setPwdMsg({ type: "success", text: "Password changed successfully!" });
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else {
        setPwdMsg({ type: "error", text: d.detail || "Failed to change password" });
      }
    } catch {
      setPwdMsg({ type: "error", text: "Network error" });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Profile ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-semibold text-foreground">Profile</h3>
        </div>

        {/* Avatar upload */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/40 shadow-lg shadow-primary/20">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary/60" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Profile Picture</p>
            <p className="text-xs text-muted-foreground mt-0.5">Click avatar to upload (max 2MB)</p>
            <button onClick={() => fileRef.current?.click()}
              className="mt-2 px-3 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 transition-colors flex items-center gap-1.5">
              <Camera className="h-3 w-3" /> Change Photo
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              Email <span className="text-red-400 text-[10px] font-semibold ml-1">★ Important</span>
            </label>
            <input value={email} readOnly
              className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border text-sm text-muted-foreground cursor-not-allowed" />
            <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed. Used for emergency alerts.</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Phone className="h-3 w-3" /> Phone Number
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
        </div>

        {profileMsg && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${profileMsg.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {profileMsg.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {profileMsg.text}
          </div>
        )}

        <button onClick={handleSaveProfile} disabled={profileLoading}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50">
          <Save className="h-3.5 w-3.5" />
          {profileLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* ── Change Password ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-semibold text-foreground">Change Password</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "Current Password", value: currentPwd, onChange: setCurrentPwd },
            { label: "New Password", value: newPwd, onChange: setNewPwd },
            { label: "Confirm New Password", value: confirmPwd, onChange: setConfirmPwd },
          ].map((item) => (
            <div key={item.label}>
              <label className="text-xs text-muted-foreground mb-1 block">{item.label}</label>
              <input type="password" placeholder="••••••••" value={item.value}
                onChange={(e) => item.onChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
          ))}
        </div>
        {pwdMsg && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${pwdMsg.type === "success" ? "text-green-500" : "text-red-500"}`}>
            {pwdMsg.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {pwdMsg.text}
          </div>
        )}
        <button onClick={handleChangePassword} disabled={pwdLoading}
          className="mt-4 px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors disabled:opacity-50">
          {pwdLoading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* ── Notifications ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-semibold text-foreground">Notification Settings</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "Email Notifications", desc: "Receive alert summaries via email", on: true },
            { label: "Push Notifications", desc: "Browser push notifications for critical alerts", on: true },
            { label: "SMS Alerts", desc: "SMS for critical alerts", on: false },
            { label: "Weekly Digest", desc: "Weekly summary", on: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
              <div>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className={`w-9 h-5 rounded-full relative ${item.on ? "bg-primary/30" : "bg-border"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full ${item.on ? "left-4 bg-primary" : "left-0.5 bg-muted-foreground"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-semibold text-foreground">Appearance</h3>
        </div>
        <div className="flex gap-3">
          <button onClick={() => changeTheme("dark")}
            className={`flex-1 p-3 rounded-lg border text-sm font-medium ${theme === "dark" ? "bg-primary/20 border-primary text-primary" : "bg-secondary/30 border-border text-muted-foreground"}`}>
            🌙 Dark
          </button>
          <button onClick={() => changeTheme("light")}
            className={`flex-1 p-3 rounded-lg border text-sm font-medium ${theme === "light" ? "bg-primary/20 border-primary text-primary" : "bg-secondary/30 border-border text-muted-foreground"}`}>
            ☀️ Light
          </button>
        </div>
      </div>

      {/* ── JOIN US — Telegram Community Card ── */}
      <div className="glass-card p-6 overflow-hidden relative group">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {/* Logo */}
          <div className="relative shrink-0">
            {/* Pulsing glow rings */}
            <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping scale-125" />
            <div className="absolute inset-0 rounded-full bg-yellow-500/10 animate-pulse" />
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/30 relative">
              <img
                src="/disasterai_logo.jpg"
                alt="DisasterAI"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
              <h3 className="text-xl font-extrabold text-foreground tracking-tight">JOIN US</h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold">DisasterAI Community</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Join our growing community of disaster response experts, developers, and AI enthusiasts. Get real-time alerts, share insights, and help build a safer world.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
              {[
                { icon: <Send className="h-3.5 w-3.5" />, label: "Telegram", href: "https://t.me/+KPKiasDPz9k5OGI1", color: "bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25" },
                { icon: <Github className="h-3.5 w-3.5" />, label: "GitHub", href: "https://github.com/FelixMathew", color: "bg-secondary/50 border-border text-foreground hover:border-primary/40" },
                { icon: <Mail className="h-3.5 w-3.5" />, label: "Email", href: "mailto:felixsparrow561@gmail.com", color: "bg-secondary/50 border-border text-foreground hover:border-primary/40" },
                { icon: <Linkedin className="h-3.5 w-3.5" />, label: "LinkedIn", href: "https://www.linkedin.com/in/felixmathew07/", color: "bg-blue-600/15 border-blue-600/30 text-blue-400 hover:bg-blue-600/25" },
              ].map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:scale-105 ${link.color}`}>
                  {link.icon}
                  {link.label}
                </a>
              ))}
            </div>

            {/* Main CTA */}
            <a href="https://t.me/+KPKiasDPz9k5OGI1" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 hover:opacity-90 active:scale-95 shadow-lg"
              style={{ background: "linear-gradient(135deg, #0088cc 0%, #2962ff 100%)", boxShadow: "0 4px 20px rgba(0,136,204,0.4)" }}>
              <Send className="h-4 w-4" />
              Join Telegram Community
            </a>
          </div>
        </div>
      </div>

      {/* ── Logout ── */}
      <Link
        to="/login"
        onClick={() => localStorage.removeItem("token")}
        className="glass-card p-4 flex items-center gap-3 text-risk-critical hover:bg-risk-critical/5 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="text-sm font-medium">Logout</span>
      </Link>

    </div>
  );
};

export default SettingsPage;
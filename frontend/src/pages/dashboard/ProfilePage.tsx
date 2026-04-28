import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Camera, Lock, Eye, EyeOff, Moon, Sun, Send, Github, Mail, Linkedin, ChevronRight } from "lucide-react";

const PROFILE_KEY = "disasterai_profile";
const load = () => {
  try { const s = localStorage.getItem(PROFILE_KEY); if (s) return JSON.parse(s); } catch {}
  return { name:"", phone:"", email: localStorage.getItem("user_email")||"", avatar:"" };
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(load);
  const [saved, setSaved]     = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile((p: any) => ({
          ...p,
          name: res.data.username || p.name,
          email: res.data.email || p.email,
          phone: res.data.phone || p.phone,
          avatar: res.data.avatar || p.avatar,
        }));
        if (res.data.email) {
          localStorage.setItem("user_email", res.data.email);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass]   = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [dark, setDark] = useState(() => (localStorage.getItem("theme")||"dark")==="dark");

  useEffect(() => {
    const handleThemeChange = () => {
      setDark((localStorage.getItem("theme") || "dark") === "dark");
    };
    window.addEventListener("themeChange", handleThemeChange);
    return () => window.removeEventListener("themeChange", handleThemeChange);
  }, []);

  const [hovDev, setHovDev] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // 0.7 quality is perfect for avatars
      };
    });
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10*1024*1024) { alert("Image must be under 10MB"); return; }
    const r = new FileReader();
    r.onload = async () => {
      const rawUrl = r.result as string;
      const optimizedUrl = await compressImage(rawUrl);
      
      // Update state immediately for preview and trigger save with fresh data
      setProfile((p: any) => {
        const next = { ...p, avatar: optimizedUrl };
        
        const saveAsync = async () => {
          try {
            const token = localStorage.getItem("token");
            if (token) {
              await axios.put("/api/profile", {
                username: next.name,
                phone: next.phone,
                avatar: next.avatar
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
            }
          } catch (err) {
            console.error("Auto-save avatar failed", err);
          }
        };
        saveAsync();
        return next;
      });
    };
    r.readAsDataURL(file);
  };

  const save = async () => {
    setSaveErr(""); if (!profile.email?.trim()) { setSaveErr("Email is required."); return; }
    
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.put("/api/profile", {
          username: profile.name,
          phone: profile.phone,
          avatar: profile.avatar
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      if (profile.email) localStorage.setItem("user_email", profile.email);
      setSaved(true); setTimeout(()=>setSaved(false), 3000);
    } catch (err: any) {
      setSaveErr(err.response?.data?.detail || "Failed to save profile.");
    }
  };

  const toggleDark = () => {
    const n = !dark; setDark(n);
    const theme = n ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", n);
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event("themeChange"));
  };

  const initials = profile.name
    ? profile.name.split(" ").map((x:string)=>x[0]).join("").toUpperCase().slice(0,2)
    : (profile.email?.[0]||"?").toUpperCase();

  const S = ({ children }: { children: string }) => (
    <p style={{fontSize:10,fontWeight:800,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"20px 0 10px 4px"}}>{children}</p>
  );

  const cardStyle = { background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:18, overflow:"hidden" };
  const rowStyle  = { width:"100%", display:"flex", alignItems:"center", gap:12, padding:"15px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" as const, transition:"background 150ms" };

  return (
    <div style={{ background:"var(--bg)", minHeight:"100%" }}>
      {/* Header */}
      <div style={{ padding:"20px 20px 12px" }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:"var(--text-1)", margin:0 }}>Profile & Settings</h1>
      </div>

      <div style={{ padding:"0 16px" }}>

        {/* ── Avatar ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 0 20px" }}>
          <div style={{ position:"relative", marginBottom:14 }}>
            <button onClick={()=>fileRef.current?.click()} style={{ background:"none", border:"none", cursor:"pointer", position:"relative", display:"block" }}>
              <div style={{
                width:90, height:90, borderRadius:"50%",
                background: profile.avatar ? "transparent" : "linear-gradient(135deg,#FFC107,#FF8F00)",
                overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 0 0 3px rgba(255,193,7,0.25), 0 8px 24px rgba(0,0,0,0.4)",
                border:"3px solid var(--bg-card)",
              }}>
                {profile.avatar
                  ? <img src={profile.avatar} alt="User Avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span style={{fontSize:30,fontWeight:900,color:"#000"}}>{initials}</span>
                }
              </div>
            </button>
            <button onClick={()=>fileRef.current?.click()}
              style={{position:"absolute",bottom:0,right:0,width:28,height:28,borderRadius:"50%",background:"var(--yellow)",border:"2px solid var(--bg-card)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.3)"}}>
              <Camera style={{width:13,height:13,color:"#000"}}/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleAvatar}/>
          </div>
          <h2 style={{fontSize:18,fontWeight:800,color:"var(--text-1)",margin:"0 0 3px"}}>{profile.name||"Your Name"}</h2>
          <p style={{fontSize:12,color:"var(--text-3)",margin:0}}>{profile.email||"No email set"}</p>
        </div>

        {/* ── Personal Info ── */}
        <S>Personal Information</S>
        <div style={{...cardStyle, padding:16, display:"flex", flexDirection:"column", gap:10}}>
          <input className="input-dark" value={profile.name} onChange={e=>setProfile((p:any)=>({...p,name:e.target.value}))} placeholder="Full name" style={{borderRadius:14}}/>
          <div style={{position:"relative"}}>
            <input className="input-dark" value={profile.email} onChange={e=>setProfile((p:any)=>({...p,email:e.target.value}))}
              placeholder="Email address *" type="email" style={{borderRadius:14, borderColor:!profile.email?"#f97316":undefined}}/>
            {!profile.email && <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:10,fontWeight:700,color:"#f97316"}}>Required</span>}
          </div>
          <input className="input-dark" value={profile.phone} onChange={e=>setProfile((p:any)=>({...p,phone:e.target.value}))} placeholder="Phone number" type="tel" style={{borderRadius:14}}/>
          {saveErr && <p style={{fontSize:12,color:"#f87171",fontWeight:600}}>{saveErr}</p>}
          <button className="btn-yellow" onClick={save} style={{width:"100%",padding:"14px"}}>
            {saved ? "✅ Saved!" : "Save Changes"}
          </button>
        </div>

        {/* ── Security ── */}
        <S>Security</S>
        <div style={cardStyle}>
          <button onClick={()=>setShowPass(!showPass)} style={{...rowStyle, borderBottom: showPass?"1px solid var(--border)":"none"}}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-elevated)"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
          >
            <div style={{width:36,height:36,borderRadius:12,background:"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Lock style={{width:16,height:16,color:"var(--text-2)"}}/>
            </div>
            <span style={{flex:1,fontSize:14,fontWeight:600,color:"var(--text-1)"}}>Change Password</span>
            <ChevronRight style={{width:15,height:15,color:"var(--text-3)",transform:showPass?"rotate(90deg)":"none",transition:"transform 200ms"}}/>
          </button>
          {showPass && (
            <div style={{padding:"14px 16px 16px",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{position:"relative"}}>
                <input className="input-dark" type={showCurr?"text":"password"} value={currPass} onChange={e=>setCurrPass(e.target.value)} placeholder="Current password" style={{borderRadius:14}}/>
                <button onClick={()=>setShowCurr(!showCurr)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer"}}>
                  {showCurr?<EyeOff style={{width:15,height:15,color:"var(--text-3)"}}/>:<Eye style={{width:15,height:15,color:"var(--text-3)"}}/>}
                </button>
              </div>
              <div style={{position:"relative"}}>
                <input className="input-dark" type={showNew?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="New password" style={{borderRadius:14}}/>
                <button onClick={()=>setShowNew(!showNew)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer"}}>
                  {showNew?<EyeOff style={{width:15,height:15,color:"var(--text-3)"}}/>:<Eye style={{width:15,height:15,color:"var(--text-3)"}}/>}
                </button>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    await axios.post("/api/change-password", {
                      current_password: currPass,
                      new_password: newPass
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    alert("Password updated successfully!");
                    setCurrPass("");
                    setNewPass("");
                    setShowPass(false);
                  } catch (err: any) {
                    alert(err.response?.data?.detail || "Failed to update password");
                  }
                }}
                style={{background:"var(--text-1)",color:"var(--bg)",border:"none",borderRadius:100,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Update Password</button>
            </div>
          )}
        </div>

        {/* ── Appearance ── */}
        <S>Appearance</S>
        <div style={cardStyle}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 16px",borderBottom:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {dark?<Moon style={{width:18,height:18,color:"var(--yellow)"}}/>:<Sun style={{width:18,height:18,color:"#f97316"}}/>}
              <span style={{fontSize:14,fontWeight:600,color:"var(--text-1)"}}>Dark Mode</span>
            </div>
            <button onClick={toggleDark} style={{width:50,height:28,borderRadius:100,background:dark?"var(--yellow)":"#333",border:"none",cursor:"pointer",position:"relative",transition:"background 300ms"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:dark?24:4,transition:"left 300ms",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}/>
            </button>
          </div>

          {/* Telegram */}
          <a href="https://t.me/+KPKiasDPz9k5OGI1" target="_blank" rel="noopener noreferrer"
            style={{display:"flex",alignItems:"center",gap:12,padding:"15px 16px",textDecoration:"none"}}
          >
            <div style={{width:40,height:40,borderRadius:14,background:"linear-gradient(135deg,#2AABEE,#229ED9)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 14px rgba(42,171,238,0.3)"}}>
              <Send style={{width:18,height:18,color:"#fff"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:800,color:"var(--text-1)",margin:0,textTransform:"uppercase",letterSpacing:"0.03em"}}>Join Our Community</p>
              <p style={{fontSize:11,color:"var(--text-3)",margin:"2px 0 0"}}>Disaster alerts &amp; updates on Telegram</p>
            </div>
            <ChevronRight style={{width:14,height:14,color:"var(--text-3)"}}/>
          </a>
        </div>

        {/* ── Developer Card ── */}
        <S>Developer</S>
        <div style={{...cardStyle,padding:"24px 20px",textAlign:"center",position:"relative"}}
          onMouseEnter={()=>setHovDev(true)} onMouseLeave={()=>setHovDev(false)}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <div style={{width:64,height:64,borderRadius:20,background:"var(--bg-elevated)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 300ms",transform:hovDev?"scale(1.06)":"scale(1)"}}>
              <svg style={{width:40,height:40,color:"var(--text-2)"}} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" fill="none">
                <path d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div style={{transition:"padding-bottom 350ms", paddingBottom:hovDev?52:0}}>
            <h3 style={{fontSize:16,fontWeight:800,color:"var(--text-1)",margin:"0 0 4px"}}>Felix Mathew</h3>
            <p style={{fontSize:12,color:"var(--text-3)",margin:0}}>@developer · DisasterAI</p>
          </div>
          {/* Social hover reveal */}
          <div style={{
            position:"absolute",bottom:20,left:"50%",
            transform:hovDev?"translateX(-50%) translateY(0)":"translateX(-50%) translateY(20px)",
            opacity:hovDev?1:0,
            transition:"opacity 300ms, transform 300ms",
            pointerEvents:hovDev?"auto":"none",
            display:"flex", gap:12, alignItems:"center",
            background:"var(--bg-elevated)", borderRadius:100, padding:"8px 18px",
            border:"1px solid var(--border)",
            boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          }}>
            {[
              { href:"https://github.com/FelixMathew", icon:<Github style={{width:16,height:16,color:"var(--text-1)"}}/>},
              { href:"mailto:felixsparrow561@gmail.com", icon:<Mail style={{width:16,height:16,color:"var(--text-1)"}}/>},
              { href:"https://www.linkedin.com/in/felixmathew07/", icon:<Linkedin style={{width:16,height:16,color:"#0077b5"}}/>},
              { href:"https://t.me/+KPKiasDPz9k5OGI1", icon:<Send style={{width:16,height:16,color:"#2AABEE"}}/>},
            ].map((s,i)=>(
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,background:"var(--bg-card)",transition:"transform 200ms"}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform="scale(1.15)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform=""}
              >{s.icon}</a>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div style={{padding:"12px 0 28px"}}>
          <button onClick={()=>{localStorage.removeItem("token");window.location.href="/login";}}
            style={{width:"100%",padding:"15px",borderRadius:100,fontWeight:700,fontSize:14,color:"#f87171",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",cursor:"pointer"}}>
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;

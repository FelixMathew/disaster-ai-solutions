import { useState, useEffect, useRef } from "react";
import { Phone, MapPin, Plus, Trash2, CheckCircle, Loader2, X, Users, ChevronDown, AlertTriangle, Share2 } from "lucide-react";

interface Contact { id:string; name:string; number:string; relation:string; }

const INCIDENT_TYPES = [
  { id:"flood",     emoji:"🌊", label:"Flood" },
  { id:"fire",      emoji:"🔥", label:"Fire" },
  { id:"earthquake",emoji:"🌍", label:"Earthquake" },
  { id:"landslide", emoji:"⛰️",  label:"Landslide" },
  { id:"storm",     emoji:"🌪️",  label:"Storm" },
  { id:"cyclone",   emoji:"🌀",  label:"Cyclone" },
  { id:"tsunami",   emoji:"🌊",  label:"Tsunami" },
  { id:"accident",  emoji:"🚗",  label:"Road Accident" },
  { id:"medical",   emoji:"🏥",  label:"Medical Emergency" },
  { id:"other",     emoji:"⚠️",  label:"Other" },
];

const RELATIONS = ["Mom","Dad","Sister","Brother","Spouse","Friend","Other"];

const EMERGENCY = [
  { n:"112", label:"National Emergency", icon:"📞", color:"#ef4444", bg:"rgba(239,68,68,0.12)", border:"rgba(239,68,68,0.25)" },
  { n:"100", label:"Police",             icon:"🛡️",  color:"#3b82f6", bg:"rgba(59,130,246,0.12)", border:"rgba(59,130,246,0.25)" },
  { n:"101", label:"Fire Brigade",       icon:"🔥", color:"#f97316", bg:"rgba(249,115,22,0.12)", border:"rgba(249,115,22,0.25)" },
  { n:"102", label:"Ambulance",          icon:"✅", color:"#22c55e", bg:"rgba(34,197,94,0.12)", border:"rgba(34,197,94,0.25)" },
];

const CONTACTS_KEY = "disasterai_contacts_v2";
const loadContacts = (): Contact[] => {
  try { return JSON.parse(localStorage.getItem(CONTACTS_KEY)||"[]"); } catch { return []; }
};

const SOSPage = () => {
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);
  const [incident, setIncident] = useState(INCIDENT_TYPES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newRel, setNewRel] = useState("Mom");
  const [location, setLocation] = useState<{lat:number;lng:number;name:string}|null>(null);
  const [holdPct, setHoldPct] = useState(0);
  const [holding, setHolding] = useState(false);
  const [sos, setSos] = useState<"idle"|"sending"|"success"|"error">("idle");
  const [msg, setMsg] = useState("");
  const holdRef = useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(() => {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        const name = d.address?.city||d.address?.town||d.address?.village||`${lat.toFixed(4)},${lng.toFixed(4)}`;
        setLocation({lat,lng,name});
      } catch { setLocation({lat,lng,name:`${lat.toFixed(4)},${lng.toFixed(4)}`}); }
    }, ()=>setLocation({lat:12.9716,lng:77.5946,name:"Bengaluru (approx)"}), { enableHighAccuracy:true });
  }, []);

  const saveContacts = (c:Contact[]) => { setContacts(c); localStorage.setItem(CONTACTS_KEY, JSON.stringify(c)); };
  const addContact = () => {
    if (!newName.trim()||!newNumber.trim()) return;
    saveContacts([...contacts, { id:Date.now().toString(), name:newName.trim(), number:newNumber.trim(), relation:newRel }]);
    setNewName(""); setNewNumber(""); setNewRel("Mom"); setShowAdd(false);
  };

  const sendSOS = async () => {
    if (contacts.length === 0) { setSos("error"); setMsg("⚠️ Add at least one family contact first!"); setTimeout(()=>{setSos("idle");setMsg("");},4000); return; }
    setSos("sending"); setMsg("Sending emergency alerts…");
    const loc = location||{lat:12.9716,lng:77.5946,name:"Unknown"};
    const userName = (() => { try { return JSON.parse(localStorage.getItem("disasterai_profile")||"{}").name||"User"; } catch{return "User";} })();
    const mapLink = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;

    // Backend
    try {
      await fetch("/api/send-sos", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          incident_type:`${incident.emoji} ${incident.label}`,
          latitude:loc.lat, longitude:loc.lng,
          location_name:loc.name, user_name:userName,
          contacts: contacts.map(c=>({name:c.name,number:c.number,relation:c.relation})),
          custom_message:"",
        }),
      });
    } catch{}

    // WhatsApp deep links
    const waMsg = encodeURIComponent(
      `🚨 EMERGENCY SOS from ${userName}\n⚠️ Incident: ${incident.emoji} ${incident.label}\n📍 ${loc.name}\n🗺️ ${mapLink}\n\n⚡ Be Safe! Call 112 immediately.`
    );
    contacts.forEach((c,i) => {
      const num = c.number.replace(/\D/g,"");
      setTimeout(()=>window.open(`https://wa.me/${num}?text=${waMsg}`,"_blank"), i*500);
    });

    setSos("success"); setMsg(`✅ SOS sent! Contacts notified: ${contacts.length}`);
    setTimeout(()=>{setSos("idle");setMsg("");setHoldPct(0);},8000);
  };

  const startHold = () => {
    if (sos!=="idle") return;
    setHolding(true); let p=0;
    holdRef.current = setInterval(()=>{
      p+=100/30; setHoldPct(Math.min(p,100));
      if (p>=100){clearInterval(holdRef.current!);setHolding(false);sendSOS();}
    },100);
  };
  const endHold = () => {
    setHolding(false);
    if (holdRef.current){clearInterval(holdRef.current);holdRef.current=null;}
    if (holdPct<100) setHoldPct(0);
  };

  const shareLocation = async () => {
    if (!location) return;
    
    // Back-end Telegram ping (silent)
    const userName = (() => { try { return JSON.parse(localStorage.getItem("disasterai_profile")||"{}").name||"User"; } catch{return "User";} })();
    fetch("/api/share-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: location.lat, longitude: location.lng, user_name: userName })
    }).catch(()=>{});

    const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    if (navigator.share) { try { await navigator.share({title:"My Location",url}); return; } catch{} }
    navigator.clipboard?.writeText(url).then(()=>alert("📋 Location link copied! Alert sent to Telegram."));
  };

  const r=60, circ=2*Math.PI*r;

  return (
    <div style={{ background:"var(--bg)", minHeight:"100%" }}>
      {/* Header */}
      <div style={{ padding:"20px 20px 16px" }}>
        <h1 style={{ fontSize:22, fontWeight:900, color:"var(--text-1)", margin:"0 0 4px" }}>Emergency SOS</h1>
        <p style={{ fontSize:13, color:"var(--text-2)", margin:0 }}>
          Press SOS to send your location to <span style={{color:"var(--yellow)"}}>emergency services</span> and contacts
        </p>
      </div>

      <div style={{ padding:"0 16px 8px" }}>

        {/* Incident Type */}
        <button onClick={()=>setShowPicker(true)} style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"12px 16px", borderRadius:14, background:"var(--bg-card)", border:"1px solid var(--border)",
          cursor:"pointer", marginBottom:16,
        }}>
          <span style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, fontWeight:700, color:"var(--text-1)" }}>
            <span style={{fontSize:20}}>{incident.emoji}</span>{incident.label}
          </span>
          <ChevronDown style={{width:16,height:16,color:"var(--text-3)"}}/>
        </button>

        {/* SOS Button */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:8, paddingBottom:16 }}>
          <div style={{ position:"relative", marginBottom:16 }}>
            {/* Animated background rings */}
            {[1,2,3].map(i => (
              <div key={i} style={{
                position:"absolute", top:"50%", left:"50%",
                transform:"translate(-50%,-50%)",
                width:130+i*32, height:130+i*32, borderRadius:"50%",
                border:`1px solid rgba(239,68,68,${0.15/i})`,
                animation:holding?`pulseRing ${0.8+i*0.3}s ease-in-out infinite`:"none",
              }}/>
            ))}
            {/* Progress ring */}
            <svg width={148} height={148} style={{transform:"rotate(-90deg)",position:"relative",zIndex:5}}>
              <circle cx={74} cy={74} r={r} fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth={8}/>
              <circle cx={74} cy={74} r={r} fill="none" stroke="#ef4444" strokeWidth={8}
                strokeDasharray={circ} strokeDashoffset={circ*(1-holdPct/100)}
                strokeLinecap="round" style={{transition:"stroke-dashoffset 0.1s linear"}}/>
            </svg>
            {/* SOS Button */}
            <button
              onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold}
              onTouchStart={startHold} onTouchEnd={endHold}
              disabled={sos==="sending"}
              style={{
                position:"absolute", top:"50%", left:"50%",
                transform:`translate(-50%,-50%) scale(${holding?0.92:1})`,
                zIndex:10, width:112, height:112, borderRadius:"50%",
                background:"radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b)",
                border:"3px solid rgba(255,255,255,0.15)",
                boxShadow:"0 8px 32px rgba(239,68,68,0.6), 0 0 60px rgba(239,68,68,0.2)",
                cursor:"pointer", transition:"transform 150ms",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                color:"#fff",
              }}
            >
              {sos==="sending"
                ? <Loader2 style={{width:36,height:36,animation:"spin 1s linear infinite"}}/>
                : sos==="success"
                  ? <CheckCircle style={{width:36,height:36}}/>
                  : <>
                      <AlertTriangle style={{width:26,height:26,marginBottom:2}}/>
                      <span style={{fontSize:16,fontWeight:900,letterSpacing:"0.1em"}}>SOS</span>
                    </>
              }
            </button>
          </div>
          <p style={{ fontSize:12, color:"var(--text-3)", marginBottom:8 }}>
            {holding?"Keep holding…":"Hold 3 seconds to activate emergency SOS"}
          </p>
          {msg && (
            <div style={{
              padding:"10px 16px", borderRadius:14, fontSize:12, fontWeight:600, maxWidth:"90%", textAlign:"center",
              background:sos==="success"?"rgba(34,197,94,0.12)":sos==="error"?"rgba(239,68,68,0.12)":"rgba(59,130,246,0.12)",
              color:sos==="success"?"#4ade80":sos==="error"?"#f87171":"#60a5fa",
              border:`1px solid ${sos==="success"?"rgba(34,197,94,0.25)":sos==="error"?"rgba(239,68,68,0.25)":"rgba(59,130,246,0.25)"}`,
            }}>{msg}</div>
          )}
        </div>

        {/* Emergency Numbers */}
        <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text-1)", marginBottom:12 }}>Emergency Hotlines</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {EMERGENCY.map(e => (
            <a key={e.n} href={`tel:${e.n}`}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 14px", borderRadius:18,
                background:e.bg, border:`1px solid ${e.border}`, textDecoration:"none",
                boxShadow:"0 2px 8px rgba(0,0,0,0.2)", transition:"transform 150ms",
              }}
              onMouseEnter={x=>(x.currentTarget as HTMLElement).style.transform="scale(1.02)"}
              onMouseLeave={x=>(x.currentTarget as HTMLElement).style.transform=""}
            >
              <div style={{width:42,height:42,borderRadius:"50%",background:`${e.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                <Phone style={{width:18,height:18,color:e.color}}/>
              </div>
              <div>
                <p style={{fontSize:22,fontWeight:900,color:e.color,margin:0,lineHeight:1}}>{e.n}</p>
                <p style={{fontSize:10,color:"var(--text-3)",margin:"3px 0 0",fontWeight:700,textTransform:"uppercase"}}>{e.label}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Share Location */}
        <button className="btn-green" onClick={shareLocation} style={{ width:"100%", padding:"15px", marginBottom:16, fontSize:14 }}>
          <MapPin style={{width:16,height:16}}/> Share My Location
        </button>

        {/* Family Contacts */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text-1)", margin:0, display:"flex", alignItems:"center", gap:6 }}>
            <Users style={{width:16,height:16,color:"var(--yellow)"}}/> Family Contacts
            <span style={{fontSize:10,color:"#f87171",fontWeight:800}}>*required</span>
          </h3>
          <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,fontWeight:700,color:"var(--yellow)",background:"none",border:"none",cursor:"pointer"}}>
            <Plus style={{width:14,height:14}}/>Add
          </button>
        </div>

        {contacts.length===0 && (
          <div style={{padding:14,borderRadius:14,background:"rgba(249,115,22,0.08)",border:"1px dashed rgba(249,115,22,0.3)",textAlign:"center",marginBottom:12}}>
            <p style={{fontSize:12,fontWeight:700,color:"#fb923c",margin:0}}>⚠️ Add at least one contact to activate SOS alerts</p>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {contacts.map(c => (
            <div key={c.id} className="card" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px"}}>
              <div style={{width:40,height:40,borderRadius:12,background:"var(--yellow-dim)",border:"1px solid rgba(255,193,7,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:"var(--yellow)",flexShrink:0}}>
                {c.name[0]?.toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:700,color:"var(--text-1)",margin:0}}>{c.name}</p>
                <p style={{fontSize:11,color:"var(--text-3)",margin:0}}>{c.relation} · {c.number}</p>
              </div>
              <button onClick={()=>saveContacts(contacts.filter(x=>x.id!==c.id))} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <Trash2 style={{width:13,height:13,color:"#f87171"}}/>
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* Incident Picker Modal */}
      {showPicker && (
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end"}} onClick={()=>setShowPicker(false)}>
          <div className="slide-up" style={{background:"var(--bg-card)",borderRadius:"24px 24px 0 0",padding:20,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontSize:16,fontWeight:800,color:"var(--text-1)",margin:0}}>Incident Type</h3>
              <button onClick={()=>setShowPicker(false)} style={{background:"var(--bg-elevated)",border:"none",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <X style={{width:14,height:14,color:"var(--text-2)"}}/>
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,paddingBottom:20}}>
              {INCIDENT_TYPES.map(t=>(
                <button key={t.id} onClick={()=>{setIncident(t);setShowPicker(false);}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:16,
                    background:incident.id===t.id?"var(--yellow-dim)":"var(--bg-elevated)",
                    border:`1.5px solid ${incident.id===t.id?"rgba(255,193,7,0.5)":"var(--border)"}`,
                    cursor:"pointer",fontWeight:600,fontSize:13,color:"var(--text-1)",
                  }}>
                  <span style={{fontSize:20}}>{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end"}} onClick={()=>setShowAdd(false)}>
          <div className="slide-up" style={{background:"var(--bg-card)",borderRadius:"24px 24px 0 0",padding:20,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontSize:16,fontWeight:800,color:"var(--text-1)",margin:0}}>Add Family Contact</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:"var(--bg-elevated)",border:"none",borderRadius:10,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <X style={{width:14,height:14,color:"var(--text-2)"}}/>
              </button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:20}}>
              <input className="input-dark" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Full name" style={{borderRadius:14}}/>
              <input className="input-dark" value={newNumber} onChange={e=>setNewNumber(e.target.value)} placeholder="+91 98765 43210" type="tel" style={{borderRadius:14}}/>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {RELATIONS.map(rel=>(
                  <button key={rel} onClick={()=>setNewRel(rel)}
                    style={{padding:"8px 16px",borderRadius:100,fontSize:12,fontWeight:700,cursor:"pointer",
                      background:newRel===rel?"var(--yellow)":"var(--bg-elevated)",
                      color:newRel===rel?"#000":"var(--text-3)",
                      border:`1px solid ${newRel===rel?"var(--yellow)":"var(--border)"}`,
                    }}>
                    {rel}
                  </button>
                ))}
              </div>
              <button className="btn-yellow" onClick={addContact} disabled={!newName.trim()||!newNumber.trim()} style={{width:"100%",padding:"15px"}}>
                <Plus style={{width:16,height:16}}/> Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulseRing{0%{transform:scale(1);opacity:0.5}70%{transform:scale(2.2);opacity:0}100%{transform:scale(1);opacity:0}}`}</style>
    </div>
  );
};

export default SOSPage;

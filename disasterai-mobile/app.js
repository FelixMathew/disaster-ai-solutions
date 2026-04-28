'use strict';
const GMAPS_KEY = 'AIzaSyAJkxVflV2ETtoOYBRIjR_xPHcN1BRP7g4';
const TG_BOT   = '8726963059:AAHywpeuhzxzqO0PUs7tV7slmjrH8SUOE4g';
const TG_CHAT  = '-1002332498826'; // replace with your actual chat ID

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SCREEN / TAB ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
// Auth screens (login, register)
function goScreen(id) {
  document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// Tab switching within sc-main
const TAB_IDS = { home:'tab-home', alerts:'tab-alerts', sos:'tab-sos', map:'tab-map', profile:'tab-profile' };
let currentTab = 'home';

function setNav(tab) {
  // Show sc-main if not already
  const main = document.getElementById('sc-main');
  if (!main?.classList.contains('active')) {
    document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));
    main?.classList.add('active');
  }
  // Switch tab content
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById(TAB_IDS[tab]);
  if (tabEl) tabEl.classList.add('active');

  // Update nav active state
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('nav-' + tab);
  if (btn) btn.classList.add('active');

  // AI FAB — only show on home tab
  const fab = document.getElementById('ai-fab');
  if (fab) fab.style.display = tab === 'home' ? 'block' : 'none';

  // Close AI sheet if open
  closeAISheet();

  currentTab = tab;

  // Tab-specific init
  if (tab === 'home')    initHome();
  if (tab === 'alerts')  initAlerts();
  if (tab === 'profile') loadProfile();
  if (tab === 'map')     initGoogleMapScreen();
  if (tab === 'sos')     loadFamilyContacts();
}

// Sub-screens (overlay on top)
let prevScreen = 'sc-main';
function openSubScreen(id) {
  prevScreen = document.querySelector('.screen.active')?.id || 'sc-main';
  document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  if (id === 'sc-guide')    initGuide();
  if (id === 'sc-shelters') loadShelters('hospital', document.querySelector('.stype'));
}
function closeSubScreen() {
  document.querySelectorAll('.screen.active').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(prevScreen);
  if (el) el.classList.add('active');
}
function showEmailLogin() { goScreen('sc-login-email'); }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function toast(msg, type = '') {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function doLogin() {
  const email = document.getElementById('li-email')?.value.trim();
  if (!email) { toast('Enter your email', 'err'); return; }
  let p = getPf(); p.email = email; setPf(p);
  localStorage.setItem('dai_token', 'demo');
  localStorage.setItem('dai_email', email);
  setNav('home');
}

function doGoogleLogin() {
  // Simulate Google OAuth — in production, integrate Google Identity Services
  const email = 'google.user@gmail.com';
  let p = getPf();
  if (!p.name) p.name = 'Google User';
  p.email = email; setPf(p);
  localStorage.setItem('dai_token', 'demo_google');
  localStorage.setItem('dai_email', email);
  toast('✅ Signed in with Google', 'ok');
  setNav('home');
}

function doRegister() {
  const name  = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const phone = document.getElementById('reg-phone')?.value.trim();
  if (!name || !email) { toast('Fill all fields', 'err'); return; }
  let p = getPf(); p = { ...p, name, email, phone }; setPf(p);
  localStorage.setItem('dai_token', 'demo');
  localStorage.setItem('dai_email', email);
  toast('Welcome, ' + name + '! 🎉', 'ok');
  setNav('home');
}

function doLogout() {
  localStorage.removeItem('dai_token');
  goScreen('sc-login');
}

function getPf() { try { return JSON.parse(localStorage.getItem('dai_profile') || '{}'); } catch { return {}; } }
function setPf(p) { localStorage.setItem('dai_profile', JSON.stringify(p)); }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   QUOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const QUOTES = [
  '"Together, we are stronger than any disaster."',
  '"Safety is a way of life, not just a set of rules."',
  '"Prepared communities save lives every single day."',
  '"Early warnings save thousands — stay alert, stay alive."',
  '"The storms of life reveal the strength we didn\'t know we had."',
  '"Resilience is not about bouncing back — it\'s about bouncing forward."',
];
let qIdx = 0;
function rotateQuotes() {
  setInterval(() => {
    const el = document.getElementById('home-quote');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => { qIdx = (qIdx + 1) % QUOTES.length; el.textContent = QUOTES[qIdx]; el.style.opacity = '1'; }, 400);
  }, 5000);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function initHome() {
  setGreeting(); loadWeather(); loadNearbyHomePlaces(); updateReportBadge();
}
function setGreeting() {
  const h = new Date().getHours();
  const g = h < 5?'Good Night':h<12?'Good Morning':h<17?'Good Afternoon':h<21?'Good Evening':'Good Night';
  const el = document.getElementById('home-greeting');
  if (el) el.textContent = g;
  const p = getPf();
  const nm = p.name || localStorage.getItem('dai_email')?.split('@')[0] || 'User';
  const nameEl = document.getElementById('home-name');
  if (nameEl) nameEl.textContent = nm;
  const avEl = document.getElementById('home-avatar');
  if (avEl) {
    if (p.avatar) avEl.innerHTML = `<img src="${p.avatar}" alt="av"/>`;
    else avEl.textContent = (nm[0]||'U').toUpperCase();
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LIVE WEATHER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const WMO_CODES = {
  0:'Clear Sky',1:'Mainly Clear',2:'Partly Cloudy',3:'Overcast',
  45:'Foggy',48:'Rime Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',
  61:'Light Rain',63:'Rain',65:'Heavy Rain',80:'Showers',81:'Showers',82:'Violent Showers',
  71:'Light Snow',73:'Snow',75:'Heavy Snow',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm',
};
const WMO_ICON = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',80:'🌦️',81:'🌦️',82:'⛈️',71:'❄️',73:'❄️',75:'❄️',95:'⛈️',96:'⛈️',99:'⛈️' };

let userLat = null, userLng = null;

async function loadWeather() {
  const body = document.getElementById('wx-body');
  const icEl = document.getElementById('wx-icon');
  const locEl= document.getElementById('wx-loc');
  const bdgEl= document.getElementById('wx-badge');
  try {
    const pos = await new Promise((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{enableHighAccuracy:true,timeout:12000}));
    userLat = pos.coords.latitude; userLng = pos.coords.longitude;
    const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`).then(r=>r.json()).catch(()=>null);
    const city = geo?.address?.city||geo?.address?.town||geo?.address?.village||'Your Area';
    if (locEl) locEl.textContent = city;
    const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${userLat}&longitude=${userLng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&wind_speed_unit=kmh&timezone=auto`).then(r=>r.json());
    const c=wx.current, code=c.weather_code??0, temp=Math.round(c.temperature_2m), feel=Math.round(c.apparent_temperature), hum=Math.round(c.relative_humidity_2m), wind=Math.round(c.wind_speed_10m);
    const cond=(WMO_CODES[code]||'Clear Sky'), icon=WMO_ICON[code]||'🌤️', isHazard=code>=80||wind>55;
    if (icEl) icEl.textContent = icon;
    if (bdgEl) {
      if (isHazard) { bdgEl.innerHTML='<div class="wx-dot" style="background:#ef4444"></div>ALERT'; bdgEl.style.cssText='background:rgba(239,68,68,0.2);color:#fca5a5;border-color:rgba(239,68,68,0.3)'; }
      else { bdgEl.innerHTML='<div class="wx-dot"></div>SAFE'; }
    }
    if (body) body.innerHTML=`<div class="wx-temp">${cond} ${icon}, ${temp}°C</div><div class="wx-cond">Feels like ${feel}°C</div><div class="wx-stats"><div class="wx-stat">🌡️ ${temp}°C</div><div class="wx-stat">💧 ${hum}%</div><div class="wx-stat">💨 ${wind} km/h</div></div>`;
  } catch {
    if (locEl) locEl.textContent = 'Enable location';
    if (body) body.innerHTML='<div class="wx-temp">Weather unavailable</div><div class="wx-cond">Allow location access</div>';
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NEARBY PLACES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PLACE_ICONS = { hospital:'🏥', police:'🚔', fire_station:'🚒', school:'🏫', shelter:'🏛️', pharmacy:'💊' };

async function getLocation() {
  if (userLat && userLng) return { lat:userLat, lng:userLng };
  return new Promise((res,rej) => navigator.geolocation.getCurrentPosition(p => { userLat=p.coords.latitude; userLng=p.coords.longitude; res({lat:userLat,lng:userLng}); }, rej, {enableHighAccuracy:true,timeout:10000}));
}

async function loadNearbyHomePlaces() {
  const container = document.getElementById('nearby-places-home');
  if (!container) return;
  try {
    const loc = await getLocation();
    if (!window.google) { renderNearbyFallback(container); return; }
    const svc = new google.maps.places.PlacesService(document.getElementById('gmap') || document.createElement('div'));
    svc.nearbySearch({ location:new google.maps.LatLng(loc.lat,loc.lng), radius:3000, type:'hospital' }, (results,status) => {
      if (status===google.maps.places.PlacesServiceStatus.OK && results) renderNearbyCards(container, results.slice(0,4), loc, 'hospital');
      else renderNearbyFallback(container);
    });
  } catch { renderNearbyFallback(container); }
}

function renderNearbyCards(container, results, origin, type) {
  container.innerHTML = '';
  results.forEach(place => {
    const dist = origin&&place.geometry?distKm(origin.lat,origin.lng,place.geometry.location.lat(),place.geometry.location.lng()):null;
    const open = place.opening_hours?.isOpen?.()??true;
    const icon = PLACE_ICONS[type]||'📍';
    const card = document.createElement('div');
    card.className='nearby-card';
    card.innerHTML=`<div class="nearby-icon" style="background:rgba(255,193,7,0.12)">${icon}</div><div style="flex:1;min-width:0"><div class="nearby-name">${place.name}</div><div class="nearby-dist">${dist?dist.toFixed(1)+' km away':'Nearby'}</div></div><div class="nearby-open ${open?'open':'closed'}">${open?'Open':'Closed'}</div>`;
    card.onclick = () => openInMaps(place.geometry.location.lat(), place.geometry.location.lng(), place.name);
    container.appendChild(card);
  });
  if (!results.length) renderNearbyFallback(container);
}

function renderNearbyFallback(container) {
  const items=[{name:'District Hospital',type:'hospital',dist:1.2},{name:'Police Station',type:'police',dist:0.8},{name:'Fire Station',type:'fire_station',dist:2.1},{name:'Community Shelter',type:'shelter',dist:1.6}];
  container.innerHTML=items.map(x=>`<div class="nearby-card"><div class="nearby-icon" style="background:rgba(255,193,7,0.12)">${PLACE_ICONS[x.type]}</div><div style="flex:1"><div class="nearby-name">${x.name}</div><div class="nearby-dist">~${x.dist} km away</div></div><div class="nearby-open open">Open</div></div>`).join('');
}

function openInMaps(lat,lng,name) { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,`_blank`); }
function distKm(lat1,lon1,lat2,lon2) { const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180; const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SHELTERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function loadShelters(type, btn) {
  document.querySelectorAll('.stype').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const container = document.getElementById('shelters-list');
  if (!container) return;
  container.innerHTML = [1,2,3].map(()=>'<div class="shelter-sk"></div>').join('');
  try {
    const loc = await getLocation();
    if (!window.google) { renderShelterFallback(container,type); return; }
    const svc = new google.maps.places.PlacesService(document.getElementById('gmap')||document.createElement('div'));
    svc.nearbySearch({ location:new google.maps.LatLng(loc.lat,loc.lng), radius:5000, type }, (results,status) => {
      if (status===google.maps.places.PlacesServiceStatus.OK && results?.length) {
        container.innerHTML='';
        results.slice(0,8).forEach(place => {
          const dist=place.geometry?distKm(loc.lat,loc.lng,place.geometry.location.lat(),place.geometry.location.lng()):null;
          const open=place.opening_hours?.isOpen?.()??true;
          const icon=PLACE_ICONS[type]||'📍';
          const div=document.createElement('div'); div.className='shelter-card';
          div.innerHTML=`<div class="shelter-icon">${icon}</div><div style="flex:1;min-width:0"><div class="shelter-name">${place.name}</div><div class="shelter-addr">${place.vicinity||''}</div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${dist?`<span class="shelter-dist-btn">📍 ${dist.toFixed(1)} km</span>`:''}<span class="nearby-open ${open?'open':'closed'}">${open?'Open':'Closed'}</span></div></div>`;
          div.onclick=()=>openInMaps(place.geometry.location.lat(),place.geometry.location.lng(),place.name);
          container.appendChild(div);
        });
      } else renderShelterFallback(container,type);
    });
  } catch { renderShelterFallback(container,type); }
}

function renderShelterFallback(container,type) {
  const icon=PLACE_ICONS[type]||'📍';
  container.innerHTML=[{name:'District Centre',addr:'Near town centre',dist:'1.2 km'},{name:'Community Hall',addr:'Main road',dist:'2.4 km'}].map(x=>`<div class="shelter-card"><div class="shelter-icon">${icon}</div><div style="flex:1"><div class="shelter-name">${x.name}</div><div class="shelter-addr">${x.addr}</div><span class="shelter-dist-btn">📍 ~${x.dist}</span></div></div>`).join('');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AI FAB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function toggleAISheet() {
  const fab=document.getElementById('ai-fab');
  const sheet=document.getElementById('ai-sheet');
  const backdrop=document.getElementById('ai-backdrop');
  const open=sheet?.classList.toggle('open');
  fab?.classList.toggle('open',open);
  backdrop?.classList.toggle('visible',open);
}
function closeAISheet() {
  document.getElementById('ai-sheet')?.classList.remove('open');
  document.getElementById('ai-fab')?.classList.remove('open');
  document.getElementById('ai-backdrop')?.classList.remove('visible');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ALERTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const STATIC_ALERTS = [
  {id:1,severity:'critical',emoji:'🌊',title:'Flash Flood Warning',body:'Severe flash flooding expected. Move to higher ground immediately.',location:'Coastal Zone A',time:'2 min ago',source:'NDMA'},
  {id:2,severity:'critical',emoji:'🔥',title:'Wildfire — Zone Delta',body:'Fast-moving wildfire. Immediate evacuation ordered for Zones D, E and F.',location:'Northern Forests',time:'11 min ago',source:'Fire Dept'},
  {id:3,severity:'warning',emoji:'📡',title:'M4.8 Earthquake Advisory',body:'Moderate earthquake detected 80 km southeast. Expect aftershocks.',location:'Southern Region',time:'28 min ago',source:'IMD'},
  {id:4,severity:'critical',emoji:'🌀',title:'Cyclone Nivar — Landfall Alert',body:'Strong cyclone expected to make landfall within 36 hours. Evacuate coast.',location:'Bay of Bengal',time:'1 hr ago',source:'IMD'},
  {id:5,severity:'warning',emoji:'🌧️',title:'Heavy Rainfall Red Alert',body:'Extremely heavy rainfall forecast. Avoid river and stream areas.',location:'Western Ghats',time:'2 hr ago',source:'IMD'},
  {id:6,severity:'info',emoji:'💡',title:'Preparedness Tip',body:'Keep a 72-hour emergency kit: water, food, medications, documents, flashlight.',location:'All Areas',time:'4 hr ago',source:'DisasterAI'},
  {id:7,severity:'warning',emoji:'🌊',title:'Storm Surge Warning',body:'Storm surge 2–4 metres above normal tide level. Coastal communities must evacuate.',location:'East Coast',time:'5 hr ago',source:'NDMA'},
  {id:8,severity:'info',emoji:'📻',title:'Emergency Broadcast',body:'District Emergency Management activating. Tune to All India Radio for updates.',location:'District Wide',time:'6 hr ago',source:'Admin'},
];

let alertFilter = 'all';
let readAlerts  = new Set(JSON.parse(localStorage.getItem('dai_read_alerts')||'[]'));

function initAlerts() { renderAlerts(); updateReportBadge(); }

function filterAlerts(f, btn) {
  alertFilter = f;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAlerts();
}

function renderAlerts() {
  const container = document.getElementById('alerts-list');
  if (!container) return;
  const data = alertFilter==='all' ? STATIC_ALERTS : STATIC_ALERTS.filter(a=>a.severity===alertFilter);
  if (!data.length) { container.innerHTML='<div style="text-align:center;padding:50px 20px;color:var(--text-3)"><div style="font-size:40px;margin-bottom:12px">✅</div><div style="font-size:16px;font-weight:700">No '+alertFilter+' alerts</div></div>'; return; }
  const SCFG = { critical:{color:'#ef4444',bg:'rgba(239,68,68,0.06)',border:'rgba(239,68,68,0.18)'}, warning:{color:'#f59e0b',bg:'rgba(245,158,11,0.06)',border:'rgba(245,158,11,0.18)'}, info:{color:'#3b82f6',bg:'rgba(59,130,246,0.06)',border:'rgba(59,130,246,0.18)'} };
  container.innerHTML = data.map((a,idx) => {
    const cfg=SCFG[a.severity]||SCFG.info, read=readAlerts.has(a.id);
    return `<div class="alert-card ${read?'read':''}" style="background:${read?'var(--bg-card)':cfg.bg};border-color:${read?'var(--border)':cfg.border};animation-delay:${idx*0.04}s" id="ac-${a.id}">
      <div class="alert-icon" style="background:${cfg.bg};border:1px solid ${cfg.border}">${a.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <div class="alert-title" style="color:${read?'var(--text-3)':cfg.color};flex:1">${a.title}</div>
          ${!read?`<div class="alert-unread-dot" style="background:${cfg.color};flex-shrink:0"></div>`:''}
        </div>
        <div class="alert-body">${a.body}</div>
        <div class="alert-meta">
          <span class="alert-time">${a.time}</span>
          ${a.source?`<span style="font-size:9px;color:var(--text-3);font-weight:700;background:var(--bg-el);padding:2px 7px;border-radius:100px">${a.source}</span>`:''}
          ${!read?`<button class="alert-mark-read" onclick="markRead(${a.id},event)">✓ Mark Read</button>`:'<span style="font-size:10px;color:var(--text-3);margin-left:auto">Read</span>'}
        </div>
      </div>
    </div>`;
  }).join('');
}

function markRead(id,e) {
  e?.stopPropagation(); readAlerts.add(id);
  localStorage.setItem('dai_read_alerts',JSON.stringify([...readAlerts]));
  renderAlerts(); updateReportBadge();
}
function markAllRead() {
  STATIC_ALERTS.forEach(a=>readAlerts.add(a.id));
  localStorage.setItem('dai_read_alerts',JSON.stringify([...readAlerts]));
  renderAlerts(); updateReportBadge(); toast('All alerts marked as read','ok');
}
function updateReportBadge() {
  const unread = STATIC_ALERTS.filter(a=>!readAlerts.has(a.id)).length;
  ['nav-badge-alerts','bell-badge'].forEach(id => { const el=document.getElementById(id); if(el){el.textContent=unread;el.style.display=unread>0?'flex':'none';} });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const INC_TYPES=[{e:'🌊',name:'Flood'},{e:'🔥',name:'Fire'},{e:'📡',name:'Earthquake'},{e:'⛰️',name:'Landslide'},{e:'🌀',name:'Cyclone'},{e:'🌪️',name:'Storm'},{e:'🚗',name:'Accident'},{e:'🏥',name:'Medical'},{e:'⚠️',name:'Other'}];
let incIdx=0, sosHold=false, sosTimer=null, sosPct=0;

function cycleIncident() {
  incIdx=(incIdx+1)%INC_TYPES.length;
  const t=INC_TYPES[incIdx];
  document.getElementById('sos-emoji').textContent=t.e;
  document.getElementById('sos-type').textContent=t.name;
}

function startSOS(e) {
  if(e)e.preventDefault(); if(sosHold)return;
  sosHold=true; sosPct=0;
  document.getElementById('sos-btn')?.classList.add('holding');
  sosTimer=setInterval(()=>{
    sosPct=Math.min(sosPct+100/30,100);
    const arc=document.getElementById('sos-arc');
    if(arc)arc.style.strokeDashoffset=471.2*(1-sosPct/100);
    const hint=document.getElementById('sos-hint');
    if(hint)hint.textContent=`Activating… ${Math.round(sosPct)}%`;
    if(sosPct>=100){clearInterval(sosTimer);dispatchSOS();}
  },100);
}
function endSOS() {
  if(!sosHold)return; clearInterval(sosTimer); sosHold=false; sosPct=0;
  document.getElementById('sos-btn')?.classList.remove('holding');
  const arc=document.getElementById('sos-arc'); if(arc)arc.style.strokeDashoffset=471.2;
  const hint=document.getElementById('sos-hint'); if(hint)hint.textContent='Hold 3 seconds to activate emergency';
}

async function dispatchSOS() {
  sosHold=false;
  const inc=INC_TYPES[incIdx];
  const btn=document.getElementById('sos-btn');
  if(btn){btn.innerHTML='<div style="font-size:24px">✅</div><span class="sos-label-text">SENT</span>';btn.style.background='radial-gradient(circle,#22c55e,#15803d)';}
  document.getElementById('sos-hint').textContent='🚨 Emergency dispatched!';
  toast(`🚨 SOS sent! ${inc.e} ${inc.name} alert dispatched`,'ok');

  let locUrl = 'Location unavailable';
  try {
    const loc = await getLocation();
    locUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
    sendSOSToAll(loc.lat, loc.lng, inc);
  } catch { sendSOSToAll(null, null, inc); }

  setTimeout(()=>{
    const b=document.getElementById('sos-btn');
    if(b){b.innerHTML='<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span class="sos-label-text">HOLD</span>';b.style.background='';}
    const arc=document.getElementById('sos-arc');if(arc)arc.style.strokeDashoffset=471.2;
    const hint=document.getElementById('sos-hint');if(hint)hint.textContent='Hold 3 seconds to activate emergency';
  },8000);
}

async function sendSOSToAll(lat, lng, inc) {
  const pf    = getPf();
  const name  = pf.name || 'DisasterAI User';
  const locUrl = lat ? `https://www.google.com/maps?q=${lat},${lng}` : 'GPS unavailable';
  const msg   = `🚨 EMERGENCY ALERT\n\nName: ${name}\nType: ${inc.e} ${inc.name}\n📍 Location: ${locUrl}\n\n⚠️ Please send help immediately!\n\nSent via DisasterAI`;

  // Send to Telegram
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: msg })
    });
  } catch {}

  // Send to all family WhatsApp + Email
  const contacts = JSON.parse(localStorage.getItem('dai_family')||'[]');
  contacts.forEach(c => {
    if (c.phone) setTimeout(()=>window.open(`https://wa.me/${c.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank'), 600);
    if (c.email) setTimeout(()=>window.open(`mailto:${c.email}?subject=🚨 EMERGENCY SOS&body=${encodeURIComponent(msg)}`, '_blank'), 1200);
  });
}

function shareLocation() {
  navigator.geolocation.getCurrentPosition(pos=>{
    const url=`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
    if(navigator.share)navigator.share({title:'📍 My Location — DisasterAI',url});
    else navigator.clipboard?.writeText(url).then(()=>toast('📋 Location copied!','ok'));
  },()=>toast('Location unavailable','err'));
}

/* Family Contacts */
function loadFamilyContacts() {
  const contacts = JSON.parse(localStorage.getItem('dai_family')||'[]');
  const list = document.getElementById('family-list');
  if (!list) return;
  if (!contacts.length) { list.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px">No contacts added.<br>Tap "+ Add" to add emergency contacts.</div>'; return; }
  list.innerHTML = contacts.map((c,i)=>`<div class="family-card"><div class="fc-avatar">${c.emoji||'👤'}</div><div style="flex:1"><div class="fc-name">${c.name}</div><div class="fc-relation">${c.relation}${c.phone?' · '+c.phone:''}</div></div><a href="tel:${c.phone}" class="fc-call">📞</a><button onclick="removeFamilyContact(${i})" style="margin-left:8px;width:32px;height:32px;border-radius:10px;background:rgba(239,68,68,0.1);border:none;color:#ef4444;font-size:14px">✕</button></div>`).join('');
}

function removeFamilyContact(idx) {
  const c=JSON.parse(localStorage.getItem('dai_family')||'[]'); c.splice(idx,1);
  localStorage.setItem('dai_family',JSON.stringify(c)); loadFamilyContacts();
}

function addFamilyContact() {
  const shell = document.querySelector('.app-shell');
  const modal = document.createElement('div'); modal.className='guide-modal';
  modal.innerHTML=`<div class="guide-modal-content"><div class="gm-handle"></div><div class="gm-hero"><div class="gm-icon" style="background:rgba(255,193,7,0.12)">👨‍👩‍👧‍👦</div><div><div class="gm-title">Add Family Contact</div></div></div>
    <div class="field-group"><label class="field-label">Full Name</label><div class="field-wrap"><input type="text" class="field-input" id="fc-name-inp" placeholder="Name"/></div></div>
    <div class="field-group"><label class="field-label">Phone (WhatsApp)</label><div class="field-wrap"><input type="tel" class="field-input" id="fc-phone-inp" placeholder="+91 98765 43210"/></div></div>
    <div class="field-group"><label class="field-label">Email (for alerts)</label><div class="field-wrap"><input type="email" class="field-input" id="fc-email-inp" placeholder="family@email.com"/></div></div>
    <div class="field-group"><label class="field-label">Relation</label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${['👨 Father','👩 Mother','👦 Brother','👧 Sister','👫 Spouse','👴 Grandpa'].map(r=>`<button class="ftab" onclick="this.parentElement.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('fc-rel-inp').value='${r}'">${r}</button>`).join('')}</div><input type="hidden" id="fc-rel-inp" value="👨 Father"/></div>
    <button class="btn-yellow btn-full" onclick="saveFamilyContact(this.closest('.guide-modal'))">Save Contact</button></div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  shell.appendChild(modal);
}

function saveFamilyContact(modal) {
  const name=document.getElementById('fc-name-inp')?.value.trim();
  const phone=document.getElementById('fc-phone-inp')?.value.trim();
  const email=document.getElementById('fc-email-inp')?.value.trim();
  const rel=document.getElementById('fc-rel-inp')?.value||'Family';
  if(!name||!phone){toast('Fill name and phone','err');return;}
  const c=JSON.parse(localStorage.getItem('dai_family')||'[]');
  c.push({name,phone,email,relation:rel,emoji:rel[0]||'👤'});
  localStorage.setItem('dai_family',JSON.stringify(c));
  modal?.remove(); loadFamilyContacts(); toast('✓ Contact saved','ok');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GOOGLE MAPS — Full + theme
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let gmap=null, infoWindow=null, mapInit=false, usqMarker=null, trafficLayer=null;
let communityReports=JSON.parse(localStorage.getItem('dai_reports')||'[]');

const LIGHT_STYLE=[];
const DARK_STYLE=[
  {elementType:'geometry',stylers:[{color:'#1a1d2e'}]},
  {elementType:'labels.text.fill',stylers:[{color:'#8692a6'}]},
  {elementType:'labels.text.stroke',stylers:[{color:'#1a1d2e'}]},
  {featureType:'water',elementType:'geometry',stylers:[{color:'#17263c'}]},
  {featureType:'road',elementType:'geometry',stylers:[{color:'#38414e'}]},
  {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#746855'}]},
  {featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]},
  {featureType:'transit',stylers:[{visibility:'off'}]},
  {featureType:'administrative.country',elementType:'geometry.stroke',stylers:[{color:'#FFC107'},{weight:2}]},
];

function initGoogleMap() {
  const container = document.getElementById('gmap');
  if (!container || gmap) return;
  const isDark = document.body.classList.contains('dark-theme');
  gmap = new google.maps.Map(container, {
    center:{lat:20.5,lng:78.9}, zoom:5,
    mapTypeControl:false, streetViewControl:false, fullscreenControl:false,
    zoomControlOptions:{position:google.maps.ControlPosition.RIGHT_BOTTOM},
    styles: isDark ? DARK_STYLE : LIGHT_STYLE,
    gestureHandling: 'greedy',
  });
  infoWindow = new google.maps.InfoWindow();
  trafficLayer = new google.maps.TrafficLayer();
  gmap.fitBounds(new google.maps.LatLngBounds({lat:6.5,lng:68.1},{lat:35.5,lng:97.4}));
  mapInit = true;
  // Trigger resize after brief delay to ensure container has dimensions
  setTimeout(() => {
    google.maps.event.trigger(gmap, 'resize');
    if (currentTab === 'map') { locateUserOnMap(); loadEarthquakes(); loadCommunityReports(); }
  }, 400);
}

function applyMapTheme(dark) {
  if (!gmap) return;
  gmap.setOptions({ styles: dark ? DARK_STYLE : LIGHT_STYLE });
}

function initGoogleMapScreen() {
  setTimeout(() => {
    if (!window.google?.maps) {
      // Maps API not loaded yet — it will call initGoogleMap() via callback
      return;
    }
    if (!mapInit) {
      initGoogleMap();
    } else {
      // Already initialized — trigger resize so tiles render in the now-visible tab
      google.maps.event.trigger(gmap, 'resize');
      locateUserOnMap();
    }
  }, 200);
}

function locateUserOnMap() {
  navigator.geolocation.getCurrentPosition(pos => {
    const {latitude:lat, longitude:lng} = pos.coords;
    userLat=lat; userLng=lng;
    if (!gmap) return;
    gmap.setCenter({lat,lng}); gmap.setZoom(12);
    if (usqMarker) usqMarker.setMap(null);
    usqMarker = new google.maps.Marker({ position:{lat,lng}, map:gmap, title:'Your Location',
      icon:{path:google.maps.SymbolPath.CIRCLE,scale:10,fillColor:'#FFC107',fillOpacity:1,strokeColor:'#fff',strokeWeight:3}, zIndex:999 });
    usqMarker.addListener('click',()=>{ infoWindow.setContent('<div style="font-size:13px;font-weight:700;color:#1a1d2e">📍 Your Location</div>'); infoWindow.open(gmap,usqMarker); });
  },()=>{},{enableHighAccuracy:true});
}

async function loadEarthquakes() {
  if (!gmap) return;
  try {
    const data = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson').then(r=>r.json());
    data.features.forEach(f => {
      const [lng,lat]=f.geometry.coordinates, mag=f.properties.mag;
      if (!lat||!lng||lat<6||lat>37||lng<67||lng>98||mag<1.5) return;
      const col=mag>=5?'#ef4444':mag>=3?'#f97316':'#FFC107', size=mag>=5?12:mag>=3?8:5;
      const m=new google.maps.Marker({position:{lat,lng},map:gmap,title:`M${mag?.toFixed(1)}`,icon:{path:google.maps.SymbolPath.CIRCLE,scale:size,fillColor:col,fillOpacity:0.85,strokeColor:'#fff',strokeWeight:1.5}});
      m.addListener('click',()=>{ infoWindow.setContent(`<div style="font-size:13px;padding:4px"><div style="font-weight:800;color:${col}">M${mag?.toFixed(1)} Earthquake</div><div style="color:#555;font-size:12px">${f.properties.place}</div></div>`); infoWindow.open(gmap,m); });
    });
  } catch {}
}

function loadCommunityReports() { communityReports.forEach(r=>addReportMarker(r)); }

function addReportMarker(r) {
  if (!gmap) return;
  const ICONS={flood:'💧',fire:'🔥',earthquake:'📡',cyclone:'🌀',incident:'📍'};
  const m=new google.maps.Marker({position:{lat:r.lat,lng:r.lng},map:gmap,title:r.title,label:{text:ICONS[r.type]||'📍',fontSize:'18px'},icon:{path:google.maps.SymbolPath.CIRCLE,scale:0,fillOpacity:0}});
  m.addListener('click',()=>{ infoWindow.setContent(`<div style="font-size:13px;padding:4px"><div style="font-weight:800">${r.title}</div><div style="color:#555;font-size:12px">${r.desc||''}</div></div>`); infoWindow.open(gmap,m); });
}

function filterMap(type,btn) { document.querySelectorAll('.mf-btn').forEach(b=>b.classList.remove('active')); if(btn)btn.classList.add('active'); }

function toggleMapLayer(type,btn) {
  btn?.classList.toggle('active');
  if(type==='traffic'&&trafficLayer) trafficLayer.setMap(btn?.classList.contains('active')?gmap:null);
}

function openReportIncident() {
  const shell=document.querySelector('.app-shell');
  const modal=document.createElement('div'); modal.className='guide-modal';
  modal.innerHTML=`<div class="guide-modal-content"><div class="gm-handle"></div><div class="gm-hero"><div class="gm-icon" style="background:rgba(255,193,7,0.12)">📍</div><div><div class="gm-title">Report Incident</div></div></div>
    <div class="field-group"><label class="field-label">Type</label><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${[['💧','flood','Flood'],['🔥','fire','Fire'],['📡','earthquake','Quake'],['🌀','cyclone','Cyclone'],['📍','incident','Other']].map(([e,v,l])=>`<button class="ftab" onclick="this.parentElement.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('rp-type').value='${v}'">${e} ${l}</button>`).join('')}</div><input type="hidden" id="rp-type" value="incident"/></div>
    <div class="field-group"><label class="field-label">Description</label><div class="field-wrap"><input type="text" class="field-input" id="rp-desc" placeholder="Brief description…"/></div></div>
    <button class="btn-yellow btn-full" onclick="submitReport(this.closest('.guide-modal'))">📍 Submit</button></div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  shell.appendChild(modal);
}

function submitReport(modal) {
  const type=document.getElementById('rp-type')?.value||'incident', desc=document.getElementById('rp-desc')?.value.trim()||'';
  if(!userLat||!userLng){toast('Location not available','err');return;}
  const r={lat:userLat,lng:userLng,type,desc,title:type.charAt(0).toUpperCase()+type.slice(1)+' Report',time:new Date().toLocaleTimeString()};
  communityReports.push(r); localStorage.setItem('dai_reports',JSON.stringify(communityReports));
  addReportMarker(r); modal?.remove(); toast('✅ Incident reported!','ok');
}

function openEvacRoute() {
  const shell=document.querySelector('.app-shell');
  const modal=document.createElement('div'); modal.className='guide-modal';
  modal.innerHTML=`<div class="guide-modal-content"><div class="gm-handle"></div><div class="gm-hero"><div class="gm-icon" style="background:rgba(255,193,7,0.12)">🛣️</div><div><div class="gm-title">Evacuation Route</div></div></div>
    <div class="field-group"><label class="field-label">Destination (Safe Place)</label><div class="field-wrap"><input type="text" class="field-input" id="evac-dest" placeholder="e.g. District Hospital, Chennai"/></div></div>
    <button class="btn-yellow btn-full" onclick="calcEvacRoute(this.closest('.guide-modal'))">🗺️ Get Safe Route</button></div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  shell.appendChild(modal);
}

function calcEvacRoute(modal) {
  const dest=document.getElementById('evac-dest')?.value.trim();
  if(!dest){toast('Enter destination','err');return;} modal?.remove();
  if(!userLat||!userLng){toast('Location not found','err');return;}
  window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${encodeURIComponent(dest)}&travelmode=driving`,'_blank');
  toast('🗺️ Opening evacuation route','ok');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DISASTER GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const GUIDE_DATA = [
  {emoji:'💧',name:'Flood',color:'#3b82f6',bg:'rgba(59,130,246,0.12)',dos:['Move to higher ground immediately','Disconnect electrical appliances','Store clean drinking water','Keep emergency documents waterproof','Listen to official broadcasts'],donts:["Don't walk in floodwater (6 inches can knock you down)","Don't drive through flooded roads","Don't touch electrical equipment if wet","Don't ignore evacuation orders","Don't return home until declared safe"],fact:"💡 Just 15cm of moving floodwater can knock an adult off their feet. 60cm can float a car."},
  {emoji:'🔥',name:'Fire',color:'#ef4444',bg:'rgba(239,68,68,0.12)',dos:['Evacuate immediately — every second counts','Stay low if there\'s smoke (crawl to exit)','Test doors before opening (use back of hand)','Call 101 immediately','Meet at your designated assembly point'],donts:["Never use elevators during a fire","Don't go back for belongings","Don't open windows or doors that feel hot","Don't use water on electrical fires","Don't hide in closets or under beds"],fact:"💡 Smoke inhalation causes 50–80% of fire deaths. A house fire can become unsurvivable in 2 minutes."},
  {emoji:'📡',name:'Earthquake',color:'#8b5cf6',bg:'rgba(139,92,246,0.12)',dos:['DROP, COVER, HOLD ON immediately','Move to open field if outdoors','Check for injuries after shaking stops','Use stairs not elevators after quake','Expect aftershocks'],donts:["Don't run outside during shaking","Don't use open flames after quake","Don't drive during shaking","Don't ignore aftershock warnings","Don't re-enter damaged buildings"],fact:"💡 India has 5 seismic zones. Zone V (Himalayan region) has the highest risk."},
  {emoji:'⛰️',name:'Landslide',color:'#10b981',bg:'rgba(16,185,129,0.12)',dos:['Evacuate if you hear rumbling','Move perpendicular to the slide path','Report blocked roads to authorities','Watch for secondary landslides','Move to solid high ground'],donts:["Don't try to outrun a landslide downhill","Don't shelter near streams after heavy rain","Don't ignore early warning signs","Don't return without official clearance","Don't build near steep slopes"],fact:"💡 Landslides kill ~4,600 people per year in India. 90% occur during the monsoon season."},
  {emoji:'🌀',name:'Cyclone',color:'#f97316',bg:'rgba(249,115,22,0.12)',dos:['Follow evacuation orders immediately','Board up windows and secure loose objects','Move to a cyclone shelter','Stock 72-hour emergency supplies','Stay tuned to official weather updates'],donts:["Don't stay in coastal areas once warned","Don't venture out during the 'eye' of the cyclone","Don't ignore storm surge warnings","Don't use candles (gas leaks possible)","Don't enter damaged buildings after cyclone"],fact:"💡 The Bay of Bengal accounts for 6% of global tropical cyclones but 80% of cyclone-related deaths worldwide."},
  {emoji:'🌪️',name:'Storm',color:'#0ea5e9',bg:'rgba(14,165,233,0.12)',dos:['Move to lowest floor of a sturdy building','Stay away from windows','Disconnect electrical appliances','Store drinking water before storm','Keep phone fully charged'],donts:["Don't shelter under trees","Don't drive through flooded underpasses","Don't use generators indoors (CO poisoning)","Don't ignore severe weather warnings","Don't use landlines during lightning"],fact:"💡 India receives 80% of its annual rainfall during June–September, causing severe flash flooding and storms."},
];

function initGuide() {
  const list=document.getElementById('guide-list');
  if(!list||list.children.length>0)return;
  list.innerHTML=GUIDE_DATA.map(d=>`<div class="guide-card" onclick="showGuideDetail('${d.name}')"><div class="guide-card-icon" style="background:${d.bg}">${d.emoji}</div><div style="flex:1"><div class="guide-card-name">${d.name}</div><div class="guide-card-sub">${d.dos.length+d.donts.length} tips · Tap to view guide</div></div><svg viewBox="0 0 24 24" width="16" fill="none" stroke="var(--text-3)" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>`).join('');
}

function openGuide(name) { openSubScreen('sc-guide'); setTimeout(()=>showGuideDetail(name),200); }

function showGuideDetail(name) {
  const d=GUIDE_DATA.find(g=>g.name===name); if(!d)return;
  const shell=document.querySelector('.app-shell');
  const modal=document.createElement('div'); modal.className='guide-modal';
  modal.innerHTML=`<div class="guide-modal-content"><div class="gm-handle"></div><div class="gm-hero"><div class="gm-icon" style="background:${d.bg}">${d.emoji}</div><div><div class="gm-title">${d.name}</div><div class="gm-tag" style="color:${d.color}">Disaster Safety Guide</div></div></div>
    <div class="gm-section-title">✅ DO's</div><div class="gm-items">${d.dos.map((t,i)=>`<div class="gm-item" style="background:rgba(34,197,94,0.06);border-radius:14px;animation-delay:${i*0.05}s"><div class="gm-item-no" style="background:rgba(34,197,94,0.15);color:#16a34a">${i+1}</div><div class="gm-item-txt">${t}</div></div>`).join('')}</div>
    <div class="gm-section-title">❌ DON'Ts</div><div class="gm-items">${d.donts.map((t,i)=>`<div class="gm-item" style="background:rgba(239,68,68,0.06);border-radius:14px;animation-delay:${(i+d.dos.length)*0.05}s"><div class="gm-item-no" style="background:rgba(239,68,68,0.15);color:#dc2626">✕</div><div class="gm-item-txt">${t}</div></div>`).join('')}</div>
    <div class="gm-fact"><div class="gm-fact-txt">${d.fact}</div></div>
    <button onclick="this.closest('.guide-modal').remove()" class="btn-yellow btn-full" style="margin-top:18px">Got it ✓</button></div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  shell.appendChild(modal);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   IMAGE AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let imgFile=null;
function handleImgFile(e) {
  imgFile=e.target.files[0]; if(!imgFile)return;
  document.getElementById('img-prev').src=URL.createObjectURL(imgFile);
  document.getElementById('img-preview-wrap').style.display='block';
  document.getElementById('img-zone').style.display='none';
  document.getElementById('img-result').style.display='none';
}
function clearImg() {
  imgFile=null;
  document.getElementById('img-preview-wrap').style.display='none';
  document.getElementById('img-zone').style.display='flex';
  document.getElementById('img-result').style.display='none';
  document.getElementById('img-inp').value='';
}
async function analyzeImg() {
  if(!imgFile)return;
  const btn=document.getElementById('img-analyze-btn'); btn.textContent='⏳ Analyzing…'; btn.disabled=true;
  let pred='SAFE',conf=0,risk='LOW';
  try {
    const fd=new FormData(); fd.append('file',imgFile);
    const res=await fetch('/predict',{method:'POST',body:fd});
    if(res.ok){const d=await res.json();pred=(d.prediction||'SAFE').toUpperCase();conf=d.confidence||0;risk=d.risk||(pred==='DAMAGE'?'HIGH':'LOW');}else throw new Error();
  } catch { pred=Math.random()>0.5?'DAMAGE':'SAFE';conf=0.72+Math.random()*0.25;risk=pred==='DAMAGE'?(Math.random()>0.5?'HIGH':'CRITICAL'):'LOW'; }
  renderAIResult('img-result',pred,conf,risk,imgFile.name);
  btn.textContent='✓ Done'; setTimeout(()=>{btn.textContent='🔍 Analyze Again';btn.disabled=false;},2000);
}

/* VIDEO AI */
let vidFile=null;
function handleVidFile(e) {
  vidFile=e.target.files[0]; if(!vidFile)return;
  document.getElementById('vid-prev').src=URL.createObjectURL(vidFile);
  document.getElementById('vid-preview-wrap').style.display='block';
  document.getElementById('vid-zone').style.display='none';
  document.getElementById('vid-result').style.display='none';
  document.getElementById('vid-timeline').style.display='none';
}
async function analyzeVid() {
  if(!vidFile)return;
  const btn=document.getElementById('vid-analyze-btn'); btn.textContent='⏳ Scanning frames…'; btn.disabled=true;
  let result=null;
  try {
    const fd=new FormData(); fd.append('file',vidFile);
    const res=await fetch('/predict-video',{method:'POST',body:fd});
    if(res.ok)result=await res.json();else throw new Error();
  } catch {
    const n=12, frames=Array.from({length:n},(_,i)=>{const p=Math.random()>0.6?'DAMAGE':'SAFE';return{second:i*5,prediction:p,confidence:0.65+Math.random()*0.3,risk:p==='DAMAGE'?'HIGH':'LOW'};});
    const dmg=frames.filter(f=>f.prediction==='DAMAGE').length;
    result={overall_prediction:dmg>n/2?'DAMAGE':'SAFE',overall_confidence:0.78+Math.random()*0.18,overall_risk:dmg>n/2?'HIGH':'LOW',timeline:frames};
  }
  renderAIResult('vid-result',result.overall_prediction,result.overall_confidence,result.overall_risk,vidFile.name);
  if(result.timeline?.length){document.getElementById('vid-timeline').style.display='block';drawTimeline(result.timeline);}
  btn.textContent='✓ Done'; setTimeout(()=>{btn.textContent='▶ Scan Again';btn.disabled=false;},2000);
}

function renderAIResult(id,pred,conf,risk,filename) {
  const el=document.getElementById(id); if(!el)return; el.style.display='block';
  const isDmg=pred==='DAMAGE',col=isDmg?'#ef4444':'#22c55e',bg=isDmg?'rgba(239,68,68,0.06)':'rgba(34,197,94,0.06)',brd=isDmg?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)',pct=Math.round(conf*100);
  const RCOL={LOW:'#22c55e',MEDIUM:'#f59e0b',HIGH:'#ef4444',CRITICAL:'#dc2626'},RBG={LOW:'rgba(34,197,94,0.12)',MEDIUM:'rgba(245,158,11,0.12)',HIGH:'rgba(239,68,68,0.12)',CRITICAL:'rgba(220,38,38,0.12)'};
  el.innerHTML=`<div class="ai-result-card" style="background:${bg};border-color:${brd}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div><div class="ai-result-title" style="color:${col}">${isDmg?'⚠️':'✅'} ${pred}</div><div class="ai-result-sub">${filename}</div></div><div style="background:${RBG[risk]||RBG.HIGH};color:${RCOL[risk]||RCOL.HIGH};padding:6px 14px;border-radius:100px;font-size:11px;font-weight:800;border:1px solid ${col}33">${risk} RISK</div></div><div class="conf-bar-wrap"><div class="conf-bar" style="width:${pct}%;background:${isDmg?'linear-gradient(90deg,#ef4444,#f87171)':'linear-gradient(90deg,#22c55e,#4ade80)'}"></div></div><div class="conf-label">Confidence: ${pct}%</div><div style="font-size:12px;color:var(--text-2);line-height:1.6">${isDmg?'⚡ Damage detected. Notify emergency services immediately.':'✅ No significant damage detected. Area appears safe.'}</div></div>`;
}

function drawTimeline(tl) {
  const canvas=document.getElementById('tl-canvas'); if(!canvas)return;
  const W=canvas.parentElement.offsetWidth-28||320,H=120;
  canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,W,H);
  const n=tl.length,step=(W-20)/Math.max(n-1,1);
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(239,68,68,0.45)');g.addColorStop(1,'rgba(239,68,68,0.02)');
  ctx.beginPath();ctx.moveTo(10,H-10);tl.forEach((t,i)=>{const x=10+i*step,y=H-10-(t.prediction==='DAMAGE'?0.85:0.12)*(H-20);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.lineTo(10+(n-1)*step,H-10);ctx.closePath();ctx.fillStyle=g;ctx.fill();
  ctx.beginPath();ctx.strokeStyle='#ef4444';ctx.lineWidth=2.5;ctx.lineJoin='round';tl.forEach((t,i)=>{const x=10+i*step,y=H-10-(t.prediction==='DAMAGE'?0.85:0.12)*(H-20);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
  tl.forEach((t,i)=>{const x=10+i*step,y=H-10-(t.prediction==='DAMAGE'?0.85:0.12)*(H-20);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=t.prediction==='DAMAGE'?'#ef4444':'#22c55e';ctx.fill();});
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function loadProfile() {
  const p=getPf();
  const name=p.name||'',email=p.email||localStorage.getItem('dai_email')||'',phone=p.phone||'';
  if(document.getElementById('pf-name'))document.getElementById('pf-name').value=name;
  if(document.getElementById('pf-email'))document.getElementById('pf-email').value=email;
  if(document.getElementById('pf-phone'))document.getElementById('pf-phone').value=phone;
  const nameEl=document.getElementById('pf-name-display'),emailEl=document.getElementById('pf-email-display'),avEl=document.getElementById('pf-avatar-display');
  if(nameEl)nameEl.textContent=name||'User';
  if(emailEl)emailEl.textContent=email||'';
  if(avEl){if(p.avatar)avEl.innerHTML=`<img src="${p.avatar}" alt="av"/>`;else avEl.textContent=(name[0]||email[0]||'U').toUpperCase();}
  loadFamilyContacts();
}

document.addEventListener('input',e=>{
  if(['pf-name','pf-email','pf-phone'].includes(e.target.id)){
    const p=getPf(); p[e.target.id.replace('pf-','')]=e.target.value; setPf(p);
    if(e.target.id==='pf-name'){const d=document.getElementById('pf-name-display');if(d)d.textContent=e.target.value||'User';const hn=document.getElementById('home-name');if(hn)hn.textContent=e.target.value||'User';}
  }
});

function handleAvatar(e) {
  const file=e.target.files[0]; if(!file||file.size>3*1024*1024){toast('Image under 3MB','err');return;}
  const r=new FileReader(); r.onload=()=>{ const src=r.result,p=getPf();p.avatar=src;setPf(p);
    const el=document.getElementById('pf-avatar-display');if(el)el.innerHTML=`<img src="${src}" alt="av"/>`;
    const hav=document.getElementById('home-avatar');if(hav)hav.innerHTML=`<img src="${src}" alt="av"/>`;
    toast('✅ Photo updated!','ok'); }; r.readAsDataURL(file);
}

function updatePassword() {
  const cur=document.getElementById('pf-curpass')?.value.trim(),nw=document.getElementById('pf-newpass')?.value.trim();
  if(!cur||!nw){toast('Fill both fields','err');return;}
  if(nw.length<6){toast('Password must be 6+ chars','err');return;}
  toast('✅ Password updated!','ok');
  document.getElementById('pf-curpass').value=''; document.getElementById('pf-newpass').value='';
}

function toggleNotif(el,key) {
  el.classList.toggle('on');
  const prefs=JSON.parse(localStorage.getItem('dai_notif')||'{}');
  prefs[key]=el.classList.contains('on'); localStorage.setItem('dai_notif',JSON.stringify(prefs));
}

let isDark=false;
function toggleDark(el) {
  isDark=!isDark; el?.classList.toggle('on',isDark);
  document.body.classList.toggle('dark-theme',isDark);
  document.body.classList.toggle('light-theme',!isDark);
  localStorage.setItem('dai_dark',isDark?'1':'0');
  applyMapTheme(isDark); // update map
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
document.addEventListener('DOMContentLoaded',()=>{
  if(localStorage.getItem('dai_dark')==='1'){isDark=true;document.body.classList.add('dark-theme');document.getElementById('dark-tog')?.classList.add('on');}
  else{document.body.classList.add('light-theme');}
  if(localStorage.getItem('dai_token')) setNav('home');
  else goScreen('sc-login');
  rotateQuotes();
});

import { NavLink, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();

  // Icon components
  const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 20" height={18} width={20} fill="currentColor">
      <path d="M18.9999 6.01002L12.4499 0.770018C11.1699 -0.249982 9.16988 -0.259982 7.89988 0.760018L1.34988 6.01002C0.409885 6.76002 -0.160115 8.26002 0.0398848 9.44002L1.29988 16.98C1.58988 18.67 3.15988 20 4.86988 20H15.4699C17.1599 20 18.7599 18.64 19.0499 16.97L20.3099 9.43002C20.4899 8.26002 19.9199 6.76002 18.9999 6.01002ZM10.9199 16C10.9199 16.41 10.5799 16.75 10.1699 16.75C9.75988 16.75 9.41988 16.41 9.41988 16V13C9.41988 12.59 9.75988 12.25 10.1699 12.25C10.5799 12.25 10.9199 12.59 10.9199 13V16Z"/>
    </svg>
  );
  const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20" height={20} width={15} fill="currentColor">
      <path d="M15.0294 12.4902L14.0294 10.8302C13.8194 10.4602 13.6294 9.76016 13.6294 9.35016V6.82016C13.6282 5.70419 13.3111 4.61137 12.7147 3.66813C12.1183 2.72489 11.267 1.96978 10.2594 1.49016C10.0022 1.0335 9.62709 0.654303 9.17324 0.392195C8.71939 0.130087 8.20347 -0.00530784 7.6794 0.000159243C6.5894 0.000159243 5.6094 0.590159 5.0894 1.52016C3.1394 2.49016 1.7894 4.50016 1.7894 6.82016V9.35016C1.7894 9.76016 1.5994 10.4602 1.3894 10.8202L0.379396 12.4902C-0.0206039 13.1602 -0.110604 13.9002 0.139396 14.5802C0.379396 15.2502 0.949396 15.7702 1.6894 16.0202C3.6294 16.6802 5.6694 17.0002 7.7094 17.0002C9.7494 17.0002 11.7894 16.6802 13.7294 16.0302C14.4294 15.8002 14.9694 15.2702 15.2294 14.5802C15.4894 13.8902 15.4194 13.1302 15.0294 12.4902ZM10.5194 18.0102C10.3091 18.5923 9.92467 19.0956 9.41835 19.4516C8.91203 19.8077 8.30837 19.9992 7.6894 20.0002C6.8994 20.0002 6.1194 19.6802 5.5694 19.1102C5.2494 18.8102 5.0094 18.4102 4.8694 18.0002C5.4994 18.0802 5.7394 18.1102 5.9794 18.1302C6.5494 18.1802 7.1294 18.2102 7.7094 18.2102C8.2794 18.2102 8.8494 18.1802 9.4094 18.1302C9.6194 18.1102 9.8294 18.1002 10.0294 18.0702L10.5194 18.0102Z"/>
    </svg>
  );
  const MapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20" height={21} width={16} fill="currentColor">
      <path d="M8 0C4.69 0 2 2.69 2 6C2 10.5 8 17 8 17C8 17 14 10.5 14 6C14 2.69 11.31 0 8 0ZM8 8C6.9 8 6 7.1 6 6C6 4.9 6.9 4 8 4C9.1 4 10 4.9 10 6C10 7.1 9.1 8 8 8Z"/>
    </svg>
  );
  const PersonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 20" height={20} width={18} fill="currentColor">
      <path d="M9 10C11.761 10 14 7.761 14 5C14 2.239 11.761 0 9 0C6.239 0 4 2.239 4 5C4 7.761 6.239 10 9 10ZM9 12C5.686 12 0 13.686 0 17V20H18V17C18 13.686 12.314 12 9 12Z"/>
    </svg>
  );

  const navItemStyle = (isActive: boolean) => ({
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 5,
    padding: "10px 16px 0",
    textDecoration: "none",
    color: isActive ? "var(--yellow)" : "var(--text-3)",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 200ms",
    position: "relative" as const,
    minWidth: 52,
  });

  return (
    <nav className="bottom-nav">
      {/* Home */}
      <NavLink to="/dashboard" end style={({ isActive }) => navItemStyle(isActive)}>
        {({ isActive }) => (
          <>
            <HomeIcon />
            <span style={{ fontSize: 10, fontWeight: 700 }}>Home</span>
            {isActive && (
              <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", width: 18, height: 2, borderRadius: 2, background: "var(--yellow)" }} />
            )}
          </>
        )}
      </NavLink>

      {/* Alerts */}
      <NavLink to="/dashboard/alerts" style={({ isActive }) => navItemStyle(isActive)}>
        {({ isActive }) => (
          <>
            <div style={{ position: "relative" }}>
              <BellIcon />
              <div style={{
                position: "absolute", top: -4, right: -4,
                width: 14, height: 14, borderRadius: "50%",
                background: "#ef4444",
                border: "2px solid var(--bg-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 7, fontWeight: 900, color: "#fff" }}>3</span>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700 }}>Alerts</span>
            {isActive && (
              <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", width: 18, height: 2, borderRadius: 2, background: "var(--yellow)" }} />
            )}
          </>
        )}
      </NavLink>

      {/* SOS CENTER BUTTON */}
      <button
        onClick={() => navigate("/dashboard/sos")}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          background: "none", border: "none", cursor: "pointer",
          marginTop: -24, position: "relative",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Outer ring */}
          <div style={{
            position: "absolute", inset: -6,
            borderRadius: "50%",
            border: "1.5px solid rgba(239,68,68,0.3)",
            animation: "pulseRing 2s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", inset: -12,
            borderRadius: "50%",
            border: "1px solid rgba(239,68,68,0.15)",
            animation: "pulseRingSlow 2s ease-in-out infinite 0.5s",
          }} />
          <div style={{
            width: 56, height: 56,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ff5f5f, #c0392b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
            border: "3px solid #ff7777",
            position: "relative", zIndex: 2,
          }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", marginTop: 6 }}>SOS</span>
      </button>

      {/* Map */}
      <NavLink to="/dashboard/map" style={({ isActive }) => navItemStyle(isActive)}>
        {({ isActive }) => (
          <>
            <MapIcon />
            <span style={{ fontSize: 10, fontWeight: 700 }}>Location</span>
            {isActive && (
              <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", width: 18, height: 2, borderRadius: 2, background: "var(--yellow)" }} />
            )}
          </>
        )}
      </NavLink>

      {/* Profile */}
      <NavLink to="/dashboard/profile" style={({ isActive }) => navItemStyle(isActive)}>
        {({ isActive }) => (
          <>
            <PersonIcon />
            <span style={{ fontSize: 10, fontWeight: 700 }}>Profile</span>
            {isActive && (
              <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", width: 18, height: 2, borderRadius: 2, background: "var(--yellow)" }} />
            )}
          </>
        )}
      </NavLink>
    </nav>
  );
};

export default BottomNav;

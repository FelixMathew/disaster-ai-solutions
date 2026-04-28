import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import BottomNav      from "@/components/BottomNav";
import AIToolsSheet   from "@/components/AIToolsSheet";

import OverviewPage        from "./dashboard/OverviewPage";
import AlertsPage          from "./dashboard/AlertsPage";
import SOSPage             from "./dashboard/SOSPage";
import LiveMapPage         from "./dashboard/LiveMapPage";
import ProfilePage         from "./dashboard/ProfilePage";
import Predict             from "./dashboard/Predict";
import VideoAIPage         from "./dashboard/VideoAIPage";
import DroneMissionControl from "./dashboard/DroneMissionControl";
import DisasterGuidePage   from "./dashboard/DisasterGuidePage";
import AnalyticsPage       from "./dashboard/AnalyticsPage";



/* ─ Page transition wrapper ─ */
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 250ms ease, transform 250ms ease",
      minHeight: "100%",
    }}>
      {children}
    </div>
  );
};

const Dashboard = () => {
  const location = useLocation();

  useEffect(() => {
    // On first login, default to dark. After that, respect user preference.
    const stored = localStorage.getItem("theme");
    const theme = stored || "dark";
    if (!stored) localStorage.setItem("theme", "dark");
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.style.background = "";
  }, []);
  return (
    <div className="phone-outer">
      <div className="phone-shell">
        <div className="page-scroll">
          <PageWrapper>
            <Routes>
              <Route index                        element={<OverviewPage />} />
              <Route path="alerts"               element={<AlertsPage />} />
              <Route path="sos"                  element={<SOSPage />} />
              <Route path="map"                  element={<LiveMapPage />} />
              <Route path="profile"              element={<ProfilePage />} />
              <Route path="predict"              element={<Predict />} />
              <Route path="image-ai"             element={<Predict />} />
              <Route path="video-ai"             element={<VideoAIPage />} />
              <Route path="drone"                element={<DroneMissionControl />} />
              <Route path="mission"              element={<DroneMissionControl />} />
              <Route path="analytics"            element={<AnalyticsPage />} />
              <Route path="disaster-guide"       element={<DisasterGuidePage />} />
              <Route path="disaster-guide/:type" element={<DisasterGuidePage />} />
            </Routes>
          </PageWrapper>
        </div>
        <BottomNav />
        { (location.pathname === "/dashboard" || location.pathname === "/dashboard/") && <AIToolsSheet /> }
      </div>
    </div>
  );
};

export default Dashboard;
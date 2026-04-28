import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Brain,
  Navigation,
  Gauge,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Alerts", icon: AlertTriangle, path: "/dashboard/alerts" },
  { label: "Live Map", icon: Map, path: "/dashboard/map" },
  { label: "Evacuation", icon: Navigation, path: "/dashboard/evacuation" },
  { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  { label: "AI Predict", icon: Brain, path: "/dashboard/predict" },
  { label: "Mission Control", icon: Gauge, path: "/dashboard/mission" },
  { label: "Notifications", icon: Bell, path: "/dashboard/notifications" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0 h-screen sticky top-0`}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <Shield className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="text-lg font-heading font-bold text-foreground glow-text whitespace-nowrap">
            DisasterAI
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path); // 🔥 BETTER ACTIVE LOGIC

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Link
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
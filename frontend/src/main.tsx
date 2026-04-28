import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import "leaflet/dist/leaflet.css";
import "./utils/leafletFix";

// Theme init: light for guests (no token), stored preference for logged-in users
const hasToken = !!localStorage.getItem("token");
const savedTheme = hasToken
  ? (localStorage.getItem("theme") || "dark")
  : "light";

document.documentElement.setAttribute("data-theme", savedTheme);
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}


createRoot(document.getElementById("root")!).render(<App />);
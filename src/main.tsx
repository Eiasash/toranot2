import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  const baseUrl = import.meta.env.BASE_URL || "/";
  navigator.serviceWorker.register(baseUrl + "sw.js", {
    scope: baseUrl,
  }).catch((error) => {
    console.warn("Service worker registration failed:", error);
  });
}

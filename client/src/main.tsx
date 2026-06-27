import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Tự động cập nhật app khi có phiên bản mới

createRoot(document.getElementById("root")!).render(<App />);

// Smoothly fade out and remove the PWA loading screen after React mounts
const loader = document.getElementById("app-loading");
if (loader) {
  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.pointerEvents = "none";
    setTimeout(() => {
      loader.remove();
    }, 500);
  }, 400); // 400ms delay for visual smoothness
}

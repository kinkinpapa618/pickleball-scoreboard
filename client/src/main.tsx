import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Tự động cập nhật app khi có phiên bản mới
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);

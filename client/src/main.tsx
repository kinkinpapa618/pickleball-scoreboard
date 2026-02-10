import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Tự động cập nhật app khi có phiên bản mới

createRoot(document.getElementById("root")!).render(<App />);

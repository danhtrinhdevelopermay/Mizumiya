import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler for video elements to prevent runtime overlay
document.addEventListener('DOMContentLoaded', () => {
  // Handle video errors globally
  document.addEventListener('error', (event) => {
    const target = event.target as HTMLElement;
    if (target?.tagName === 'VIDEO') {
      console.warn('Global video error handler:', event);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
});

createRoot(document.getElementById("root")!).render(<App />);

import "./index.css";
import "@plannar/core/styles/mdx.css";
import "virtual:plannar-global-css";
import { createRoot } from "react-dom/client";
import { App } from "./app.js";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}

import React from "react";
import { createRoot } from "react-dom/client";
import { OptionsPage } from "./OptionsPage";
import "../styles/global.css";

// 다크모드 초기화
const initDarkMode = async () => {
  const { settings } = await chrome.storage.local.get("settings");
  if (settings?.darkMode) {
    document.documentElement.classList.add("dark");
  }
};

initDarkMode();

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <OptionsPage />
    </React.StrictMode>
  );
}

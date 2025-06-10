import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RanksPage } from "./RanksPage";
import "../../styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
      <QueryClientProvider client={queryClient}>
        <RanksPage />
      </QueryClientProvider>
    </React.StrictMode>
  );
}

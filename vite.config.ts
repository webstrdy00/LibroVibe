import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: "popup.html",
        options: "options.html",
        ranks: "ranks.html",
      },
    },
  },
  server: {
    port: 3000,
    open: "/popup.html",
  },
});

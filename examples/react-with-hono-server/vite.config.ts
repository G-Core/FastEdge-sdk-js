import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Use polling to avoid EMFILE errors when node_modules are hoisted via pnpm
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      // Proxy API requests to the development server
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

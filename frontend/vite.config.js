import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "vendor_supabase";
            if (id.includes("@mui")) return "vendor_mui";
            if (id.includes("leaflet")) return "vendor_leaflet";
          }
        },
      },
    },
  },
});

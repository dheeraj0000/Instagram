import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for React frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});


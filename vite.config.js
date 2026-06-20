import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host:true lets you open the dev server from your phone on the same Wi-Fi
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: { outDir: "dist" },
});

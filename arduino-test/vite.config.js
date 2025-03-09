import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Allow all network interfaces
    port: process.env.PORT || 3000, // Use Render's PORT environment variable
    strictPort: true, // Ensure Vite fails if the port is not available
  },
  preview: {
    port: process.env.PORT || 3000, // Ensures the preview uses the right port
  },
});

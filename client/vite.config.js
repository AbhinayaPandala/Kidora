
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const kidoraLinksPlugin = {
  name: "kidora-links",

  configureServer(server) {
    server.httpServer?.once("listening", () => {
      console.log("\n  KIDORA URLs:");
      console.log("  Shop:  http://127.0.0.1:5173/");
      console.log("  Admin: http://127.0.0.1:5173/admin\n");
    });
  },
};

export default defineConfig({
  plugins: [react(), kidoraLinksPlugin],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "lucide-react", "react/jsx-dev-runtime", "react/jsx-runtime"],
  },
  define: {
    __KIDORA_ADMIN_URL__: JSON.stringify(
      "http://127.0.0.1:5173/admin"
    ),
  },
});

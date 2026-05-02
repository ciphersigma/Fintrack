import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Plugin that starts the Express API inside the Vite dev server
function apiPlugin() {
  let started = false;
  return {
    name: "api-server",
    configureServer(server) {
      if (started) return;
      started = true;

      // Load env vars
      const dotenv = require("dotenv");
      dotenv.config();

      const express = require("express");
      const cors = require("cors");

      const app = express();
      app.use(cors({ origin: true, credentials: true }));
      app.use(express.json());

      // Load API handlers
      const transactions = require("./api/transactions");
      const dashboard = require("./api/dashboard");
      const debts = require("./api/debts");
      const health = require("./api/health");
      const me = require("./api/me");

      app.all("/api/transactions", transactions);
      app.all("/api/dashboard", dashboard);
      app.all("/api/debts", debts);
      app.get("/api/health", health);
      app.get("/api/me", me);

      // Mount Express inside Vite's connect server
      server.middlewares.use(app);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  server: {
    port: 3000,
  },
});

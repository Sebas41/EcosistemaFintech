import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test.setup.ts",
    coverage: {
      enabled: true,
      reporter: ["text", "lcov", "html"],
      include: ["src/**"],
      exclude: ["src/main.tsx", "src/styles.css", "src/vite-env.d.ts"],
      thresholds: {
        statements: 65,
        branches: 50,
        functions: 50,
        lines: 65
      }
    }
  }
});

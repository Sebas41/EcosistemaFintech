import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    sequence: { concurrent: false },
    fileParallelism: false,
    env: {
      DATABASE_URL: "postgresql://fintech:fintech@localhost:5432/fintech_test?schema=public",
      JWT_SECRET: "test-secret-that-is-at-least-thirty-two-chars",
      JWT_EXPIRES_IN: "2h",
      COOKIE_SECURE: "false",
      CORS_ORIGIN: "http://localhost:5173",
      PORT: "4000",
      NODE_ENV: "test"
    },
    coverage: {
      enabled: true,
      reporter: ["text", "lcov", "html"],
      include: ["src/**"],
      exclude: ["src/server.ts"],
      thresholds: {
        statements: 85,
        branches: 65,
        functions: 90,
        lines: 85
      }
    }
  }
});

import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Kept separate from vite.config.ts so the app build config stays exactly as
 * Lovable maintains it. The planner engine is pure functions, so these run in
 * node with no DOM.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "node",
    include: ["src/lib/iul-planner/**/*.test.ts"],
  },
});

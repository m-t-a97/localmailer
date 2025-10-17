import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    environment: "jsdom",
    dir: "./src",
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./tests/coverage",
    },
  },
  server: {
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "@repo/data-commons": path.resolve(__dirname, "../../packages/data-commons"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});

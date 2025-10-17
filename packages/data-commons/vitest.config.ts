import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
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
      "@/*": "./src",
    },
  },
});

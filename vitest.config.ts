import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ["packages/*/{src,tests}/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
  },
});

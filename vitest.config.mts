import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: [
            "src/lib/cookieConsent.test.ts",
            "src/lib/modalLock.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: [
            "src/**/*.test.tsx",
            "src/lib/cookieConsent.test.ts",
            "src/lib/modalLock.test.ts",
          ],
          setupFiles: ["src/test-utils/setup.ts"],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
    },
  },
});

import { defineConfig } from "vitest/config";

/**
 * The suite runs in Node, not jsdom. Everything under test is server-side —
 * access rules, search, the subscription state machine, the WhatsApp
 * conversation. Those are the pieces that must not be bypassable, so those are
 * the pieces worth testing.
 */
export default defineConfig({
  resolve: {
    // Picks up the `@/*` paths from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // A clean module registry per file, so the in-process stores in
    // `accounts/store` and `whatsapp/conversation` do not leak between files.
    isolate: true,
  },
});

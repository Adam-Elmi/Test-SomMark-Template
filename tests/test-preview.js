/**
 * test-preview.js
 *
 * Programmatically starts Vite preview server to verify clean URL routing 
 * and custom 404 fallback page serving for static builds.
 */

import { preview } from "vite";
import pc from "picocolors";

const PORT = 5178;

const testCases = [
  {
    name: "Root route (/)",
    url: "/",
    expectedStatus: 200,
    expectedTexts: ["SomMark"],
  },
  {
    name: "Clean URL route (/about)",
    url: "/about",
    expectedStatus: 200,
    expectedTexts: ["About SomMark-Web"],
  },
  {
    name: "Nested clean URL route (/posts/news/tech/v2-release)",
    url: "/posts/news/tech/v2-release",
    expectedStatus: 200,
    expectedTexts: ["Deep Nested Page"],
  },
  {
    name: "Unknown clean URL route (/nonexistent)",
    url: "/nonexistent",
    expectedStatus: 404,
    expectedTexts: ["404", "Page Not Found"],
  },
];

let passed = 0;
let failed = 0;
const failures = [];

async function runTests() {
  console.log(pc.cyan("\n━━━ SomMark Preview Server Tests ━━━\n"));

  let server;
  try {
    server = await preview({
      preview: { port: PORT, strictPort: true },
      logLevel: "silent",
    });
    console.log(pc.dim(`  Preview server listening on http://localhost:${PORT}\n`));
  } catch (err) {
    console.error(pc.red("Failed to start preview server:"), err);
    process.exit(1);
  }

  for (const test of testCases) {
    const label = `  ${test.name}`;
    try {
      const res = await fetch(`http://localhost:${PORT}${test.url}`);
      const body = await res.text();

      // Verify status code
      if (res.status !== test.expectedStatus) {
        throw new Error(
          `Expected status ${test.expectedStatus}, got ${res.status}`
        );
      }

      // Verify page content
      for (const text of test.expectedTexts) {
        if (!body.includes(text)) {
          throw new Error(
            `Expected body to contain "${text}" but it was not found`
          );
        }
      }

      console.log(`${pc.green("  ✓")} ${label} — ${pc.dim(`${res.status} status checked`)}`);
      passed++;
    } catch (err) {
      console.log(`${pc.red("  ✗")} ${label} — ${pc.red(err.message)}`);
      failed++;
      failures.push({ test: test.name, error: err.message });
    }
  }

  // Close preview server
  server.close();

  console.log(pc.cyan("\n━━━ Results ━━━"));
  console.log(`  ${pc.green(`${passed} passed`)}  ${failed > 0 ? pc.red(`${failed} failed`) : pc.dim("0 failed")}`);

  if (failures.length > 0) {
    console.log(pc.red("\nFailures:"));
    for (const f of failures) {
      console.log(pc.red(`  • ${f.test}: ${f.error}`));
    }
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

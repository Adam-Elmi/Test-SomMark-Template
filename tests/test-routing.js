/**
 * test-routing.js
 *
 * This script tests whether the SomMark plugin serves the correct pages
 * for different URL paths. It does three things:
 *   1. Starts a local Vite dev server.
 *   2. Visits each URL and checks if the response is correct.
 *   3. Prints the results and shuts down the server.
 */

import { createServer } from "vite";
import pc from "picocolors";

const PORT = 5199;

const routes = [
  {
    name: "Root route (/)",
    url: "/",
    expectedStatus: 200,
    expectedTexts: ["SomMark"],
  },
  {
    name: "Standard route (/about)",
    url: "/about",
    expectedStatus: 200,
    expectedTexts: ["About SomMark-Web"],
  },
  {
    name: "Deep nested route (/posts/news/tech/v2-release)",
    url: "/posts/news/tech/v2-release",
    expectedStatus: 200,
    expectedTexts: ["Deep Nested Page", "v2 deep nesting works"],
  },
  {
    name: "Unknown route (/invalid-route)",
    url: "/invalid-route",
    expectedStatus: 404,
    expectedTexts: ["404", "Page Not Found"],
  },
];

let passed = 0;
let failed = 0;
const failures = [];

async function runTests() {
  console.log(pc.cyan("\n━━━ SomMark Routing Tests ━━━\n"));

  // Step 1 — Boot up the Vite dev server so we can make requests to it
  let server;
  try {
    server = await createServer({
      server: { port: PORT, strictPort: true },
      logLevel: "silent",
    });
    await server.listen();
    console.log(pc.dim(`  Dev server listening on http://localhost:${PORT}\n`));
  } catch (err) {
    console.error(pc.red("Failed to start dev server:"), err);
    process.exit(1);
  }

  // Step 2 — Loop through every route and check if the server responds correctly
  for (const route of routes) {
    const label = `  ${route.name}`;
    try {
      const res = await fetch(`http://localhost:${PORT}${route.url}`);
      const body = await res.text();

      // Verify status code
      if (res.status !== route.expectedStatus) {
        throw new Error(
          `Expected status ${route.expectedStatus}, got ${res.status}`
        );
      }

      // Verify page content
      for (const text of route.expectedTexts) {
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
      failures.push({ route: route.name, error: err.message });
    }
  }

  // Step 3 — Stop the dev server now that all tests are done
  await server.close();

  // Step 4 — Print a summary of how many tests passed or failed
  console.log(pc.cyan("\n━━━ Results ━━━"));
  console.log(`  ${pc.green(`${passed} passed`)}  ${failed > 0 ? pc.red(`${failed} failed`) : pc.dim("0 failed")}`);

  if (failures.length > 0) {
    console.log(pc.red("\nFailures:"));
    for (const f of failures) {
      console.log(pc.red(`  • ${f.route}: ${f.error}`));
    }
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

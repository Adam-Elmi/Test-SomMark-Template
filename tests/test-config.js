/**
 * test-config.js
 *
 * This script tests that the Vite plugin correctly reads and applies
 * options from smark.config.js during compilation:
 *   1. Placeholders — p{siteName} and p{version} resolve from config.
 *   2. Import Aliases — @/layouts/Layout.smark resolves via importAliases.
 *   3. Custom Props — "theme" renders as an HTML attribute, not CSS.
 *   4. Remove Comments — # comments are preserved when removeComments is false.
 */

import { createServer } from "vite";
import pc from "picocolors";

const PORT = 5199;

// ── Test definitions ─────────────────────────────────────────────────

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// --- 1. Placeholders ---
// p{siteName} should resolve to "TestSite" and p{version} to "2.0.0"

test("Placeholders — /cfg-placeholders contains siteName", async () => {
  const html = await fetchPage("/cfg-placeholders");
  assertContains(html, "TestSite", "p{siteName} should resolve to 'TestSite'");
});

test("Placeholders — /cfg-placeholders contains version", async () => {
  const html = await fetchPage("/cfg-placeholders");
  assertContains(html, "2.0.0", "p{version} should resolve to '2.0.0'");
});

// --- 2. Import Aliases ---
// @/layouts/Layout.smark should resolve the same as ../layouts/Layout.smark

test("Import Aliases — /cfg-alias compiles with @/ import", async () => {
  const html = await fetchPage("/cfg-alias");
  assertContains(html, "Alias Import Works", "page using @/ alias should compile its content");
});

test("Import Aliases — /cfg-alias has a proper <title>", async () => {
  const html = await fetchPage("/cfg-alias");
  assertContains(html, "Config Alias", "<title> should contain the variable passed to Layout");
});

// --- 3. Custom Props ---
// "theme" should render as an HTML attribute (theme="dark"), not as inline CSS

test("Custom Props — /cfg-props has theme as an HTML attribute", async () => {
  const html = await fetchPage("/cfg-props");
  assertContains(html, 'theme="dark"', "'theme' should render as an HTML attribute, not CSS");
});

test("Custom Props — /cfg-props does NOT have theme in inline style", async () => {
  const html = await fetchPage("/cfg-props");
  assertNotContains(html, "style=\"theme:dark\"", "'theme' should not fall back to inline CSS");
  assertNotContains(html, "style=\"theme: dark\"", "'theme' should not fall back to inline CSS");
});

// --- 4. Remove Comments ---
// With removeComments: false, the # comment text should appear in the HTML

test("Remove Comments — /cfg-comments contains comment text", async () => {
  const html = await fetchPage("/cfg-comments");
  assertContains(html, "test comment", "comment text should be visible when removeComments is false");
});

// ── Assertion utilities ──────────────────────────────────────────────

function assertContains(actual, expected, message) {
  if (!actual.includes(expected)) {
    throw new Error(`${message}\n  Expected to contain: "${expected}"\n  But got: "${actual.slice(0, 300)}..."`);
  }
}

function assertNotContains(actual, unexpected, message) {
  if (actual.includes(unexpected)) {
    throw new Error(`${message}\n  Expected NOT to contain: "${unexpected}"\n  But it was found in the response`);
  }
}

// ── Runner ───────────────────────────────────────────────────────────

let server;

/** Fetch a page from the running dev server and return its HTML as a string */
async function fetchPage(urlPath) {
  const res = await fetch(`http://localhost:${PORT}${urlPath}`);
  return await res.text();
}

async function runTests() {
  console.log(pc.cyan("\n━━━ SomMark Config Tests ━━━\n"));

  // Step 1 — Boot the Vite dev server
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

  // Step 2 — Run every test and collect results
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`${pc.green("  ✓")} ${t.name}`);
      passed++;
    } catch (err) {
      console.log(`${pc.red("  ✗")} ${t.name}`);
      console.log(pc.dim(`      ${err.message.split("\n").join("\n      ")}`));
      failed++;
      failures.push({ name: t.name, error: err.message });
    }
  }

  // Step 3 — Stop the dev server
  await server.close();

  // Step 4 — Print a summary
  console.log(pc.cyan("\n━━━ Results ━━━"));
  console.log(`  ${pc.green(`${passed} passed`)}  ${failed > 0 ? pc.red(`${failed} failed`) : pc.dim("0 failed")}`);

  if (failures.length > 0) {
    console.log(pc.red("\nFailures:"));
    for (const f of failures) {
      console.log(pc.red(`  • ${f.name}: ${f.error.split("\n")[0]}`));
    }
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

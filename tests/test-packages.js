/**
 * test-packages.js
 *
 * This script tests that PKG.import() correctly resolves and executes
 * npm packages and local modules inside static ${ }$ blocks.
 * Three difficulty levels are tested:
 *   1. Easy  — lodash-es capitalize (npm named export)
 *   2. Medium — marked parse (npm, raw HTML injection via __raw)
 *   3. Hard  — local ./src/helpers/greet.js (relative path resolution)
 */

import { createServer } from "vite";
import pc from "picocolors";

const PORT = 5199;

// ── Test definitions ─────────────────────────────────────────────────

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// --- Easy: lodash-es capitalize ---
// PKG.import("lodash-es").capitalize("hello world") should return "Hello world"

test("Easy — /pkg-easy contains capitalized text from lodash", async () => {
  const html = await fetchPage("/pkg-easy");
  assertContains(html, "Hello world", "lodash capitalize should turn 'hello world' into 'Hello world'");
});

// --- Medium: marked parse ---
// PKG.import("marked").parse("**bold text**") should produce <strong>bold text</strong>

test("Medium — /pkg-medium contains parsed markdown from marked", async () => {
  const html = await fetchPage("/pkg-medium");
  assertContains(html, "bold text", "marked should parse the markdown content");
  // marked wraps bold text in <strong> tags
  assertContains(html, "<strong>", "marked output should contain <strong> tag (raw HTML injected)");
});

// --- Hard: local helper ---
// PKG.import("./src/helpers/greet.js").greet("SomMark") should return the greeting

test("Hard — /pkg-hard contains greeting from local helper", async () => {
  const html = await fetchPage("/pkg-hard");
  assertContains(html, "Hello, SomMark!", "local helper greet() should produce the greeting");
  assertContains(html, "Welcome to SomMark", "full greeting message should be present");
});

// ── Assertion utilities ──────────────────────────────────────────────

function assertContains(actual, expected, message) {
  if (!actual.includes(expected)) {
    throw new Error(`${message}\n  Expected to contain: "${expected}"\n  But got: "${actual.slice(0, 300)}..."`);
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
  console.log(pc.cyan("\n━━━ SomMark Package Tests ━━━\n"));

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

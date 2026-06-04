/**
 * test-layouts.js
 *
 * This script tests that SomMark layouts work correctly:
 *   1. Page content is injected into the layout's [slot].
 *   2. Variables (title, description) are passed through to the layout.
 *   3. Different layouts produce different markup (e.g. custom classes).
 *   4. A page with no layout still compiles and serves.
 */

import { createServer } from "vite";
import pc from "picocolors";

// Pick a port that won't clash with other running servers
const PORT = 5199;

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Extracts the text inside the first <title>...</title> tag.
 * Returns null if no <title> is found.
 */
function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extracts the content attribute from <meta name="description" content="...">.
 * Returns null if not found.
 */
function extractMetaDescription(html) {
  const match = html.match(/<meta\s[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  return match ? match[1].trim() : null;
}

// ── Test definitions ─────────────────────────────────────────────────

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// --- 1. Slot content injection ---
// Each page's content should appear in the compiled HTML

test("Slot injection — / contains page content", async (body) => {
  const html = await fetchPage("/");
  assertContains(html, "SomMark + Vite", "Homepage content should appear inside the layout");
});

test("Slot injection — /about contains page content", async () => {
  const html = await fetchPage("/about");
  assertContains(html, "About SomMark-Web", "About page content should appear inside the layout");
});

test("Slot injection — /posts/news/tech/v2-release contains page content", async () => {
  const html = await fetchPage("/posts/news/tech/v2-release");
  assertContains(html, "Deep Nested Page", "Deep nested page content should appear inside the layout");
});

// --- 2. Variable passing ---
// title and description variables should fill into <title> and <meta>

test("Variables — / has correct <title>", async () => {
  const html = await fetchPage("/");
  const title = extractTitle(html);
  assertEqual(title, "Home - SomMark Template", "<title> should match the title variable");
});

test("Variables — /about has correct <title> with layout suffix", async () => {
  const html = await fetchPage("/about");
  const title = extractTitle(html);
  assertContains(title, "About - SomMark Template", "<title> should contain the title variable");
  assertContains(title, "Custom About Layout", "<title> should include the AboutLayout suffix");
});

test("Variables — / has correct <meta description>", async () => {
  const html = await fetchPage("/");
  const desc = extractMetaDescription(html);
  assertEqual(desc, "A premium template built with SomMark and Vite.", "<meta description> should match");
});

test("Variables — /about has correct <meta description>", async () => {
  const html = await fetchPage("/about");
  const desc = extractMetaDescription(html);
  assertEqual(desc, "Learn more about SomMark-Web", "<meta description> should match");
});

// --- 3. Layout-specific class ---
// AboutLayout adds class="custom-about-layout" on #app, Layout does not

test("Layout class — /about has 'custom-about-layout'", async () => {
  const html = await fetchPage("/about");
  assertContains(html, "custom-about-layout", "AboutLayout should add its custom class");
});

test("Layout class — / does NOT have 'custom-about-layout'", async () => {
  const html = await fetchPage("/");
  assertNotContains(html, "custom-about-layout", "Layout (non-About) should not have the About class");
});

// --- 4. No-layout edge case ---
// A page with no layout should still compile, but won't have <head> or <!DOCTYPE>

test("No layout — /raw compiles without a layout", async () => {
  const html = await fetchPage("/raw");
  assertContains(html, "Raw Page", "Raw page content should be present");
  assertContains(html, "no layout wrapper", "Raw page paragraph text should be present");
});

test("No layout — /raw does NOT have <!DOCTYPE html>", async () => {
  const html = await fetchPage("/raw");
  assertNotContains(html, "<!DOCTYPE html>", "A page with no layout should not produce a DOCTYPE");
});

// ── Assertion utilities ──────────────────────────────────────────────

function assertContains(actual, expected, message) {
  if (!actual.includes(expected)) {
    throw new Error(`${message}\n  Expected to contain: "${expected}"\n  But got: "${actual.slice(0, 200)}..."`);
  }
}

function assertNotContains(actual, unexpected, message) {
  if (actual.includes(unexpected)) {
    throw new Error(`${message}\n  Expected NOT to contain: "${unexpected}"\n  But it was found in the response`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: "${expected}"\n  Got:      "${actual}"`);
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
  console.log(pc.cyan("\n━━━ SomMark Layout Tests ━━━\n"));

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

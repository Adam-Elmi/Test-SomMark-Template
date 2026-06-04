/**
 * test-build.js
 *
 * This script tests that `vite build` produces a correct production bundle:
 *   1. Build completes without errors.
 *   2. An HTML file exists for every page route.
 *   3. Nested route directories are created correctly.
 *   4. HTML files contain the expected compiled content.
 *   5. Runtime JS is emitted for pages with runtime blocks.
 *   6. CSS assets are bundled.
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import pc from "picocolors";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

let passed = 0;
let failed = 0;
const failures = [];

// ── Assertion helpers ────────────────────────────────────────────────

function assert(condition, name) {
  if (condition) {
    console.log(`${pc.green("  ✓")} ${name}`);
    passed++;
  } else {
    console.log(`${pc.red("  ✗")} ${name}`);
    failed++;
    failures.push(name);
  }
}

async function assertFileContains(filePath, text, name) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    assert(content.includes(text), name);
  } catch {
    assert(false, `${name} (file not found: ${filePath})`);
  }
}

// ── Recursively find files matching a pattern ────────────────────────

async function findFiles(dir, ext) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findFiles(fullPath, ext)));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log(pc.cyan("\n━━━ SomMark Build Output Tests ━━━\n"));

  // Step 1 — Run vite build
  console.log(pc.dim("  Running vite build...\n"));
  let buildSuccess = true;
  try {
    execSync("npx vite build", { cwd: ROOT, stdio: "pipe" });
  } catch (err) {
    buildSuccess = false;
    console.log(pc.red("  Build failed:"));
    console.log(pc.dim(`  ${err.stderr?.toString().slice(0, 500) || err.message}`));
  }
  assert(buildSuccess, "vite build completes without errors");

  if (!buildSuccess) {
    console.log(pc.red("\n  Build failed — skipping remaining tests.\n"));
    process.exit(1);
  }

  // Step 2 — Check that HTML files exist for every page route
  console.log(pc.cyan("\n  HTML Files\n"));

  const expectedHtmlFiles = [
    "index.html",
    "about.html",
    "raw.html",
    "cfg-alias.html",
    "cfg-comments.html",
    "cfg-placeholders.html",
    "cfg-props.html",
    "pkg-easy.html",
    "pkg-medium.html",
    "pkg-hard.html",
    "posts/news/tech/v2-release.html",
  ];

  for (const file of expectedHtmlFiles) {
    const fullPath = path.join(DIST, file);
    assert(existsSync(fullPath), `dist/${file} exists`);
  }

  // Step 3 — Check HTML content correctness
  console.log(pc.cyan("\n  HTML Content\n"));

  await assertFileContains(
    path.join(DIST, "index.html"),
    "SomMark + Vite",
    "index.html contains 'SomMark + Vite'"
  );

  await assertFileContains(
    path.join(DIST, "about.html"),
    "About SomMark-Web",
    "about.html contains 'About SomMark-Web'"
  );

  await assertFileContains(
    path.join(DIST, "cfg-placeholders.html"),
    "TestSite",
    "cfg-placeholders.html contains 'TestSite' (placeholder resolved)"
  );

  await assertFileContains(
    path.join(DIST, "cfg-placeholders.html"),
    "2.0.0",
    "cfg-placeholders.html contains '2.0.0' (placeholder resolved)"
  );

  await assertFileContains(
    path.join(DIST, "posts/news/tech/v2-release.html"),
    "Deep Nested Page",
    "v2-release.html contains 'Deep Nested Page'"
  );

  await assertFileContains(
    path.join(DIST, "pkg-easy.html"),
    "Hello world",
    "pkg-easy.html contains 'Hello world' (lodash capitalize)"
  );

  // Step 4 — Check runtime JS is emitted
  console.log(pc.cyan("\n  Runtime JS\n"));

  const runtimeDir = path.join(DIST, "sommark-runtime");
  assert(existsSync(runtimeDir), "dist/sommark-runtime/ directory exists");

  const runtimeFiles = await findFiles(runtimeDir, ".js");
  assert(runtimeFiles.length > 0, "at least one runtime JS file was emitted");

  // The homepage has a runtime counter, so its runtime JS should exist
  const indexRuntime = runtimeFiles.find((f) => f.includes("index.smark.js"));
  assert(!!indexRuntime, "runtime JS for index.smark exists (has runtime counter)");

  // Step 5 — Check CSS assets
  console.log(pc.cyan("\n  CSS Assets\n"));

  const assetsDir = path.join(DIST, "assets");
  if (existsSync(assetsDir)) {
    const cssFiles = await findFiles(assetsDir, ".css");
    assert(cssFiles.length > 0, "at least one CSS file in dist/assets/");
  } else {
    // CSS may be inlined — just check that index.html has style content
    await assertFileContains(
      path.join(DIST, "index.html"),
      "background",
      "index.html contains inline CSS styles"
    );
  }

  // ── Summary ────────────────────────────────────────────────────────

  console.log(pc.cyan("\n━━━ Results ━━━"));
  console.log(`  ${pc.green(`${passed} passed`)}  ${failed > 0 ? pc.red(`${failed} failed`) : pc.dim("0 failed")}`);

  if (failures.length > 0) {
    console.log(pc.red("\nFailures:"));
    for (const f of failures) {
      console.log(pc.red(`  • ${f}`));
    }
  }
  console.log();

  process.exit(failed > 0 ? 1 : 0);
}

main();

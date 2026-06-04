/**
 * test-tailwind.js
 *
 * This script tests the TailwindCSS setup and cleanup scripts
 * as a round-trip:
 *   1. Runs setup-tailwindcss.js and verifies it created the right files.
 *   2. Runs cleanup-tailwindcss.js and verifies it removed everything.
 *   3. Restores the original style.css as a safety net.
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import pc from "picocolors";

const ROOT = process.cwd();
const CSS_PATH = path.join(ROOT, "src/styles/style.css");
const POSTCSS_PATH = path.join(ROOT, "postcss.config.js");
const TAILWIND_PATH = path.join(ROOT, "tailwind.config.js");
const PKG_PATH = path.join(ROOT, "package.json");

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

// ── Run a script, piping "\n" to stdin to accept the default prompt ──

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [scriptPath], {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Send enter to accept the default CSS file path
    child.stdin.write("\n");
    child.stdin.end();

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Script exited with code ${code}\n${stderr}\n${stdout}`));
      }
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log(pc.cyan("\n━━━ SomMark Tailwind Round-Trip Tests ━━━\n"));

  // Save original CSS so we can verify it's preserved after cleanup
  const originalCss = await fs.readFile(CSS_PATH, "utf-8");

  // ── Phase A: Run Setup ─────────────────────────────────────────────

  console.log(pc.dim("  Running setup-tailwindcss.js...\n"));
  try {
    await runScript("scripts/tailwindcss/setup-tailwindcss.js");
  } catch (err) {
    console.error(pc.red("  Setup script failed:"), err.message);
    process.exit(1);
  }

  console.log(pc.cyan("\n  Phase A — After Setup\n"));

  // A1: postcss.config.js exists and has the right content
  assert(existsSync(POSTCSS_PATH), "postcss.config.js exists");
  if (existsSync(POSTCSS_PATH)) {
    const postcssContent = await fs.readFile(POSTCSS_PATH, "utf-8");
    assert(postcssContent.includes("@tailwindcss/postcss"), "postcss.config.js contains @tailwindcss/postcss plugin");
  }

  // A2: tailwind.config.js exists and has .smark in content paths
  assert(existsSync(TAILWIND_PATH), "tailwind.config.js exists");
  if (existsSync(TAILWIND_PATH)) {
    const twContent = await fs.readFile(TAILWIND_PATH, "utf-8");
    assert(twContent.includes("smark"), "tailwind.config.js includes smark in content glob");
  }

  // A3: package.json lists tailwindcss in devDependencies
  const pkgAfterSetup = JSON.parse(await fs.readFile(PKG_PATH, "utf-8"));
  assert(
    pkgAfterSetup.devDependencies && pkgAfterSetup.devDependencies.tailwindcss,
    "package.json has tailwindcss in devDependencies"
  );

  // A4/A5: CSS file has tailwind directives
  const cssAfterSetup = await fs.readFile(CSS_PATH, "utf-8");
  assert(cssAfterSetup.includes('@import "tailwindcss"'), 'style.css contains @import "tailwindcss"');
  assert(cssAfterSetup.includes("@source"), "style.css contains @source directive");

  // A6: Original CSS content is still present (not replaced)
  assert(cssAfterSetup.includes(":root"), "style.css still has original :root styles");

  // ── Phase B: Run Cleanup ───────────────────────────────────────────

  console.log(pc.dim("\n  Running cleanup-tailwindcss.js...\n"));
  try {
    await runScript("scripts/tailwindcss/cleanup-tailwindcss.js");
  } catch (err) {
    console.error(pc.red("  Cleanup script failed:"), err.message);
    // Continue to verify what we can
  }

  console.log(pc.cyan("\n  Phase B — After Cleanup\n"));

  // B1/B2: Config files removed
  assert(!existsSync(POSTCSS_PATH), "postcss.config.js has been removed");
  assert(!existsSync(TAILWIND_PATH), "tailwind.config.js has been removed");

  // B3: tailwindcss no longer in package.json
  const pkgAfterCleanup = JSON.parse(await fs.readFile(PKG_PATH, "utf-8"));
  assert(
    !pkgAfterCleanup.devDependencies || !pkgAfterCleanup.devDependencies.tailwindcss,
    "package.json no longer has tailwindcss in devDependencies"
  );

  // B4/B5: CSS file no longer has tailwind directives
  const cssAfterCleanup = await fs.readFile(CSS_PATH, "utf-8");
  assert(!cssAfterCleanup.includes('@import "tailwindcss"'), 'style.css no longer has @import "tailwindcss"');
  assert(!cssAfterCleanup.includes("@source"), "style.css no longer has @source directive");

  // B6: Original CSS content is preserved
  assert(cssAfterCleanup.includes(":root"), "style.css still has original :root styles after cleanup");
  assert(cssAfterCleanup.includes("body"), "style.css still has original body styles after cleanup");

  // ── Safety net: restore original CSS ───────────────────────────────

  await fs.writeFile(CSS_PATH, originalCss, "utf-8");

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

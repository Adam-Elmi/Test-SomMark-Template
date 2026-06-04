/**
 * run-all.js
 *
 * Runs all test scripts in order and reports the overall result.
 * Stops on the first failure.
 */

import { execSync } from "node:child_process";
import pc from "picocolors";

const tests = [
  { name: "Routing",    script: "tests/test-routing.js" },
  { name: "Layouts",    script: "tests/test-layouts.js" },
  { name: "Packages",   script: "tests/test-packages.js" },
  { name: "Config",     script: "tests/test-config.js" },
  { name: "Tailwind",   script: "tests/test-tailwind.js" },
  { name: "Build",      script: "tests/test-build.js" },
];

console.log(pc.cyan("\n══════════════════════════════════════"));
console.log(pc.cyan("  SomMark-Web — Full Test Suite"));
console.log(pc.cyan("══════════════════════════════════════\n"));

let passed = 0;

for (const t of tests) {
  console.log(pc.cyan(`\n▸ ${t.name}`));
  console.log(pc.dim("─".repeat(40)));

  try {
    execSync(`node ${t.script}`, { cwd: process.cwd(), stdio: "inherit" });
    passed++;
  } catch {
    console.log(pc.red(`\n✗ "${t.name}" failed — stopping here.\n`));
    process.exit(1);
  }
}

console.log(pc.cyan("\n══════════════════════════════════════"));
console.log(pc.green(`  All ${passed}/${tests.length} test suites passed ✓`));
console.log(pc.cyan("══════════════════════════════════════\n"));

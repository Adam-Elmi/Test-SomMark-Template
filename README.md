# Test-SomMark-Template

This project tests the [SomMark-Web](https://github.com/Adam-Elmi/SomMark-Web) Vite plugin template to make sure everything works correctly. It checks:- page routing, layouts, npm packages, config options, Tailwind scripts, and the final build output.

## Setup

```sh
npm install
```

## Run All Tests

```sh
npm test
```

This runs 6 test suites one after another (62 checks in total):

| Suite | Script | What it checks |
|---|---|---|
| **Routing** | `tests/test-routing.js` | Pages load at the right URLs, including deeply nested ones |
| **Layouts** | `tests/test-layouts.js` | Page content goes into the layout's slot, variables work, no-layout pages compile |
| **Packages** | `tests/test-packages.js` | npm packages and local JS files can be used inside `.smark` pages |
| **Config** | `tests/test-config.js` | `smark.config.js` options like placeholders, import aliases, and custom props are applied |
| **Tailwind** | `tests/test-tailwind.js` | The setup script installs Tailwind correctly, and the cleanup script removes it cleanly |
| **Build** | `tests/test-build.js` | `vite build` creates the right HTML files, JS bundles, and CSS in `dist/` |

## Run a Single Suite

```sh
node tests/test-routing.js
node tests/test-layouts.js
node tests/test-packages.js
node tests/test-config.js
node tests/test-tailwind.js
node tests/test-build.js
```

## Project Structure

```
├── src/
│   ├── assets/              # Static files (logo image)
│   ├── helpers/             # Local JS modules used in package tests
│   ├── layouts/             # Page layouts (Layout + AboutLayout)
│   ├── pages/               # All .smark test pages
│   │   ├── posts/news/tech/ # Deeply nested route test page
│   │   ├── cfg-*.smark      # Pages that test config options
│   │   ├── pkg-*.smark      # Pages that test npm package imports
│   │   └── raw.smark        # A page with no layout
│   └── styles/              # CSS stylesheets
├── scripts/
│   └── tailwindcss/         # Tailwind setup and cleanup scripts
├── tests/                   # All test scripts
├── smark.config.js          # Config with placeholders, aliases, and custom props
└── vite.config.ts           # Vite config with the SomMark plugin
```
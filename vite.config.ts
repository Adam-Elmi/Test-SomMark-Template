import { defineConfig } from "vite";
import sommarkWeb from "sommark-web";

export default defineConfig({
  plugins: [sommarkWeb({
    // For testing
    siteUrl: "https://sommark.dev"
  })],
});

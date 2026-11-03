import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Rutas relativas: la misma build sirve en local y en GitHub Pages (/Txispa-Type/).
  base: "./",
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});

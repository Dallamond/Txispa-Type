// Agrupa las comprobaciones previas a cada commit: tipos, lint, tests y build.
// Modelo: ../Shellpath/app/scripts/run-checks.mjs. Se lanza node directamente
// (sin shell) porque la ruta del proyecto lleva espacios ("03 - PROYECTOS TEC").

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = (...ruta) => join(raiz, "node_modules", ...ruta);

const pasos = [
  ["tsc -b", bin("typescript", "bin", "tsc"), ["-b"]],
  ["oxlint", bin("oxlint", "bin", "oxlint"), []],
  ["vitest run", bin("vitest", "vitest.mjs"), ["run"]],
  ["vite build", bin("vite", "bin", "vite.js"), ["build"]],
];

let fallidos = 0;
for (const [nombre, script, args] of pasos) {
  console.log(`\n▶ ${nombre}`);
  try {
    execFileSync(process.execPath, [script, ...args], { cwd: raiz, stdio: "inherit" });
  } catch {
    console.error(`✖ ${nombre} ha fallado`);
    fallidos++;
    break;
  }
}

if (fallidos > 0) process.exit(1);
console.log("\n✔ Todas las comprobaciones pasadas.");

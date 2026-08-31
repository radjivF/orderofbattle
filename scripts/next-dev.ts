import { spawn } from "node:child_process";
import { lstatSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { nextDevCliArgs } from "../src/lib/nextDevArgs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function nodeModulesIsSymlink(): boolean {
  try {
    return lstatSync(join(root, "node_modules")).isSymbolicLink();
  } catch {
    return false;
  }
}

const child = spawn(
  join(root, "node_modules", ".bin", "next"),
  nextDevCliArgs({
    nodeModulesIsSymlink: nodeModulesIsSymlink(),
    extra: process.argv.slice(2),
  }),
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

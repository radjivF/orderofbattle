#!/usr/bin/env node

/**
 * Generate a lightweight faction metadata manifest for faction pickers,
 * library cards, and lazy loading — without bundling full catalogues.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../src/engine/data");
const outPath = path.join(dataDir, "faction-manifest.json");

function main() {
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".json") && !f.includes("manifest"))
    .filter((f) =>
      !["battle-tactics.json", "regiments-of-renown.json", "battleplan-missions.json"].includes(f)
    );

  const manifest = [];

  for (const file of files) {
    const fullPath = path.join(dataDir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    
    // Only include actual faction catalogues (those with units array)
    if (!Array.isArray(data.units)) {
      continue;
    }

    manifest.push({
      id: data.id,
      name: data.name,
      game: data.game || "Age of Sigmar 4th",
      pointsCapDefault: data.pointsCapDefault || 2000,
      parentFactionIds: data.parentFactionIds || null,
      unitCount: data.units.length,
      heroCount: data.units.filter((u) => u.hero).length,
    });
  }

  // Sort by id for stable diffs
  manifest.sort((a, b) => a.id.localeCompare(b.id));

  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`Generated ${manifest.length} faction entries → ${outPath}`);
}

main();

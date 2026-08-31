/** Faction art under /public/factions/{id}.webp */

const LANDSCAPE_SIZE = { width: 1280, height: 853 };
const PORTRAIT_SIZE = { width: 1280, height: 1600 };

/** Bump when replacing a public/factions/{id}.webp so Next/browser cache cannot keep the old file. */
const ART_REV: Record<string, number> = {
  "disciples-of-tzeentch": 1,
  "ironjawz": 2,
  "slaves-to-darkness": 1,
  "soulblight-gravelords": 2,
  "stormcast-eternals": 2,
};

/** Left-weighted subjects (vampire/dragon) when list cards crop tall. */
const LEFT_FOCUS_ART = new Set(["soulblight-gravelords"]);

/** Per-faction list-card crop when default portrait framing misses the subject. */
const CARD_ART_FOCUS: Record<string, string> = {
  "blades-of-khorne": "object-cover object-[center_38%]",
  "skaven": "object-cover object-[62%_32%]",
};

const LANDSCAPE_ART = new Set([
  "disciples-of-tzeentch",
  "ironjawz",
  "slaves-to-darkness",
  "soulblight-gravelords",
  "stormcast-eternals",
]);

const FACTION_ART = new Set([
  "blades-of-khorne",
  "cities-of-sigmar",
  "daughters-of-khaine",
  "disciples-of-tzeentch",
  "flesh-eater-courts",
  "fyreslayers",
  "gloomspite-gitz",
  "hedonites-of-slaanesh",
  "helsmiths-of-hashut",
  "idoneth-deepkin",
  "ironjawz",
  "kharadron-overlords",
  "kruleboyz",
  "lumineth-realm-lords",
  "maggotkin-of-nurgle",
  "nighthaunt",
  "ogor-mawtribes",
  "ossiarch-bonereapers",
  "seraphon",
  "skaven",
  "slaves-to-darkness",
  "sons-of-behemat",
  "soulblight-gravelords",
  "stormcast-eternals",
  "sylvaneth",
]);

/** Map The Old World army ids onto existing AoS backdrop art. */
const TOW_ART_FALLBACK: Record<string, string> = {
  "beastmen-brayherds": "slaves-to-darkness",
  "chaos-dwarfs": "helsmiths-of-hashut",
  "daemons-of-chaos": "slaves-to-darkness",
  "dark-elves": "daughters-of-khaine",
  "dwarfen-mountain-holds": "fyreslayers",
  "grand-cathay": "cities-of-sigmar",
  "high-elf-realms": "lumineth-realm-lords",
  "kingdom-of-bretonnia": "cities-of-sigmar",
  lizardmen: "seraphon",
  "ogre-kingdoms": "ogor-mawtribes",
  "orc-and-goblin-tribes": "ironjawz",
  skaven: "skaven",
  "the-empire-of-man": "cities-of-sigmar",
  "tomb-kings-of-khemri": "ossiarch-bonereapers",
  "vampire-counts": "soulblight-gravelords",
  "warriors-of-chaos": "slaves-to-darkness",
  "wood-elf-realms": "sylvaneth",
};

const SCOURGE_REALM_ART = new Set(["scourge-aqshy", "scourge-ghyran"]);

export type ScourgeRealmBackdrop = "aqshy" | "ghyran" | null | undefined;

export function factionArtSrc(factionId: string | null | undefined): string | null {
  if (!factionId) return null;
  const mapped = TOW_ART_FALLBACK[factionId] ?? factionId;
  if (!FACTION_ART.has(mapped)) return null;
  const rev = ART_REV[mapped];
  const path = `/factions/${mapped}.webp`;
  return rev ? `${path}?v=${rev}` : path;
}

/** Resolve TOW / journal ids to an art catalogue id for backdrop preload. */
export function towBackdropFactionId(
  factionId: string | null | undefined,
): string | null {
  if (!factionId) return null;
  if (TOW_ART_FALLBACK[factionId]) return TOW_ART_FALLBACK[factionId];
  for (const [towId, artId] of Object.entries(TOW_ART_FALLBACK)) {
    if (factionId.startsWith(`${towId}-`)) return artId;
  }
  return factionArtSrc(factionId) ? factionId : null;
}

function scourgeRealmArtSrc(realm: "aqshy" | "ghyran"): string | null {
  const id = realm === "aqshy" ? "scourge-aqshy" : "scourge-ghyran";
  if (!SCOURGE_REALM_ART.has(id) || !FACTION_ART.has(id)) {
    return null;
  }
  return factionArtSrc(id);
}

/** Backdrop art — optional per-faction scourge file, then global scourge art, then faction default. */
export function listBackdropArtSrc(
  factionId: string | null | undefined,
  scourgeRealm?: ScourgeRealmBackdrop,
): string | null {
  if (!factionId) {
    return null;
  }
  if (scourgeRealm === "aqshy" || scourgeRealm === "ghyran") {
    const perFaction = factionArtSrc(`${factionId}-scourge-${scourgeRealm}`);
    if (perFaction) {
      return perFaction;
    }
    const realmArt = scourgeRealmArtSrc(scourgeRealm);
    if (realmArt) {
      return realmArt;
    }
  }
  return factionArtSrc(factionId);
}

const loadedBackdropSrcs = new Set<string>();

/** Warm the cache before the list pane mounts — avoids art scale-in on open. */
export function preloadBackdropArt(
  factionId: string | null | undefined,
  scourgeRealm?: ScourgeRealmBackdrop,
): Promise<void> {
  const src = listBackdropArtSrc(factionId, scourgeRealm);
  if (!src || loadedBackdropSrcs.has(src)) {
    return Promise.resolve();
  }
  if (typeof Image === "undefined") {
    loadedBackdropSrcs.add(src);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      loadedBackdropSrcs.add(src);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function isBackdropArtReady(
  factionId: string | null | undefined,
  scourgeRealm?: ScourgeRealmBackdrop,
): boolean {
  const src = listBackdropArtSrc(factionId, scourgeRealm);
  return !src || loadedBackdropSrcs.has(src);
}

export function factionArtSize(factionId: string): {
  width: number;
  height: number;
} {
  return LANDSCAPE_ART.has(factionId) ? LANDSCAPE_SIZE : PORTRAIT_SIZE;
}

function catalogueArtId(
  faction:
    | { id: string; parentFactionIds?: string[] }
    | null
    | undefined,
): string | null {
  if (!faction) return null;
  for (const id of [faction.id, ...(faction.parentFactionIds ?? [])]) {
    if (factionArtSrc(id)) return id;
  }
  return null;
}

export function catalogueArtSrc(
  faction:
    | { id: string; parentFactionIds?: string[] }
    | null
    | undefined,
): string | null {
  return factionArtSrc(catalogueArtId(faction));
}

/** List-card crop: portrait art sits high, landscape stays centered. */
export function catalogueArtClass(
  faction:
    | { id: string; parentFactionIds?: string[] }
    | null
    | undefined,
): string {
  const id = catalogueArtId(faction);
  if (id && CARD_ART_FOCUS[id]) {
    return CARD_ART_FOCUS[id];
  }
  if (id && LEFT_FOCUS_ART.has(id)) {
    return "object-cover object-left";
  }
  return id && LANDSCAPE_ART.has(id)
    ? "object-cover object-center"
    : "object-cover object-[center_28%]";
}

/** Full-bleed splash/backdrop crop. */
export function factionBackdropArtClass(factionId: string | null | undefined): string {
  if (factionId && LEFT_FOCUS_ART.has(factionId)) {
    return "object-cover object-left";
  }
  return "object-cover object-center";
}


/** Dark gradient over faction backdrop art — same crop and weight for splash and builder. */
export function factionArtScrimClass(): string {
  return "bg-gradient-to-b from-ink/78 via-ink/88 to-ink/94";
}

/** Tint veil for scourge season backdrop art. */
export function scourgeRealmVeilClass(realm: ScourgeRealmBackdrop): string {
  if (realm === "aqshy") {
    return "bg-[rgba(120,45,12,0.14)]";
  }
  if (realm === "ghyran") {
    return "bg-[rgba(28,90,48,0.14)]";
  }
  return "bg-transparent";
}

/** Faction art under /public/factions/{id}.webp */

const FACTION_ART = new Set([
  "blades-of-khorne",
  "cities-of-sigmar",
  "daughters-of-khaine",
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
  "sons-of-behemat",
  "soulblight-gravelords",
  "stormcast-eternals",
  "sylvaneth",
]);

export function factionArtSrc(factionId: string | null | undefined): string | null {
  if (!factionId || !FACTION_ART.has(factionId)) return null;
  return `/factions/${factionId}.webp`;
}

export function hasFactionArt(factionId: string | null | undefined): boolean {
  return factionArtSrc(factionId) !== null;
}

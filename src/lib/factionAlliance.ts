import { listFactionMetadata } from "@/engine/queries";
import type { FactionMetadata } from "@/engine/data/load";

export type GrandAlliance = "order" | "destruction" | "chaos" | "death";

export const GRAND_ALLIANCE_ORDER: GrandAlliance[] = [
  "order",
  "destruction",
  "chaos",
  "death",
];

export const GRAND_ALLIANCE_LABELS: Record<GrandAlliance, string> = {
  order: "Order",
  destruction: "Destruction",
  chaos: "Chaos",
  death: "Death",
};

const FACTION_GRAND_ALLIANCE: Record<string, GrandAlliance> = {
  "stormcast-eternals": "order",
  "cities-of-sigmar": "order",
  "daughters-of-khaine": "order",
  "fyreslayers": "order",
  "idoneth-deepkin": "order",
  "kharadron-overlords": "order",
  "lumineth-realm-lords": "order",
  seraphon: "order",
  sylvaneth: "order",
  "gloomspite-gitz": "destruction",
  ironjawz: "destruction",
  kruleboyz: "destruction",
  "ogor-mawtribes": "destruction",
  "sons-of-behemat": "destruction",
  "blades-of-khorne": "chaos",
  "disciples-of-tzeentch": "chaos",
  "hedonites-of-slaanesh": "chaos",
  "helsmiths-of-hashut": "chaos",
  "maggotkin-of-nurgle": "chaos",
  skaven: "chaos",
  "slaves-to-darkness": "chaos",
  "flesh-eater-courts": "death",
  nighthaunt: "death",
  "ossiarch-bonereapers": "death",
  "soulblight-gravelords": "death",
};

export function grandAllianceForFaction(factionId: string): GrandAlliance {
  const alliance = FACTION_GRAND_ALLIANCE[factionId];
  if (!alliance) {
    throw new Error(`Unknown faction alliance: ${factionId}`);
  }
  return alliance;
}

export type FactionGrandAllianceGroup = {
  alliance: GrandAlliance;
  label: string;
  factions: FactionMetadata[];
};

/** Core factions grouped by Grand Alliance; full list, scrollable. */
export function listFactionsByGrandAlliance(): FactionGrandAllianceGroup[] {
  const sorted = listFactionMetadata();
  return GRAND_ALLIANCE_ORDER.map((alliance) => ({
    alliance,
    label: GRAND_ALLIANCE_LABELS[alliance],
    factions: sorted.filter(
      (faction) => grandAllianceForFaction(faction.id) === alliance,
    ),
  })).filter((group) => group.factions.length > 0);
}

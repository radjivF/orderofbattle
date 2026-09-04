import type { BattleTacticCard, FactionCatalogue, RegimentOfRenown, SpearheadCatalogue } from "../types";
import { spearheads as spearheadCatalogues } from "./spearhead/manifest";
import factionManifest from "./faction-manifest.json";
import battleTacticsJson from "./battle-tactics.json";

export type FactionMetadata = {
  id: string;
  name: string;
  game: string;
  pointsCapDefault: number;
  parentFactionIds: string[] | null;
  unitCount: number;
  heroCount: number;
};

type FactionLoader = () => Promise<{ default: unknown }>;
type RorLoader = () => Promise<{ default: unknown }>;

const factionLoaders: Record<string, FactionLoader> = {
  "big-waaagh": () => import("./big-waaagh.json"),
  "blades-of-khorne-gorechosen-champions": () => import("./blades-of-khorne-gorechosen-champions.json"),
  "blades-of-khorne-the-baleful-lords": () => import("./blades-of-khorne-the-baleful-lords.json"),
  "blades-of-khorne": () => import("./blades-of-khorne.json"),
  "cities-of-sigmar-allies-of-the-free-cities": () => import("./cities-of-sigmar-allies-of-the-free-cities.json"),
  "cities-of-sigmar-the-iron-march": () => import("./cities-of-sigmar-the-iron-march.json"),
  "cities-of-sigmar": () => import("./cities-of-sigmar.json"),
  "daughters-of-khaine-champions-of-the-arena": () => import("./daughters-of-khaine-champions-of-the-arena.json"),
  "daughters-of-khaine-the-croneseer-s-pariahs": () => import("./daughters-of-khaine-the-croneseer-s-pariahs.json"),
  "daughters-of-khaine-zainthar-kai": () => import("./daughters-of-khaine-zainthar-kai.json"),
  "daughters-of-khaine": () => import("./daughters-of-khaine.json"),
  "disciples-of-tzeentch-change-cult-uprising": () => import("./disciples-of-tzeentch-change-cult-uprising.json"),
  "disciples-of-tzeentch-the-oracles-of-fate": () => import("./disciples-of-tzeentch-the-oracles-of-fate.json"),
  "disciples-of-tzeentch": () => import("./disciples-of-tzeentch.json"),
  "flesh-eater-courts-new-summercourt": () => import("./flesh-eater-courts-new-summercourt.json"),
  "flesh-eater-courts-the-equinox-feast": () => import("./flesh-eater-courts-the-equinox-feast.json"),
  "flesh-eater-courts": () => import("./flesh-eater-courts.json"),
  "fyreslayers-lofnir-drothkeepers": () => import("./fyreslayers-lofnir-drothkeepers.json"),
  "fyreslayers": () => import("./fyreslayers.json"),
  "gloomspite-gitz-da-king-s-gitz": () => import("./gloomspite-gitz-da-king-s-gitz.json"),
  "gloomspite-gitz-droggz-s-gitmob": () => import("./gloomspite-gitz-droggz-s-gitmob.json"),
  "gloomspite-gitz-trugg-s-troggherd": () => import("./gloomspite-gitz-trugg-s-troggherd.json"),
  "gloomspite-gitz": () => import("./gloomspite-gitz.json"),
  "hedonites-of-slaanesh-court-of-the-godlings": () => import("./hedonites-of-slaanesh-court-of-the-godlings.json"),
  "hedonites-of-slaanesh-the-decadent-host": () => import("./hedonites-of-slaanesh-the-decadent-host.json"),
  "hedonites-of-slaanesh": () => import("./hedonites-of-slaanesh.json"),
  "helsmiths-of-hashut-taar-s-grand-forgehost": () => import("./helsmiths-of-hashut-taar-s-grand-forgehost.json"),
  "helsmiths-of-hashut-ziggurat-stampede": () => import("./helsmiths-of-hashut-ziggurat-stampede.json"),
  "helsmiths-of-hashut": () => import("./helsmiths-of-hashut.json"),
  "idoneth-deepkin-the-first-phalanx-of-ionrach": () => import("./idoneth-deepkin-the-first-phalanx-of-ionrach.json"),
  "idoneth-deepkin-wardens-of-the-chorrileum": () => import("./idoneth-deepkin-wardens-of-the-chorrileum.json"),
  "idoneth-deepkin": () => import("./idoneth-deepkin.json"),
  "ironjawz-krazogg-s-grunta-stampede": () => import("./ironjawz-krazogg-s-grunta-stampede.json"),
  "ironjawz-zoggrok-s-ironmongerz": () => import("./ironjawz-zoggrok-s-ironmongerz.json"),
  "ironjawz": () => import("./ironjawz.json"),
  "kharadron-overlords-grundstok-expeditionary-force": () => import("./kharadron-overlords-grundstok-expeditionary-force.json"),
  "kharadron-overlords-pioneer-outpost": () => import("./kharadron-overlords-pioneer-outpost.json"),
  "kharadron-overlords-the-magnate-s-crew": () => import("./kharadron-overlords-the-magnate-s-crew.json"),
  "kharadron-overlords": () => import("./kharadron-overlords.json"),
  "kruleboyz-murkvast-menagerie": () => import("./kruleboyz-murkvast-menagerie.json"),
  "kruleboyz": () => import("./kruleboyz.json"),
  "lumineth-realm-lords-aelementiri-conclave": () => import("./lumineth-realm-lords-aelementiri-conclave.json"),
  "lumineth-realm-lords-vanari-paragons": () => import("./lumineth-realm-lords-vanari-paragons.json"),
  "lumineth-realm-lords": () => import("./lumineth-realm-lords.json"),
  "maggotkin-of-nurgle-cycle-of-corruption": () => import("./maggotkin-of-nurgle-cycle-of-corruption.json"),
  "maggotkin-of-nurgle-the-gardeners-of-nurgle": () => import("./maggotkin-of-nurgle-the-gardeners-of-nurgle.json"),
  "maggotkin-of-nurgle": () => import("./maggotkin-of-nurgle.json"),
  "nighthaunt-the-clattering-procession": () => import("./nighthaunt-the-clattering-procession.json"),
  "nighthaunt-the-eternal-nightmare": () => import("./nighthaunt-the-eternal-nightmare.json"),
  "nighthaunt": () => import("./nighthaunt.json"),
  "ogor-mawtribes-beastclaw-alfrostun": () => import("./ogor-mawtribes-beastclaw-alfrostun.json"),
  "ogor-mawtribes-mawseeker-gollop": () => import("./ogor-mawtribes-mawseeker-gollop.json"),
  "ogor-mawtribes-meatfist-mawtribe": () => import("./ogor-mawtribes-meatfist-mawtribe.json"),
  "ogor-mawtribes-the-roving-maw": () => import("./ogor-mawtribes-the-roving-maw.json"),
  "ogor-mawtribes": () => import("./ogor-mawtribes.json"),
  "ossiarch-bonereapers-the-lance-of-ossia": () => import("./ossiarch-bonereapers-the-lance-of-ossia.json"),
  "ossiarch-bonereapers-the-null-myriad": () => import("./ossiarch-bonereapers-the-null-myriad.json"),
  "ossiarch-bonereapers": () => import("./ossiarch-bonereapers.json"),
  "seraphon": () => import("./seraphon.json"),
  "skaven-thanquol-s-mutated-menagerie": () => import("./skaven-thanquol-s-mutated-menagerie.json"),
  "skaven-the-great-grand-gnawhorde": () => import("./skaven-the-great-grand-gnawhorde.json"),
  "skaven": () => import("./skaven.json"),
  "slaves-to-darkness-legion-of-the-first-prince": () => import("./slaves-to-darkness-legion-of-the-first-prince.json"),
  "slaves-to-darkness-the-swords-of-chaos": () => import("./slaves-to-darkness-the-swords-of-chaos.json"),
  "slaves-to-darkness-tribes-of-the-snow-peaks": () => import("./slaves-to-darkness-tribes-of-the-snow-peaks.json"),
  "slaves-to-darkness": () => import("./slaves-to-darkness.json"),
  "sons-of-behemat-king-brodd-s-stomp": () => import("./sons-of-behemat-king-brodd-s-stomp.json"),
  "sons-of-behemat": () => import("./sons-of-behemat.json"),
  "soulblight-gravelords-barrow-legion": () => import("./soulblight-gravelords-barrow-legion.json"),
  "soulblight-gravelords-knights-of-the-crimson-keep": () => import("./soulblight-gravelords-knights-of-the-crimson-keep.json"),
  "soulblight-gravelords-scions-of-nulahmia": () => import("./soulblight-gravelords-scions-of-nulahmia.json"),
  "soulblight-gravelords": () => import("./soulblight-gravelords.json"),
  "stormcast-eternals-draconith-skywing": () => import("./stormcast-eternals-draconith-skywing.json"),
  "stormcast-eternals-heroes-of-the-first-forged": () => import("./stormcast-eternals-heroes-of-the-first-forged.json"),
  "stormcast-eternals-ruination-brotherhood": () => import("./stormcast-eternals-ruination-brotherhood.json"),
  "stormcast-eternals": () => import("./stormcast-eternals.json"),
  "sylvaneth-lords-of-the-clan": () => import("./sylvaneth-lords-of-the-clan.json"),
  "sylvaneth-soulpod-guardians": () => import("./sylvaneth-soulpod-guardians.json"),
  "sylvaneth-the-evergreen-hunt": () => import("./sylvaneth-the-evergreen-hunt.json"),
  "sylvaneth": () => import("./sylvaneth.json"),
};

const rorLoader: RorLoader = () => import("./regiments-of-renown.json");

const factionCache = new Map<string, FactionCatalogue>();
let rorCache: RegimentOfRenown[] | null = null;
const loadingPromises = new Map<string, Promise<FactionCatalogue>>();
let rorLoadingPromise: Promise<RegimentOfRenown[]> | null = null;

export const factionMetadata = factionManifest as FactionMetadata[];

export async function ensureFaction(id: string): Promise<FactionCatalogue | undefined> {
  const cached = factionCache.get(id);
  if (cached) {
    return cached;
  }

  const existingLoad = loadingPromises.get(id);
  if (existingLoad) {
    return existingLoad;
  }

  const loader = factionLoaders[id];
  if (!loader) {
    return undefined;
  }

  const loadPromise = loader().then((module) => {
    const catalogue = module.default as FactionCatalogue;
    factionCache.set(id, catalogue);
    loadingPromises.delete(id);
    return catalogue;
  });

  loadingPromises.set(id, loadPromise);
  return loadPromise;
}

export function getFactionSync(id: string): FactionCatalogue | undefined {
  return factionCache.get(id);
}

export async function ensureRegimentsOfRenown(): Promise<RegimentOfRenown[]> {
  if (rorCache) {
    return rorCache;
  }

  if (rorLoadingPromise) {
    return rorLoadingPromise;
  }

  rorLoadingPromise = rorLoader().then((module) => {
    rorCache = module.default as RegimentOfRenown[];
    rorLoadingPromise = null;
    return rorCache;
  });

  return rorLoadingPromise;
}

export function getRegimentsOfRenownSync(): RegimentOfRenown[] | null {
  return rorCache;
}

export async function ensureAllFactions(): Promise<FactionCatalogue[]> {
  await Promise.all(
    factionMetadata.map((meta) => ensureFaction(meta.id)),
  );
  return factionMetadata
    .map((meta) => getFactionSync(meta.id))
    .filter((f): f is FactionCatalogue => f !== undefined);
}

export function getAllFactionsSync(): FactionCatalogue[] {
  return factionMetadata
    .map((meta) => getFactionSync(meta.id))
    .filter((f): f is FactionCatalogue => f !== undefined);
}

export const spearheads = spearheadCatalogues as SpearheadCatalogue[];

export const battleTactics = battleTacticsJson as BattleTacticCard[];

export function battleTacticsForRealm(
  realm: "aqshy" | "ghyran" | null,
): BattleTacticCard[] {
  if (!realm) {
    return [];
  }
  return battleTactics.filter((card) => card.realm === realm);
}

export function battleTacticById(id: string): BattleTacticCard | undefined {
  return battleTactics.find((card) => card.id === id);
}

/** Season for the setup picker: linked list, else a selected card, else Aqshy. */
export function battleTacticRealmForPicker(
  listRealm: "aqshy" | "ghyran" | null | undefined,
  selectedIds: string[],
): "aqshy" | "ghyran" {
  if (listRealm === "aqshy" || listRealm === "ghyran") {
    return listRealm;
  }
  for (const id of selectedIds) {
    const realm = battleTacticById(id)?.realm;
    if (realm === "aqshy" || realm === "ghyran") {
      return realm;
    }
  }
  return "aqshy";
}

function unknownTacticStub(
  id: string,
  realm: "aqshy" | "ghyran",
): BattleTacticCard {
  return {
    id,
    name: id,
    setup: "",
    affray: "",
    strike: "",
    domination: "",
    realm,
  };
}

/** Realm deck plus any already-picked cards so prefilled IDs stay visible and editable. */
export function battleTacticPickerCards(
  realm: "aqshy" | "ghyran" | null,
  selectedIds: string[],
): BattleTacticCard[] {
  const poolRealm = realm === "ghyran" ? "ghyran" : "aqshy";
  const base = battleTacticsForRealm(poolRealm);
  const seen = new Set(base.map((card) => card.id));
  const extras: BattleTacticCard[] = [];
  for (const id of selectedIds) {
    if (seen.has(id)) {
      continue;
    }
    const card = battleTacticById(id) ?? unknownTacticStub(id, poolRealm);
    extras.push(card);
    seen.add(id);
  }
  return extras.length === 0 ? base : [...extras, ...base];
}

import type { TowFactionCatalogue, TowLoresCatalogue, TowMagicItemsCatalogue } from "../../tow/types";
import magicItemsJson from "./magic-items.json";
import loresOfMagicJson from "./lores-of-magic.json";
import commonSpecialRulesJson from "./common-special-rules.json";
import beastmenBrayherds from "./beastmen-brayherds.json";
import chaosDwarfs from "./chaos-dwarfs.json";
import daemonsOfChaos from "./daemons-of-chaos.json";
import darkElves from "./dark-elves.json";
import dwarfenMountainHolds from "./dwarfen-mountain-holds.json";
import grandCathay from "./grand-cathay.json";
import highElfRealms from "./high-elf-realms.json";
import kingdomOfBretonnia from "./kingdom-of-bretonnia.json";
import lizardmen from "./lizardmen.json";
import ogreKingdoms from "./ogre-kingdoms.json";
import orcAndGoblinTribes from "./orc-and-goblin-tribes.json";
import skaven from "./skaven.json";
import theEmpireOfMan from "./the-empire-of-man.json";
import tombKingsOfKhemri from "./tomb-kings-of-khemri.json";
import vampireCounts from "./vampire-counts.json";
import warriorsOfChaos from "./warriors-of-chaos.json";
import woodElfRealms from "./wood-elf-realms.json";
import beastmenBrayherdsMinotaurBloodHerd from "./beastmen-brayherds-minotaur-blood-herd.json";
import beastmenBrayherdsWildHerd from "./beastmen-brayherds-wild-herd.json";
import chaosDwarfsRenegades20 from "./chaos-dwarfs-renegades-2-0.json";
import dwarfenMountainHoldsExpeditionaryForce from "./dwarfen-mountain-holds-expeditionary-force.json";
import dwarfenMountainHoldsRoyalClan from "./dwarfen-mountain-holds-royal-clan.json";
import dwarfenMountainHoldsSlayerHost from "./dwarfen-mountain-holds-slayer-host.json";
import grandCathayJadeFleet from "./grand-cathay-jade-fleet.json";
import grandCathayWarriorsOfWindField from "./grand-cathay-warriors-of-wind-field.json";
import highElfRealmsChracianWarhost from "./high-elf-realms-chracian-warhost.json";
import highElfRealmsSeaGuardGarrison from "./high-elf-realms-sea-guard-garrison.json";
import kingdomOfBretonniaErrantryCrusade from "./kingdom-of-bretonnia-errantry-crusade.json";
import lizardmenRenegades20 from "./lizardmen-renegades-2-0.json";
import orcAndGoblinTribesNomadicWaaagh from "./orc-and-goblin-tribes-nomadic-waaagh.json";
import orcAndGoblinTribesTrollHorde from "./orc-and-goblin-tribes-troll-horde.json";
import skavenRenegadesV20 from "./skaven-renegades-v2-0.json";
import theEmpireOfManCityStateOfNuln from "./the-empire-of-man-city-state-of-nuln.json";
import theEmpireOfManKnightlyOrder from "./the-empire-of-man-knightly-order.json";
import tombKingsOfKhemriMortuaryCult from "./tomb-kings-of-khemri-mortuary-cult.json";
import tombKingsOfKhemriRoyalHost from "./tomb-kings-of-khemri-royal-host.json";
import warriorsOfChaosHeraldsOfDarkness from "./warriors-of-chaos-heralds-of-darkness.json";
import warriorsOfChaosHordesOfChaos from "./warriors-of-chaos-hordes-of-chaos.json";
import warriorsOfChaosWolvesOfTheSea from "./warriors-of-chaos-wolves-of-the-sea.json";
import woodElfRealmsHostOfTalsyn from "./wood-elf-realms-host-of-talsyn.json";
import woodElfRealmsOrionSWildHunt from "./wood-elf-realms-orion-s-wild-hunt.json";

export const magicItemsCatalogue = magicItemsJson as TowMagicItemsCatalogue;
export const loresCatalogue = loresOfMagicJson as TowLoresCatalogue;

export const factions = [
  beastmenBrayherds,
  chaosDwarfs,
  daemonsOfChaos,
  darkElves,
  dwarfenMountainHolds,
  grandCathay,
  highElfRealms,
  kingdomOfBretonnia,
  lizardmen,
  ogreKingdoms,
  orcAndGoblinTribes,
  skaven,
  theEmpireOfMan,
  tombKingsOfKhemri,
  vampireCounts,
  warriorsOfChaos,
  woodElfRealms,
] as TowFactionCatalogue[];

export const journals = [
  beastmenBrayherdsMinotaurBloodHerd,
  beastmenBrayherdsWildHerd,
  chaosDwarfsRenegades20,
  dwarfenMountainHoldsExpeditionaryForce,
  dwarfenMountainHoldsRoyalClan,
  dwarfenMountainHoldsSlayerHost,
  grandCathayJadeFleet,
  grandCathayWarriorsOfWindField,
  highElfRealmsChracianWarhost,
  highElfRealmsSeaGuardGarrison,
  kingdomOfBretonniaErrantryCrusade,
  lizardmenRenegades20,
  orcAndGoblinTribesNomadicWaaagh,
  orcAndGoblinTribesTrollHorde,
  skavenRenegadesV20,
  theEmpireOfManCityStateOfNuln,
  theEmpireOfManKnightlyOrder,
  tombKingsOfKhemriMortuaryCult,
  tombKingsOfKhemriRoyalHost,
  warriorsOfChaosHeraldsOfDarkness,
  warriorsOfChaosHordesOfChaos,
  warriorsOfChaosWolvesOfTheSea,
  woodElfRealmsHostOfTalsyn,
  woodElfRealmsOrionSWildHunt,
] as TowFactionCatalogue[];

export const allTowArmies = [...factions, ...journals] as TowFactionCatalogue[];

export const commonSpecialRuleNames = new Set(
  (commonSpecialRulesJson as { names: string[] }).names,
);


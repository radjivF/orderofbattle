import type { BattleTacticCard, FactionCatalogue, RegimentOfRenown, SpearheadCatalogue } from "../types";
import { spearheads as spearheadCatalogues } from "./spearhead/manifest";
import bigWaaagh from "./big-waaagh.json";
import bladesOfKhorneGorechosenChampions from "./blades-of-khorne-gorechosen-champions.json";
import bladesOfKhorneTheBalefulLords from "./blades-of-khorne-the-baleful-lords.json";
import bladesOfKhorne from "./blades-of-khorne.json";
import citiesOfSigmarAlliesOfTheFreeCities from "./cities-of-sigmar-allies-of-the-free-cities.json";
import citiesOfSigmarTheIronMarch from "./cities-of-sigmar-the-iron-march.json";
import citiesOfSigmar from "./cities-of-sigmar.json";
import daughtersOfKhaineChampionsOfTheArena from "./daughters-of-khaine-champions-of-the-arena.json";
import daughtersOfKhaineTheCroneseerSPariahs from "./daughters-of-khaine-the-croneseer-s-pariahs.json";
import daughtersOfKhaineZaintharKai from "./daughters-of-khaine-zainthar-kai.json";
import daughtersOfKhaine from "./daughters-of-khaine.json";
import disciplesOfTzeentchChangeCultUprising from "./disciples-of-tzeentch-change-cult-uprising.json";
import disciplesOfTzeentchTheOraclesOfFate from "./disciples-of-tzeentch-the-oracles-of-fate.json";
import disciplesOfTzeentch from "./disciples-of-tzeentch.json";
import fleshEaterCourtsNewSummercourt from "./flesh-eater-courts-new-summercourt.json";
import fleshEaterCourtsTheEquinoxFeast from "./flesh-eater-courts-the-equinox-feast.json";
import fleshEaterCourts from "./flesh-eater-courts.json";
import fyreslayersLofnirDrothkeepers from "./fyreslayers-lofnir-drothkeepers.json";
import fyreslayers from "./fyreslayers.json";
import gloomspiteGitzDaKingSGitz from "./gloomspite-gitz-da-king-s-gitz.json";
import gloomspiteGitzDroggzSGitmob from "./gloomspite-gitz-droggz-s-gitmob.json";
import gloomspiteGitzTruggSTroggherd from "./gloomspite-gitz-trugg-s-troggherd.json";
import gloomspiteGitz from "./gloomspite-gitz.json";
import hedonitesOfSlaaneshCourtOfTheGodlings from "./hedonites-of-slaanesh-court-of-the-godlings.json";
import hedonitesOfSlaaneshTheDecadentHost from "./hedonites-of-slaanesh-the-decadent-host.json";
import hedonitesOfSlaanesh from "./hedonites-of-slaanesh.json";
import helsmithsOfHashutTaarSGrandForgehost from "./helsmiths-of-hashut-taar-s-grand-forgehost.json";
import helsmithsOfHashutZigguratStampede from "./helsmiths-of-hashut-ziggurat-stampede.json";
import helsmithsOfHashut from "./helsmiths-of-hashut.json";
import idonethDeepkinTheFirstPhalanxOfIonrach from "./idoneth-deepkin-the-first-phalanx-of-ionrach.json";
import idonethDeepkinWardensOfTheChorrileum from "./idoneth-deepkin-wardens-of-the-chorrileum.json";
import idonethDeepkin from "./idoneth-deepkin.json";
import ironjawzKrazoggSGruntaStampede from "./ironjawz-krazogg-s-grunta-stampede.json";
import ironjawzZoggrokSIronmongerz from "./ironjawz-zoggrok-s-ironmongerz.json";
import ironjawz from "./ironjawz.json";
import kharadronOverlordsGrundstokExpeditionaryForce from "./kharadron-overlords-grundstok-expeditionary-force.json";
import kharadronOverlordsPioneerOutpost from "./kharadron-overlords-pioneer-outpost.json";
import kharadronOverlordsTheMagnateSCrew from "./kharadron-overlords-the-magnate-s-crew.json";
import kharadronOverlords from "./kharadron-overlords.json";
import kruleboyzMurkvastMenagerie from "./kruleboyz-murkvast-menagerie.json";
import kruleboyz from "./kruleboyz.json";
import luminethRealmLordsAelementiriConclave from "./lumineth-realm-lords-aelementiri-conclave.json";
import luminethRealmLordsVanariParagons from "./lumineth-realm-lords-vanari-paragons.json";
import luminethRealmLords from "./lumineth-realm-lords.json";
import maggotkinOfNurgleCycleOfCorruption from "./maggotkin-of-nurgle-cycle-of-corruption.json";
import maggotkinOfNurgleTheGardenersOfNurgle from "./maggotkin-of-nurgle-the-gardeners-of-nurgle.json";
import maggotkinOfNurgle from "./maggotkin-of-nurgle.json";
import nighthauntTheClatteringProcession from "./nighthaunt-the-clattering-procession.json";
import nighthauntTheEternalNightmare from "./nighthaunt-the-eternal-nightmare.json";
import nighthaunt from "./nighthaunt.json";
import ogorMawtribesBeastclawAlfrostun from "./ogor-mawtribes-beastclaw-alfrostun.json";
import ogorMawtribesMawseekerGollop from "./ogor-mawtribes-mawseeker-gollop.json";
import ogorMawtribesMeatfistMawtribe from "./ogor-mawtribes-meatfist-mawtribe.json";
import ogorMawtribesTheRovingMaw from "./ogor-mawtribes-the-roving-maw.json";
import ogorMawtribes from "./ogor-mawtribes.json";
import ossiarchBonereapersTheLanceOfOssia from "./ossiarch-bonereapers-the-lance-of-ossia.json";
import ossiarchBonereapersTheNullMyriad from "./ossiarch-bonereapers-the-null-myriad.json";
import ossiarchBonereapers from "./ossiarch-bonereapers.json";
import seraphon from "./seraphon.json";
import skavenThanquolSMutatedMenagerie from "./skaven-thanquol-s-mutated-menagerie.json";
import skavenTheGreatGrandGnawhorde from "./skaven-the-great-grand-gnawhorde.json";
import skaven from "./skaven.json";
import slavesToDarknessLegionOfTheFirstPrince from "./slaves-to-darkness-legion-of-the-first-prince.json";
import slavesToDarknessTheSwordsOfChaos from "./slaves-to-darkness-the-swords-of-chaos.json";
import slavesToDarknessTribesOfTheSnowPeaks from "./slaves-to-darkness-tribes-of-the-snow-peaks.json";
import slavesToDarkness from "./slaves-to-darkness.json";
import sonsOfBehematKingBroddSStomp from "./sons-of-behemat-king-brodd-s-stomp.json";
import sonsOfBehemat from "./sons-of-behemat.json";
import soulblightGravelordsBarrowLegion from "./soulblight-gravelords-barrow-legion.json";
import soulblightGravelordsKnightsOfTheCrimsonKeep from "./soulblight-gravelords-knights-of-the-crimson-keep.json";
import soulblightGravelordsScionsOfNulahmia from "./soulblight-gravelords-scions-of-nulahmia.json";
import soulblightGravelords from "./soulblight-gravelords.json";
import stormcastEternalsDraconithSkywing from "./stormcast-eternals-draconith-skywing.json";
import stormcastEternalsHeroesOfTheFirstForged from "./stormcast-eternals-heroes-of-the-first-forged.json";
import stormcastEternalsRuinationBrotherhood from "./stormcast-eternals-ruination-brotherhood.json";
import stormcastEternals from "./stormcast-eternals.json";
import sylvanethLordsOfTheClan from "./sylvaneth-lords-of-the-clan.json";
import sylvanethSoulpodGuardians from "./sylvaneth-soulpod-guardians.json";
import sylvanethTheEvergreenHunt from "./sylvaneth-the-evergreen-hunt.json";
import sylvaneth from "./sylvaneth.json";
import regimentsOfRenownJson from "./regiments-of-renown.json";
import battleTacticsJson from "./battle-tactics.json";

export const factions = [
  bigWaaagh,
  bladesOfKhorneGorechosenChampions,
  bladesOfKhorneTheBalefulLords,
  bladesOfKhorne,
  citiesOfSigmarAlliesOfTheFreeCities,
  citiesOfSigmarTheIronMarch,
  citiesOfSigmar,
  daughtersOfKhaineChampionsOfTheArena,
  daughtersOfKhaineTheCroneseerSPariahs,
  daughtersOfKhaineZaintharKai,
  daughtersOfKhaine,
  disciplesOfTzeentchChangeCultUprising,
  disciplesOfTzeentchTheOraclesOfFate,
  disciplesOfTzeentch,
  fleshEaterCourtsNewSummercourt,
  fleshEaterCourtsTheEquinoxFeast,
  fleshEaterCourts,
  fyreslayersLofnirDrothkeepers,
  fyreslayers,
  gloomspiteGitzDaKingSGitz,
  gloomspiteGitzDroggzSGitmob,
  gloomspiteGitzTruggSTroggherd,
  gloomspiteGitz,
  hedonitesOfSlaaneshCourtOfTheGodlings,
  hedonitesOfSlaaneshTheDecadentHost,
  hedonitesOfSlaanesh,
  helsmithsOfHashutTaarSGrandForgehost,
  helsmithsOfHashutZigguratStampede,
  helsmithsOfHashut,
  idonethDeepkinTheFirstPhalanxOfIonrach,
  idonethDeepkinWardensOfTheChorrileum,
  idonethDeepkin,
  ironjawzKrazoggSGruntaStampede,
  ironjawzZoggrokSIronmongerz,
  ironjawz,
  kharadronOverlordsGrundstokExpeditionaryForce,
  kharadronOverlordsPioneerOutpost,
  kharadronOverlordsTheMagnateSCrew,
  kharadronOverlords,
  kruleboyzMurkvastMenagerie,
  kruleboyz,
  luminethRealmLordsAelementiriConclave,
  luminethRealmLordsVanariParagons,
  luminethRealmLords,
  maggotkinOfNurgleCycleOfCorruption,
  maggotkinOfNurgleTheGardenersOfNurgle,
  maggotkinOfNurgle,
  nighthauntTheClatteringProcession,
  nighthauntTheEternalNightmare,
  nighthaunt,
  ogorMawtribesBeastclawAlfrostun,
  ogorMawtribesMawseekerGollop,
  ogorMawtribesMeatfistMawtribe,
  ogorMawtribesTheRovingMaw,
  ogorMawtribes,
  ossiarchBonereapersTheLanceOfOssia,
  ossiarchBonereapersTheNullMyriad,
  ossiarchBonereapers,
  seraphon,
  skavenThanquolSMutatedMenagerie,
  skavenTheGreatGrandGnawhorde,
  skaven,
  slavesToDarknessLegionOfTheFirstPrince,
  slavesToDarknessTheSwordsOfChaos,
  slavesToDarknessTribesOfTheSnowPeaks,
  slavesToDarkness,
  sonsOfBehematKingBroddSStomp,
  sonsOfBehemat,
  soulblightGravelordsBarrowLegion,
  soulblightGravelordsKnightsOfTheCrimsonKeep,
  soulblightGravelordsScionsOfNulahmia,
  soulblightGravelords,
  stormcastEternalsDraconithSkywing,
  stormcastEternalsHeroesOfTheFirstForged,
  stormcastEternalsRuinationBrotherhood,
  stormcastEternals,
  sylvanethLordsOfTheClan,
  sylvanethSoulpodGuardians,
  sylvanethTheEvergreenHunt,
  sylvaneth,
] as FactionCatalogue[];

export const regimentsOfRenown =
  regimentsOfRenownJson as RegimentOfRenown[];

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

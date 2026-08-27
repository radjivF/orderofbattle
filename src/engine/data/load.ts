import type { FactionCatalogue, RegimentOfRenown } from "../types";
import bladesOfKhorne from "./blades-of-khorne.json";
import citiesOfSigmar from "./cities-of-sigmar.json";
import daughtersOfKhaine from "./daughters-of-khaine.json";
import disciplesOfTzeentch from "./disciples-of-tzeentch.json";
import fleshEaterCourts from "./flesh-eater-courts.json";
import fyreslayers from "./fyreslayers.json";
import gloomspiteGitz from "./gloomspite-gitz.json";
import hedonitesOfSlaanesh from "./hedonites-of-slaanesh.json";
import helsmithsOfHashut from "./helsmiths-of-hashut.json";
import idonethDeepkin from "./idoneth-deepkin.json";
import ironjawz from "./ironjawz.json";
import kharadronOverlords from "./kharadron-overlords.json";
import kruleboyz from "./kruleboyz.json";
import luminethRealmLords from "./lumineth-realm-lords.json";
import maggotkinOfNurgle from "./maggotkin-of-nurgle.json";
import nighthaunt from "./nighthaunt.json";
import ogorMawtribes from "./ogor-mawtribes.json";
import ossiarchBonereapers from "./ossiarch-bonereapers.json";
import seraphon from "./seraphon.json";
import skaven from "./skaven.json";
import slavesToDarkness from "./slaves-to-darkness.json";
import sonsOfBehemat from "./sons-of-behemat.json";
import soulblightGravelords from "./soulblight-gravelords.json";
import stormcastEternals from "./stormcast-eternals.json";
import sylvaneth from "./sylvaneth.json";
import regimentsOfRenownJson from "./regiments-of-renown.json";

export const factions = [
  bladesOfKhorne,
  citiesOfSigmar,
  daughtersOfKhaine,
  disciplesOfTzeentch,
  fleshEaterCourts,
  fyreslayers,
  gloomspiteGitz,
  hedonitesOfSlaanesh,
  helsmithsOfHashut,
  idonethDeepkin,
  ironjawz,
  kharadronOverlords,
  kruleboyz,
  luminethRealmLords,
  maggotkinOfNurgle,
  nighthaunt,
  ogorMawtribes,
  ossiarchBonereapers,
  seraphon,
  skaven,
  slavesToDarkness,
  sonsOfBehemat,
  soulblightGravelords,
  stormcastEternals,
  sylvaneth,
] as FactionCatalogue[];

export const regimentsOfRenown =
  regimentsOfRenownJson as RegimentOfRenown[];

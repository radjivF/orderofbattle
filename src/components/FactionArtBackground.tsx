"use client";

import {
  factionArtScrimClass,
  factionBackdropArtClass,
  listBackdropArtSrc,
  scourgeRealmVeilClass,
  type ScourgeRealmBackdrop,
} from "@/lib/factionArt";
import { LIST_DETAIL_BACKDROP_TRANSITION_CLASS } from "@/lib/builderUi";

type Props = {
  factionId: string | null | undefined;
  scourgeRealm?: ScourgeRealmBackdrop;
  /** Dark scrim for builder UI — off while the opening splash is visible. */
  scrim?: boolean;
};

/** Identical art crop and scrim everywhere — no scale tricks, no fade-in. */
export function FactionArtLayers({
  factionId,
  scourgeRealm,
  scrim = true,
}: Props) {
  const src = listBackdropArtSrc(factionId, scourgeRealm);
  const artClass = factionBackdropArtClass(factionId);
  const veilClass = scourgeRealmVeilClass(scourgeRealm);
  const scrimClass = factionArtScrimClass();

  if (!src) {
    return <div className="absolute inset-0 bg-ink" />;
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        decoding="sync"
        fetchPriority="high"
        className={`absolute inset-0 h-full w-full ${artClass}`}
      />
      <div className={`absolute inset-0 ${veilClass}`} />
      <div
        className={`absolute inset-0 ${scrimClass} ${LIST_DETAIL_BACKDROP_TRANSITION_CLASS} ${
          scrim ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!scrim}
      />
    </>
  );
}

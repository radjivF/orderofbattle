"use client";

import Image from "next/image";
import {
  factionArtScrimClass,
  factionBackdropArtClass,
  listBackdropArtSrc,
  scourgeRealmVeilClass,
  type ScourgeRealmBackdrop,
} from "@/lib/factionArt";

type Props = {
  factionId: string | null | undefined;
  scourgeRealm?: ScourgeRealmBackdrop;
  /** Lighter scrim while the open splash is on screen. */
  splash?: boolean;
};

function scourgeVeilClass(scourgeRealm: ScourgeRealmBackdrop): string {
  return scourgeRealmVeilClass(scourgeRealm);
}

/** Identical art crop and scrim everywhere — splash, builder, no transitions. */
export function FactionArtLayers({ factionId, scourgeRealm, splash }: Props) {
  const src = listBackdropArtSrc(factionId, scourgeRealm);
  const artClass = factionBackdropArtClass(factionId);
  const veilClass = scourgeVeilClass(scourgeRealm);
  const scrimClass = factionArtScrimClass(splash);

  if (!src) {
    return <div className="absolute inset-0 bg-ink" />;
  }

  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        quality={75}
        priority
        unoptimized
        className={artClass}
      />
      <div className={`absolute inset-0 ${veilClass}`} />
      <div className={`absolute inset-0 ${scrimClass}`} />
    </>
  );
}

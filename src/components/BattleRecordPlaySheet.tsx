"use client";

import { formatPoints } from "@/engine/pointsCap";
import { catalogueForList, isSpearheadList } from "@/engine/spearhead";
import type { ArmyList } from "@/engine/types";
import { summarize } from "@/engine/validate";
import {
  dropCountLabel,
  HEADER_DROPS_LINE_CLASS,
  HEADER_STATS_STACK_CLASS,
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  PLAY_SHEET_PANEL_CLASS,
  SITE_HEADER_ROW_CLASS,
} from "@/lib/builderUi";
import { BuilderReady } from "./BuilderReady";
import { FactionArtLayers } from "./FactionArtBackground";
import { IosNavCloseButton } from "./ios/IosNavIconButton";
import { ModalFrame, useModalDismiss } from "./ModalFrame";

type Props = {
  list: ArmyList;
  playerName: string;
  onClose: () => void;
};

export function BattleRecordPlaySheet({ list, playerName, onClose }: Props) {
  const faction = catalogueForList(list);
  if (!faction) {
    return null;
  }

  const totals = summarize(list, faction);
  const spearhead = isSpearheadList(list);

  return (
    <ModalFrame
      label={`Play ${playerName}`}
      onClose={onClose}
      fullPage
      panelClassName={PLAY_SHEET_PANEL_CLASS}
    >
      <PlaySheetBody
        list={list}
        totals={totals}
        spearhead={spearhead}
        faction={faction}
      />
    </ModalFrame>
  );
}

function PlaySheetBody({
  list,
  totals,
  spearhead,
  faction,
}: {
  list: ArmyList;
  totals: ReturnType<typeof summarize>;
  spearhead: boolean;
  faction: NonNullable<ReturnType<typeof catalogueForList>>;
}) {
  const close = useModalDismiss();

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <FactionArtLayers
          factionId={list.factionId}
          scourgeRealm={list.scourgeRealm}
        />
      </div>
      <div className={`${SITE_HEADER_ROW_CLASS} relative z-10`}>
        <p className="min-w-0 flex-1 truncate font-serif text-[15px] font-semibold leading-none sm:text-lg">
          {list.name}
        </p>
        <div className="flex shrink-0 items-center gap-2.5">
          <div className={HEADER_STATS_STACK_CLASS}>
            <p className="flex items-center justify-end gap-1.5 text-[13px] text-sigmarite sm:text-sm">
              {spearhead ? (
                <span>Spearhead</span>
              ) : (
                <>
                  <span>{formatPoints(totals.points)}</span>
                  <span className="text-ink-muted">/</span>
                  <span className="text-ink-muted">
                    {formatPoints(list.pointsCap)}
                  </span>
                </>
              )}
            </p>
            {spearhead ? null : (
              <p className={HEADER_DROPS_LINE_CLASS}>
                {dropCountLabel(totals.drops)}
              </p>
            )}
          </div>
          <IosNavCloseButton label="Close play" onClick={close} />
        </div>
      </div>
      <div className={`${MODAL_SHEET_SCROLL_HOST_CLASS} relative z-10`}>
        <div className={MODAL_SHEET_SCROLL_CLASS}>
          <BuilderReady list={list} faction={faction} openPlay embedded />
        </div>
      </div>
    </>
  );
}

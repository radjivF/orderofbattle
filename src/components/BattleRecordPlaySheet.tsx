"use client";

import { useState } from "react";
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
import { saveArmy } from "@/lib/storage";
import { BuilderReady } from "./BuilderReady";
import { FactionArtLayers } from "./FactionArtBackground";
import { IosNavCloseButton } from "./ios/IosNavIconButton";
import { ModalFrame, useModalDismiss } from "./ModalFrame";
import { ScourgeOfAqshyChip } from "./ScourgeOfAqshyChip";
import { ScourgeOfAqshySheet } from "./ScourgeOfAqshySheet";

type Props = {
  list: ArmyList;
  playerName: string;
  onClose: () => void;
  /** When opened from battle record, use game session fury/rage. */
  gameFury?: number;
  gameRage?: number;
  onGameFuryChange?: (fury: number) => void;
  onGameRageChange?: (rage: number) => void;
};

export function BattleRecordPlaySheet({
  list,
  playerName,
  onClose,
  gameFury,
  gameRage,
  onGameFuryChange,
  onGameRageChange,
}: Props) {
  const faction = catalogueForList(list);
  if (!faction) {
    return null;
  }

  const totals = summarize(list, faction);
  const spearhead = isSpearheadList(list);

  const fromBattle = gameFury !== undefined && gameRage !== undefined;
  const fury = fromBattle ? gameFury : list.playFury ?? 0;
  const rage = fromBattle ? gameRage : list.playRage ?? 0;

  async function updateListFury(newFury: number) {
    if (fromBattle && onGameFuryChange) {
      onGameFuryChange(newFury);
    } else {
      const updated = { ...list, playFury: newFury };
      await saveArmy(updated);
    }
  }

  async function updateListRage(newRage: number) {
    if (fromBattle && onGameRageChange) {
      onGameRageChange(newRage);
    } else {
      const updated = { ...list, playRage: newRage };
      await saveArmy(updated);
    }
  }

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
        fury={fury}
        rage={rage}
        onFuryChange={updateListFury}
        onRageChange={updateListRage}
      />
    </ModalFrame>
  );
}

function PlaySheetBody({
  list,
  totals,
  spearhead,
  faction,
  fury,
  rage,
  onFuryChange,
  onRageChange,
}: {
  list: ArmyList;
  totals: ReturnType<typeof summarize>;
  spearhead: boolean;
  faction: NonNullable<ReturnType<typeof catalogueForList>>;
  fury: number;
  rage: number;
  onFuryChange: (fury: number) => void;
  onRageChange: (rage: number) => void;
}) {
  const close = useModalDismiss();
  const [scourgeSheetOpen, setScourgeSheetOpen] = useState(false);
  const showScourge = list.scourgeRealm === "aqshy";

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
          {showScourge ? (
            <ScourgeOfAqshyChip
              fury={fury}
              rage={rage}
              onClick={() => setScourgeSheetOpen(true)}
            />
          ) : null}
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
      {scourgeSheetOpen && showScourge ? (
        <ScourgeOfAqshySheet
          fury={fury}
          rage={rage}
          onChangeFury={onFuryChange}
          onChangeRage={onRageChange}
          onClose={() => setScourgeSheetOpen(false)}
        />
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import {
  createBattleRecord,
  type BattleArmyPick,
  type CreateBattleRecordInput,
  type GameSession,
} from "@/engine/gameSession";
import {
  IOS_LIQUID_CTA_CLASS,
  MODAL_SHEET_FOOTER_CLASS,
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  SHEET_HEADER_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";
import { BattleRecordMatchFields } from "./BattleRecordMatchFields";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (game: GameSession) => void;
};

export function BattleRecordCreateSheet({ open, onClose, onCreated }: Props) {
  const [yourName, setYourName] = useState("");
  const [yourArmy, setYourArmy] = useState<BattleArmyPick | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentArmy, setOpponentArmy] = useState<BattleArmyPick | null>(null);
  const [allowDoubleTurn, setAllowDoubleTurn] = useState(true);
  const [paintedYou, setPaintedYou] = useState(false);
  const [paintedOpponent, setPaintedOpponent] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) {
    return null;
  }

  const gaps: string[] = [];
  if (yourName.trim().length === 0) gaps.push("your name");
  if (!yourArmy) gaps.push("your army");
  if (opponentName.trim().length === 0) gaps.push("opponent name");
  if (!opponentArmy) gaps.push("opponent army");

  const canCreate = !saving && gaps.length === 0;

  function create() {
    if (!canCreate || !yourArmy || !opponentArmy) return;
    setSaving(true);
    const input: CreateBattleRecordInput = {
      yourName,
      yourArmy: yourArmy.label,
      opponentName,
      opponentArmy: opponentArmy.label,
      allowDoubleTurn,
      paintedYou,
      paintedOpponent,
      yourTacticCardIds: yourArmy.tacticIds,
      opponentTacticCardIds: opponentArmy.tacticIds,
      yourListId: yourArmy.listId,
      opponentListId: opponentArmy.listId,
    };
    onCreated(createBattleRecord(input));
  }

  return (
    <ModalFrame
      label="New battle record"
      onClose={onClose}
      fullPage
      panelClassName="parchment-card flex h-full w-full flex-col overflow-hidden text-parchment-ink"
    >
      <div className={SHEET_HEADER_CLASS}>
        <h2 className="font-serif text-2xl">New battle record</h2>
        <SheetCloseButton label="Close new battle record" onClick={onClose} />
      </div>
      <div className={MODAL_SHEET_SCROLL_HOST_CLASS}>
        <div className={`${MODAL_SHEET_SCROLL_CLASS} flex flex-col gap-5 px-5`}>
          <BattleRecordMatchFields
            values={{
              yourName,
              yourArmyLabel: yourArmy?.label ?? "",
              opponentName,
              opponentArmyLabel: opponentArmy?.label ?? "",
              allowDoubleTurn,
              paintedYou,
              paintedOpponent,
            }}
            onYourName={setYourName}
            onOpponentName={setOpponentName}
            onAllowDoubleTurn={setAllowDoubleTurn}
            onPaintedYou={setPaintedYou}
            onPaintedOpponent={setPaintedOpponent}
            onPickArmy={(side, pick) => {
              if (side === "you") setYourArmy(pick);
              else setOpponentArmy(pick);
            }}
          />
        </div>
      </div>
      <div className={MODAL_SHEET_FOOTER_CLASS}>
        {gaps.length > 0 ? (
          <p className="pb-2 text-center text-xs text-sheet-muted">
            Still need {gaps.join(", ")}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!canCreate}
          onClick={create}
          className={`${IOS_LIQUID_CTA_CLASS} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {saving ? "Starting…" : "Continue"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={SHEET_SECONDARY_BUTTON_CLASS}
        >
          Cancel
        </button>
      </div>
    </ModalFrame>
  );
}

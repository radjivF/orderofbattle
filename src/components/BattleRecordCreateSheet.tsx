"use client";

import { useState } from "react";
import {
  createBattleRecord,
  type BattleArmyPick,
  type CreateBattleRecordInput,
  type GameSession,
} from "@/engine/gameSession";
import {
  MODAL_SHEET_FOOTER_ROW_CLASS,
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  SHEET_FOOTER_CANCEL_CLASS,
  SHEET_FOOTER_PRIMARY_CLASS,
  SHEET_HEADER_CLASS,
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
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl">New battle record</h2>
          {gaps.length > 0 ? (
            <p
              role="status"
              className="mt-0.5 text-[11px] leading-snug text-sheet-muted"
            >
              Still need {gaps.join(", ")}
            </p>
          ) : null}
        </div>
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
      <div className={MODAL_SHEET_FOOTER_ROW_CLASS}>
        <button
          type="button"
          onClick={onClose}
          className={SHEET_FOOTER_CANCEL_CLASS}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canCreate}
          onClick={create}
          className={SHEET_FOOTER_PRIMARY_CLASS}
        >
          {saving ? "Starting…" : "Continue"}
        </button>
      </div>
    </ModalFrame>
  );
}

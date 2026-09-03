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
  SHEET_PANEL_CLASS,
} from "@/lib/builderUi";
import {
  BattleRecordMatchFields,
  type MatchFieldWarnings,
} from "./BattleRecordMatchFields";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (game: GameSession) => void | Promise<void>;
};

export function BattleRecordCreateSheet({ open, onClose, onCreated }: Props) {
  const [yourName, setYourName] = useState("");
  const [yourArmy, setYourArmy] = useState<BattleArmyPick | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentArmy, setOpponentArmy] = useState<BattleArmyPick | null>(null);
  const [allowDoubleTurn, setAllowDoubleTurn] = useState(true);
  const [showCp, setShowCp] = useState(false);
  const [paintedYou, setPaintedYou] = useState(false);
  const [paintedOpponent, setPaintedOpponent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  /** The sheet stays mounted while closed, so a reopen has to start from scratch. */
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setYourName("");
      setYourArmy(null);
      setOpponentName("");
      setOpponentArmy(null);
      setAllowDoubleTurn(true);
      setShowCp(false);
      setPaintedYou(false);
      setPaintedOpponent(false);
      setSaving(false);
      setShowWarnings(false);
    }
  }

  if (!open) {
    return null;
  }

  /** Both names are required — armies can be picked later on the setup screen. */
  const gaps: MatchFieldWarnings = {};
  if (yourName.trim().length === 0) gaps.yourName = "Put a name";
  if (opponentName.trim().length === 0)
    gaps.opponentName = "Put an opponent name";
  const complete = Object.keys(gaps).length === 0;

  async function create() {
    if (saving) return;
    if (!complete) {
      setShowWarnings(true);
      return;
    }
    setSaving(true);
    const input: CreateBattleRecordInput = {
      yourName,
      yourArmy: yourArmy?.label ?? "",
      opponentName,
      opponentArmy: opponentArmy?.label ?? "",
      allowDoubleTurn,
      showCp,
      paintedYou,
      paintedOpponent,
      yourTacticCardIds: yourArmy?.tacticIds ?? [],
      opponentTacticCardIds: opponentArmy?.tacticIds ?? [],
      yourListId: yourArmy?.listId,
      opponentListId: opponentArmy?.listId,
    };
    try {
      await onCreated(createBattleRecord(input));
    } catch {
      /* Keep the sheet open with the entries intact so the save can be retried. */
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalFrame
      label="New battle record"
      onClose={onClose}
      panelClassName={SHEET_PANEL_CLASS}
    >
      <div className={SHEET_HEADER_CLASS}>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl">New battle record</h2>
        </div>
        <SheetCloseButton label="Close new battle record" onClick={onClose} />
      </div>
      <div className={MODAL_SHEET_SCROLL_HOST_CLASS}>
        <div className={`${MODAL_SHEET_SCROLL_CLASS} flex flex-col gap-5 px-5`}>
          <BattleRecordMatchFields
            values={{
              yourName,
              yourArmyLabel: yourArmy?.label ?? "",
              yourArmyPoints: yourArmy?.pointsLabel,
              opponentName,
              opponentArmyLabel: opponentArmy?.label ?? "",
              opponentArmyPoints: opponentArmy?.pointsLabel,
              allowDoubleTurn,
              showCp,
              paintedYou,
              paintedOpponent,
            }}
            warnings={showWarnings ? gaps : undefined}
            onYourName={setYourName}
            onOpponentName={setOpponentName}
            onAllowDoubleTurn={setAllowDoubleTurn}
            onShowCp={setShowCp}
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
          disabled={saving}
          onClick={() => void create()}
          className={SHEET_FOOTER_PRIMARY_CLASS}
        >
          {saving ? "Starting…" : "Continue"}
        </button>
      </div>
    </ModalFrame>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  createBattleRecord,
  type CreateBattleRecordInput,
  type GameSession,
} from "@/engine/gameSession";
import { listFactionsByGrandAlliance } from "@/lib/factionAlliance";
import {
  IOS_LIQUID_CTA_CLASS,
  MODAL_SHEET_FOOTER_CLASS,
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  SHEET_HEADER_CLASS,
  SHEET_PANEL_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (game: GameSession) => void;
};

const SELECT_CLASS =
  "min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none";

export function BattleRecordCreateSheet({ open, onClose, onCreated }: Props) {
  const factionGroups = useMemo(() => listFactionsByGrandAlliance(), []);
  const [yourName, setYourName] = useState("");
  const [yourArmyId, setYourArmyId] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [opponentArmyId, setOpponentArmyId] = useState("");
  const [allowDoubleTurn, setAllowDoubleTurn] = useState(true);
  const [paintedYou, setPaintedYou] = useState(false);
  const [paintedOpponent, setPaintedOpponent] = useState(false);

  if (!open) {
    return null;
  }

  const yourArmyName = factionName(factionGroups, yourArmyId);
  const opponentArmyName = factionName(factionGroups, opponentArmyId);

  const canCreate =
    yourName.trim().length > 0 &&
    Boolean(yourArmyName) &&
    opponentName.trim().length > 0 &&
    Boolean(opponentArmyName);

  function reset() {
    setYourName("");
    setYourArmyId("");
    setOpponentName("");
    setOpponentArmyId("");
    setAllowDoubleTurn(true);
    setPaintedYou(false);
    setPaintedOpponent(false);
  }

  function create() {
    if (!canCreate || !yourArmyName || !opponentArmyName) return;
    const input: CreateBattleRecordInput = {
      yourName,
      yourArmy: yourArmyName,
      opponentName,
      opponentArmy: opponentArmyName,
      allowDoubleTurn,
      paintedYou,
      paintedOpponent,
    };
    const game = createBattleRecord(input);
    reset();
    onCreated(game);
  }

  return (
    <ModalFrame
      label="New battle record"
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <h2 className="font-serif text-2xl">New battle record</h2>
        <SheetCloseButton label="Close new battle record" onClick={onClose} />
      </div>
      <div className={MODAL_SHEET_SCROLL_HOST_CLASS}>
        <div className={`${MODAL_SHEET_SCROLL_CLASS} flex flex-col gap-5 px-5`}>
          <label className="flex flex-col gap-2 text-base text-sheet-muted">
            Your name
            <input
              value={yourName}
              onChange={(event) => setYourName(event.target.value)}
              className={SELECT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-2 text-base text-sheet-muted">
            Your army
            <select
              value={yourArmyId}
              onChange={(event) => setYourArmyId(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Choose army…</option>
              {factionGroups.map((group) => (
                <optgroup key={group.alliance} label={group.label}>
                  {group.factions.map((faction) => (
                    <option key={faction.id} value={faction.id}>
                      {faction.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-base text-sheet-muted">
            Opponent name
            <input
              value={opponentName}
              onChange={(event) => setOpponentName(event.target.value)}
              className={SELECT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-2 text-base text-sheet-muted">
            Opponent army
            <select
              value={opponentArmyId}
              onChange={(event) => setOpponentArmyId(event.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Choose army…</option>
              {factionGroups.map((group) => (
                <optgroup key={group.alliance} label={group.label}>
                  {group.factions.map((faction) => (
                    <option key={faction.id} value={faction.id}>
                      {faction.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <p className="text-base text-sheet-muted">Double turn</p>
            <IosSegmentedControl
              ariaLabel="Allow double turn"
              value={allowDoubleTurn ? "on" : "off"}
              onChange={(next) => setAllowDoubleTurn(next === "on")}
              options={[
                { value: "on", label: "Allowed" },
                { value: "off", label: "Off" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-3 pb-2">
            <p className="text-base text-sheet-muted">Painted army (+10 VP)</p>
            <label className="flex items-center gap-3 text-base text-parchment-ink">
              <input
                type="checkbox"
                checked={paintedYou}
                onChange={(event) => setPaintedYou(event.target.checked)}
                className="size-5 accent-aether"
              />
              Yours painted
            </label>
            <label className="flex items-center gap-3 text-base text-parchment-ink">
              <input
                type="checkbox"
                checked={paintedOpponent}
                onChange={(event) => setPaintedOpponent(event.target.checked)}
                className="size-5 accent-aether"
              />
              Opponent painted
            </label>
          </div>
        </div>
      </div>
      <div className={MODAL_SHEET_FOOTER_CLASS}>
        <button
          type="button"
          disabled={!canCreate}
          onClick={create}
          className={IOS_LIQUID_CTA_CLASS}
        >
          Continue
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

function factionName(
  groups: ReturnType<typeof listFactionsByGrandAlliance>,
  factionId: string,
): string | undefined {
  if (!factionId) return undefined;
  for (const group of groups) {
    const faction = group.factions.find((item) => item.id === factionId);
    if (faction) return faction.name;
  }
  return undefined;
}

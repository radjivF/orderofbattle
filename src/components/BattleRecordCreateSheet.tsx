"use client";

import { useMemo, useState } from "react";
import {
  battleplanLayouts,
  getBattleplanLayout,
} from "@/engine/battleplanLayout";
import { battleTacticsForRealm } from "@/engine/data/load";
import {
  createBattleRecord,
  type CreateBattleRecordInput,
  type GameSession,
} from "@/engine/gameSession";
import {
  IOS_LIQUID_CTA_CLASS,
  MODAL_SHEET_FOOTER_CLASS,
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  SHEET_HEADER_CLASS,
  SHEET_PANEL_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";
import { BattleplanBoard } from "./BattleplanBoard";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (game: GameSession) => void;
};

function toggleId(selected: string[], id: string, max: number): string[] {
  if (selected.includes(id)) {
    return selected.filter((item) => item !== id);
  }
  if (selected.length >= max) {
    return selected;
  }
  return [...selected, id];
}

export function BattleRecordCreateSheet({ open, onClose, onCreated }: Props) {
  const aqshyCards = useMemo(() => battleTacticsForRealm("aqshy"), []);
  const [yourName, setYourName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [yourCards, setYourCards] = useState<string[]>([]);
  const [opponentCards, setOpponentCards] = useState<string[]>([]);
  const [battleplanId, setBattleplanId] = useState(
    battleplanLayouts[0]?.id ?? "into-the-fire",
  );
  const [allowDoubleTurn, setAllowDoubleTurn] = useState(true);
  const [paintedYou, setPaintedYou] = useState(false);
  const [paintedOpponent, setPaintedOpponent] = useState(false);

  if (!open) {
    return null;
  }

  const layout = getBattleplanLayout(battleplanId);
  const canCreate =
    yourName.trim().length > 0 &&
    opponentName.trim().length > 0 &&
    yourCards.length === 2 &&
    opponentCards.length === 2 &&
    Boolean(layout);

  function reset() {
    setYourName("");
    setOpponentName("");
    setYourCards([]);
    setOpponentCards([]);
    setBattleplanId(battleplanLayouts[0]?.id ?? "into-the-fire");
    setAllowDoubleTurn(true);
    setPaintedYou(false);
    setPaintedOpponent(false);
  }

  function create() {
    if (!canCreate) return;
    const input: CreateBattleRecordInput = {
      yourName,
      opponentName,
      battleplanId,
      allowDoubleTurn,
      yourTacticCardIds: [yourCards[0]!, yourCards[1]!],
      opponentTacticCardIds: [opponentCards[0]!, opponentCards[1]!],
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
              className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-base text-sheet-muted">
            Opponent name
            <input
              value={opponentName}
              onChange={(event) => setOpponentName(event.target.value)}
              className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none"
            />
          </label>

          <CardPick
            label="Your battle tactics"
            selected={yourCards}
            cards={aqshyCards}
            onToggle={(id) => setYourCards((cur) => toggleId(cur, id, 2))}
          />
          <CardPick
            label="Opponent battle tactics"
            selected={opponentCards}
            cards={aqshyCards}
            onToggle={(id) => setOpponentCards((cur) => toggleId(cur, id, 2))}
          />

          <div className="flex flex-col gap-2">
            <p className="text-base text-sheet-muted">Battleplan</p>
            <select
              value={battleplanId}
              onChange={(event) => setBattleplanId(event.target.value)}
              aria-label="Battleplan"
              className="min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-lg text-parchment-ink"
            >
              {battleplanLayouts.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  Table {plan.table} · {plan.name}
                </option>
              ))}
            </select>
            {layout ? (
              <div className="mt-2 overflow-hidden rounded-xl bg-parchment-ink/5 p-3">
                <BattleplanBoard layout={layout} />
                <p className="mt-2 text-xs text-sheet-muted">
                  Schematic · not official map art
                </p>
              </div>
            ) : null}
          </div>

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
            <label className="flex items-center gap-3 text-base text-parchment-ink">
              <input
                type="checkbox"
                checked={paintedYou}
                onChange={(event) => setPaintedYou(event.target.checked)}
                className="size-5 accent-aether"
              />
              Painted army (+10 you)
            </label>
            <label className="flex items-center gap-3 text-base text-parchment-ink">
              <input
                type="checkbox"
                checked={paintedOpponent}
                onChange={(event) => setPaintedOpponent(event.target.checked)}
                className="size-5 accent-aether"
              />
              Painted army (+10 opponent)
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
          Start battle
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

function CardPick({
  label,
  selected,
  cards,
  onToggle,
}: {
  label: string;
  selected: string[];
  cards: ReturnType<typeof battleTacticsForRealm>;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-base text-sheet-muted">
        {label} ({selected.length}/2)
      </legend>
      <ul className="flex flex-col gap-2">
        {cards.map((card) => {
          const checked = selected.includes(card.id);
          const disabled = !checked && selected.length >= 2;
          return (
            <li key={card.id}>
              <label
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 ${
                  checked ? "bg-aether/15" : "bg-parchment-ink/5"
                } ${disabled ? "opacity-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(card.id)}
                  className="size-5 accent-aether"
                />
                <span className="font-medium text-parchment-ink">
                  {card.name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

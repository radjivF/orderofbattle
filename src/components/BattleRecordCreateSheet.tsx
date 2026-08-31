"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  createBattleRecord,
  type CreateBattleRecordInput,
  type GameSession,
} from "@/engine/gameSession";
import { getFaction } from "@/engine/queries";
import { isTowList } from "@/engine/storedList";
import type { ArmyList } from "@/engine/types";
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
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import { ModalFrame } from "./ModalFrame";
import { SheetCloseButton } from "./ios/SheetIconButton";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (game: GameSession) => void;
};

type ArmyChoice = {
  label: string;
  tacticIds: string[];
};

type PickerTarget = "you" | "opponent";

const SELECT_CLASS =
  "min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none";
const PICK_BUTTON_CLASS = `${SELECT_CLASS} text-left`;

export function BattleRecordCreateSheet({ open, onClose, onCreated }: Props) {
  const factionGroups = useMemo(() => listFactionsByGrandAlliance(), []);
  const lists = useSyncExternalStore(
    subscribeArmies,
    getArmiesSnapshot,
    getArmiesServerSnapshot,
  );
  const aosLists = useMemo(
    () => (lists ?? []).filter((item): item is ArmyList => !isTowList(item)),
    [lists],
  );

  const [yourName, setYourName] = useState("");
  const [yourArmy, setYourArmy] = useState<ArmyChoice | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentArmy, setOpponentArmy] = useState<ArmyChoice | null>(null);
  const [allowDoubleTurn, setAllowDoubleTurn] = useState(true);
  const [paintedYou, setPaintedYou] = useState(false);
  const [paintedOpponent, setPaintedOpponent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState<PickerTarget | null>(null);

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
    };
    onCreated(createBattleRecord(input));
  }

  return (
    <>
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
            <div className="flex flex-col gap-2 text-base text-sheet-muted">
              Your army
              <button
                type="button"
                aria-label="Your army"
                onClick={() => setPicking("you")}
                className={PICK_BUTTON_CLASS}
              >
                {yourArmy?.label ?? "Choose army…"}
              </button>
            </div>
            <label className="flex flex-col gap-2 text-base text-sheet-muted">
              Opponent name
              <input
                value={opponentName}
                onChange={(event) => setOpponentName(event.target.value)}
                className={SELECT_CLASS}
              />
            </label>
            <div className="flex flex-col gap-2 text-base text-sheet-muted">
              Opponent army
              <button
                type="button"
                aria-label="Opponent army"
                onClick={() => setPicking("opponent")}
                className={PICK_BUTTON_CLASS}
              >
                {opponentArmy?.label ?? "Choose army…"}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-base text-sheet-muted">
                Priority and double turn
              </p>
              <p className="text-sm text-sheet-muted">
                Track who takes each turn (AoS priority), or skip initiative and
                just score.
              </p>
              <IosSegmentedControl
                ariaLabel="Priority and double turn"
                value={allowDoubleTurn ? "on" : "off"}
                onChange={(next) => setAllowDoubleTurn(next === "on")}
                options={[
                  { value: "on", label: "Track priority" },
                  { value: "off", label: "No initiative" },
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
                  onChange={(event) =>
                    setPaintedOpponent(event.target.checked)
                  }
                  className="size-5 accent-aether"
                />
                Opponent painted
              </label>
            </div>
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

      {picking ? (
        <ArmyPickSheet
          title={picking === "you" ? "Choose your army" : "Choose opponent army"}
          lists={aosLists}
          factionGroups={factionGroups}
          defaultTab={aosLists.length > 0 ? "lists" : "factions"}
          onClose={() => setPicking(null)}
          onPick={(choice) => {
            if (picking === "you") setYourArmy(choice);
            else setOpponentArmy(choice);
            setPicking(null);
          }}
        />
      ) : null}
    </>
  );
}

function ArmyPickSheet({
  title,
  lists,
  factionGroups,
  defaultTab,
  onClose,
  onPick,
}: {
  title: string;
  lists: ArmyList[];
  factionGroups: ReturnType<typeof listFactionsByGrandAlliance>;
  defaultTab: "lists" | "factions";
  onClose: () => void;
  onPick: (choice: ArmyChoice) => void;
}) {
  const [tab, setTab] = useState<"lists" | "factions">(defaultTab);

  return (
    <ModalFrame
      label={title}
      onClose={onClose}
      panelClassName={`${SHEET_PANEL_CLASS} text-parchment-ink`}
    >
      <div className={SHEET_HEADER_CLASS}>
        <h2 className="font-serif text-2xl">{title}</h2>
        <SheetCloseButton label={`Close ${title}`} onClick={onClose} />
      </div>
      <div className="px-5 pb-3">
        <IosSegmentedControl
          ariaLabel="Army source"
          value={tab}
          onChange={(next) => setTab(next as "lists" | "factions")}
          options={[
            { value: "lists", label: "My lists" },
            { value: "factions", label: "Factions" },
          ]}
        />
      </div>
      <div className={MODAL_SHEET_SCROLL_HOST_CLASS}>
        <div className={`${MODAL_SHEET_SCROLL_CLASS} flex flex-col gap-2 px-5 pb-5`}>
          {tab === "lists" ? (
            lists.length === 0 ? (
              <p className="py-6 text-center text-sm text-sheet-muted">
                No saved lists yet. Pick a faction instead.
              </p>
            ) : (
              lists.map((list) => {
                const faction = getFaction(list.factionId);
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() =>
                      onPick({
                        label: list.name,
                        tacticIds: (list.battleTacticCardIds ?? []).slice(0, 2),
                      })
                    }
                    className="rounded-xl bg-parchment-ink/5 px-4 py-3 text-left ring-1 ring-parchment-ink/10"
                  >
                    <p className="font-serif text-lg text-parchment-ink">
                      {list.name}
                    </p>
                    <p className="mt-0.5 text-sm text-sheet-muted">
                      {faction?.name ?? list.factionId}
                      {(list.battleTacticCardIds ?? []).length > 0
                        ? ` · ${(list.battleTacticCardIds ?? []).length} tactics`
                        : ""}
                    </p>
                  </button>
                );
              })
            )
          ) : (
            factionGroups.map((group) => (
              <div key={group.alliance} className="flex flex-col gap-2">
                <p className="pt-2 text-xs font-semibold tracking-wide uppercase text-sheet-muted">
                  {group.label}
                </p>
                {group.factions.map((faction) => (
                  <button
                    key={faction.id}
                    type="button"
                    onClick={() =>
                      onPick({ label: faction.name, tacticIds: [] })
                    }
                    className="rounded-xl bg-parchment-ink/5 px-4 py-3 text-left font-serif text-lg text-parchment-ink ring-1 ring-parchment-ink/10"
                  >
                    {faction.name}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </ModalFrame>
  );
}

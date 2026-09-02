"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import type { BattleArmyPick } from "@/engine/gameSession";
import { getFaction } from "@/engine/queries";
import { isTowList } from "@/engine/storedList";
import type { ArmyList } from "@/engine/types";
import {
  MODAL_SHEET_SCROLL_CLASS,
  MODAL_SHEET_SCROLL_HOST_CLASS,
  SHEET_HEADER_CLASS,
} from "@/lib/builderUi";
import { listFactionsByGrandAlliance } from "@/lib/factionAlliance";
import {
  getArmiesServerSnapshot,
  getArmiesSnapshot,
  subscribeArmies,
} from "@/lib/storage";
import { ModalFrame } from "./ModalFrame";
import { IosSegmentedControl } from "./ios/IosSegmentedControl";
import { SheetCloseButton } from "./ios/SheetIconButton";

type PickerTarget = "you" | "opponent";

const SELECT_CLASS =
  "min-h-11 w-full rounded-xl bg-parchment-ink/5 px-3 font-serif text-xl text-parchment-ink outline-none";
const PICK_BUTTON_CLASS = `${SELECT_CLASS} text-left`;
const FIELD_WARN_RING_CLASS = "ring-1 ring-illegal/45";

function FieldWarning({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="text-sm leading-snug text-illegal">
      {message}
    </p>
  );
}

type Values = {
  yourName: string;
  yourArmyLabel: string;
  opponentName: string;
  opponentArmyLabel: string;
  allowDoubleTurn: boolean;
  paintedYou: boolean;
  paintedOpponent: boolean;
};

export type MatchFieldWarnings = Partial<
  Record<"yourName" | "yourArmy" | "opponentName" | "opponentArmy", string>
>;

type Props = {
  values: Values;
  warnings?: MatchFieldWarnings;
  onYourName: (value: string) => void;
  onOpponentName: (value: string) => void;
  onAllowDoubleTurn: (value: boolean) => void;
  onPaintedYou: (value: boolean) => void;
  onPaintedOpponent: (value: boolean) => void;
  onPickArmy: (side: PickerTarget, pick: BattleArmyPick) => void;
};

export function BattleRecordMatchFields({
  values,
  warnings,
  onYourName,
  onOpponentName,
  onAllowDoubleTurn,
  onPaintedYou,
  onPaintedOpponent,
  onPickArmy,
}: Props) {
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
  const [picking, setPicking] = useState<PickerTarget | null>(null);
  const warnPrefix = useId();
  const warnId = (field: keyof MatchFieldWarnings) => `${warnPrefix}-${field}`;
  const fieldProps = (field: keyof MatchFieldWarnings) =>
    warnings?.[field]
      ? { "aria-invalid": true, "aria-describedby": warnId(field) }
      : {};
  const fieldClass = (field: keyof MatchFieldWarnings, base: string) =>
    warnings?.[field] ? `${base} ${FIELD_WARN_RING_CLASS}` : base;

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2 text-base text-sheet-muted">
          Your name
          <input
            value={values.yourName}
            onChange={(event) => onYourName(event.target.value)}
            className={fieldClass("yourName", SELECT_CLASS)}
            {...fieldProps("yourName")}
          />
        </label>
        <FieldWarning id={warnId("yourName")} message={warnings?.yourName} />
      </div>
      <div className="flex flex-col gap-2 text-base text-sheet-muted">
        Your army
        <button
          type="button"
          aria-label="Your army"
          onClick={() => setPicking("you")}
          className={fieldClass("yourArmy", PICK_BUTTON_CLASS)}
          {...fieldProps("yourArmy")}
        >
          {values.yourArmyLabel || "Choose army…"}
        </button>
        <FieldWarning id={warnId("yourArmy")} message={warnings?.yourArmy} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2 text-base text-sheet-muted">
          Opponent name
          <input
            value={values.opponentName}
            onChange={(event) => onOpponentName(event.target.value)}
            className={fieldClass("opponentName", SELECT_CLASS)}
            {...fieldProps("opponentName")}
          />
        </label>
        <FieldWarning
          id={warnId("opponentName")}
          message={warnings?.opponentName}
        />
      </div>
      <div className="flex flex-col gap-2 text-base text-sheet-muted">
        Opponent army
        <button
          type="button"
          aria-label="Opponent army"
          onClick={() => setPicking("opponent")}
          className={fieldClass("opponentArmy", PICK_BUTTON_CLASS)}
          {...fieldProps("opponentArmy")}
        >
          {values.opponentArmyLabel || "Choose army…"}
        </button>
        <FieldWarning
          id={warnId("opponentArmy")}
          message={warnings?.opponentArmy}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-base text-sheet-muted">Priority and double turn</p>
        <p className="text-sm text-sheet-muted">
          Track who takes each turn (AoS priority), or skip initiative and just
          score.
        </p>
        <IosSegmentedControl
          ariaLabel="Priority and double turn"
          value={values.allowDoubleTurn ? "on" : "off"}
          onChange={(next) => onAllowDoubleTurn(next === "on")}
          options={[
            { value: "on", label: "Track priority" },
            { value: "off", label: "No initiative" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-base text-sheet-muted">Painted army (+10 VP)</p>
        <label className="flex items-center gap-3 text-base text-parchment-ink">
          <input
            type="checkbox"
            checked={values.paintedYou}
            onChange={(event) => onPaintedYou(event.target.checked)}
            className="size-5 accent-aether"
          />
          Yours painted
        </label>
        <label className="flex items-center gap-3 text-base text-parchment-ink">
          <input
            type="checkbox"
            checked={values.paintedOpponent}
            onChange={(event) => onPaintedOpponent(event.target.checked)}
            className="size-5 accent-aether"
          />
          Opponent painted
        </label>
      </div>

      {picking ? (
        <ArmyPickSheet
          title={
            picking === "you" ? "Choose your army" : "Choose opponent army"
          }
          lists={aosLists}
          factionGroups={factionGroups}
          defaultTab={aosLists.length > 0 ? "lists" : "factions"}
          onClose={() => setPicking(null)}
          onPick={(choice) => {
            onPickArmy(picking, choice);
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
  onPick: (choice: BattleArmyPick) => void;
}) {
  const [tab, setTab] = useState<"lists" | "factions">(defaultTab);

  return (
    <ModalFrame
      label={title}
      onClose={onClose}
      fullPage
      panelClassName="parchment-card flex h-full w-full flex-col overflow-hidden text-parchment-ink"
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
        <div
          className={`${MODAL_SHEET_SCROLL_CLASS} flex flex-col gap-2 px-5 pb-5`}
        >
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
                        listId: list.id,
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

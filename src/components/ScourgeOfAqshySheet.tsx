"use client";

import { useState } from "react";
import {
  IOS_LIQUID_CTA_CLASS,
  SHEET_SECONDARY_BUTTON_CLASS,
} from "@/lib/builderUi";
import { ModalFrame } from "./ModalFrame";

type Props = {
  fury: number;
  rage: number;
  playerName?: string;
  onChangeFury: (fury: number) => void;
  onChangeRage: (rage: number) => void;
  onClose: () => void;
};

const PANEL = "parchment-card rounded-2xl px-4 py-4 text-parchment-ink";

export function ScourgeOfAqshySheet({
  fury,
  rage,
  playerName,
  onChangeFury,
  onChangeRage,
  onClose,
}: Props) {
  const [erupting, setErupting] = useState(false);

  function adjustFury(delta: number) {
    onChangeFury(Math.max(0, Math.min(7, fury + delta)));
  }

  function adjustRage(delta: number) {
    onChangeRage(Math.max(0, rage + delta));
  }

  function spendEruption(amount: 1 | 2 | 3) {
    const spend = Math.min(amount, rage);
    onChangeRage(rage - spend);
    setErupting(false);
  }

  function spendFight() {
    if (rage >= 1) {
      onChangeRage(rage - 1);
      onChangeFury(Math.max(0, fury - 1));
    }
  }

  return (
    <ModalFrame
      label={`Scourge of Aqshy${playerName ? ` · ${playerName}` : ""}`}
      onClose={onClose}
      panelClassName="bg-gradient-to-b from-parchment to-parchment/95"
    >
      <div className="space-y-4 px-4 py-6">
        <section className={PANEL}>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-parchment-ink">Fury level</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustFury(-1)}
                disabled={fury <= 0}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment-ink/10 font-semibold text-parchment-ink ring-1 ring-parchment-ink/20 transition hover:bg-parchment-ink/15 disabled:opacity-40"
                aria-label="Decrease fury"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center font-serif text-2xl tabular-nums text-parchment-ink">
                {fury}
              </span>
              <button
                type="button"
                onClick={() => adjustFury(1)}
                disabled={fury >= 7}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment-ink/10 font-semibold text-parchment-ink ring-1 ring-parchment-ink/20 transition hover:bg-parchment-ink/15 disabled:opacity-40"
                aria-label="Increase fury"
              >
                +
              </button>
            </div>
          </div>
          <div className="mt-3 flex justify-center gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition ${
                  i < fury
                    ? "bg-ember shadow-sm ring-1 ring-ember/30"
                    : "bg-parchment-ink/10 ring-1 ring-parchment-ink/10"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-sheet-muted">
            Once per battle, deployment: attacker fury = 1, defender fury = 2. Max 7.
          </p>
        </section>

        <section className={PANEL}>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-parchment-ink">Rage dice</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustRage(-1)}
                disabled={rage <= 0}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment-ink/10 font-semibold text-parchment-ink ring-1 ring-parchment-ink/20 transition hover:bg-parchment-ink/15 disabled:opacity-40"
                aria-label="Decrease rage"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center font-serif text-2xl tabular-nums text-parchment-ink">
                {rage}
              </span>
              <button
                type="button"
                onClick={() => adjustRage(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment-ink/10 font-semibold text-parchment-ink ring-1 ring-parchment-ink/20 transition hover:bg-parchment-ink/15"
                aria-label="Increase rage"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-sheet-muted">
            Start of battle round: gain rage equal to fury. End of round: unspent rage lost.
          </p>
        </section>

        <section className={PANEL}>
          <h3 className="font-serif text-lg text-parchment-ink">Spend rage</h3>
          {!erupting ? (
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setErupting(true)}
                disabled={rage < 1}
                className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full disabled:opacity-40`}
              >
                Eruption of Fury · spend 1–3
              </button>
              <button
                type="button"
                onClick={spendFight}
                disabled={rage < 1}
                className={`${SHEET_SECONDARY_BUTTON_CLASS} w-full disabled:opacity-40`}
              >
                Fight through the pain · spend 1, fury −1
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-parchment-ink/70">Spend how many?</p>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => spendEruption(amount)}
                    disabled={rage < amount}
                    className={`${IOS_LIQUID_CTA_CLASS} !min-h-11 disabled:opacity-40`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setErupting(false)}
                className={SHEET_SECONDARY_BUTTON_CLASS}
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>
    </ModalFrame>
  );
}

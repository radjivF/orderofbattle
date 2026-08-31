"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { getBattleplanLayout } from "@/engine/battleplanLayout";
import { matchTotal, type GameSession } from "@/engine/gameSession";
import {
  EMPTY_LIBRARY_CTA_CLASS,
  LIBRARY_CARD_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
} from "@/lib/builderUi";
import {
  getGamesServerSnapshot,
  getGamesSnapshot,
  saveGame,
  subscribeGames,
} from "@/lib/gameStorage";
import { BattleRecordCreateSheet } from "./BattleRecordCreateSheet";
import { IosNavAddButton } from "./ios/IosNavIconButton";
import { SiteFooter } from "./SiteFooter";

export function BattleRecordScreen() {
  const router = useRouter();
  const games = useSyncExternalStore(
    subscribeGames,
    getGamesSnapshot,
    getGamesServerSnapshot,
  );
  const [creating, setCreating] = useState(false);

  async function onCreated(game: GameSession) {
    await saveGame(game);
    setCreating(false);
    router.push(`/battle-record/${game.id}`);
  }

  return (
    <div className="relative z-10 min-h-full">
      <div className="mx-auto w-full max-w-3xl px-5 pt-2 pb-3 sm:px-6">
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <span className="w-11" aria-hidden="true" />
          <h1 className={LIBRARY_TITLE_CLASS}>Battle record</h1>
          <IosNavAddButton
            label="New battle record"
            onClick={() => setCreating(true)}
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6">
        {games === undefined ? (
          <p className="py-16 text-center text-sm text-parchment/80">
            Loading games…
          </p>
        ) : games.length === 0 ? (
          <div className="parchment-card mx-auto max-w-sm rounded-2xl px-5 py-8 text-center text-parchment-ink">
            <p className="font-serif text-2xl">No games yet</p>
            <p className="mt-2 text-sm text-sheet-muted">
              Start a battle record to track turns, victory points, and battle
              tactics.
            </p>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={EMPTY_LIBRARY_CTA_CLASS}
            >
              New battle record
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 pt-2">
            {games.map((game) => {
              const plan = getBattleplanLayout(game.battleplanId);
              return (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/battle-record/${game.id}`)}
                    className={`${LIBRARY_CARD_CLASS} pressable flex w-full flex-col gap-1 p-4 text-left sm:p-5`}
                  >
                    <span className="font-serif text-xl text-parchment-ink">
                      {game.yourName} vs {game.opponentName}
                    </span>
                    <span className="text-sm text-sheet-muted">
                      {game.yourArmy} vs {game.opponentArmy}
                      {plan ? ` · ${plan.name}` : ""} ·{" "}
                      {matchTotal(game, "you")}–{matchTotal(game, "opponent")} ·{" "}
                      {game.status === "setup"
                        ? "Setup"
                        : game.status === "active"
                          ? "In progress"
                          : "Done"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter showPitch={false} />

      <BattleRecordCreateSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(game) => void onCreated(game)}
      />
    </div>
  );
}

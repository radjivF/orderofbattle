"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { getBattleplanLayout } from "@/engine/battleplanLayout";
import { matchTotal, type GameSession } from "@/engine/gameSession";
import {
  EMPTY_LIBRARY_CTA_CLASS,
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
import { IosNavAddButton, IosNavBackButton } from "./ios/IosNavIconButton";
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
    <div className="relative z-10 min-h-full text-parchment">
      <div className="mx-auto w-full max-w-3xl px-5 pt-2 pb-3 sm:px-6">
        <div className={LIBRARY_TITLE_ROW_CLASS}>
          <IosNavBackButton
            label="Back to lists"
            onClick={() => router.push("/dashboard")}
          />
          <h1 className={LIBRARY_TITLE_CLASS}>Battle record</h1>
          <IosNavAddButton
            label="New battle record"
            onClick={() => setCreating(true)}
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-6">
        {games === undefined ? (
          <p className="py-16 text-center text-sm text-parchment/70">
            Loading games…
          </p>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="font-serif text-2xl">No games yet</p>
            <p className="mt-2 max-w-sm text-sm text-parchment/70">
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
                    className="pressable flex w-full flex-col gap-1 rounded-2xl bg-ink-raised px-4 py-4 text-left ring-1 ring-parchment/12"
                  >
                    <span className="font-serif text-xl">
                      {game.yourName} vs {game.opponentName}
                    </span>
                    <span className="text-sm text-parchment/65">
                      {plan?.name ?? game.battleplanId} ·{" "}
                      {matchTotal(game, "you")}–{matchTotal(game, "opponent")} ·{" "}
                      {game.status === "active" ? "In progress" : "Done"}
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

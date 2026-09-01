"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { getBattleplanLayout } from "@/engine/battleplanLayout";
import { matchTotal, type GameSession } from "@/engine/gameSession";
import {
  CONFIRM_SHEET_PANEL_CLASS,
  EMPTY_LIBRARY_CTA_CLASS,
  LIBRARY_TITLE_CLASS,
  LIBRARY_TITLE_ROW_CLASS,
  SITE_COLUMN_CLASS,
} from "@/lib/builderUi";
import {
  deleteGame,
  getGamesServerSnapshot,
  getGamesSnapshot,
  saveGame,
  subscribeGames,
} from "@/lib/gameStorage";
import { BattleRecordCreateSheet } from "./BattleRecordCreateSheet";
import { ConfirmSheetActions } from "./ConfirmSheetActions";
import { ModalFrame } from "./ModalFrame";
import { IosNavAddButton } from "./ios/IosNavIconButton";
import { SiteFooter } from "./SiteFooter";

const GAME_CARD_CLASS =
  "parchment-card flex w-full flex-col rounded-2xl p-4 text-parchment-ink sm:p-5";

function statusLabel(status: GameSession["status"]): string {
  if (status === "setup") return "Setup";
  if (status === "active") return "In progress";
  return "Done";
}

export function BattleRecordScreen() {
  const games = useSyncExternalStore(
    subscribeGames,
    getGamesSnapshot,
    getGamesServerSnapshot,
  );
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GameSession | null>(null);

  async function onCreated(game: GameSession) {
    await saveGame(game);
    setCreating(false);
    // Soft push from this sheet often leaves usePathname on /battle-record
    // while the URL already moved — hard navigate so setup actually appears.
    window.location.assign(`/battle-record/${game.id}`);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await deleteGame(id);
  }

  return (
    <div className="relative z-10 min-h-full">
      <div className={`${SITE_COLUMN_CLASS} pt-2 pb-3`}>
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
                  <article className={GAME_CARD_CLASS}>
                    <Link
                      href={`/battle-record/${game.id}`}
                      className="pressable flex flex-col gap-1 text-left text-parchment-ink"
                    >
                      <span className="text-sm font-semibold tracking-wide uppercase text-sheet-muted">
                        {statusLabel(game.status)}
                        {plan ? ` · ${plan.name}` : ""}
                      </span>
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 font-serif text-xl leading-tight">
                          {game.yourName} vs {game.opponentName}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="font-serif text-2xl font-semibold tabular-nums leading-none text-parchment-ink sm:text-3xl">
                            {matchTotal(game, "you")} –{" "}
                            {matchTotal(game, "opponent")}
                          </span>
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 12 20"
                            className="size-5 text-parchment-ink/35"
                          >
                            <path
                              d="M2.5 2.5 9.5 10l-7 7.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.25"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </span>
                      <span className="text-sm text-sheet-muted">
                        {game.yourArmy} vs {game.opponentArmy}
                      </span>
                    </Link>
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="button"
                        aria-label={`Delete ${game.yourName} vs ${game.opponentName}`}
                        onClick={() => setDeleteTarget(game)}
                        className="pressable px-1 py-0.5 text-sm text-illegal"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
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

      {deleteTarget ? (
        <ModalFrame
          label="Delete battle"
          onClose={() => setDeleteTarget(null)}
          panelClassName={CONFIRM_SHEET_PANEL_CLASS}
        >
          <p className="px-2 pb-2 text-center text-sm leading-relaxed text-sheet-muted">
            <span className="font-serif text-base text-parchment-ink">
              {deleteTarget.yourName} vs {deleteTarget.opponentName}
            </span>{" "}
            will be removed from this device. This cannot be undone.
          </p>
          <ConfirmSheetActions
            onConfirm={() => void confirmDelete()}
            onCancel={() => setDeleteTarget(null)}
          />
        </ModalFrame>
      ) : null}
    </div>
  );
}

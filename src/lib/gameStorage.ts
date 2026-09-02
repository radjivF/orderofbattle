import type { GameSession } from "@/engine/gameSession";
import { GAMES_STORE, openOrderOfBattleDb } from "./storage";

let cache: GameSession[] | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function sortGames(games: GameSession[]) {
  return [...games].sort((a, b) => b.updatedAt - a.updatedAt);
}

async function readAll(): Promise<GameSession[]> {
  if (!isBrowser() || !("indexedDB" in window)) return [];
  try {
    const db = await openOrderOfBattleDb();
    const rows = await idbReq<GameSession[]>(
      db.transaction(GAMES_STORE, "readonly").objectStore(GAMES_STORE).getAll(),
    );
    db.close();
    return sortGames(rows);
  } catch {
    return [];
  }
}

async function writeAll(games: GameSession[]): Promise<void> {
  if (!isBrowser() || !("indexedDB" in window)) return;
  const db = await openOrderOfBattleDb();
  const tx = db.transaction(GAMES_STORE, "readwrite");
  const store = tx.objectStore(GAMES_STORE);
  await idbReq(store.clear());
  await Promise.all(games.map((game) => idbReq(store.put(game))));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

async function hydrate() {
  cache = await readAll();
  emit();
}

export function subscribeGames(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (cache === undefined) {
    void hydrate();
  }
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getGamesSnapshot() {
  return cache;
}

export function getGamesServerSnapshot(): GameSession[] | undefined {
  return undefined;
}

export async function saveGame(game: GameSession): Promise<GameSession> {
  const stored = { ...game, updatedAt: Date.now() };
  const current = cache ?? (await readAll());
  cache = sortGames([
    stored,
    ...current.filter((item) => item.id !== stored.id),
  ]);
  emit();
  await writeAll(cache);
  return stored;
}

export async function deleteGame(id: string): Promise<void> {
  cache = sortGames(
    (cache ?? (await readAll())).filter((item) => item.id !== id),
  );
  emit();
  await writeAll(cache);
}

export async function getGame(id: string): Promise<GameSession | undefined> {
  const current = cache ?? (await readAll());
  return current.find((game) => game.id === id);
}

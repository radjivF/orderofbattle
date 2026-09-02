import type { ArmyList } from "@/engine/types";
import type { StoredList } from "@/engine/storedList";
import { isTowList, normalizeStoredList } from "@/engine/storedList";
import { partitionPortableLists } from "@/engine/listPortable";
import { prepareImportedArmy } from "@/engine/listFactories";

export {
  appendRegimentWithHero,
  blankArmy,
  blankPathToGlory,
  blankSpearhead,
  duplicateArmy,
  prepareImportedArmy,
} from "@/engine/listFactories";
export { blankTowArmy, isTowList } from "@/engine/tow/listFactories";
export type { StoredList } from "@/engine/storedList";

const DB_NAME = "orderofbattle";
const STORE = "lists";
export const GAMES_STORE = "games";
/** Bumped for Battle record `games` object store. */
const VERSION = 2;
const READY_KEY = "orderofbattle:idb-ready";

/** Legacy browser keys from the pre-rename project; keep for one-time migration. */
const LEGACY_DB_NAME = "enlist";
const LEGACY_LOCAL_KEYS = ["orderofbattle:lists", "enlist:lists"] as const;

let cache: StoredList[] | undefined;
const listeners = new Set<() => void>();

// Serialize IDB writes to prevent interleaving clear+put operations
let writeQueue: Promise<void> = Promise.resolve();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeList(list: StoredList): StoredList {
  return normalizeStoredList(list);
}

function listRecency(list: StoredList) {
  return list.lastOpenedAt ?? list.updatedAt;
}

function sortLists(lists: StoredList[]) {
  return [...lists].sort((a, b) => listRecency(b) - listRecency(a));
}

export function openOrderOfBattleDb(): Promise<IDBDatabase> {
  return openDb(DB_NAME, VERSION);
}

function openDb(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      if (name === DB_NAME && !db.objectStoreNames.contains(GAMES_STORE)) {
        db.createObjectStore(GAMES_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbReq<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readFromIndexedDB(name: string): Promise<StoredList[]> {
  if (!isBrowser() || !("indexedDB" in window)) return [];
  try {
    const db = await openDb(name, VERSION);
    const rows = await idbReq<StoredList[]>(
      db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
    );
    db.close();
    return sortLists(rows.map(normalizeList));
  } catch {
    return [];
  }
}

async function writeAllToIndexedDB(lists: StoredList[]): Promise<void> {
  if (!isBrowser() || !("indexedDB" in window)) return;
  
  // Serialize writes: wait for previous write to complete before starting new one
  writeQueue = writeQueue.then(async () => {
    const db = await openDb(DB_NAME, VERSION);
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await idbReq(store.clear());
    await Promise.all(lists.map((list) => idbReq(store.put(list))));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
  
  await writeQueue;
}

function readFromLocalStorage(key: string): StoredList[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as StoredList[];
    if (!Array.isArray(parsed)) return null;
    return sortLists(parsed.map(normalizeList));
  } catch {
    return null;
  }
}

function clearLegacyLocalStorage() {
  if (!isBrowser()) return;
  for (const key of LEGACY_LOCAL_KEYS) {
    localStorage.removeItem(key);
  }
}

function markReady() {
  if (!isBrowser()) return;
  localStorage.setItem(READY_KEY, "1");
}

function isReady() {
  return isBrowser() && localStorage.getItem(READY_KEY) === "1";
}

async function readAll(): Promise<StoredList[]> {
  if (!isBrowser()) return [];

  const primary = await readFromIndexedDB(DB_NAME);
  if (primary.length > 0 || isReady()) return primary;

  for (const key of LEGACY_LOCAL_KEYS) {
    const fromLocal = readFromLocalStorage(key);
    if (fromLocal !== null && fromLocal.length > 0) {
      await writeAllToIndexedDB(fromLocal);
      clearLegacyLocalStorage();
      markReady();
      return fromLocal;
    }
  }

  const legacyIdb = await readFromIndexedDB(LEGACY_DB_NAME);
  if (legacyIdb.length > 0) {
    await writeAllToIndexedDB(legacyIdb);
    markReady();
    return legacyIdb;
  }

  markReady();
  return primary;
}

async function hydrate() {
  cache = await readAll();
  emit();
}

export function subscribeArmies(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (cache === undefined) {
    void hydrate();
  }
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function getArmiesSnapshot() {
  return cache;
}

export function getArmiesServerSnapshot(): StoredList[] | undefined {
  return undefined;
}

export async function saveArmy(list: StoredList): Promise<StoredList> {
  const stored = {
    ...normalizeStoredList(list),
    updatedAt: Date.now(),
  };
  const current = cache ?? (await readAll());
  cache = sortLists([
    stored,
    ...current.filter((item) => item.id !== stored.id),
  ]);
  await writeAllToIndexedDB(cache);
  markReady();
  emit();
  return stored;
}

/** Bump recency for library ordering without treating open as an edit. */
export async function recordArmyOpened(id: string): Promise<void> {
  // Re-read cache immediately before composing to get latest state (e.g. from saveArmy)
  const current = cache ?? (await readAll());
  const list = current.find((item) => item.id === id);
  if (!list) {
    return;
  }
  // Don't overwrite a more recent updatedAt with stale data
  const withTimestamps = {
    ...list,
    lastOpenedAt: Date.now(),
  };
  cache = sortLists([
    withTimestamps,
    ...current.filter((item) => item.id !== id),
  ]);
  await writeAllToIndexedDB(cache);
  markReady();
  emit();
}

export async function deleteArmy(id: string): Promise<void> {
  cache = sortLists(
    (cache ?? (await readAll())).filter((item) => item.id !== id),
  );
  await writeAllToIndexedDB(cache);
  markReady();
  emit();
}

export async function importArmies(lists: ArmyList[]): Promise<ArmyList[]> {
  const current = cache ?? (await readAll());
  const { novel } = partitionPortableLists(
    lists,
    current.filter((item): item is ArmyList => !isTowList(item)),
  );
  const imported = novel.map((list) => prepareImportedArmy(list));
  if (imported.length === 0) {
    return [];
  }
  cache = sortLists([...imported, ...current]);
  await writeAllToIndexedDB(cache);
  markReady();
  emit();
  return imported;
}

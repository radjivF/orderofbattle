import type { ArmyList } from "@/engine/types";
import { partitionPortableLists } from "@/engine/listPortable";
import {
  normalizeArmyList,
  prepareImportedArmy,
} from "@/engine/listFactories";

export {
  appendRegimentWithHero,
  blankArmy,
  blankPathToGlory,
  blankSpearhead,
  duplicateArmy,
  prepareImportedArmy,
} from "@/engine/listFactories";

const DB_NAME = "orderofbattle";
const STORE = "lists";
const VERSION = 1;
const READY_KEY = "orderofbattle:idb-ready";

/** Legacy browser keys from the pre-rename project; keep for one-time migration. */
const LEGACY_DB_NAME = "enlist";
const LEGACY_LOCAL_KEYS = ["orderofbattle:lists", "enlist:lists"] as const;

let cache: ArmyList[] | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeList(list: ArmyList): ArmyList {
  return normalizeArmyList(list);
}

function listRecency(list: ArmyList) {
  return list.lastOpenedAt ?? list.updatedAt;
}

function sortLists(lists: ArmyList[]) {
  return [...lists].sort((a, b) => listRecency(b) - listRecency(a));
}

function openDb(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
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

async function readFromIndexedDB(name: string): Promise<ArmyList[]> {
  if (!isBrowser() || !("indexedDB" in window)) return [];
  try {
    const db = await openDb(name, VERSION);
    const rows = await idbReq<ArmyList[]>(
      db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
    );
    db.close();
    return sortLists(rows.map(normalizeList));
  } catch {
    return [];
  }
}

async function writeAllToIndexedDB(lists: ArmyList[]): Promise<void> {
  if (!isBrowser() || !("indexedDB" in window)) return;
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
}

function readFromLocalStorage(key: string): ArmyList[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as ArmyList[];
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

async function readAll(): Promise<ArmyList[]> {
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

export function getArmiesServerSnapshot(): ArmyList[] | undefined {
  return undefined;
}

export async function saveArmy(list: ArmyList): Promise<ArmyList> {
  const stored = {
    ...normalizeArmyList(list),
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
  const current = cache ?? (await readAll());
  const list = current.find((item) => item.id === id);
  if (!list) {
    return;
  }
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
  const { novel } = partitionPortableLists(lists, current);
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

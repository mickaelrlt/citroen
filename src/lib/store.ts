import { useSyncExternalStore } from "react";

export type Financement = "LOA" | "LLD" | "COMPTANT";

export interface BaseItem {
  id: string;
  createdAt: string;
  rappelDate?: string;
  rappelRaison?: string;
  rappelNotified?: boolean;
  prenom?: unknown;
  nom?: unknown;
  tel?: unknown;
  email?: unknown;
  adresse?: unknown;
  modele?: unknown;
  financement?: unknown;
  detailOffre?: unknown;
  repriseVehicule?: unknown;
  repriseMontant?: unknown;
  note?: unknown;
  statut?: unknown;
  etat?: unknown;
  immat?: unknown;
  chassis?: unknown;
  livraison?: unknown;
  prix?: unknown;
  finition?: unknown;
  options?: unknown;
  [key: string]: unknown;
}

export const COLLECTIONS = {
  offres: "citro-offres",
  commandes: "citro-commandes",
  direction: "citro-direction",
} as const;
export type CollectionKey = keyof typeof COLLECTIONS;

const cache = new Map<string, BaseItem[]>();
const listeners = new Set<() => void>();
const EMPTY: BaseItem[] = [];

function read(key: CollectionKey): BaseItem[] {
  const k = COLLECTIONS[key];
  if (!cache.has(k)) {
    try {
      cache.set(k, JSON.parse(localStorage.getItem(k) || "[]"));
    } catch {
      cache.set(k, []);
    }
  }
  return cache.get(k)!;
}

export function getAll(key: CollectionKey) {
  return typeof window === "undefined" ? EMPTY : read(key);
}

export function save(key: CollectionKey, items: BaseItem[]) {
  const k = COLLECTIONS[key];
  cache.set(k, items);
  localStorage.setItem(k, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function upsert(key: CollectionKey, item: Partial<BaseItem>) {
  const items = read(key);
  if (item.id) {
    save(key, items.map((i) => (i.id === item.id ? { ...i, ...item } as BaseItem : i)));
  } else {
    save(key, [
      { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as BaseItem,
      ...items,
    ]);
  }
}

export function remove(key: CollectionKey, id: string) {
  save(key, read(key).filter((i) => i.id !== id));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = () => {
    cache.clear();
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCollection(key: CollectionKey) {
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}

export const euro = (v: unknown) =>
  v === undefined || v === "" || v === null
    ? ""
    : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const fmtDate = (v: unknown) =>
  v ? new Date(String(v)).toLocaleString("fr-FR", { dateStyle: "medium", ...(String(v).includes("T") ? { timeStyle: "short" } : {}) }) : "";

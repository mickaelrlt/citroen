import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BaseItem {
  id: string;
  createdAt: string;
  rappelDate?: string;
  rappelRaison?: string;
  rappelNotified?: boolean;
  prenom?: unknown; nom?: unknown; tel?: unknown; email?: unknown; adresse?: unknown;
  modele?: unknown; financement?: unknown; detailOffre?: unknown; repriseVehicule?: unknown;
  repriseMontant?: unknown; repriseDate?: unknown; note?: unknown; statuts?: unknown; etat?: unknown;
  immat?: unknown; chassis?: unknown; livraison?: unknown; prix?: unknown; finition?: unknown;
  date?: unknown; heure?: unknown; jour?: unknown; texte?: unknown; mois?: unknown; lignes?: unknown; scelle?: unknown;
  dossierId?: unknown; path?: unknown; ordre?: unknown; parentId?: unknown; mime?: unknown;
  options?: unknown; reprise?: unknown; source?: unknown; repriseNote?: unknown; dateImmat?: unknown; affectation?: unknown; assurance?: unknown; carteGrise?: unknown;
  [key: string]: unknown;
}

export const COLLECTIONS = ["offres", "commandes", "direction", "rdv", "notes", "objectifs", "dossiers", "fichiers"] as const;
export type CollectionKey = (typeof COLLECTIONS)[number];

type State = Record<CollectionKey, BaseItem[]>;
const EMPTY: BaseItem[] = [];
let state: State = { offres: [], commandes: [], direction: [], rdv: [], notes: [], objectifs: [], dossiers: [], fichiers: [] };
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setCol(key: CollectionKey, items: BaseItem[]) {
  state = { ...state, [key]: items };
  emit();
}

export async function loadAll() {
  const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  const next: State = { offres: [], commandes: [], direction: [], rdv: [], notes: [], objectifs: [], dossiers: [], fichiers: [] };
  for (const r of data ?? []) {
    const k = r.collection as CollectionKey;
    if (!next[k]) continue;
    next[k].push({ ...(r.data as object), id: r.id, createdAt: r.created_at } as BaseItem);
  }
  state = next;
  loaded = true;
  emit();
}

export function clearAll() {
  state = { offres: [], commandes: [], direction: [], rdv: [], notes: [], objectifs: [], dossiers: [], fichiers: [] };
  loaded = false;
  emit();
}

export const isLoaded = () => loaded;

export function getAll(key: CollectionKey) {
  return state[key];
}

function payload(item: Partial<BaseItem>) {
  const { id: _i, createdAt: _c, ...rest } = item;
  return rest as Record<string, unknown>;
}

export async function upsert(key: CollectionKey, item: Partial<BaseItem>) {
  const items = state[key];
  if (item.id) {
    const merged = { ...items.find((i) => i.id === item.id), ...item } as BaseItem;
    setCol(key, items.map((i) => (i.id === item.id ? merged : i)));
    const { error } = await supabase.from("items").update({ data: payload(merged) as never }).eq("id", item.id);
    if (error) throw error;
  } else {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    setCol(key, [{ ...item, id, createdAt } as BaseItem, ...items]);
    const { error } = await supabase.from("items").insert({ id, collection: key, data: payload(item) as never });
    if (error) throw error;
  }
}

export async function remove(key: CollectionKey, id: string) {
  setCol(key, state[key].filter((i) => i.id !== id));
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCollection(key: CollectionKey) {
  return useSyncExternalStore(subscribe, () => state[key], () => EMPTY);
}

export const euro = (v: unknown) =>
  v === undefined || v === "" || v === null
    ? ""
    : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const fmtDate = (v: unknown) =>
  v ? new Date(String(v)).toLocaleString("fr-FR", { dateStyle: "medium", ...(String(v).includes("T") ? { timeStyle: "short" } : {}) }) : "";

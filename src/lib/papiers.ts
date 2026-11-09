export type PapierEtat = "ok" | "ko";
export interface Papiers {
  mode?: "Comptant" | "Financement";
  reprise?: boolean;
  cee?: boolean;
  etats?: Record<string, PapierEtat>;
}

export const BASE_DOCS = ["Carte d'identité", "Permis", "Justificatif de domicile", "Avis d'impôt"];
export const FINANCEMENT_DOCS = ["Revenus", "RIB"];
export const REPRISE_DOCS = ["Carte grise", "Histovec", "Market Price"];

export const asPapiers = (v: unknown): Papiers => (v && typeof v === "object" && !Array.isArray(v) ? (v as Papiers) : {});

/** Documents shown in the grid for the chosen options. */
export function visibleDocs(p: Papiers): string[] {
  return [...BASE_DOCS, ...(p.mode === "Financement" ? FINANCEMENT_DOCS : []), ...(p.reprise ? REPRISE_DOCS : [])];
}

/** Documents that count for the status (Avis d'impôt only when CEE is ticked). */
export function requiredDocs(p: Papiers): string[] {
  return visibleDocs(p).filter((d) => d !== "Avis d'impôt" || p.cee);
}

export function papiersStatus(p: Papiers): "red" | "orange" | "green" {
  const req = requiredDocs(p);
  const ok = req.filter((d) => p.etats?.[d] === "ok").length;
  if (ok === 0) return "red";
  return ok === req.length ? "green" : "orange";
}

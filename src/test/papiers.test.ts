import { describe, expect, it } from "vitest";
import { papiersStatus, requiredDocs } from "@/lib/papiers";

describe("papiers", () => {
  it("financement adds Revenus and RIB, reprise adds its docs", () => {
    expect(requiredDocs({ mode: "Financement", reprise: true })).toEqual(["Carte d'identité", "Permis", "Justificatif de domicile", "Revenus", "RIB", "Carte grise", "Histovec", "Market Price"]);
  });
  it("avis d'impôt only required with CEE", () => {
    expect(requiredDocs({ cee: true })).toContain("Avis d'impôt");
  });
  it("status red / orange / green", () => {
    expect(papiersStatus({})).toBe("red");
    expect(papiersStatus({ etats: { Permis: "ok" } })).toBe("orange");
    expect(papiersStatus({ etats: { "Carte d'identité": "ok", Permis: "ok", "Justificatif de domicile": "ok" } })).toBe("green");
  });
});

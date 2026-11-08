import { describe, expect, it } from "vitest";
import { groupOrdersByMonth } from "@/lib/order-months";
import type { BaseItem } from "@/lib/store";

const order = (id: string, dateCommande?: string): BaseItem => ({ id, createdAt: "2026-11-08T00:00:00Z", dateCommande });

describe("Orders grouped by order month", () => {
  it("uses the order date, separates years and puts the most recent months first", () => {
    const groups = groupOrdersByMonth([order("old", "2025-11-03"), order("oct", "2026-10-20"), order("nov1", "2026-11-01"), order("nov8", "2026-11-08")]);
    expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([["nov8", "nov1"], ["oct"], ["old"]]);
    expect(groups.map((g) => g.label)).toEqual(["novembre 2026", "octobre 2026", "novembre 2025"]);
  });
  it("keeps undated orders visible after dated months without inventing an order date", () => {
    const groups = groupOrdersByMonth([order("undated"), order("dated", "2026-11-08")]);
    expect(groups[1]?.items.map((i) => i.id)).toEqual(["undated"]);
    expect(groups[1]?.label).toBe("Sans date de commande");
  });
});
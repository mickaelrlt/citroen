import type { BaseItem } from "@/lib/store";

export function groupOrdersByMonth(items: BaseItem[]) {
  const months = new Map<string, BaseItem[]>();
  for (const item of items) {
    const date = String(item['dateCommande'] ?? "");
    const key = /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(date) ? date.slice(0, 7) : "";
    const list = months.get(key) ?? [];
    list.push(item);
    months.set(key, list);
  }
  return [...months.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, list]) => ({
      label: key ? new Date(`${key}-01T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "Sans date de commande",
      items: [...list].sort((a, b) => String(b['dateCommande'] ?? "").localeCompare(String(a['dateCommande'] ?? ""))),
    }));
}
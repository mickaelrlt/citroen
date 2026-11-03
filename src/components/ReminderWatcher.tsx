import { useEffect } from "react";
import { toast } from "sonner";
import { getAll, save, type CollectionKey } from "@/lib/store";

function check() {
  const now = Date.now();
  (["offres", "commandes"] as CollectionKey[]).forEach((key) => {
    const items = getAll(key);
    let changed = false;
    const next = items.map((i) => {
      if (i.rappelDate && !i.rappelNotified && new Date(i.rappelDate).getTime() <= now) {
        changed = true;
        const who = [i.prenom, i.nom].filter(Boolean).join(" ") || String(i.modele ?? "Client");
        const body = i.rappelRaison ? String(i.rappelRaison) : "Rappel prévu";
        toast(`🔔 ${who}`, { description: body, duration: 15000 });
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Rappel : ${who}`, { body });
        }
        return { ...i, rappelNotified: true };
      }
      return i;
    });
    if (changed) save(key, next);
  });
}

export function ReminderWatcher() {
  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);
  return null;
}

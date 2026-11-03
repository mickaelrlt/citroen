import { useEffect } from "react";
import { toast } from "sonner";
import { getAll, upsert, type CollectionKey } from "@/lib/store";

function check() {
  const now = Date.now();
  (["offres", "commandes"] as CollectionKey[]).forEach((key) => {
    getAll(key).forEach((i) => {
      if (i.rappelDate && !i.rappelNotified && new Date(i.rappelDate).getTime() <= now) {
        const who = [i.prenom, i.nom].filter(Boolean).join(" ") || String(i.modele ?? "Client");
        const body = i.rappelRaison ? String(i.rappelRaison) : "Rappel prévu";
        toast(`🔔 ${who}`, { description: body, duration: 15000 });
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Rappel : ${who}`, { body });
        }
        void upsert(key, { id: i.id, rappelNotified: true });
      }
    });
  });
}

export function ReminderWatcher() {
  useEffect(() => {
    const first = setTimeout(check, 1500);
    const t = setInterval(check, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  return null;
}

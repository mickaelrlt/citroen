import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, Users, FileCheck2, Car, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, fmtDate, type BaseItem } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Carnet Vendeur — Tableau de bord" },
      { name: "description", content: "Clients, commandes, véhicules de direction et rappels du vendeur." },
      { property: "og:title", content: "Carnet Vendeur — Tableau de bord" },
      { property: "og:description", content: "Clients, commandes, véhicules de direction et rappels du vendeur." },
    ],
  }),
  component: Index,
});

type Rappel = BaseItem & { type: string; to: "/offres" | "/commandes" };

function RappelList({ items, now }: { items: Rappel[]; now: number }) {
  return (
    <ul className="space-y-2">
      {items.map((r) => {
        const late = new Date(String(r.rappelDate)).getTime() <= now;
        return (
          <li key={r.id}>
            <Link to={r.to} className="card-surface flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
              <BellRing className={`size-5 shrink-0 ${late ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {[r.prenom, r.nom].filter(Boolean).join(" ") || String(r.modele ?? "")}{" "}
                  <span className="tag ml-1">{r.type}</span>
                </p>
                <p className="truncate text-sm text-muted-foreground">{String(r.rappelRaison ?? "")}</p>
              </div>
              <span className={`shrink-0 text-right text-sm ${late ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {fmtDate(r.rappelDate)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Index() {
  const offres = useCollection("offres");
  const commandes = useCollection("commandes");
  const direction = useCollection("direction");
  const [open, setOpen] = useState(true);
  const [perm, setPerm] = useState<string>("granted");
  useEffect(() => setPerm("Notification" in window ? Notification.permission : "unsupported"), []);

  const rappels = [
    ...offres.map((i) => ({ ...i, type: "Offre", to: "/offres" as const })),
    ...commandes.map((i) => ({ ...i, type: "Commande", to: "/commandes" as const })),
  ]
    .filter((i) => i.rappelDate)
    .sort((a, b) => String(a.rappelDate).localeCompare(String(b.rappelDate)));

  const now = Date.now();
  const limit = now + 7 * 24 * 3600 * 1000;
  const bientot = rappels.filter((r) => new Date(String(r.rappelDate)).getTime() <= limit);
  const plusTard = rappels.filter((r) => new Date(String(r.rappelDate)).getTime() > limit);
  const stats = [
    { label: "Clients offre", n: offres.length, icon: Users, to: "/offres" as const },
    { label: "Commandes", n: commandes.length, icon: FileCheck2, to: "/commandes" as const },
    { label: "Véhicules direction", n: direction.length, icon: Car, to: "/direction" as const },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Bonjour 👋</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Votre journée</h1>
      </header>

      {perm === "default" && (
        <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Activez les notifications pour être alerté de vos rappels.</p>
          <Button onClick={() => Notification.requestPermission().then(setPerm)}>
            <BellRing /> Activer
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.to} to={s.to} className="card-surface group flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
            <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <s.icon />
            </span>
            <span>
              <span className="block font-display text-3xl font-bold">{s.n}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          Bientôt <span className="tag tag-red">{bientot.length}</span>
        </h2>
        <p className="-mt-2 text-sm text-muted-foreground">Rappels des 7 prochains jours et en retard</p>
        {bientot.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Rien dans les 7 prochains jours.</p>
        ) : (
          <RappelList items={bientot} now={now} />
        )}
      </section>

      <section className="space-y-3">
        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-xl px-1 text-left">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            Rappels <span className="tag">{plusTard.length}</span>
          </h2>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {open ? "Masquer" : "Afficher"} <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
        {open &&
          (plusTard.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Aucun rappel plus lointain.</p>
          ) : (
            <RappelList items={plusTard} now={now} />
          ))}
      </section>
    </div>
  );
}

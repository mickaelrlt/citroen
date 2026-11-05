import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, Users, FileCheck2, Car, ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, fmtDate, type BaseItem } from "@/lib/store";
import showroom from "@/assets/showroom-illustration.jpg";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Carnet Vendeur — Tableau de bord" },
      { name: "description", content: "Calendrier, rappels et rendez-vous du vendeur Citroën." },
      { property: "og:title", content: "Carnet Vendeur — Tableau de bord" },
      { property: "og:description", content: "Calendrier, rappels et rendez-vous du vendeur Citroën." },
    ],
  }),
  component: Index,
});

type Entry = BaseItem & { type: string; to: "/offres" | "/commandes" | "/rdv"; when: string; title: string; sub: string };

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function EntryList({ items, now }: { items: Entry[]; now: number }) {
  return (
    <ul className="space-y-2">
      {items.map((r) => {
        const late = new Date(r.when).getTime() <= now;
        const Icon = r.type === "RDV" ? CalendarDays : BellRing;
        return (
          <li key={r.type + r.id}>
            <Link to={r.to} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-secondary">
              <Icon className={`size-4 shrink-0 ${late ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title} <span className={`tag ml-1 ${r.type === "RDV" ? "tag-blue" : ""}`}>{r.type}</span></p>
                {r.sub && <p className="truncate text-xs text-muted-foreground">{r.sub}</p>}
              </div>
              <span className={`shrink-0 text-xs ${late ? "font-semibold text-primary" : "text-muted-foreground"}`}>{fmtDate(r.when)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MiniCalendar({ rdvs, rappels }: { rdvs: BaseItem[]; rappels: Entry[] }) {
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const today = keyOf(new Date());
  const offset = (cur.getDay() + 6) % 7;
  const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <section className="card-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{MONTHS[cur.getMonth()]} {cur.getFullYear()}</h2>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" aria-label="Mois précédent" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))}><ChevronLeft /></Button>
          <Button size="icon" variant="ghost" aria-label="Mois suivant" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))}><ChevronRight /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const k = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(d)}`;
          const dayRdv = rdvs.filter((r) => r.date === k);
          const dayRap = rappels.filter((r) => r.when.slice(0, 10) === k);
          return (
            <Link key={i} to="/rdv" className={`flex min-h-16 flex-col rounded-lg border p-1.5 text-left text-xs transition-colors hover:bg-secondary ${k === today ? "border-primary bg-accent" : ""}`}>
              <span className={`font-semibold ${k === today ? "text-primary" : ""}`}>{d}</span>
              {dayRdv.slice(0, 2).map((r) => (
                <span key={r.id} className="mt-0.5 hidden truncate rounded bg-primary/10 px-1 text-[10px] text-primary sm:block">{String(r.heure ?? "")} {String(r.note || r.nom || "RDV")}</span>
              ))}
              <span className="mt-auto flex gap-1 sm:hidden">
                {dayRdv.length > 0 && <span className="size-1.5 rounded-full bg-primary" />}
              </span>
              {dayRap.length > 0 && <span className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground"><BellRing className="size-3" /><span className="hidden sm:inline">{dayRap.length}</span></span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Index() {
  const offres = useCollection("offres");
  const commandes = useCollection("commandes");
  const direction = useCollection("direction");
  const rdvs = useCollection("rdv");
  const objectifs = useCollection("objectifs");
  const todayKey = keyOf(new Date());
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<string>("granted");
  useEffect(() => setPerm("Notification" in window ? Notification.permission : "unsupported"), []);

  const name = (i: BaseItem) => [i.prenom, i.nom].filter(Boolean).join(" ");
  const rappels: Entry[] = [
    ...offres.map((i) => ({ ...i, type: "Offre", to: "/offres" as const })),
    ...commandes.map((i) => ({ ...i, type: "Commande", to: "/commandes" as const })),
  ].filter((i) => i.rappelDate).map((i) => ({ ...i, when: String(i.rappelDate), title: name(i) || String(i.modele ?? ""), sub: String(i.rappelRaison ?? "") }));
  const rdvEntries: Entry[] = rdvs.filter((r) => String(r.date ?? "") >= todayKey).map((r) => ({
    ...r, type: "RDV", to: "/rdv" as const, when: `${r.date}T${r.heure || "00:00"}`, title: name(r) || "Rendez-vous", sub: String(r.note ?? ""),
  }));
  const all = [...rappels, ...rdvEntries].sort((a, b) => a.when.localeCompare(b.when));
  const now = Date.now();
  const limit = now + 7 * 24 * 3600 * 1000;
  const bientot = all.filter((r) => new Date(r.when).getTime() <= limit);
  const plusTard = all.filter((r) => new Date(r.when).getTime() > limit);
  const todayRdv = rdvs.filter((r) => r.date === todayKey).length;

  const stats = [
    { label: "Offres", n: offres.length, icon: Users, to: "/offres" as const },
    { label: "Commandes", n: commandes.length, icon: FileCheck2, to: "/commandes" as const },
    { label: "Direction", n: direction.length, icon: Car, to: "/direction" as const },
    { label: "RDV", n: rdvEntries.length, icon: CalendarDays, to: "/rdv" as const },
    { label: "Objectif", n: objectifs.filter((o) => o.scelle).length, icon: Target, to: "/objectif" as const },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Bonjour 👋</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Votre journée</h1>
      </header>

      {perm === "default" && (
        <div className="card-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Activez les notifications pour être alerté de vos rappels.</p>
          <Button onClick={() => Notification.requestPermission().then(setPerm)}><BellRing /> Activer</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <MiniCalendar rdvs={rdvs} rappels={rappels} />

          <section className="relative overflow-hidden rounded-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
            <img src={showroom} alt="Citroën devant la concession" width={1600} height={720} loading="lazy" className="h-56 w-full object-cover sm:h-64" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-background">
              <p className="flex items-center gap-2 text-sm font-medium opacity-90"><Clock className="size-4" />{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
              <p className="font-display text-2xl font-bold">{todayRdv === 0 ? "Aucun RDV aujourd'hui" : `${todayRdv} RDV aujourd'hui`}</p>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {stats.map((s) => (
              <Link key={s.to} to={s.to} className="card-surface flex flex-col items-start gap-2 p-4 transition-transform hover:-translate-y-0.5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><s.icon className="size-4" /></span>
                <span className="font-display text-2xl font-bold leading-none">{s.n}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="card-surface h-fit space-y-5 p-5 lg:sticky lg:top-20">
          <h2 className="font-display text-xl font-semibold">Rappels & RDV</h2>
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">Bientôt <span className="tag tag-red">{bientot.length}</span></h3>
            <p className="text-xs text-muted-foreground">7 prochains jours et en retard</p>
            {bientot.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Rien dans les 7 prochains jours.</p> : <EntryList items={bientot} now={now} />}
          </section>
          <section className="space-y-2">
            <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
              <h3 className="flex items-center gap-2 font-semibold">Rappels <span className="tag">{plusTard.length}</span></h3>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">{open ? "Masquer" : "Afficher"} <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} /></span>
            </button>
            {open && (plusTard.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun rappel plus lointain.</p> : <EntryList items={plusTard} now={now} />)}
          </section>
        </aside>
      </div>
    </div>
  );
}

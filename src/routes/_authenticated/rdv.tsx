import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCollection, upsert, remove, type BaseItem } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/rdv")({
  head: () => ({
    meta: [
      { title: "Agenda des RDV — Carnet Vendeur" },
      { name: "description", content: "Calendrier des rendez-vous clients et notes du jour." },
      { property: "og:title", content: "Agenda des RDV — Carnet Vendeur" },
      { property: "og:description", content: "Calendrier des rendez-vous clients et notes du jour." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RdvPage,
});

const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HEURES = Array.from({ length: 14 }, (_, i) => i + 7);
const fail = () => toast.error("Enregistrement impossible, vérifiez votre connexion");

function RdvPage() {
  const rdvs = useCollection("rdv");
  const notes = useCollection("notes");
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState<string | null>(null);
  const [rdv, setRdv] = useState<Partial<BaseItem> | null>(null);
  const [noteText, setNoteText] = useState("");

  const cells = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - ((month.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);

  const byDay = (k: string) =>
    rdvs.filter((r) => String(r.date ?? "") === k).sort((a, b) => String(a.heure ?? "").localeCompare(String(b.heure ?? "")));
  const noteOf = (k: string) => notes.find((n) => n.jour === k);
  const today = key(new Date());

  const openDay = (k: string) => { setDay(k); setNoteText(String(noteOf(k)?.texte ?? "")); };
  const saveNote = () => {
    const n = noteOf(day!);
    if (!noteText.trim()) { if (n) remove("notes", n.id).catch(fail); }
    else upsert("notes", { ...(n ?? {}), jour: day!, texte: noteText }).catch(fail);
    setDay(null);
  };
  const set = (k: string, v: string) => setRdv((r) => ({ ...r, [k]: v }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Agenda</h1>
          <p className="text-muted-foreground">Rendez-vous clients et notes du jour</p>
        </div>
        <Button size="lg" onClick={() => setRdv({ date: today, heure: "10:00" })}><Plus /> RDV</Button>
      </header>

      <div className="card-surface p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button>
          <h2 className="font-display text-xl font-semibold capitalize">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2>
          <Button variant="ghost" size="icon" aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground">
          {JOURS.map((j) => <div key={j} className="py-1">{j}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const k = key(d);
            const list = byDay(k);
            const n = noteOf(k);
            const other = d.getMonth() !== month.getMonth();
            return (
              <button key={k} type="button" onClick={() => openDay(k)}
                className={`flex min-h-20 flex-col gap-1 overflow-hidden rounded-lg border p-1 text-left text-xs transition hover:border-primary sm:min-h-28 sm:p-1.5 ${other ? "opacity-40" : ""} ${k === today ? "border-primary bg-accent" : "bg-background"}`}>
                <span className="flex items-center justify-between font-semibold">
                  {d.getDate()} {n && <StickyNote className="size-3 text-primary" />}
                </span>
                {list.slice(0, 3).map((r) => (
                  <span key={r.id} className="truncate rounded bg-primary px-1 text-primary-foreground">
                    <span className="hidden sm:inline">{String(r.heure ?? "")} </span>{String(r.note || [r.prenom, r.nom].filter(Boolean).join(" ") || "—")}
                  </span>
                ))}
                {list.length > 3 && <span className="text-muted-foreground">+{list.length - 3}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={!!day} onOpenChange={(o) => !o && setDay(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{day && new Date(day + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {day && HEURES.map((h) => {
              const list = byDay(day).filter((r) => {
                const hr = Number(String(r.heure ?? "").slice(0, 2));
                return h === HEURES[0] ? hr <= h : h === HEURES[HEURES.length - 1] ? hr >= h : hr === h;
              });
              return (
              <div key={h} className="flex gap-2 border-t pt-1">
                <button type="button" className="w-12 shrink-0 text-left text-xs font-semibold text-muted-foreground hover:text-primary"
                  onClick={() => { setRdv({ date: day, heure: `${pad(h)}:00` }); setDay(null); }}>{pad(h)}:00</button>
                <div className="min-h-8 flex-1 space-y-1">
            {list.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2 rounded-lg border-l-4 border-primary bg-accent p-2 text-sm">
                <button type="button" className="text-left" onClick={() => { setRdv(r); setDay(null); }}>
                  <strong>{String(r.heure ?? "")} — {String(r.prenom ?? "")} {String(r.nom ?? "")}</strong>
                  {r.tel ? <p>{String(r.tel)}</p> : null}
                  {r.email ? <p>{String(r.email)}</p> : null}
                  {r.note ? <p className="whitespace-pre-line text-muted-foreground">{String(r.note)}</p> : null}
                </button>
                <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => confirm("Supprimer ce RDV ?") && remove("rdv", r.id).catch(fail)}><Trash2 /></Button>
              </div>
            ))}
                </div>
              </div>
              );
            })}
            <Button variant="outline" className="w-full" onClick={() => { setRdv({ date: day!, heure: "10:00" }); setDay(null); }}><Plus /> RDV ce jour</Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-jour">Note du jour</Label>
            <Textarea id="note-jour" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={saveNote}>Enregistrer la note</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rdv} onOpenChange={(o) => !o && setRdv(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{rdv?.id ? "Modifier le RDV" : "Nouveau RDV"}</DialogTitle></DialogHeader>
          <form id="rdv-form" className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); upsert("rdv", rdv!).catch(fail); setRdv(null); }}>
            {([["prenom", "Prénom", "text"], ["nom", "Nom", "text"], ["tel", "Téléphone", "tel"], ["email", "E-mail", "email"], ["date", "Date", "date"], ["heure", "Heure", "time"]] as const).map(([n, l, t]) => (
              <div key={n} className="space-y-1.5">
                <Label htmlFor={`rdv-${n}`}>{l}</Label>
                <Input id={`rdv-${n}`} type={t} required={n === "date" || n === "heure"} value={String(rdv?.[n] ?? "")} onChange={(e) => set(n, e.target.value)} />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rdv-note">Note</Label>
              <Textarea id="rdv-note" value={String(rdv?.note ?? "")} onChange={(e) => set("note", e.target.value)} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRdv(null)}>Annuler</Button>
            <Button type="submit" form="rdv-form">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

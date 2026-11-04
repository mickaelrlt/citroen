import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Plus, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCollection, upsert, type BaseItem } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/objectif")({
  head: () => ({
    meta: [
      { title: "Objectifs du mois — Carnet Vendeur" },
      { name: "description", content: "Tableau des objectifs mensuels VO, VN, FI et archives." },
      { property: "og:title", content: "Objectifs du mois — Carnet Vendeur" },
      { property: "og:description", content: "Tableau des objectifs mensuels VO, VN, FI et archives." },
    ],
  }),
  component: ObjectifPage,
});

const COLS = ["Obj", "VO", "VN", "FI", "€", "TOT"];
type Row = Record<string, string>;
const blank = (): Row[] => [{ Obj: "Objectif" }, { Obj: "Réalisé" }];
const fail = () => toast.error("Enregistrement impossible, vérifiez votre connexion");
const monthLabel = (m: string) => new Date(m + "-01T12:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

function Table({ rows, onChange }: { rows: Row[]; onChange?: (r: Row[]) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr>{COLS.map((c) => <th key={c} className="border bg-primary px-2 py-2 font-display text-primary-foreground">{c}</th>)}{onChange && <th className="w-10" />}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {COLS.map((c) => (
                <td key={c} className="border p-0">
                  {onChange ? (
                    <input aria-label={`${c} ligne ${i + 1}`} className="w-full bg-transparent px-2 py-2 text-center outline-none focus:bg-accent" value={r[c] ?? ""}
                      onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, [c]: e.target.value } : x)))} />
                  ) : <div className="px-2 py-2 text-center">{r[c] ?? ""}</div>}
                </td>
              ))}
              {onChange && <td><Button variant="ghost" size="icon" aria-label="Supprimer la ligne" onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 /></Button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ObjectifPage() {
  const all = useCollection("objectifs");
  const current = all.find((o) => !o.scelle);
  const archives = all.filter((o) => o.scelle).sort((a, b) => String(b.mois).localeCompare(String(a.mois)));
  const [rows, setRows] = useState<Row[]>(blank());
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7));
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (current) { setRows((current.lignes as Row[]) ?? blank()); setMois(String(current.mois ?? mois)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const save = (r: Row[], m = mois) => { setRows(r); upsert("objectifs", { ...(current ?? {}), mois: m, lignes: r, scelle: false } as Partial<BaseItem>).catch(fail); };

  const seal = () => {
    if (!confirm(`Sceller le tableau de ${monthLabel(mois)} ? Il ne sera plus modifiable.`)) return;
    upsert("objectifs", { ...(current ?? {}), mois, lignes: rows, scelle: true } as Partial<BaseItem>).catch(fail);
    const d = new Date(mois + "-01T12:00"); d.setMonth(d.getMonth() + 1);
    setMois(d.toISOString().slice(0, 7)); setRows(blank());
    toast.success("Tableau scellé et archivé");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Objectifs</h1>
          <p className="text-muted-foreground">Mois en cours et archives scellées</p>
        </div>
        <Button size="lg" onClick={seal}><Lock /> Sceller le mois</Button>
      </header>

      <section className="card-surface space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <input type="month" aria-label="Mois" className="select-native w-auto capitalize" value={mois} onChange={(e) => { setMois(e.target.value); save(rows, e.target.value); }} />
          <Button variant="outline" onClick={() => save([...rows, {}])}><Plus /> Ligne</Button>
        </div>
        <Table rows={rows} onChange={save} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Archives</h2>
        {archives.length === 0 && <p className="text-sm text-muted-foreground">Aucun mois scellé pour l'instant.</p>}
        {archives.map((a) => (
          <div key={a.id} className="card-surface p-4">
            <button type="button" className="flex w-full items-center justify-between font-semibold capitalize" onClick={() => setOpen(open === a.id ? null : a.id)}>
              <span className="flex items-center gap-2"><Lock className="size-4 text-primary" /> {monthLabel(String(a.mois))}</span>
              <ChevronDown className={`size-4 transition ${open === a.id ? "rotate-180" : ""}`} />
            </button>
            {open === a.id && <div className="mt-3"><Table rows={(a.lignes as Row[]) ?? []} /></div>}
          </div>
        ))}
      </section>
    </div>
  );
}

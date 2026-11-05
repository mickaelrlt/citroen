import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, Pencil, Trash2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCollection, upsert, remove, fmtDate, type BaseItem, type CollectionKey } from "@/lib/store";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "multi" | "number" | "date" | "datetime-local" | "tel" | "email" | "choice" | "check";
  showIf?: (e: Partial<BaseItem>) => boolean;
  options?: string[];
  section?: string;
  full?: boolean;
}

interface Props {
  collection: CollectionKey;
  title: string;
  subtitle: string;
  fields: Field[];
  withReminder?: boolean;
  cardTitle: (i: BaseItem) => string;
  cardMeta: (i: BaseItem) => ReactNode;
  cardTags: (i: BaseItem) => string[];
  tagColors?: Record<string, string>;
  newLabel: string;
  groups?: { label: string; test: (i: BaseItem) => boolean }[];
}

export function CrudPage(p: Props) {
  const items = useCollection(p.collection);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<BaseItem> | null>(null);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return items;
    return items.filter((i) => JSON.stringify(i).toLowerCase().includes(s));
  }, [items, q]);

  const allFields: Field[] = p.withReminder
    ? [
        ...p.fields,
        { name: "rappelDate", label: "Date du rappel", type: "datetime-local", section: "Rappel calendaire" },
        { name: "rappelRaison", label: "Raison du rappel", type: "text", section: "Rappel calendaire" },
      ]
    : p.fields;

  const sections = Array.from(new Set(allFields.map((f) => f.section ?? "")));

  const set = (k: string, v: unknown) =>
    setEditing((e) => ({ ...e, [k]: v, ...(k === "rappelDate" ? { rappelNotified: false } : {}) }));
  const fail = () => toast.error("Enregistrement impossible, vérifiez votre connexion");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{p.title}</h1>
          <p className="text-muted-foreground">{p.subtitle}</p>
        </div>
        <Button onClick={() => setEditing({})} size="lg">
          <Plus /> {p.newLabel}
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Aucun élément pour l'instant.
        </div>
      ) : (
        <div className="space-y-8">
          {(p.groups ?? [{ label: "", test: () => true }]).map((g) => {
            const list = filtered.filter(g.test);
            return (
              <section key={g.label} className="space-y-3">
                {g.label && (
                  <h2 className="font-display text-xl font-semibold">
                    {g.label} <span className="text-sm font-normal text-muted-foreground">({list.length})</span>
                  </h2>
                )}
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune commande.</p>
                ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {list.map((i) => (
                  <article key={i.id} className="card-surface flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-lg font-semibold leading-tight">{p.cardTitle(i)}</h2>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" aria-label="Modifier" onClick={() => setEditing(i)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Supprimer"
                          onClick={() => confirm("Supprimer cet élément ?") && remove(p.collection, i.id).catch(fail)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.cardTags(i).filter(Boolean).map((t) => (
                        <span key={t} className={`tag ${p.tagColors?.[t] ?? ""}`}>{t}</span>
                      ))}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">{p.cardMeta(i)}</div>
                    {i.rappelDate && (
                      <div className="mt-auto flex items-start gap-2 rounded-lg bg-accent p-2.5 text-sm text-accent-foreground">
                        <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>
                          <strong>{fmtDate(i.rappelDate)}</strong>
                          {i.rappelRaison ? ` — ${i.rappelRaison}` : ""}
                        </span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier" : p.newLabel}</DialogTitle>
          </DialogHeader>
          <form
            id="crud-form"
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              upsert(p.collection, editing!).catch(fail);
              setEditing(null);
            }}
          >
            {sections.map((s) => (
              <fieldset key={s} className="space-y-3">
                {s && <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{s}</legend>}
                <div className="grid gap-3 sm:grid-cols-2">
                  {allFields.filter((f) => (f.section ?? "") === s && (!f.showIf || f.showIf(editing ?? {}))).map((f) => {
                    const v = String(editing?.[f.name] ?? "");
                    const arr = Array.isArray(editing?.[f.name]) ? (editing![f.name] as string[]) : [];
                    return (
                      <div key={f.name} className={`space-y-1.5 ${f.full || f.type === "textarea" || f.type === "multi" ? "sm:col-span-2" : ""}`}>
                        <Label htmlFor={f.name}>{f.label}</Label>
                        {f.type === "check" ? (
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input id={f.name} type="checkbox" className="size-4 accent-primary" checked={!!editing?.[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                            Oui
                          </label>
                        ) : f.type === "choice" ? (
                          <div className="flex flex-wrap gap-2">
                            {f.options!.map((o) => (
                              <Button key={o} type="button" size="sm" variant={v === o ? "default" : "outline"} aria-pressed={v === o} onClick={() => set(f.name, v === o ? "" : o)}>
                                {o}
                              </Button>
                            ))}
                          </div>
                        ) : f.type === "textarea" ? (
                          <Textarea id={f.name} value={v} onChange={(e) => set(f.name, e.target.value)} />
                        ) : f.type === "multi" ? (
                          <div className="flex flex-wrap gap-2">
                            {f.options!.map((o) => {
                              const on = arr.includes(o);
                              return (
                                <button
                                  type="button"
                                  key={o}
                                  aria-pressed={on}
                                  onClick={() => set(f.name, on ? arr.filter((x) => x !== o) : [...arr, o])}
                                  className={`tag cursor-pointer px-3 py-1.5 text-sm transition ${on ? p.tagColors?.[o] ?? "" : "opacity-60"}`}
                                >
                                  <span className={`mr-1.5 inline-block size-3.5 rounded-sm border ${on ? "bg-current" : ""}`} />
                                  {o}
                                </button>
                              );
                            })}
                          </div>
                        ) : f.type === "select" ? (
                          <select id={f.name} className="select-native" value={v} onChange={(e) => set(f.name, e.target.value)}>
                            <option value="">—</option>
                            {f.options!.map((o) => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <Input id={f.name} type={f.type ?? "text"} value={v} onChange={(e) => set(f.name, e.target.value)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button type="submit" form="crud-form">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

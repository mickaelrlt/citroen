import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Folder, FolderPlus, Pencil, Trash2, ArrowUp, ArrowDown, Upload, FileText, ChevronLeft, ChevronRight, ExternalLink, GripVertical, Image as ImageIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCollection, upsert, remove, type BaseItem } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/dossiers")({
  head: () => ({
    meta: [
      { title: "Dossiers — Carnet Vendeur" },
      { name: "description", content: "Dossiers et sous-dossiers pour ranger vos PDF et images." },
      { property: "og:title", content: "Dossiers — Carnet Vendeur" },
      { property: "og:description", content: "Dossiers et sous-dossiers pour ranger vos PDF et images." },
    ],
  }),
  component: DossiersPage,
});

const fail = () => toast.error("Opération impossible, vérifiez votre connexion");
const ord = (d: BaseItem) => Number(d.ordre ?? 0);
const parentOf = (d: BaseItem) => (d.parentId ? String(d.parentId) : null);
const isImage = (f: BaseItem) => String(f.mime ?? "").startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(String(f.nom ?? ""));

function DossiersPage() {
  const all = [...useCollection("dossiers")].sort((a, b) => ord(a) - ord(b) || a.createdAt.localeCompare(b.createdAt));
  const fichiers = useCollection("fichiers");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ nom: string; url: string; image: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = all.find((d) => d.id === openId) ?? null;
  const children = all.filter((d) => parentOf(d) === (current?.id ?? null));
  const files = current ? fichiers.filter((f) => f.dossierId === current.id) : [];

  const path: BaseItem[] = [];
  for (let c = current; c; c = all.find((d) => d.id === parentOf(c!)) ?? null) path.unshift(c);

  useEffect(() => () => { if (viewer) URL.revokeObjectURL(viewer.url); }, [viewer]);

  const descendants = (id: string): BaseItem[] => all.filter((d) => parentOf(d) === id).flatMap((d) => [d, ...descendants(d.id)]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= children.length) return;
    const l = [...children];
    const [x] = l.splice(from, 1);
    l.splice(to, 0, x!);
    l.forEach((d, i) => ord(d) !== i && upsert("dossiers", { id: d.id, ordre: i }).catch(fail));
  };
  const create = () => {
    const nom = prompt(current ? "Nom du sous-dossier" : "Nom du dossier");
    if (nom?.trim()) upsert("dossiers", { nom: nom.trim(), ordre: children.length, parentId: current?.id ?? null }).catch(fail);
  };
  const rename = (d: BaseItem) => {
    const nom = prompt("Nouveau nom", String(d.nom ?? ""));
    if (nom?.trim()) upsert("dossiers", { id: d.id, nom: nom.trim() }).catch(fail);
  };
  const delFile = async (f: BaseItem) => {
    await supabase.storage.from("pdfs").remove([String(f.path)]);
    await remove("fichiers", f.id);
  };
  const delFolder = (d: BaseItem) => {
    const tree = [d, ...descendants(d.id)];
    const fs = fichiers.filter((f) => tree.some((t) => t.id === f.dossierId));
    const subs = tree.length - 1;
    if (!confirm(`Supprimer « ${d.nom} »${subs ? `, ses ${subs} sous-dossier(s)` : ""}${fs.length ? ` et ses ${fs.length} fichier(s)` : ""} ?`)) return;
    Promise.all(fs.map(delFile)).then(() => Promise.all(tree.map((t) => remove("dossiers", t.id)))).catch(fail);
  };
  const uploadFiles = async (list: FileList | null) => {
    if (!list || !current) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      for (const file of Array.from(list)) {
        const ok = file.type === "application/pdf" || file.type.startsWith("image/");
        if (!ok) { toast.error(`${file.name} n'est ni un PDF ni une image`); continue; }
        const ext = file.name.split(".").pop() || "bin";
        const p = `${data.user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("pdfs").upload(p, file, { contentType: file.type });
        if (error) throw error;
        await upsert("fichiers", { dossierId: current.id, nom: file.name, path: p, mime: file.type });
      }
    } catch { fail(); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const openFile = async (f: BaseItem) => {
    const { data, error } = await supabase.storage.from("pdfs").download(String(f.path));
    if (error || !data) { fail(); return; }
    const image = isImage(f);
    const blob = new Blob([data], { type: image ? data.type || String(f.mime) : "application/pdf" });
    setViewer({ nom: String(f.nom), url: URL.createObjectURL(blob), image });
  };

  // every folder except the current one, for "move to"
  const label = (d: BaseItem): string => { const p = all.find((x) => x.id === parentOf(d)); return p ? `${label(p)} / ${d.nom}` : String(d.nom); };
  const targets = all.filter((d) => d.id !== current?.id).map((d) => ({ id: d.id, label: label(d) })).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {current && (
            <nav className="-ml-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={() => setOpenId(parentOf(current))}><ChevronLeft /> Retour</Button>
              <button className="hover:text-foreground" onClick={() => setOpenId(null)}>Dossiers</button>
              {path.slice(0, -1).map((p) => (
                <span key={p.id} className="flex items-center gap-1"><ChevronRight className="size-3" /><button className="hover:text-foreground" onClick={() => setOpenId(p.id)}>{String(p.nom)}</button></span>
              ))}
            </nav>
          )}
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="truncate">{current ? String(current.nom ?? "") : "Dossiers"}</span>
            {current && <Button variant="ghost" size="icon" aria-label="Renommer" onClick={() => rename(current)}><Pencil /></Button>}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" variant={current ? "outline" : "default"} onClick={create}><FolderPlus /> {current ? "Sous-dossier" : "Nouveau dossier"}</Button>
          {current && <Button size="lg" disabled={busy} onClick={() => fileRef.current?.click()}><Upload /> {busy ? "Envoi…" : "Ajouter PDF / images"}</Button>}
          <input ref={fileRef} type="file" accept="application/pdf,image/*" multiple hidden onChange={(e) => uploadFiles(e.target.files)} />
        </div>
      </header>

      {children.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((d, i) => {
            const nSub = all.filter((x) => parentOf(x) === d.id).length;
            const nFiles = fichiers.filter((f) => f.dossierId === d.id).length;
            return (
              <li key={d.id} draggable onDragStart={() => setDrag(d.id)} onDragOver={(e) => e.preventDefault()}
                onDrop={() => { const from = children.findIndex((x) => x.id === drag); if (from >= 0) move(from, i); setDrag(null); }}
                className={`card-surface flex items-center gap-1 p-3 ${drag === d.id ? "opacity-50" : ""}`}>
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                <button type="button" onClick={() => setOpenId(d.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Folder className="size-8 shrink-0 fill-primary/20 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{String(d.nom ?? "")}</span>
                    <span className="text-xs text-muted-foreground">{nSub ? `${nSub} dossier(s) · ` : ""}{nFiles} fichier(s)</span>
                  </span>
                </button>
                <Button variant="ghost" size="icon" aria-label="Monter" onClick={() => move(i, i - 1)} disabled={i === 0}><ArrowUp /></Button>
                <Button variant="ghost" size="icon" aria-label="Descendre" onClick={() => move(i, i + 1)} disabled={i === children.length - 1}><ArrowDown /></Button>
                <Button variant="ghost" size="icon" aria-label="Renommer" onClick={() => rename(d)}><Pencil /></Button>
                <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => delFolder(d)}><Trash2 /></Button>
              </li>
            );
          })}
        </ul>
      )}

      {!current && children.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Aucun dossier pour l'instant.</p>
      )}

      {current && (files.length === 0 ? (
        children.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Ce dossier est vide.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="card-surface flex items-center gap-2 p-3">
              <button type="button" onClick={() => openFile(f)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                {isImage(f) ? <ImageIcon className="size-6 shrink-0 text-primary" /> : <FileText className="size-6 shrink-0 text-primary" />}
                <span className="truncate font-medium">{String(f.nom ?? "")}</span>
              </button>
              {targets.length > 0 && (
                <select aria-label="Déplacer vers" className="max-w-36 rounded-md border bg-background px-2 py-1 text-sm" value=""
                  onChange={(e) => e.target.value && upsert("fichiers", { id: f.id, dossierId: e.target.value }).catch(fail)}>
                  <option value="">Déplacer…</option>
                  {targets.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              )}
              <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => confirm("Supprimer ce fichier ?") && delFile(f).catch(fail)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      ))}

      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
          <DialogHeader className="flex-row items-center justify-between gap-2 pr-8">
            <DialogTitle className="truncate">{viewer?.nom}</DialogTitle>
            <span className="flex shrink-0 gap-3 text-sm">
              <a href={viewer?.url} download={viewer?.nom} className="flex items-center gap-1 text-primary"><Download className="size-4" /> Télécharger</a>
              <a href={viewer?.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary"><ExternalLink className="size-4" /> Ouvrir</a>
            </span>
          </DialogHeader>
          {viewer && (viewer.image
            ? <div className="flex min-h-0 flex-1 items-center justify-center"><img src={viewer.url} alt={viewer.nom} className="max-h-full max-w-full rounded-md object-contain" /></div>
            : <object data={viewer.url} type="application/pdf" className="w-full flex-1 rounded-md border">
                <p className="p-6 text-center text-sm">Aperçu indisponible sur cet appareil. <a className="text-primary underline" href={viewer.url} target="_blank" rel="noreferrer">Ouvrir le PDF</a></p>
              </object>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}

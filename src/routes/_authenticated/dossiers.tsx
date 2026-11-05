import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Folder, FolderPlus, Pencil, Trash2, ArrowUp, ArrowDown, Upload, FileText, ChevronLeft, ExternalLink, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCollection, upsert, remove, type BaseItem } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/dossiers")({
  head: () => ({
    meta: [
      { title: "Dossiers PDF — Carnet Vendeur" },
      { name: "description", content: "Dossiers personnels pour ranger et consulter vos PDF." },
      { property: "og:title", content: "Dossiers PDF — Carnet Vendeur" },
      { property: "og:description", content: "Dossiers personnels pour ranger et consulter vos PDF." },
    ],
  }),
  component: DossiersPage,
});

const fail = () => toast.error("Opération impossible, vérifiez votre connexion");
const ord = (d: BaseItem) => Number(d.ordre ?? 0);

function DossiersPage() {
  const dossiers = [...useCollection("dossiers")].sort((a, b) => ord(a) - ord(b) || a.createdAt.localeCompare(b.createdAt));
  const fichiers = useCollection("fichiers");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ nom: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = dossiers.find((d) => d.id === openId);

  const reorder = (list: BaseItem[]) => list.forEach((d, i) => ord(d) !== i && upsert("dossiers", { id: d.id, ordre: i }).catch(fail));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= dossiers.length) return;
    const l = [...dossiers];
    const [x] = l.splice(from, 1);
    l.splice(to, 0, x);
    reorder(l);
  };
  const create = () => {
    const nom = prompt("Nom du dossier");
    if (nom?.trim()) upsert("dossiers", { nom: nom.trim(), ordre: dossiers.length }).catch(fail);
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
    const files = fichiers.filter((f) => f.dossierId === d.id);
    if (!confirm(`Supprimer « ${d.nom} »${files.length ? ` et ses ${files.length} PDF` : ""} ?`)) return;
    Promise.all(files.map(delFile)).then(() => remove("dossiers", d.id)).catch(fail);
  };
  const uploadFiles = async (list: FileList | null) => {
    if (!list || !current) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      for (const file of Array.from(list)) {
        if (file.type !== "application/pdf") { toast.error(`${file.name} n'est pas un PDF`); continue; }
        const path = `${data.user!.id}/${crypto.randomUUID()}.pdf`;
        const { error } = await supabase.storage.from("pdfs").upload(path, file, { contentType: "application/pdf" });
        if (error) throw error;
        await upsert("fichiers", { dossierId: current.id, nom: file.name, path });
      }
    } catch { fail(); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const openPdf = async (f: BaseItem) => {
    const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(String(f.path), 3600);
    if (error || !data) { fail(); return; }
    setViewer({ nom: String(f.nom), url: data.signedUrl });
  };

  return (
    <div className="space-y-6">
      {!current ? (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Dossiers</h1>
              <p className="text-muted-foreground">Glissez un dossier pour le déplacer</p>
            </div>
            <Button size="lg" onClick={create}><FolderPlus /> Nouveau dossier</Button>
          </header>
          {dossiers.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Aucun dossier pour l'instant.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dossiers.map((d, i) => (
                <li key={d.id} draggable onDragStart={() => setDrag(d.id)} onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { const from = dossiers.findIndex((x) => x.id === drag); if (from >= 0) move(from, i); setDrag(null); }}
                  className={`card-surface flex items-center gap-2 p-3 ${drag === d.id ? "opacity-50" : ""}`}>
                  <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
                  <button type="button" onClick={() => setOpenId(d.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Folder className="size-8 shrink-0 fill-primary/20 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{String(d.nom ?? "")}</span>
                      <span className="text-xs text-muted-foreground">{fichiers.filter((f) => f.dossierId === d.id).length} PDF</span>
                    </span>
                  </button>
                  <Button variant="ghost" size="icon" aria-label="Monter" onClick={() => move(i, i - 1)} disabled={i === 0}><ArrowUp /></Button>
                  <Button variant="ghost" size="icon" aria-label="Descendre" onClick={() => move(i, i + 1)} disabled={i === dossiers.length - 1}><ArrowDown /></Button>
                  <Button variant="ghost" size="icon" aria-label="Renommer" onClick={() => rename(d)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => delFolder(d)}><Trash2 /></Button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setOpenId(null)}><ChevronLeft /> Dossiers</Button>
              <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
                {String(current.nom ?? "")}
                <Button variant="ghost" size="icon" aria-label="Renommer" onClick={() => rename(current)}><Pencil /></Button>
              </h1>
            </div>
            <Button size="lg" disabled={busy} onClick={() => fileRef.current?.click()}><Upload /> {busy ? "Envoi…" : "Ajouter des PDF"}</Button>
            <input ref={fileRef} type="file" accept="application/pdf" multiple hidden onChange={(e) => uploadFiles(e.target.files)} />
          </header>
          {fichiers.filter((f) => f.dossierId === current.id).length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Aucun PDF dans ce dossier.</p>
          ) : (
            <ul className="space-y-2">
              {fichiers.filter((f) => f.dossierId === current.id).map((f) => (
                <li key={f.id} className="card-surface flex items-center gap-2 p-3">
                  <button type="button" onClick={() => openPdf(f)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <FileText className="size-6 shrink-0 text-primary" />
                    <span className="truncate font-medium">{String(f.nom ?? "")}</span>
                  </button>
                  {dossiers.length > 1 && (
                    <select aria-label="Déplacer vers" className="rounded-md border bg-background px-2 py-1 text-sm" value=""
                      onChange={(e) => e.target.value && upsert("fichiers", { id: f.id, dossierId: e.target.value }).catch(fail)}>
                      <option value="">Déplacer…</option>
                      {dossiers.filter((d) => d.id !== current.id).map((d) => <option key={d.id} value={d.id}>{String(d.nom)}</option>)}
                    </select>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => confirm("Supprimer ce PDF ?") && delFile(f).catch(fail)}><Trash2 /></Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
          <DialogHeader className="flex-row items-center justify-between gap-2 pr-8">
            <DialogTitle className="truncate">{viewer?.nom}</DialogTitle>
            <a href={viewer?.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-sm text-primary"><ExternalLink className="size-4" /> Ouvrir</a>
          </DialogHeader>
          {viewer && <iframe src={viewer.url} title={viewer.nom} className="w-full flex-1 rounded-md border" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

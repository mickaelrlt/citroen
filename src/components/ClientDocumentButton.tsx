import { useEffect, useState } from "react";
import { Download, FileText, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PdfViewer } from "@/components/PdfViewer";
import { supabase } from "@/integrations/supabase/client";
import { type ClientDocument } from "@/lib/client-document";

export function ClientDocumentButton({ document }: { document: ClientDocument }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const open = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.storage.from("pdfs").download(document.path);
      if (error || !data) throw error;
      setUrl(URL.createObjectURL(new Blob([data], { type: "application/pdf" })));
    } catch {
      toast.error("Ouverture du PDF impossible, vérifiez votre connexion.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <Button type="button" variant="outline" className="max-w-full justify-start" disabled={busy} onClick={open}>
      {busy ? <LoaderCircle className="animate-spin" /> : <FileText />}
      <span className="truncate">{document.name}</span>
    </Button>
    <Dialog open={!!url} onOpenChange={(open) => { if (!open) setUrl(null); }}>
      <DialogContent className="flex h-[90dvh] w-[calc(100%-1rem)] max-w-5xl flex-col">
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle className="truncate">{document.name}</DialogTitle>
          {url && <a href={url} download={document.name} className="flex items-center gap-1 text-sm text-primary"><Download className="size-4" /> Télécharger</a>}
        </DialogHeader>
        {url && <PdfViewer url={url} />}
      </DialogContent>
    </Dialog>
  </>;
}
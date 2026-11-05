import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PdfViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const box = ref.current;
    if (!box) return;
    box.innerHTML = "";
    setState("loading");
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const pdf = await pdfjs.getDocument({ url }).promise;
        const width = Math.min((outer.current?.clientWidth || 800) - 24, 1000);
        // render at high resolution so tables stay sharp when zoomed
        const quality = Math.min((window.devicePixelRatio || 1) * 3, 4);
        for (let n = 1; n <= pdf.numPages && !cancelled; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * quality });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = `${width}px`;
          canvas.className = "mb-3 block rounded-md bg-white shadow";
          box.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp, canvas }).promise;
          if (n === 1 && !cancelled) setState("ok");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div ref={outer} className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
      {state === "loading" && <p className="absolute inset-x-0 top-0 z-10 p-6 text-center text-sm text-muted-foreground">Chargement du PDF…</p>}
      {state === "error" && <p className="absolute inset-x-0 top-0 z-10 p-6 text-center text-sm">Impossible d'afficher ce PDF. Utilisez « Télécharger ».</p>}
      <TransformWrapper minScale={0.5} maxScale={8} initialScale={1} limitToBounds={false} wheel={{ step: 0.15 }} doubleClick={{ step: 1 }} panning={{ velocityDisabled: true }}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute bottom-3 right-3 z-20 flex gap-1 rounded-full border bg-background/90 p-1 shadow">
              <Button size="icon" variant="ghost" aria-label="Dézoomer" onClick={() => zoomOut(0.4)}><ZoomOut /></Button>
              <Button size="icon" variant="ghost" aria-label="Taille normale" onClick={() => resetTransform()}><Maximize /></Button>
              <Button size="icon" variant="ghost" aria-label="Zoomer" onClick={() => zoomIn(0.4)}><ZoomIn /></Button>
            </div>
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ padding: 12, cursor: "grab" }}>
              <div ref={ref} />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

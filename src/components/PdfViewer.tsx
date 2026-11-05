import { useEffect, useRef, useState } from "react";

export function PdfViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
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
        const width = Math.min(box.clientWidth || 800, 1000);
        const dpr = window.devicePixelRatio || 1;
        for (let n = 1; n <= pdf.numPages && !cancelled; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = "100%";
          canvas.className = "mx-auto mb-3 max-w-[1000px] rounded-md bg-white shadow";
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
    <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted p-3">
      {state === "loading" && <p className="p-6 text-center text-sm text-muted-foreground">Chargement du PDF…</p>}
      {state === "error" && <p className="p-6 text-center text-sm">Impossible d'afficher ce PDF. Utilisez « Télécharger ».</p>}
      <div ref={ref} />
    </div>
  );
}

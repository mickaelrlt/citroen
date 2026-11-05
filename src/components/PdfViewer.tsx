import { useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PdfViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const api = useRef<ReactZoomPanPinchRef>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pdfRef = useRef<any>(null);
  const cssW = useRef(800);
  const rendered = useRef<Map<number, number>>(new Map());
  const timer = useRef<number | undefined>(undefined);

  // render one page at a resolution matching the current zoom (capped for memory)
  const renderPage = async (n: number, zoom: number) => {
    const pdf = pdfRef.current;
    const canvas = canvases()[n - 1];
    if (!pdf || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const p = await pdf.getPage(n);
    const base = p.getViewport({ scale: 1 });
    let s = (cssW.current / base.width) * Math.max(zoom, 1) * dpr * 1.25;
    const maxArea = 16_000_000;
    if (base.width * s * base.height * s > maxArea) s = Math.sqrt(maxArea / (base.width * base.height));
    if ((rendered.current.get(n) ?? 0) >= s * 0.98) return;
    rendered.current.set(n, s);
    const vp = p.getViewport({ scale: s });
    const off = document.createElement("canvas");
    off.width = vp.width; off.height = vp.height;
    await p.render({ canvasContext: off.getContext("2d")!, viewport: vp, canvas: off }).promise;
    canvas.width = off.width; canvas.height = off.height;
    canvas.getContext("2d")!.drawImage(off, 0, 0);
  };
  const sharpen = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = api.current; const o = outer.current;
      if (!r || !o) return;
      const { scale, positionY } = r.state;
      const top = -positionY / scale, bottom = top + o.clientHeight / scale;
      canvases().forEach((c, i) => {
        if (c.offsetTop + c.offsetHeight >= top && c.offsetTop <= bottom) renderPage(i + 1, scale);
      });
    }, 250);
  };

  const canvases = () => Array.from(ref.current?.querySelectorAll("canvas") ?? []) as HTMLCanvasElement[];
  const goTo = (n: number) => {
    const r = api.current;
    const list = canvases();
    if (!r || !list.length) return;
    const i = Math.max(1, Math.min(list.length, n));
    const { scale, positionX } = r.state;
    r.setTransform(positionX, -(list[i - 1]!.offsetTop) * scale, scale, 200);
    setPage(i);
  };
  const track = (scale: number, y: number) => {
    const list = canvases();
    const mid = (-y + (outer.current?.clientHeight ?? 0) / 3) / scale;
    let cur = 1;
    list.forEach((c, i) => { if (c.offsetTop <= mid) cur = i + 1; });
    setPage(cur);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(page + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
        pdfRef.current = pdf; rendered.current = new Map();
        if (!cancelled) { setTotal(pdf.numPages); setPage(1); }
        const width = Math.min((outer.current?.clientWidth || 800) - 24, 1000);
        // render at high resolution so tables stay sharp when zoomed
        cssW.current = width;
        const quality = Math.min((window.devicePixelRatio || 1) * 2, 3);
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
          rendered.current.set(n, (width / base.width) * quality);
          if (n === 1 && !cancelled) setState("ok");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  // smooth wheel zoom: scale by wheel delta magnitude, anchored at the cursor
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const r = api.current;
      if (!r) return;
      e.preventDefault();
      const { scale, positionX, positionY } = r.state;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = Math.min(8, Math.max(0.5, scale * Math.exp(-dy * 0.0015)));
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const k = next / scale;
      r.setTransform(px - (px - positionX) * k, py - (py - positionY) * k, next, 0);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={outer} className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
      {state === "loading" && <p className="absolute inset-x-0 top-0 z-10 p-6 text-center text-sm text-muted-foreground">Chargement du PDF…</p>}
      {state === "error" && <p className="absolute inset-x-0 top-0 z-10 p-6 text-center text-sm">Impossible d'afficher ce PDF. Utilisez « Télécharger ».</p>}
      <TransformWrapper minScale={0.5} maxScale={8} initialScale={1} limitToBounds={false} ref={api} onTransform={(_r, st) => { track(st.scale, st.positionY); sharpen(); }} wheel={{ disabled: true }} doubleClick={{ step: 1 }} panning={{ velocityDisabled: true }}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {total > 1 && (
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full border bg-background/90 p-1 shadow">
                <Button size="icon" variant="ghost" aria-label="Première page" onClick={() => goTo(1)} disabled={page <= 1}><ChevronsLeft /></Button>
                <Button size="icon" variant="ghost" aria-label="Page précédente" onClick={() => goTo(page - 1)} disabled={page <= 1}><ChevronLeft /></Button>
                <select aria-label="Aller à la page" className="h-9 rounded-md bg-transparent px-1 text-sm font-medium" value={page} onChange={(e) => goTo(Number(e.target.value))}>
                  {Array.from({ length: total }, (_, i) => <option key={i} value={i + 1}>{i + 1} / {total}</option>)}
                </select>
                <Button size="icon" variant="ghost" aria-label="Page suivante" onClick={() => goTo(page + 1)} disabled={page >= total}><ChevronRight /></Button>
                <Button size="icon" variant="ghost" aria-label="Dernière page" onClick={() => goTo(total)} disabled={page >= total}><ChevronsRight /></Button>
              </div>
            )}
            <div className="absolute bottom-16 right-3 sm:bottom-3 z-20 flex gap-1 rounded-full border bg-background/90 p-1 shadow">
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

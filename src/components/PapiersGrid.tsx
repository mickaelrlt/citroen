import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { asPapiers, papiersStatus, visibleDocs, type Papiers } from "@/lib/papiers";

const COLOR = { red: "tag-red", orange: "tag-orange", green: "tag-green" } as const;

export function PapiersGrid({ value, onChange }: { value: unknown; onChange: (v: Papiers) => void }) {
  const [open, setOpen] = useState(false);
  const p = asPapiers(value);
  const mode = p.mode ?? "Comptant";
  const status = papiersStatus(p);
  const upd = (patch: Partial<Papiers>) => onChange({ ...p, mode, ...patch });
  const toggle = (d: string) => upd({ etats: { ...p.etats, [d]: p.etats?.[d] === "ok" ? "ko" : "ok" } });

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <button type="button" className="flex w-full items-center justify-between font-medium" onClick={() => setOpen((o) => !o)}>
        <span className="flex items-center gap-2">{open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />} Papiers</span>
        <span className={`tag ${COLOR[status]}`}>Papiers</span>
      </button>
      {open && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["Comptant", "Financement"] as const).map((m) => (
              <Button key={m} type="button" size="sm" variant={mode === m ? "default" : "outline"} aria-pressed={mode === m} onClick={() => upd({ mode: m })}>{m}</Button>
            ))}
            <Button type="button" size="sm" variant={p.reprise ? "default" : "outline"} aria-pressed={!!p.reprise} onClick={() => upd({ reprise: !p.reprise })}>Reprise</Button>
          </div>
          <div className="space-y-2">
            {visibleDocs({ ...p, mode }).map((d) => {
              const isAvis = d === "Avis d'impôt";
              const disabled = isAvis && !p.cee;
              const ok = p.etats?.[d] === "ok";
              return (
                <div key={d} className="flex items-center gap-2">
                  <div className="w-14 shrink-0">
                    {isAvis && (
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" className="size-3.5 accent-primary" checked={!!p.cee} onChange={(e) => upd({ cee: e.target.checked })} /> CEE
                      </label>
                    )}
                  </div>
                  <button type="button" disabled={disabled} onClick={() => toggle(d)}
                    className={`tag flex-1 justify-center px-3 py-2 text-sm ${disabled ? "opacity-40" : ok ? "tag-green" : "tag-red"}`}>
                    {d}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

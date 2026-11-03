export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <rect width="40" height="40" rx="10" className="fill-primary" />
        <path d="M9 19 L20 12 L31 19" className="stroke-primary-foreground" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 28 L20 21 L31 28" className="stroke-primary-foreground" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="leading-none">
        <span className="block font-display text-lg font-extrabold tracking-[0.18em]">CITROËN</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Carnet vendeur</span>
      </span>
    </span>
  );
}

type ServerAdSlotProps = {
  code?: string | null;
  label?: string;
  slotId?: string;
  className?: string;
};

export function ServerAdSlot({ code, label = "Advertisement", slotId = "server-ad", className = "" }: ServerAdSlotProps) {
  const cleanCode = (code || "").trim();

  if (!cleanCode) {
    return (
      <section className={`abm-ad-slot ${className}`} data-ad-slot={slotId}>
        <div className="abm-ad-label">{label}</div>
        <div className="abm-ad-inner text-center text-sm text-slate-400">
          No ad code saved yet. Add ad code in Admin → Ads Settings.
        </div>
      </section>
    );
  }

  return (
    <section className={`abm-ad-slot ${className}`} data-ad-slot={slotId}>
      <div className="abm-ad-label">{label}</div>
      <div className="abm-ad-inner" dangerouslySetInnerHTML={{ __html: cleanCode }} />
    </section>
  );
}

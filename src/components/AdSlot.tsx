"use client";

import { useEffect, useMemo, useRef } from "react";

type AdSlotProps = {
  code?: string | null;
  enabled?: boolean;
  label?: string;
  slotId?: string;
  className?: string;
};

/**
 * Server/initial HTML friendly ad renderer.
 *
 * Important for A-ADS verification:
 * - The iframe/script code must be present in the page HTML, not only injected after React useEffect.
 * - Bots may check the static HTML of the exact URL.
 *
 * The same code is rendered with dangerouslySetInnerHTML for initial markup,
 * then scripts are re-mounted after hydration so script-based networks still run.
 */
export function AdSlot({ code, enabled = true, label = "Advertisement", slotId = "ad", className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanCode = useMemo(() => (code || "").trim(), [code]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || !cleanCode) return;

    const scripts = Array.from(container.querySelectorAll("script"));

    scripts.forEach((oldScript) => {
      const script = document.createElement("script");

      Array.from(oldScript.attributes).forEach((attribute) => {
        script.setAttribute(attribute.name, attribute.value);
      });

      if (!script.async) script.async = true;
      script.text = oldScript.textContent || "";
      oldScript.parentNode?.replaceChild(script, oldScript);
    });
  }, [cleanCode, enabled]);

  if (!enabled || !cleanCode) return null;

  return (
    <aside className={`abm-ad-slot ${className}`} data-ad-slot={slotId}>
      <div className="abm-ad-label">{label}</div>
      <div
        ref={containerRef}
        className="abm-ad-inner"
        dangerouslySetInnerHTML={{ __html: cleanCode }}
      />
    </aside>
  );
}

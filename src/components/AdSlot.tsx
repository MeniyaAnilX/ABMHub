"use client";

import { useEffect, useMemo, useRef } from "react";

type AdSlotProps = {
  code?: string | null;
  enabled?: boolean;
  label?: string;
  slotId?: string;
  className?: string;
};

export function AdSlot({ code, enabled = true, label = "Advertisement", slotId = "ad", className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanCode = useMemo(() => (code || "").trim(), [code]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    if (!enabled || !cleanCode) return;

    const template = document.createElement("template");
    template.innerHTML = cleanCode;
    container.appendChild(template.content.cloneNode(true));

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
      <div ref={containerRef} className="abm-ad-inner" />
    </aside>
  );
}

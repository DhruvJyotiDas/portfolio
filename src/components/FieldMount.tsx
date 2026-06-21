"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { FORMATION_NAMES } from "@/lib/formations";

const Field = dynamic(() => import("./Field"), { ssr: false });

export default function FieldMount() {
  const formationRef = useRef(0);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-formation]"));
    const label = document.getElementById("fieldState");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const f = Number((e.target as HTMLElement).dataset.formation);
            if (!Number.isNaN(f) && f !== formationRef.current) {
              formationRef.current = f;
              if (label) label.textContent = FORMATION_NAMES[f] ?? "core";
            }
          }
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <Field formationRef={formationRef} />
    </div>
  );
}

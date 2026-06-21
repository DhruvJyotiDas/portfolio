"use client";

import { useEffect, useRef, useState } from "react";

const DATA: Record<string, string> = {
  help: "commands: whoami · research · projects · experience · contact · clear",
  whoami: "Dhruv Jyoti Das — AI researcher & engineer (LLMs, vision transformers, spatiotemporal SSL).",
  research: "spatiotemporal: masked SSL on Sentinel-2 (STCLN) · vision: causal-emergence routing (CET-ViT) · language: graph-grounded clarification (Samsung) · alignment: QLoRA→DPO Hindi (XAlign)",
  projects: "CET-ViT · STCLN · code-vuln detection · Chat X · XAlign · TLS proxy",
  experience: "Meet.space (AI/ML Lead) · Univ. of Galway (research) · IIT Indore (STCLN) · Samsung R&D",
  contact: "dd4708@srmist.edu.in · GitHub · LinkedIn",
};

export function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(["djd-research · type `help`"]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "`" && !open) { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  function run(cmd: string) {
    const c = cmd.trim().toLowerCase();
    if (!c) return;
    if (c === "clear") { setLines([]); return; }
    setLines((l) => [...l, `› ${c}`, DATA[c] ?? `command not found: ${c} — try help`]);
  }

  return (
    <>
      <button className="term-hint" onClick={() => setOpen(true)}>› open terminal</button>
      {open && (
        <div className="term open" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="term-win">
            <div className="term-bar"><i /><i /><i />&nbsp; djd@research — zsh
              <span className="close-x" onClick={() => setOpen(false)}>[esc]</span></div>
            <div className="term-body">
              {lines.map((l, i) => <div className="out" key={i}>{l}</div>)}
              <div className="term-line">
                <span className="ps">djd@research ›</span>
                <input ref={inputRef} className="term-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { run((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }
                  }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

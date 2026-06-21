"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
const SUGG = [
  "What research does Dhruv do?",
  "What's the hardest system he's built?",
  "Why would a team want to hire him?",
];

export function Ask() {
  const [log, setLog] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function ask(q: string) {
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    if (inputRef.current) inputRef.current.value = "";
    const next = [...log, { role: "user", content: query } as Msg];
    setLog([...next, { role: "assistant", content: "…" }]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const text = (data?.text as string) || "No response — try rephrasing.";
      setLog([...next, { role: "assistant", content: text }]);
    } catch {
      setLog([...next, { role: "assistant", content: "The assistant is unavailable right now." }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section id="ask" data-formation="1">
      <div className="sec-head">
        <span className="sec-idx">05</span><span className="sec-title">Ask the page</span>
        <span className="sec-note">an assistant grounded in Dhruv's CV — ask it anything</span>
      </div>
      <div className="ask">
        <div className="ask-head"><span className="dot" /> assistant · grounded in CV + research history</div>
        <div className="ask-log">
          {log.length === 0 && <div className="msg sys">Ask about the research, the systems, or the fit for a role.</div>}
          {log.map((m, i) => <div key={i} className={`msg ${m.role === "user" ? "u" : "a"}`}>{m.content}</div>)}
        </div>
        <div className="ask-row">
          <input ref={inputRef} placeholder="e.g. What's the most novel thing in CET-ViT?"
                 onKeyDown={(e) => { if (e.key === "Enter") ask((e.target as HTMLInputElement).value); }} />
          <button disabled={busy} onClick={() => ask(inputRef.current?.value ?? "")}>
            {busy ? "…" : "send"}
          </button>
        </div>
        <div className="ask-sugg">
          {SUGG.map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}
        </div>
      </div>
    </section>
  );
}

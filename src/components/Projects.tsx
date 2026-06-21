"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Github, ExternalLink, Presentation, Play, Database } from "lucide-react";
import { projects, type LinkKind } from "@/data/projects";
import { MiniChart } from "./MiniChart";

const ICON: Record<LinkKind, React.ReactNode> = {
  paper: <FileText size={14} />,
  report: <FileText size={14} />,
  code: <Github size={14} />,
  live: <ExternalLink size={14} />,
  slides: <Presentation size={14} />,
  demo: <Play size={14} />,
  data: <Database size={14} />,
};

export function Projects() {
  const [open, setOpen] = useState<string | null>(projects[0]?.id ?? null);

  return (
    <section id="work" data-formation="2">
      <div className="sec-head">
        <span className="sec-idx">03</span><span className="sec-title">Projects</span>
        <span className="sec-note">expand for summary, metrics, results, and resources</span>
      </div>

      <div className="proj">
        {projects.map((p) => {
          const isOpen = open === p.id;
          return (
            <div className={`proj-card ${isOpen ? "open" : ""}`} key={p.id}>
              <button className="proj-head" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
                <div className="proj-title">
                  <h3>{p.title}</h3>
                  {p.status && <span className="proj-status">{p.status}</span>}
                </div>
                <div className="proj-side">
                  <span>{p.venue}</span><span className="proj-period">{p.period}</span>
                  <span className={`chev ${isOpen ? "up" : ""}`}>▾</span>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
                    className="proj-bodywrap"
                  >
                    <div className="proj-body">
                      <p>{p.summary}</p>
                      <div className="proj-nums">
                        {p.metrics.map((m) => (
                          <div key={m.label}><b>{m.value}</b>{m.label}</div>
                        ))}
                      </div>
                      {p.chart && <MiniChart chart={p.chart} />}
                      <div className="proj-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
                      <div className="proj-links">
                        {p.links.map((l) => (
                          <a key={l.kind + l.label} href={l.href}
                             target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                            {ICON[l.kind]} {l.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

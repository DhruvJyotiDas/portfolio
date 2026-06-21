const threads = [
  { tag: "SPATIOTEMPORAL · SSL", h: "Masked SSL on satellite time-series",
    p: "Extending STCLN for low-label crop mapping on Sentinel-2: multi-scale tokenizers, temporal cross-attention, spectral-channel gating. +8–12% F1-macro under 1–10% labelled regimes.",
    m: ["masked recon", "temporal attn", "CCA / t-SNE"] },
  { tag: "VISION · DYNAMIC COMPUTE", h: "Causal emergence inside ViTs",
    p: "V-CEO: sparse EI-guided token assignment discovers per-image macro-regions without segmentation labels. A two-term EI loss stabilises reversibility and resolves rank-1 collapse.",
    m: ["EI loss", "Gumbel-Softmax K", "ROCm / MI300X"] },
  { tag: "LANGUAGE · STRUCTURED REASONING", h: "Graph-grounded ambiguity & clarification",
    p: "At Samsung R&D: ambiguity as relation reachability over story-level knowledge graphs; a component-aware clarification algorithm with guaranteed convergence narrows vague queries in fewer turns.",
    m: ["knowledge graphs", "CQG", "NER ensemble"] },
  { tag: "LANGUAGE · ALIGNMENT", h: "Cross-lingual alignment for Hindi",
    p: "XAlign: QLoRA SFT → DPO on a 14K Hindi preference set, plus a contrastive reward model. +27% preference score, −38% unsafe compliance, less English fallback under Hindi-only prompting.",
    m: ["QLoRA", "DPO", "reward model"] },
];

export function ResearchThreads() {
  return (
    <section id="research" data-formation="1">
      <div className="sec-head">
        <span className="sec-idx">01</span><span className="sec-title">Research threads</span>
        <span className="sec-note">four directions, one question: how do systems learn structure with little supervision?</span>
      </div>
      <div className="threads">
        {threads.map((t) => (
          <div className="thread" key={t.h}>
            <div className="tag">{t.tag}</div>
            <h3>{t.h}</h3>
            <p>{t.p}</p>
            <div className="meth">{t.m.map((x) => <span key={x}>{x}</span>)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

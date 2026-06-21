const clusters = [
  { label: "MODELS", items: ["PyTorch · ROCm", "Transformers / ViT", "QLoRA · DPO", "RAG pipelines", "Mamba / SSM"] },
  { label: "RESEARCH", items: ["Self-supervised learning", "Remote-sensing AI", "NLP · alignment", "Vision transformers", "W&B · CCA · t-SNE"] },
  { label: "SYSTEMS", items: ["Node · WebRTC", "React Native", "MongoDB · PostgreSQL", "WebSocket / REST", "vLLM serving"] },
  { label: "INFRA", items: ["Linux · Nginx", "Docker", "GPU · A30 / MI300X", "Certbot · TLS", "PM2"] },
];

export function Instruments() {
  return (
    <section id="stack" data-formation="3">
      <div className="sec-head">
        <span className="sec-idx">04</span><span className="sec-title">Instruments</span>
        <span className="sec-note">the toolchain behind the research and the systems</span>
      </div>
      <div className="clusters">
        {clusters.map((c) => (
          <div className="cluster" key={c.label}>
            <div className="clabel">{c.label}</div>
            <ul>{c.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  );
}

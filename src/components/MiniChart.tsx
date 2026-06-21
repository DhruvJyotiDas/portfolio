import type { Project } from "@/data/projects";

export function MiniChart({ chart }: { chart: NonNullable<Project["chart"]> }) {
  const max = Math.max(...chart.bars.map((b) => b.value)) * 1.04;
  const W = 360, H = 150, pad = 28, bw = 64, gap = 48;
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={chart.caption}>
        {chart.bars.map((b, i) => {
          const h = (b.value / max) * (H - pad - 24);
          const x = pad + i * (bw + gap);
          const y = H - pad - h;
          return (
            <g key={b.label}>
              <rect x={x} y={y} width={bw} height={h} rx={2}
                className={b.highlight ? "bar hi" : "bar"} />
              <text x={x + bw / 2} y={y - 7} className="bar-val" textAnchor="middle">
                {b.value}{chart.unit ?? ""}
              </text>
              <text x={x + bw / 2} y={H - 8} className="bar-lab" textAnchor="middle">
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>{chart.caption}</figcaption>
    </figure>
  );
}

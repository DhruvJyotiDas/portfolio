export type LinkKind = "paper" | "code" | "live" | "report" | "slides" | "demo" | "data";

export type ProjectLink = { kind: LinkKind; label: string; href: string };

export type Project = {
  id: string;
  title: string;
  status?: string;
  venue?: string;
  period: string;
  summary: string;
  metrics: { value: string; label: string }[];
  tags: string[];
  links: ProjectLink[];
  // Optional bar chart — ONLY include where there are real comparable numbers.
  chart?: { caption: string; unit?: string; bars: { label: string; value: number; highlight?: boolean }[] };
};

// TODO: replace placeholder "#" hrefs with real paper / repo / live URLs.
export const projects: Project[] = [
  {
    id: "cet-vit",
    title: "CET-ViT: Causal Emergence Transformer for Vision",
    status: "preprint in prep",
    venue: "CVIP / ICLR target",
    period: "2026",
    summary:
      "V-CEO: a sparse Effective-Information-guided token-assignment module that discovers per-image macro-regions without segmentation supervision. A two-term EI loss (entropy floor + reversibility ceiling) resolves rank-1 collapse and over-diffusion. Trained from scratch on AMD MI300X. CIFAR-100 results below; ImageNet experiments underway before submission.",
    metrics: [
      { value: "76.5%", label: "CIFAR-100 acc" },
      { value: "+2.6", label: "F1 vs no-EI" },
      { value: "0.1%", label: "param overhead" },
      { value: "11.4k", label: "img/s" },
    ],
    tags: ["Vision Transformer", "Causal emergence", "Dynamic compute", "ROCm"],
    links: [
      { kind: "paper", label: "Preprint", href: "#" },
      { kind: "code", label: "Code", href: "#" },
      { kind: "slides", label: "Slides", href: "#" },
    ],
    chart: {
      caption: "Overall accuracy, CIFAR-100 (trained from scratch)",
      unit: "%",
      bars: [
        { label: "no-EI baseline", value: 74.15 },
        { label: "V-CEO (ours)", value: 76.54, highlight: true },
      ],
    },
  },
  {
    id: "stcln",
    title: "STCLN for Crop Mapping",
    status: "active",
    venue: "IIT Indore",
    period: "2025 –",
    summary:
      "Decoder-aware self-supervision for remote sensing on Sentinel-2 time-series. Temporal-aware cross-attention and spectral-channel gating reduce reconstruction drift and lift downstream crop classification in label-scarce settings.",
    metrics: [
      { value: "+8–12%", label: "F1-macro (low-label)" },
      { value: "1–10%", label: "labelled regimes" },
      { value: "Sentinel-2", label: "time-series" },
    ],
    tags: ["Self-supervised", "Remote sensing", "Masked recon", "Temporal attn"],
    links: [
      { kind: "report", label: "Tech report", href: "#" },
      { kind: "code", label: "Code", href: "#" },
      // TODO: add a W&B report link for a real training-curve embed
    ],
  },
  {
    id: "vuln",
    title: "LLM-Powered Code Vulnerability Detection",
    status: "active",
    venue: "UROP · SRMIST",
    period: "2025 –",
    summary:
      "Recall-optimised CodeBERT framework for C/C++ on BigVul: 30x weighted loss + balanced undersampling for severe class imbalance, an XAI suite (attention heatmaps + LIME), and a nine-step adversarial benchmark. 0.02% confidence drift under variable renaming proves high semantic invariance.",
    metrics: [
      { value: "1.00", label: "recall" },
      { value: "0.99", label: "F1" },
      { value: "0.02%", label: "adversarial drift" },
      { value: "122ms", label: "min latency · T4" },
    ],
    tags: ["CodeBERT", "Security", "Explainable AI", "Adversarial"],
    links: [
      { kind: "report", label: "Report", href: "#" },
      { kind: "code", label: "Code", href: "#" },
    ],
  },
  {
    id: "chatx",
    title: "Chat X — Real-Time AI Communication",
    venue: "deployed",
    period: "2024–25",
    summary:
      "Real-time chat + video over a full WebRTC pipeline (ICE/SDP/renegotiation) with self-hosted STUN/TURN for reliable NAT traversal, MongoDB persistence, transformer-based summarisation and sentiment tagging over WebSocket signalling.",
    metrics: [
      { value: "<200ms", label: "chat latency" },
      { value: "P2P", label: "self-hosted TURN" },
    ],
    tags: ["WebRTC", "Node", "MongoDB", "Real-time"],
    links: [
      { kind: "live", label: "Live demo", href: "#" },
      { kind: "code", label: "Code", href: "#" },
    ],
  },
  {
    id: "xalign",
    title: "XAlign — Hindi LLM Alignment",
    venue: "independent",
    period: "2025",
    summary:
      "Hindi-focused alignment: QLoRA SFT then DPO on a 14K preference set, plus a contrastive reward model calibrated with Expected Policy Divergence. Custom eval harness (toxicity, MT-Bench-style scoring, SafetyBench-HI).",
    metrics: [
      { value: "+27%", label: "preference score" },
      { value: "−38%", label: "unsafe compliance" },
    ],
    tags: ["QLoRA", "DPO", "Reward model", "Low-resource"],
    links: [
      { kind: "report", label: "Writeup", href: "#" },
      { kind: "data", label: "Dataset", href: "#" },
    ],
  },
];

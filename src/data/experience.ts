export type Experience = {
  org: string;
  logo: string;          // slug -> public/logos/<slug>.svg ; falls back to monogram
  role: string;
  location: string;
  period: string;
  type: "industry" | "research";
  bullets: string[];
  tags: string[];
};

// NOTE: Meet.space and Galway fields marked TODO are placeholders — confirm/replace.
export const experience: Experience[] = [
  {
    org: "Meet.space",
    logo: "meetspace",
    role: "AI / ML Lead",
    location: "Switzerland (Remote)",
    period: "2026 – Present", // TODO: confirm start date
    type: "industry",
    bullets: [
      // TODO: replace with the real scope of what you built and shipped
      "Lead the AI/ML function for a Swiss startup, owning model strategy and pipeline architecture.",
      "Manage and direct a multi-person team across model, data, and serving workstreams.",
    ],
    tags: ["Team lead", "LLM systems", "Product AI"],
  },
  {
    org: "University of Galway — Insight Centre",
    logo: "galway",
    role: "Research Intern",
    location: "Galway, Ireland (Remote)",
    period: "2026 – Present", // TODO: confirm dates
    type: "research",
    bullets: [
      "Research on multi-agent / decentralized AI under Prof. Saeed Hamood Alsamhi.", // TODO: confirm supervisor spelling
      "Applying agentic coordination to crop / agricultural management.",
    ],
    tags: ["Multi-agent", "Decentralized AI", "Agriculture"],
  },
  {
    org: "IIT Indore — SSL Lab",
    logo: "iit-indore",
    role: "Research Intern (STCLN)",
    location: "Indore, India (Remote)",
    period: "2025 – Present",
    type: "research",
    bullets: [
      "Extended STCLN for masked self-supervised learning on Sentinel-2 time-series, targeting label-scarce crop mapping.",
      "Redesigned encoder/decoder with multi-scale tokenizers, temporal cross-attention, and spectral gating.",
      "+8–12% F1-macro under 1–10% labelled regimes; analysed representations via CCA / t-SNE, logged with W&B.",
    ],
    tags: ["Self-supervised", "Remote sensing", "Sentinel-2"],
  },
  {
    org: "Samsung R&D",
    logo: "samsung",
    role: "Research Intern",
    location: "Bangalore, India",
    period: "Mar 2025 – Jan 2026",
    type: "research",
    bullets: [
      "Built a memory-augmented conversational system to resolve vague queries and cut clarification turns.",
      "Formalised ambiguity as relation reachability over story-level knowledge graphs from 1000 CoQA narratives.",
      "Designed a component-aware clarification algorithm with guaranteed convergence; released dataset + pipeline.",
    ],
    tags: ["Knowledge graphs", "Conversational AI", "CQG"],
  },
];

export const education = [
  { org: "IIT Madras", logo: "iit-madras", line: "BS · Data Science & Programming", period: "2027" },
  { org: "SRMIST", logo: "srmist", line: "B.Tech · Computer Science (CGPA 9.0)", period: "2027" },
];

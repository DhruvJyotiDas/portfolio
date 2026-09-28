export const zones = [
  { id: 'overview', label: 'Overview', hardware: 'EXTERIOR', number: '01' },
  { id: 'about', label: 'About', hardware: 'ARCHITECTURE', number: '02' },
  { id: 'experience', label: 'Experience', hardware: 'COMPUTE', number: '03' },
  { id: 'projects', label: 'Projects', hardware: 'WORKLOAD', number: '04' },
  { id: 'skills', label: 'Skills', hardware: 'CIRCUITRY', number: '05' },
  { id: 'certifications', label: 'Credentials', hardware: 'BACKPLATE', number: '06' },
  { id: 'contact', label: 'Contact', hardware: 'CONNECTION', number: '07' },
] as const
export type ZoneId = typeof zones[number]['id']
export type ProjectId = 'chat-x' | 'cet-vit' | 'compass' | 'xalign' | 'med-x' | 'proxy'
export interface ResearchRole {
  name: string
  title: string
  date: string
  specs: string[]
  tag: string
  resources?: { label: string; url: string; local?: boolean }[]
}
export interface Project {
  id: ProjectId
  name: string
  category: string
  subtitle: string
  problem: string
  approach: string
  highlights?: string[]
  metrics: { value: string; label: string; fraction: number }[]
  stack: string[]
  link?: { label: string; url: string }
  presentation?: { conference: string; acronym: string; location: string; status: string; certificate: string }
}
export const content = {
  name: 'Dhruv Jyoti Das',
  initials: 'DJD',
  title: 'CS + Data Science · ML Researcher · Systems Builder',
  location: 'Chennai, India',
  bio: 'Two degrees. One curiosity: how far can we push intelligent systems? I’m a computer science and data science student working at the intersection of machine learning research and real-world engineering.',
  bioDetail: 'From knowledge-grounded conversations at Samsung R&D to self-supervised satellite learning at IIT Indore and code security at SRM UROP, I build systems that turn research into something useful.',
  education: [
    { school: 'SRM Institute of Science and Technology', degree: 'B.Tech · Computer Science', detail: 'CGPA 9.0 / 10', year: '2027' },
    { school: 'IIT Madras', degree: 'BS · Data Science', detail: 'Dual-degree pathway', year: '2027' },
  ],
  roles: [
    { name: 'Samsung R&D', title: 'Research Intern', date: 'MAR 2025 — JAN 2026', specs: ['Built memory-augmented conversational AI and NER ensembles for knowledge-graph construction.', 'Designed graph-grounded ambiguity resolution and minimal clarifying-question generation.'], tag: 'CONVERSATIONAL AI', resources: [{ label: 'Samsung PRISM research PDF', url: 'SAMSUNG PRISM.pdf', local: true }, { label: 'KG-CoQA dataset', url: 'https://huggingface.co/datasets/vikash0132/KG-CoQA' }] },
    { name: 'IIT Indore', title: 'Research Intern', date: 'NOV 2025 — PRESENT', specs: ['Extended STCLN with masked self-supervised learning on Sentinel-2 time series.', 'Observed +8–12% F1-macro gains in low-label crop mapping with temporal cross-attention and spectral gating.'], tag: 'SELF-SUPERVISED LEARNING' },
    { name: 'Saeed Hamood Alsamhi', title: 'Research collaborator · NUIG, Galway, Ireland', date: 'ONGOING', specs: ['Working together on research.'], tag: 'INTERNATIONAL RESEARCH' },
    { name: 'SRM UROP', title: 'Research Intern', date: 'AUG 2025 — PRESENT', specs: ['Built recall-optimized C/C++ vulnerability detection with CodeBERT: 1.00 recall and 0.99 F1 on the reported evaluation.', 'Validated model behavior with LIME, attention maps, and adversarial robustness experiments.'], tag: 'AI FOR CODE SECURITY' },
  ] as ResearchRole[],
  skills: [
    { name: 'Languages', items: ['Java', 'C', 'Python', 'JavaScript'] },
    { name: 'Web & systems', items: ['HTML5', 'CSS3', 'Node.js', 'Express.js', 'React Native', 'WebSocket', 'REST APIs', 'WebRTC'] },
    { name: 'Data & ML', items: ['PyTorch', 'Vision Transformers', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn', 'Gabor filtering', 'ROCm'] },
    { name: 'AI & language', items: ['RAG pipelines', 'Multi-turn CQG', 'DeepSeek', 'Local LLMs', 'Prompt structuring', 'CodeBERT', 'QLoRA', 'SFT / DPO'] },
    { name: 'Infrastructure & research tools', items: ['MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'Render', 'Serveo', 'ngrok', 'Git / GitHub', 'Tableau', 'Weights & Biases', 'LIME', 'CCA / t-SNE'] },
  ],
  certifications: [
    { issuer: 'ORACLE', name: 'Java SE 11 Developer', detail: 'Certified Professional · February 2025', code: 'OCP / JAVA', file: 'ORACLE_JAVA_SE_11_eCertificate.pdf' },
    { issuer: 'ORACLE', name: 'OCI Data Science', detail: '2025 Certified Professional · August 2025', code: 'OCI / DS', file: 'CERTIFICATE - Oracle Cloud Infrastructure 2025 Certified Data Science Professional Certificate.pdf' },
    { issuer: 'SERVICENOW', name: 'Certified Application Developer', detail: 'CAD · May 2026', code: 'CAD / NOW', file: 'CAD ServiceNow Certificate.pdf' },
    { issuer: 'NPTEL', name: 'ML · Java · NLP · DBMS', detail: 'Technical certifications', code: 'NPTEL / CS' },
    { issuer: 'IIT MADRAS', name: 'Data Science & Programming', detail: 'Foundational level cleared', code: 'IITM / DS' },
  ],
  recommendations: [
    { name: 'Dr. Shibu N V', context: 'Samsung PRISM project mentor', file: 'LOR-Shibu-sir.pdf' },
    { name: 'Dr. Arulmurugan A', context: 'Faculty advisor', file: 'LOR-arulmurgan-sir.pdf' },
  ],
  contact: { email: 'dd4708@srmist.edu.in', phone: '+916370806401', github: 'https://github.com/DhruvJyotiDas', linkedin: 'https://www.linkedin.com/in/dhruv-jyoti-das-494739207/' },
  resumes: { general: 'DhruvJyotiDas_CV.pdf', research: 'DhruvJyotiDas_Research_CV.pdf' },
}
export const projects: Project[] = [
  {
    id: 'chat-x', name: 'Chat X', category: 'COMMUNICATION / SYSTEMS', subtitle: 'Messaging, meetings and AI in one place.',
    problem: 'Bring dependable messaging, group calls, scheduling and useful AI tools into one communication workspace.',
    approach: 'Built IB Connect with private and group chat, persistent history, LiveKit audio/video meetings, live captions and server-side AI features. The current repository documents a Go API, MariaDB, WebSocket delivery and TURN fallback.',
    metrics: [{ value: 'LIVE', label: 'Messaging and meetings', fraction: 1 }],
    stack: ['React', 'Go', 'MariaDB', 'WebSocket', 'LiveKit'],
    link: { label: 'View Chat X repository', url: 'https://github.com/DhruvJyotiDas/Chat-X' },
  },
  {
    id: 'cet-vit', name: 'CET-ViT', category: 'VISION / RESEARCH', subtitle: 'A different way to see the bigger picture.',
    problem: 'Discover meaningful macro-regions in images without segmentation supervision, while avoiding collapsed or over-diffused token assignments.',
    approach: 'Designed V-CEO, a sparse effective-information-guided token assignment module. A two-term EI loss balances an entropy floor and reversibility ceiling. Trained from scratch on AMD MI300X with dynamic K estimation via Gumbel-Softmax.',
    metrics: [{ value: '76.54%', label: 'CIFAR-100 accuracy', fraction: .7654 }, { value: '11,433', label: 'Images / second', fraction: .9 }, { value: '0.1%', label: 'Parameter overhead', fraction: .01 }],
    stack: ['PyTorch', 'ROCm', 'AMD MI300X', 'Vision Transformer'],
    link: { label: 'Explore model', url: 'https://huggingface.co/Dhruv1000/cet-vit-v4-cifar100' },
    presentation: { conference: 'International Conference on Statistical Learning, Data Science & Generative AI', acronym: 'ICSL-DSGA 2026', location: 'Sunway University, Malaysia', status: 'Accepted and presented · IEEE technically co-sponsored conference', certificate: 'Dhruv Jyoti Das-1.pdf' },
  },
  {
    id: 'compass', name: 'Compass', category: 'AI / CUSTOMER ENGAGEMENT', subtitle: 'An AI growth marketer inside a real CRM.',
    problem: 'Give teams a single place to manage customer relationships and build campaigns, whether they work manually or describe a goal to an AI assistant.',
    approach: 'Built a streaming Growth Assistant, customer intelligence cards, AI-assisted segments compiled to parameterized SQL, and editable campaign artifacts that require approval before launch. A server-side token allow-list personalizes messages; communication status and citation-checked analytics close the loop.',
    highlights: ['Growth Assistant routes requests to customer lookup, profile drafting, message history, customer creation or a campaign proposal.', 'Customer Intelligence combines an RFM-based engagement score with churn risk, lifetime value and next-best-action suggestions.', 'AI Segment Builder compiles proposed filters to parameterized SQL and explains why each customer matched.', 'Campaigns remain editable, require approval before launch, and personalize copy server-side from an allowed token set.', 'Communications monitoring, a conversion funnel and citation-checked AI insights connect results to the next campaign.'],
    metrics: [{ value: '0–100', label: 'Engagement scoring', fraction: 1 }, { value: 'SSE', label: 'Streaming assistant', fraction: .7 }],
    stack: ['React', 'Python', 'PostgreSQL', 'SSE', 'LLM orchestration'],
    link: { label: 'View Compass repository', url: 'https://github.com/DhruvJyotiDas/Compass' },
  },
  {
    id: 'xalign', name: 'XAlign', category: 'LLM / ALIGNMENT', subtitle: 'Alignment that speaks your language.',
    problem: 'Improve Hindi instruction following, context retention, and safety in open-weight language models affected by cross-lingual degradation.',
    approach: 'Assembled a 14K-sample Hindi instruction dataset. Applied QLoRA supervised fine-tuning to 7B/13B models, followed by direct preference optimization, and evaluated with an internal Hindi-focused harness.',
    metrics: [{ value: '+27%', label: 'Preference score', fraction: .27 }, { value: '−38%', label: 'Unsafe compliance', fraction: .38 }, { value: '14K', label: 'Instruction samples', fraction: .7 }],
    stack: ['QLoRA', 'SFT', 'DPO', 'Transformers'],
  },
  {
    id: 'med-x', name: 'Med-X', category: 'AI / DIGITAL HEALTH', subtitle: 'MediSpace: clearer medical records for patients and doctors.',
    problem: 'Medical records are fragmented and difficult for patients to understand or for clinicians to review quickly.',
    approach: 'MediSpace organizes reports and appointments into patient and doctor portals, with consent-based access and Google Gemini summaries. The project describes domain-specific MedGemma fine-tuning and an NGINX HTTPS inference endpoint. Its repository provides the implementation details.',
    highlights: ['Patient portal organizes reports by specialty and summarizes selected documents with Google Gemini.', 'Doctor portal presents appointments and patient records through consent-based access.', 'The project repository describes MedGemma fine-tuning on domain-specific data.', 'Its deployment description places the inference service behind NGINX on HTTPS port 443.'],
    metrics: [{ value: '2', label: 'Patient and doctor portals', fraction: .5 }, { value: 'HTTPS', label: 'Inference endpoint', fraction: .8 }],
    stack: ['MedGemma', 'Google Gemini', 'NGINX', 'HTTPS', 'Medical report workflows'],
    link: { label: 'View Med-X repository', url: 'https://github.com/DhruvJyotiDas/Med-X' },
  },
  {
    id: 'proxy', name: 'TLS-Mimicking Proxy', category: 'NETWORKS / RESEARCH', subtitle: 'Engineering around network boundaries.',
    problem: 'Study censorship-resistant transport and connectivity under restrictive campus network conditions.',
    approach: 'Deployed Trojan over TLS/443 on Oracle VPS with Let’s Encrypt certificates. Configured SOCKS5 transport, ingress rules, and Linux routing; documented TCP connectivity alongside UDP and QUIC limitations.',
    metrics: [{ value: 'TLS / 443', label: 'Transport protocol', fraction: 1 }],
    stack: ['Linux', 'TLS', 'Trojan', 'Oracle VPS'],
    link: { label: 'View repository', url: 'https://github.com/DhruvJyotiDas/TLS-MIMICKING-TROJAN-PROXY' },
  },
]

// Single source of truth for all portfolio content (mirrors the CV).
// Edit here — every section, the JSON-LD and the meta tags read from this file.

export const site = {
  url: 'https://abdula-adil.vercel.app',
  title: 'Abdula Adil — AI Engineer in Abu Dhabi | LLM · Voice AI · Computer Vision',
  description:
    'Abdula Adil — AI Engineer in Abu Dhabi, UAE. Builds LLM systems, voice AI, P&ID-to-3D computer vision and full-stack .NET, Python & React Native apps.',
  ogImage: '/og-image.png',
  cv: '/Abdula_Adil_CV.pdf',
  // Search-engine ownership tokens. Paste only the `content` value of the meta tag each console gives you.
  // Google: search.google.com/search-console → Add property → URL prefix → "HTML tag".
  // Bing:   bing.com/webmasters → Add site → "HTML Meta Tag" (or import straight from Google Search Console).
  verification: {
    google: '',
    bing: '',
  },
};

export const person = {
  name: 'Abdula Adil',
  first: 'Abdula',
  last: 'Adil',
  role: 'AI Engineer',
  specialties: ['LLM', 'Voice AI', 'Computer Vision'],
  stack: 'Full Stack (.NET · Python · React Native)',
  location: 'Abu Dhabi, UAE',
  timezone: 'Asia/Dubai',
  email: 'adduadil38@gmail.com',
  linkedin: 'https://www.linkedin.com/in/abdulaadil',
  linkedinLabel: 'linkedin.com/in/abdulaadil',
  // Spellings people may type. Fed to JSON-LD `alternateName` so search engines tie them to this person.
  alternateNames: ['Abdulla Adil', 'Abdullah Adil', 'Abdul Adil', 'Adil Abdula'],
  // Every public profile that is yours (GitHub, Medium, dev.to, X, Kaggle, Hugging Face...).
  // These become JSON-LD `sameAs` — the strongest signal for tying your name to this site. LinkedIn is required.
  profiles: [
    'https://www.linkedin.com/in/abdulaadil',
  ],
  facts: [
    'UAE Employment Visa',
    '30-day notice',
    'MoHESR-recognized degree',
    'UAE Driving License',
    'Open to relocate',
  ],
  languages: ['English (Professional)', 'Malayalam (Native)'],
  strengths: [
    'Problem solving & debugging',
    'System architecture',
    'Technical documentation',
    'Client training & communication',
    'Applied AI research',
  ],
};

export const summary =
  'AI Engineer building LLM-powered enterprise systems for the industrial and asset-integrity sector. Leading AI features on VAIL-Plant — real-time voice chat with the AI assistant and an AI-vision pipeline that converts P&ID drawings into 3D models — while serving as the sole engineer building AI capabilities for the VAIL ERP platform.';

export const stats = [
  { value: 3, prefix: '', suffix: '×', label: 'Employee of the Month', note: 'Sep 2025 · Feb 2026 · May 2026' },
  { value: 35, prefix: '<', suffix: 'ms', label: 'Safety decision latency', note: 'Laya edge AI, in simulation' },
  { value: 1, prefix: '', suffix: '', label: 'Sole AI engineer', note: 'on a full-scale ERP platform' },
  { value: 3, prefix: '', suffix: '-day', label: 'Onsite client training', note: 'Sonatrach · Algeria' },
];

export const capabilities = [
  {
    id: 'llm',
    title: 'LLM Integration',
    blurb:
      'Natural-language access to enterprise data — NL→SQL and RAG-style retrieval over SQL Server, conversational assistants, and inference tuned for real workloads.',
    tags: ['Ollama', 'Semantic Kernel', 'vLLM', 'RAG', 'NL→SQL', 'Prompt engineering', 'Fine-tuning'],
  },
  {
    id: 'voice',
    title: 'Voice AI',
    blurb:
      'Hands-free assistants field engineers can talk to: Whisper speech-to-text in, Kokoro text-to-speech out, on web and mobile.',
    tags: ['Whisper', 'Kokoro', 'Speech-to-text', 'Text-to-speech', 'React Native'],
  },
  {
    id: 'vision',
    title: 'Computer Vision',
    blurb:
      'AI-vision interpretation of engineering drawings (P&ID) with Python post-processing for accuracy — turning 2D drawings into 3D models.',
    tags: ['Vision models', 'P&ID', 'Python', '2D → 3D'],
  },
  {
    id: 'micro',
    title: 'AI Microservices',
    blurb:
      'Python FastAPI services for inference, retrieval and model serving — async, Pydantic-validated, Dockerized and integrated with ASP.NET Core over REST.',
    tags: ['FastAPI', 'Pydantic', 'Docker', 'REST', 'ASP.NET Core'],
  },
  {
    id: 'agentic',
    title: 'Agentic Engineering',
    blurb:
      'Daily, disciplined AI-accelerated delivery with Claude Code — custom reusable agent skills, context and token optimization, secure configurations.',
    tags: ['Claude Code', 'Agent skills', 'Context optimization', 'Prompt engineering'],
  },
  {
    id: 'edge',
    title: 'Edge & Industrial AI',
    blurb:
      'Offline, on-premise inference for low-connectivity sites — low-latency small-model classification with System 1 / System 2 routing over SCADA.',
    tags: ['Offline inference', 'Small models', 'Modbus', 'OPC UA', 'SCADA'],
  },
];

export const projects = [
  {
    id: 'plant',
    index: '01',
    kicker: 'Current focus · Enterprise AI assistant & mobile app',
    title: 'VAIL-Plant',
    lede: 'An AI assistant field engineers can talk to — and that can read their drawings.',
    bullets: [
      'Integrated real-time <b>voice chat</b> — <b>Whisper</b> speech-to-text and <b>Kokoro</b> text-to-speech — so engineers ask about plant data and hear answers hands-free.',
      'Built an <b>AI-vision pipeline that converts P&amp;ID drawings into 3D models</b>, combining vision-model extraction with Python post-processing to improve accuracy.',
      'Developed the <b>mobile app end-to-end</b> in React Native CLI — asset inspection, maintenance planning, risk assessment and reporting.',
      'Co-developed the AI backend: <b>Ollama + Semantic Kernel</b> for natural-language querying, <b>vLLM</b> for throughput, conversational front-ends in Angular and React Native.',
    ],
    tags: ['React Native CLI', 'Angular', 'ASP.NET Core', 'FastAPI', 'Whisper', 'Kokoro', 'Ollama', 'vLLM'],
    demo: 'voice',
  },
  {
    id: 'pid',
    index: '02',
    kicker: 'VAIL-Plant · Computer vision',
    title: 'P&ID → 3D',
    lede: 'Engineering drawings in, navigable 3D plant models out.',
    bullets: [
      'Vision-model extraction of equipment, lines and instruments from piping &amp; instrumentation diagrams.',
      '<b>Python post-processing</b> to clean up detections and improve accuracy before geometry is generated.',
      'Generates a <b>3D model</b> from the 2D drawing — turning static documents into something engineers can explore.',
    ],
    tags: ['Vision models', 'Python', 'FastAPI', 'P&ID', '3D generation'],
    demo: 'pid',
  },
  {
    id: 'erp',
    index: '03',
    kicker: 'Solo · AI development',
    title: 'VAIL ERP — AI',
    lede: 'Ask the ERP a question in plain English. Get the answer from live data.',
    bullets: [
      '<b>Sole engineer</b> designing and building AI capabilities from scratch for a full-scale ERP — Inventory, Sales, HR, Finance — owning architecture through delivery.',
      'Built <b>Python FastAPI microservices</b> for LLM inference, retrieval and NL querying, Dockerized and integrated with ASP.NET Core over REST so AI scales independently.',
      'Applied <b>Clean Architecture with CQRS + MediatR</b> for transactional .NET modules and lightweight FastAPI services for Python-native AI.',
    ],
    tags: ['ASP.NET Core', 'Python FastAPI', 'SQL Server', 'Ollama', 'Semantic Kernel', 'CQRS'],
    demo: 'sql',
  },
  {
    id: 'aips',
    index: '04',
    kicker: 'Process safety',
    title: 'VAIL-AIPS',
    lede: 'Process-safety software where the stakes are physical.',
    bullets: [
      'Delivered <b>process-safety modules</b> — hazard management, compliance tracking, dashboards and risk tracking.',
      'Optimized <b>SQL Server</b> queries to cut response times; supported production deployments and cross-stack debugging.',
    ],
    tags: ['React Native CLI', 'ASP.NET Core', 'MySQL', 'SQL Server'],
    demo: 'risk',
  },
];

export const experience = [
  {
    role: 'Software Developer — AI & Full Stack',
    org: 'Velosi Asset Integrity Ltd',
    when: 'Jan 2025 — Present',
    where: 'Abu Dhabi, UAE',
    current: true,
    points: [
      'Leading AI features on <b>VAIL-Plant</b>: Whisper + Kokoro voice chat and the P&amp;ID → 3D vision pipeline.',
      '<b>Sole engineer</b> building AI capabilities for the <b>VAIL ERP</b> platform, architecture through delivery.',
      'Python <b>FastAPI</b> AI microservices (Ollama, Semantic Kernel, vLLM) integrated with ASP.NET Core.',
      '<b>International client delivery — Sonatrach, Algeria:</b> ran a 3-day onsite hands-on training program for engineering teams.',
      'Accelerated delivery with <b>agentic AI workflows</b> — Claude Code, custom agent skills, context/token optimization.',
      '<b>Employee of the Month ×3</b> — Sep 2025, Feb 2026, May 2026.',
    ],
  },
  {
    role: 'Web Development Intern',
    org: 'Almasat Information Technology',
    when: 'Feb 2024 — Apr 2024',
    where: 'Dubai · Remote',
    points: ['Developed and optimized web content platforms, improving SEO performance and search visibility across client web properties.'],
  },
  {
    role: 'Vulnerability Analyst Intern',
    org: 'Red Team Hackers',
    when: 'Aug 2023 — Sep 2023',
    where: 'Kochi, India',
    points: ['Conducted a full penetration test (DC-1) and delivered a structured vulnerability report with remediation recommendations.'],
  },
];

export const skills = [
  { group: 'AI & LLM', items: ['Ollama', 'Semantic Kernel', 'vLLM', 'RAG', 'NL→SQL', 'Whisper', 'Kokoro', 'Vision models', 'Prompt engineering', 'Fine-tuning', 'Claude Code'] },
  { group: 'Backend', items: ['ASP.NET Core Web API', 'C#', 'Python', 'FastAPI', 'PHP / Laravel', 'EF Core', 'CQRS + MediatR', 'Clean Architecture', 'SignalR', 'JWT', 'REST', 'Microservices'] },
  { group: 'Frontend & Mobile', items: ['React Native (CLI & Expo)', 'React + Vite', 'Angular', 'Astro', 'TypeScript', 'JavaScript (ES6+)', 'Redux', 'Zustand', 'MobX'] },
  { group: 'Data & BI', items: ['SQL Server (query tuning)', 'MySQL', 'Firebase', 'Power BI'] },
  { group: 'Cloud & DevOps', items: ['Docker', 'Git', 'GitHub', 'Azure (fundamentals)', 'Vercel', 'Production deployments'] },
  { group: 'Security & Practice', items: ['OWASP Top 10', 'Secure coding', 'VAPT fundamentals', 'Agile / Scrum'] },
];

export const education = {
  degree: 'Bachelor of Engineering, Computer Science',
  school: 'P.A. College of Engineering, Mangalore (VTU), India',
  year: '2024',
  minors: 'Minors: Software Design, Networking',
  recognition: 'Recognized by the UAE Ministry of Higher Education and Scientific Research (MoHESR)',
  certs: ['ASP.NET Core 8 Web API — Clean Architecture + Azure Services (Udemy)', 'Pre-Security Learning Path (TryHackMe)'],
};

export const marquee = [
  'Ollama', 'Semantic Kernel', 'vLLM', 'Whisper', 'Kokoro', 'FastAPI', 'ASP.NET Core', 'React Native',
  'Angular', 'SQL Server', 'Docker', 'Claude Code', 'RAG', 'NL→SQL', 'OPC UA', 'Modbus', 'TypeScript', 'Python', 'C#',
];

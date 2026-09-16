export interface PMVariable {
  id: string;
  label: string;
  value: string;
  options: string[];
}

export interface PainPoint {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  javaContext: string;
  challenges: string[];
  solutions: string[];
  pmMetric: string;
}

export const PERSONA_STAGES = [
  { id: 'senior', label: 'Senior Product Manager', years: '5-8' },
  { id: 'principal', label: 'Principal Product Manager', years: '8-12' },
  { id: 'director', label: 'Director of AI Product Management', years: '12+' }
];

export const TECH_STACKS = [
  { id: 'spring_boot', label: 'Spring Boot & Microservices', desc: 'Standard cloud-native JVM architectures' },
  { id: 'legacy_ee', label: 'Jakarta EE / Legacy Monoliths', desc: 'Heavy legacy codebases with Oracle DB & WebSphere' },
  { id: 'reactive_java', label: 'Reactive Java (Project Reactor/Vert.x)', desc: 'High-throughput, event-driven reactive pipelines' }
];

export const DOMAINS = [
  { id: 'fintech', label: 'Fintech & Banking', requirements: 'Strict compliance, audit logs, low-latency transaction validation' },
  { id: 'healthcare', label: 'Healthcare & HIPAA', requirements: 'PHI data masking, high precision medical terminology RAG' },
  { id: 'saas', label: 'High-Scale B2B SaaS', requirements: 'Multi-tanent isolation, dynamic resource allocation, API rate limiting' }
];

export const AI_OBJECTIVES = [
  { id: 'copilot', label: 'Agentic Workflows & Copilots', desc: 'Auto-completing workflow tasks or developer enablement' },
  { id: 'rag', label: 'Enterprise RAG (Retrieval-Augmented Gen)', desc: 'Bridging relational databases with Vector Indices' },
  { id: 'modernization', label: 'Legacy Java to LLM Automation', desc: 'Refactoring 10-year-old Spring classes into modern Python/Java APIs' }
];

export const CORE_PAIN_POINTS: PainPoint[] = [
  {
    id: 'runtime_perf',
    title: 'JVM Memory Footprint & GPU-CPU Colocation Latency',
    shortTitle: 'Performance & Colocation',
    icon: 'Cpu',
    javaContext: 'Java Virtual Machine (JVM) memory models (Java Heap, Metaspace) are highly optimized for CPU-bound high-concurrency threads. Deep learning models reside in GPU memory (CUDA) with highly specialized C++ libraries (PyTorch/TensorFlow).',
    challenges: [
      'JNI (Java Native Interface) overhead: High latency penalty when crossing the boundary between JVM and native C++ inference libs.',
      'Memory Overhead: Double buffering when passing heavy tensors from JVM heap to native system memory.',
      'JVM Garbage Collection (GC) pauses stalling real-time streaming LLM tokens, creating high jitter in time-to-first-token (TTFT).'
    ],
    solutions: [
      'Deploy separate, lightweight Python-based sidecar microservices for model hosting, communicating over high-speed gRPC/Protobuf instead of client JNI calls.',
      'Adopt Spring AI or LangChain4j using web-client interfaces with non-blocking reactive models (Spring WebFlux) to decouple heavy JVM threads from slow LLM streaming raw sockets.',
      'Transition to GraalVM Native Image to minimize memory consumption and slash startup delays in serverless host configurations.'
    ],
    pmMetric: 'Time to First Token (TTFT) < 150ms; Memory utilization reduction by 40% using GraalVM compiles.'
  },
  {
    id: 'legacy_modernization',
    title: 'Legacy Java EE Refactoring & Enterprise Data Pipeline Integrations',
    shortTitle: 'Legacy Modernization',
    icon: 'RefreshCw',
    javaContext: 'Many US Enterprises depend on massive SOAP/REST XML Java 8 codebases, Hibernate/JPA object mapping, and stored procedures across multi-decade legacy databases.',
    challenges: [
      'LLMs lack deep semantic context for proprietary, 15-year-old enterprise Java frameworks, leading to high hallucinations during code refactoring.',
      'Fragmented Data: Critical corporate knowledge is locked inside Oracle / IBM DB2 relational databases or PDF repositories without pre-existing vector embeddings.',
      'Tight Coupling: Monolithic classes contain mixed business logic, SQL commands, and XML representations, making modular RAG mapping hard.'
    ],
    solutions: [
      'Launch a semantic metadata injection engine: Expose enterprise Java business rules into intermediate JSON/YAML schemas for the LLM before prompting.',
      'Use LangChain4j Document Ingestors with Spring Batch-driven pipelines to continuously synchronize relational changes into Vector Databases (e.g., Milvus, Pinecone, pgvector).',
      'Create small-scope agentic adapters that read database schemas via JDBC and parse them into standard JSON schemas, decoupling core service classes.'
    ],
    pmMetric: 'Refactoring velocity increment: +65%; XML-to-JSON automated migration precision: 94.2%.'
  },
  {
    id: 'security_compliance',
    title: 'Enterprise Safety, SOC2/GDPR Compliance & Private Tenant RAG Isolation',
    shortTitle: 'Security & Compliance',
    icon: 'ShieldAlert',
    javaContext: 'Java enterprise environments operate under strict multi-tenant context delegation models (such as Spring Security, JAAS) enforcing strict data boundaries.',
    challenges: [
      'Data Leakage: Proprietary enterprise inputs from tenant A leaking into shared parameters or open-source foundation model fine-tuning caches.',
      'Audit Compliance: Strict mandates for auditable access trails, data retention, and explainable AI decisions which raw APIs lack.',
      'Prompt Injection: Dynamic API calls driven by agentic frameworks opening new SQL Injection style attack vectors in Legacy Java query layers.'
    ],
    solutions: [
      'Enforce Semantic Firewalls: Intercept incoming JVM prompt requests to detect and redact Personally Identifiable Information (PII) using local Regex/Palo Alto models before API egress.',
      'Implement Vector Store metadata filtering: Bind user JWT security tokens directly to pgvector queries using Spring Security context, ensuring strict row-access limits.',
      'Adhere to the Guardrails pattern: Introduce strict LLM-response schemas with standard JSON schema validation models (like Jackson Parser) before saving content to DB.'
    ],
    pmMetric: 'Zero PII data leakages across external APIs; 100% compliance alignment score with SOC2 Type II.'
  },
  {
    id: 'ecosystem_gap',
    title: 'The Python-to-Java Ecosystem Bridge & LangChain4j Adoption Jitter',
    shortTitle: 'Ecosystem Bridge',
    icon: 'GitBranch',
    javaContext: 'The entire modern AI innovation velocity (HuggingFace, LangChain, LlamaIndex, vLLM, LangGraph) is heavily Python-driven, causing lag in JVM-ecosystem maturity.',
    challenges: [
      'The "Ecosystem Gap": Java developers struggle with a lack of native SDKs for emerging local model routers and embedding frameworks.',
      'Developer Friction: Refactoring Java architecture teams to think in probabilistic agent loops rather than deterministic Java object-oriented design patterns.',
      'Heavy Spring Framework updates and dependency lock-in blocking migration toward modern reactive microservices.'
    ],
    solutions: [
      'Standardize on LangChain4j: A robust, active framework matching LangChain parity specifically tailored for standard Spring Boot configurations and Java types.',
      'Move core intelligence to centralized Gateway orchestration proxies (e.g. Kong, Apigee, Custom Node services) to abstract LLM model management.',
      'Provide pre-configured Spring Boot Starter packages with enterprise templates for model logging, rate-limiting, and standard fallback patterns.'
    ],
    pmMetric: 'Onboarding time for traditional Java devs to AI feature release down from 4 weeks to 5 days.'
  },
  {
    id: 'cost_orchestration',
    title: 'Token Cost Optimization, Multi-Model Routing, & LLM Failovers',
    shortTitle: 'Cost & Failovers',
    icon: 'DollarSign',
    javaContext: 'Java transaction handling (JTA, ACID transactions) is built on absolute reliability. If external LLMs or third-party APIs experience downtime or high-cost spikes, JVM-driven platforms risk transactional failures.',
    challenges: [
      'High Cost Overhead: Sending multi-megabyte context payloads inside repetitive user requests is economically unsustainable.',
      'Single Point of Failure: Relying on a single API model vendor can lead to complete service denial if their rate limits or servers spike.',
      'Inefficient LLM Utilization: Utilizing high-cost models (e.g. Gemini Pro / GPT-4) for trivial classification tasks that can run on tiny local models.'
    ],
    solutions: [
      'Build a JVM Smart Semantic Cache: Store common input embeddings in Redis/Valkey cache and handle identical/extremely close intent requests locally in 5ms without query egress.',
      'Deploy Dynamic Model Routers: Build Java routing logic inside Spring WebClient that directs easy queries to local 8B models (e.g. Gemma 2) and escalates complex queries to frontier models (e.g. Gemini Pro).',
      'Leverage Spring Retry & Resilience4j for robust circuit-breakers, rate limiters, and automated fallback routes on secondary model clouds.'
    ],
    pmMetric: 'Aggregated monthly cloud API savings of 35-50%; API reliability assurance up to 99.99% SLA.'
  }
];

export function buildPrompt(
  seniorityLabel: string,
  techStackLabel: string,
  domainLabel: string,
  objectiveLabel: string,
  customNotes: string
): string {
  return `你现在扮演一名**硅谷最顶尖的高级人工智能产品经理（Senior/Principal AI Product Manager）**。你深谙企业级软件架构、AI技术栈，特别是传统企业在迈向 AI 转型（AI Transformation & Modernization）时遭遇的核心痛点与商业决策路径。

当前，美国众多中大型企业正在加速 AI 落地，其中绝大多数企业拥有庞大、复杂的 **${techStackLabel}** 遗留系统。你在负责推进这一类技术栈企业的 AI 升级，主要面向 **${domainLabel}** 行业，当前的最核心业务升级目标是 **${objectiveLabel}**。

请对当前环境下，这类企业在 AI 转型过程中**最想解决、最迫切解决的核心问题**进行深度剖析。

---

### 请执行以下深入调研与分析任务：

1. **核心痛点诊断 (Core Painpoints & Bottlenecks):**
   - 深入分析将现代 AI/LLM 模型集成进现有的 ${techStackLabel} 架构时，面临的底层矛盾有哪些？
   - 重点从「JVM 线程/内存模型与 GPU/C++ 底层计算对齐」、「传统关系型数据库（JDBC/Hibernate）与向量数据库（Vector RAG）的异步数据链路同步」以及「Legacy 遗留系统代码库的重构速度」三个维度，指出最痛的3个技术与产品分水岭。

2. **商业与合规决策痛点 (Enterprise Governance & Compliance):**
   - 在 **${domainLabel}** 这一特定行业下，企业最想解决的数据安全与合规挑战是什么？（如数据隔离机制、防止敏感代码及PII数据流向公有云、以及多租户隔离 RAG 架构设计）。

3. **硅谷先进实践解法 (Silicon Valley Best Practice Framework):**
   - 针对上述痛点，硅谷当下最主流、高层认可度最高的架构解法是什么？（如 sidecar 微服务设计、Spring AI/LangChain4j 整合决策、GraalVM 原生映像编译优化、大模型网关 API Gateway 等）。
   - 每一个解法请写出对应的核心实施策略。

4. **落地成功度量指标 (PM North Star Metrics):**
   - 作为产品负责人，你用来评估该 AI 转型项目是否成功的最关键 4 个度量指标（包括延迟 TTFT、准确率、成本降幅、研发组织效能提升等），请给出具体的量化标准。

---

${customNotes ? `### 补充场景备注 (Custom Context Notes):\n${customNotes}\n\n---` : ''}

### 输出格式要求 (Strict Formatting Guidelines):
- **专业、切中要害、杜绝虚话：** 使用硅谷高级 Product Manager 和 Tech Lead 水准的行业术语（例如 GraalVM, JVM overhead, TCO, TTFT, RAG context stuffing, Data lineage, Sidecar proxy, Multi-tenant tenant-isolation ）。
- **中英文混合阅读体验：** 保持硅谷日常工作中对前沿技术词汇和管理架构缩写的英文原文保留，内容主要用中文进行深度多级排版输出。
- **条理极其清晰：** 采用极其适合大模型阅读与高管演示的高度结构化 Markdown，配合精细的 bullet points 形式，层层递进。`;
}

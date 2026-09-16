export interface ScenarioQA {
  id: string;
  question: string;
  shortLabel: string;
  pmAnalysis: string;
  architectureSchema: string[];
  techCodeTitle: string;
  techCode: string;
}

export const PM_SCENARIOS: ScenarioQA[] = [
  {
    id: 'spring_streaming',
    question: 'How do we resolve Spring Boot thread exhaustion and high TTFT when streaming heavy API tokens under massive concurrent user load?',
    shortLabel: 'Thread Exhaustion & Streaming',
    pmAnalysis: `From a Product and Tech Lead perspective, standard Servlet engines (like Tomcat default of 200 worker threads) lock up threads during I/O block, which is catastrophic when waiting for slow LLM tokens.

Our PM Architecture Strategy:
1. **Pivoting to Non-blocking Reactive Streams**: Stop allocating one JVM Tomcat thread per remote HTTP connection. Move to Netty or Spring WebFlux.
2. **Decoupling Response Logic**: Stream tokens asynchronously via Server-Sent Events (SSE) directly to the browser.
3. **Context Allocation Tuning**: Pre-fetch or compress user request history on client-side before sending to system layers.`,
    architectureSchema: [
      'Client Browser (EventSource) <--> Netty Server (VPC WebClient)',
      'WebFlux Thread Pool (Non-blocking) <--> SSE Stream',
      'Remote Model API (e.g. Gemini) streaming fragments without blocking Heap allocations'
    ],
    techCodeTitle: 'Reactive Non-Blocking Controller with Spring WebFlux & LangChain4j',
    techCode: `import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import reactor.core.publisher.Flux;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;

@RestController
@RequestMapping("/api/ai")
public class ReactiveChatController {

    private final StreamingChatLanguageModel chatModel;

    public ReactiveChatController(StreamingChatLanguageModel chatModel) {
        this.chatModel = chatModel;
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamAiResponse(@RequestBody ChatRequest request) {
        // Leverages Reactive Project Reactor under Netty
        // No Tomcat worker thread is occupied while waiting for the LLM API to stream tokens!
        return Flux.create(sink -> {
            chatModel.generate(request.getMessage(), new StreamingResponseHandler<AiMessage>() {
                @Override
                public void onNext(String token) {
                    sink.next(token);
                }

                @Override
                public void onComplete(Response<AiMessage> response) {
                    sink.complete();
                }

                @Override
                public void onError(Throwable error) {
                    sink.error(error);
                }
            });
        });
    }
}`
  },
  {
    id: 'hibernate_vector_sync',
    question: 'How do we continuously synchronize our legacy Hibernate JPA relational schemas into our vector databases/RAG systems without causing DB lockups or transaction delays?',
    shortLabel: 'RAG Relational Database Sync',
    pmAnalysis: `Enterprise platforms frequently trigger massive database transactions and batch operations. Forcing synchronous embedding generations inside transaction blocks during save/update hooks kills DB performance and triggers lockups.

Our PM Architecture Strategy:
1. **Applying outbox pattern or Async Event Broker**: Decouple the transactional save from embedding vector computations.
2. **Buffer with Spring Events / Spring Batch**: Leverage Spring Application Events or Apache Kafka for reliable asynchronous delivery.
3. **Batch Vector Upserting**: Instead of hitting vector APIs (like pgvector or Pinecone) row-by-row, buffer and execute bulk updates.`,
    architectureSchema: [
      'Hibernate Entity Saved (Database Transaction Complete)',
      'Spring Event Publisher (TransactionalEventListener) sends record ID',
      'ThreadPool Executor fetches record, requests embedding from Gemini, and updates VectorDB concurrently'
    ],
    techCodeTitle: 'Asynchronous Relational Model to Vector Store Publisher with Spring Events',
    techCode: `@Component
public class AsyncDocumentVectorEngine {

    private final EmbeddingModel embeddingModel;
    private final VectorStore vectorStore; // e.g. LangChain4j PgVectorStore
    
    @Async("vectorThreadPool") // Executed on separate, non-blocking ThreadPool
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleDocumentCreatedEvent(DocumentCreatedEvent event) {
        Document doc = event.getDocument();
        
        // Assemble the semantic chunk for embedding
        String semanticChunk = String.format("Title: %s | Content: %s | Author: %s", 
            doc.getTitle(), doc.getContent(), doc.getAuthor());
            
        // Calculate the vector embedding asynchronously
        Response<Embedding> embeddingResponse = embeddingModel.embed(semanticChunk);
        
        // Save to Vector Database with metadata filters
        vectorStore.add(new VectorItem(
            doc.getId().toString(), 
            embeddingResponse.content(), 
            Map.of("tenantId", doc.getTenantId(), "category", doc.getCategory())
        ));
    }
}`
  },
  {
    id: 'private_security_guardrails',
    question: 'How do we design a bulletproof Java tenant-isolation container and redact strict PII data from client payloads before sending prompts to external APIs?',
    shortLabel: 'Enterprise Compliance & Guardrails',
    pmAnalysis: `For Fintech & Healthcare apps, leaking private files, PII, or PHI data to external model clouds is a critical SOC2 compliance failure.

Our PM Architecture Strategy:
1. **Zero-Trust Input Interceptor (Semantic Firewall)**: Implement pre-processing interceptors in Spring Gateway or Jakarta Security context.
2. **Deterministic Redaction Engine**: Use rapid, parallel Aho-Corasick or native regex engines in the JVM to mask names, numbers, or credit cards.
3. **Response Validation Guardrails**: Ensure the returned JSON strictly obeys output models to block injection schemas before entering internal systems.`,
    architectureSchema: [
      'User Prompt Input --> Spring MVC HandlerInterceptor',
      'Aho-Corasick Regex Redactor masks PII (e.g., Jane Doe -> [REDACTED_NAME])',
      'Sanitized Prompt sent to LLM --> JSON Output verified by Jackson Model Parser'
    ],
    techCodeTitle: 'Enterprise Guardrail Interceptor & Jackson Validation Schema',
    techCode: `@Component
public class SecurityGuardrailInterceptor implements HandlerInterceptor {

    private final PiiRedactorService redactorService;

    public SecurityGuardrailInterceptor(PiiRedactorService redactorService) {
        this.redactorService = redactorService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Intercept raw payload before sending to LLM API
        String rawPrompt = request.getParameter("prompt");
        if (rawPrompt != null) {
            String sanitized = redactorService.redactPii(rawPrompt);
            request.setAttribute("sanitizedPrompt", sanitized);
            // Example: "My medical ID is 1293-AB" becomes "My medical ID is [REDACTED_ID]"
        }
        return true;
    }
}

// Ensure Response adheres to strict JSON mapping pattern to prevent Injection Execution
public class GuardrailResponseValidator {
    private final ObjectMapper mapper = new ObjectMapper();

    public AnalysisOutput validateAndParse(String llmOutputRaw) throws IOException {
        // Enforce strong schema schema types; discards unrequested root parameters or raw JS/HTML code injection
        return mapper.readValue(llmOutputRaw, AnalysisOutput.class);
    }
}`
  },
  {
    id: 'jvm_semantic_cache',
    question: 'How can we build a highly optimized JVM-centric semantic caching layer to bypass expensive LLM token calls for repeated intents?',
    shortLabel: 'JVM Semantic Caching',
    pmAnalysis: `Sending identical or semantically duplicate queries directly to third-party LLM providers violates both Latency SLA targets and Enterprise COGS (Cost of Goods Sold/Operations) budgets.

Our PM Architecture Strategy:
1. **Local Vector Comparison**: Use a lightning-fast local vector matching framework (such as LangChain4j embedding store or Caffeine Cache paired with local Pinecone indexes).
2. **Strict Cosine Similarity Thresholds**: Compare current user query embedding with historic stored queries. If distance < 0.08, serve Cached JSON Response in < 8ms!
3. **Automated Cache Invalidation**: Map cache invalidation to Hibernate entity state modifications to guarantee dynamic consistency.`,
    architectureSchema: [
      'User Prompt Vectorized locally in JVM (e.g., ONNX model)',
      'Lookup in Caffeine Cache or local Redis (Cosine similarity lookup)',
      'Match found: Return cached answer (8ms, $0 cost) | Match missed: Call Gemini ($0.015, 3s)'
    ],
    techCodeTitle: 'Spring Boot Semantic Cache Service featuring Caffeine Cache',
    techCode: `@Service
public class JvmSemanticCacheManager {

    private final EmbeddingModel embeddingModel;
    private final CaffeineCache cacheStore; // High-performance Java in-memory cache
    private final double similarityThreshold = 0.95; // 95% Intent correlation match

    public String getSemanticMatch(String currentPrompt) {
        float[] queryEmbedding = embeddingModel.embed(currentPrompt).content().vector();
        
        // Scan cache registry for similar intent vectors
        for (CacheItem item : cacheStore.getAllItems()) {
            double similarity = cosineSimilarity(queryEmbedding, item.getEmbedding());
            if (similarity >= similarityThreshold) {
                log.info("Semantic cache HIT! Bypassed API cost. Identity similarity: {}", similarity);
                return item.getCachedContent();
            }
        }
        return null; // Cache Miss, trigger remote Gemini inference pipeline
    }

    private double cosineSimilarity(float[] vectorA, float[] vectorB) {
        double dotProduct = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}`
  }
];

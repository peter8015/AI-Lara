import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Schema } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API client
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAI;
}

// Structured output JSON schema definition
const structuredResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description: 'The core conversational reply to the user message.'
    },
    sentiment: {
      type: Type.STRING,
      description: 'Sentiment of the discussion: POSITIVE, NEUTRAL, or CONSTRUCTIVE'
    },
    intent: {
      type: Type.STRING,
      description: 'Identified user intent, e.g. ARCHITECTURE_INQUIRY, CODE_GENERATION, TROUBLESHOOTING, GENERAL_QA'
    },
    keyPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key technical takeaways or actionable recommendations'
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score from 0.0 to 1.0'
    },
    suggestedFollowUps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Two to three concise suggested follow-up questions'
    }
  },
  required: ['reply', 'sentiment', 'intent', 'keyPoints', 'confidence', 'suggestedFollowUps']
};

// Fallback intelligent generator if GEMINI_API_KEY is not configured
function generateSimulatedResponse(prompt: string, structured: boolean) {
  const lower = prompt.toLowerCase();
  let replyText = `In a Spring Boot AI architecture, the service layer acts as the resilient mediator between the client and the LLM API.

Key components in Spring Boot:
1. **WebClient / RestClient**: Handles HTTP/SSE connections with non-blocking reactive pipelines.
2. **Resilience4j**: Configures Retry (@Retry) with exponential backoff and Timeouts (@TimeLimiter) to safeguard thread pools.
3. **Structured Output**: Uses Jackson's ObjectMapper or Spring AI's BeanOutputConverter to bind JSON responses directly to Java Records.
4. **Token Telemetry**: Logs PromptTokens, CompletionTokens, and TTFT (Time To First Token) via Micrometer for production monitoring.`;

  if (lower.includes('retry') || lower.includes('timeout')) {
    replyText = `**Spring Boot Resilience Architecture**:
- **Retry Pattern**: Use \`@Retry(name = "llmApi", fallbackMethod = "fallbackResponse")\` with Resilience4j. Configure 3 attempts with 500ms initial interval and exponential multiplier of 2.
- **Timeout Pattern**: Enforce \`Duration.ofSeconds(timeoutSeconds)\` on WebClient or using Resilience4j \`@TimeLimiter\`. If the LLM provider hangs, the connection closes gracefully without exhausting worker threads.`;
  } else if (lower.includes('streaming') || lower.includes('sse')) {
    replyText = `**Spring Boot Streaming (SSE) Implementation**:
- Controller method returns \`Flux<ServerSentEvent<String>>\` with \`MediaType.TEXT_EVENT_STREAM_VALUE\`.
- Under the hood, Netty or Tomcat handles the non-blocking push of token chunks.
- The browser consumes this using standard \`EventSource\` or \`fetch()\` with \`ReadableStream\`.`;
  }

  if (structured) {
    return {
      reply: replyText,
      sentiment: 'POSITIVE',
      intent: lower.includes('code') ? 'CODE_GENERATION' : 'ARCHITECTURE_INQUIRY',
      keyPoints: [
        'Spring Boot WebClient isolates JVM threads from slow LLM streaming raw sockets.',
        'Resilience4j circuit breakers and retries prevent cascade failures.',
        'Structured Output guarantees type safety and eliminates parsing exceptions in Java applications.'
      ],
      confidence: 0.96,
      suggestedFollowUps: [
        'How does Spring AI compare to LangChain4j for production Java?',
        'How do I configure exponential backoff in Resilience4j?',
        'Can I track token usage with Prometheus and Grafana?'
      ]
    };
  }

  return { reply: replyText };
}

// Standard Spring Boot ProblemDetail Error Formatter
function createSpringProblemDetail(status: number, title: string, detail: string, pathUrl: string, retryAttempts: number = 0) {
  return {
    type: `https://api.springboot.io/errors/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    detail,
    instance: pathUrl,
    timestamp: new Date().toISOString(),
    retryAttempts,
    framework: 'Spring Boot 3.3.x / WebClient / Resilience4j',
    solutionSuggestion: status === 504 
      ? 'Increase the request timeout or optimize the prompt length.'
      : status === 429
      ? 'The upstream LLM provider is rate-limiting requests. Exponential backoff retry engaged.'
      : status === 401
      ? 'Invalid or missing API key in application.properties / environment.'
      : 'Review the Spring Boot application logs for stacktrace.'
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    version: '3.3.4',
    app: 'Java AI Chat Application',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Non-streaming / Structured Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { messages, structured = false, timeoutMs = 15000, maxRetries = 3, simulateError } = req.body;
  const startTime = Date.now();

  // Simulated error triggers for demonstration
  if (simulateError === 'unauthorized_401') {
    return res.status(401).json(createSpringProblemDetail(401, 'Unauthorized', 'Invalid or missing API credential for LLM provider.', req.originalUrl, 0));
  }
  if (simulateError === 'ratelimit_429') {
    return res.status(429).json(createSpringProblemDetail(429, 'Too Many Requests', 'Upstream LLM rate limit quota exceeded (429 RESOURCE_EXHAUSTED).', req.originalUrl, maxRetries));
  }
  if (simulateError === 'model_error_500') {
    return res.status(500).json(createSpringProblemDetail(500, 'Internal Server Error', 'LLM service encountered an unrecoverable exception.', req.originalUrl, maxRetries));
  }
  if (simulateError === 'timeout_simulated') {
    await new Promise(r => setTimeout(r, Math.min(timeoutMs + 800, 8000)));
    return res.status(504).json(createSpringProblemDetail(504, 'Gateway Timeout', `Request timed out after ${timeoutMs}ms (WebClient RequestTimeoutException).`, req.originalUrl, maxRetries));
  }

  const userPrompt = Array.isArray(messages) && messages.length > 0
    ? messages[messages.length - 1].content
    : 'Hello, explain Spring Boot AI architecture.';

  const ai = getGeminiClient();

  // Retry execution loop (Resilience4j simulation in Spring Boot)
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      if (!ai) {
        // Fallback simulation when no API key is provided
        const simulated = generateSimulatedResponse(userPrompt, structured);
        const latencyMs = Date.now() - startTime;
        const promptTokens = Math.ceil(userPrompt.length / 3.5) + 15;
        const textForTokenCount = typeof simulated === 'object' ? JSON.stringify(simulated) : simulated;
        const completionTokens = Math.ceil(textForTokenCount.length / 3.5);

        return res.json({
          status: 'SUCCESS',
          retryAttemptsUsed: attempt - 1,
          data: simulated,
          tokenUsage: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            latencyMs,
            tokensPerSec: Math.round((completionTokens / (Math.max(latencyMs, 100) / 1000)) * 10) / 10
          }
        });
      }

      // Real Gemini API call with gemini-3.8-flash and strict timeout deadline
      const abortController = new AbortController();
      let timeoutId: any = null;

      const systemInstruction = `You are a Senior Java Enterprise Architect & Spring AI expert.
You are helping the user build or understand Java AI Chat Applications using Spring Boot, Spring AI, or LangChain4j.
Be concise, clear, technically accurate, and use clean markdown formatting with Java snippets when helpful.`;

      const config: any = {
        systemInstruction,
        abortSignal: abortController.signal
      };

      if (structured) {
        config.responseMimeType = 'application/json';
        config.responseSchema = structuredResponseSchema;
      }

      // Format conversation history
      const contents = Array.isArray(messages)
        ? messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }))
        : [{ role: 'user', parts: [{ text: userPrompt }] }];

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config
      });

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          const err = new Error(`WebClient timeout deadline of ${timeoutMs}ms exceeded`);
          err.name = 'AbortError';
          reject(err);
        }, timeoutMs);
      });

      const response = await Promise.race([generatePromise, timeoutPromise]) as any;
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      const rawText = response.text || '';
      let parsedData: any = rawText;

      if (structured) {
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          parsedData = { reply: rawText, sentiment: 'NEUTRAL', intent: 'GENERAL_QA', keyPoints: [], confidence: 0.9, suggestedFollowUps: [] };
        }
      } else {
        parsedData = { reply: rawText };
      }

      const usageMetadata = response.usageMetadata;
      const promptTokens = usageMetadata?.promptTokenCount || Math.ceil(userPrompt.length / 3.5);
      const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil(rawText.length / 3.5);

      return res.json({
        status: 'SUCCESS',
        retryAttemptsUsed: attempt - 1,
        data: parsedData,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          latencyMs,
          tokensPerSec: Math.round((completionTokens / (Math.max(latencyMs, 100) / 1000)) * 10) / 10
        }
      });
    } catch (err: any) {
      lastError = err;
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        if (simulateError === 'timeout_simulated') {
          return res.status(504).json(createSpringProblemDetail(504, 'Gateway Timeout', `Spring WebClient timed out after ${timeoutMs}ms.`, req.originalUrl, attempt));
        }
        if (attempt >= maxRetries) {
          break; // Fallback will engage below
        }
      }
      // If error is 4xx client error (except 429), don't retry
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
        return res.status(err.status).json(createSpringProblemDetail(err.status, 'Client Error', err.message || 'LLM API client error', req.originalUrl, attempt));
      }
      // Wait exponential backoff before next attempt
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.min(attempt * 400, 1500)));
      }
    }
  }

  // All retries exhausted: If user explicitly simulated an error, return ProblemDetail
  if (simulateError && simulateError !== 'none') {
    return res.status(500).json(createSpringProblemDetail(500, 'Retry Exhausted', `Failed after ${maxRetries} retry attempts: ${lastError?.message || 'Unknown error'}`, req.originalUrl, maxRetries));
  }

  // Spring Boot Fallback Pattern (@Retry(fallbackMethod = "fallbackResponse"))
  const fallbackData = generateSimulatedResponse(userPrompt, structured);
  const latencyMs = Date.now() - startTime;
  const promptTokens = Math.ceil(userPrompt.length / 3.5) + 15;
  const completionTokens = Math.ceil(JSON.stringify(fallbackData).length / 3.5);

  return res.json({
    status: 'FALLBACK_ENGAGED',
    retryAttemptsUsed: maxRetries,
    fallbackEngaged: true,
    data: fallbackData,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      latencyMs,
      tokensPerSec: Math.round((completionTokens / (Math.max(latencyMs, 100) / 1000)) * 10) / 10
    }
  });
});

// Real-time Streaming SSE endpoint (Server-Sent Events)
app.post('/api/chat/stream', async (req, res) => {
  const { messages, timeoutMs = 15000, maxRetries = 3, simulateError } = req.body;
  const startTime = Date.now();

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Simulated errors
  if (simulateError === 'unauthorized_401') {
    sendEvent('error', createSpringProblemDetail(401, 'Unauthorized', 'Invalid API key for LLM Provider.', '/api/chat/stream', 0));
    return res.end();
  }
  if (simulateError === 'ratelimit_429') {
    sendEvent('retry', { attempt: 1, maxRetries, message: 'Rate limit 429 encountered, backoff 600ms...' });
    sendEvent('retry', { attempt: 2, maxRetries, message: 'Rate limit 429 encountered, backoff 1200ms...' });
    sendEvent('error', createSpringProblemDetail(429, 'Too Many Requests', 'Rate limit exceeded on LLM upstream.', '/api/chat/stream', maxRetries));
    return res.end();
  }
  if (simulateError === 'timeout_simulated') {
    sendEvent('status', { message: 'Spring Boot WebClient dispatching request...' });
    await new Promise(r => setTimeout(r, Math.min(timeoutMs + 500, 6000)));
    sendEvent('error', createSpringProblemDetail(504, 'Gateway Timeout', `Stream exceeded deadline of ${timeoutMs}ms.`, '/api/chat/stream', maxRetries));
    return res.end();
  }

  const userPrompt = Array.isArray(messages) && messages.length > 0
    ? messages[messages.length - 1].content
    : 'Hello from Spring Boot!';

  const ai = getGeminiClient();

  if (!ai) {
    // Simulated SSE token streaming
    sendEvent('status', { message: 'Spring Boot Netty WebClient connected. Streaming tokens...' });
    const simulated = generateSimulatedResponse(userPrompt, false);
    const words = simulated.reply.split(' ');

    let emittedText = '';
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      emittedText += chunk;
      sendEvent('token', { token: chunk, index: i });
      await new Promise(r => setTimeout(r, 25)); // 25ms per token stream
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = Math.ceil(userPrompt.length / 3.5) + 12;
    const completionTokens = Math.ceil(emittedText.length / 3.5);

    sendEvent('done', {
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        latencyMs,
        tokensPerSec: Math.round((completionTokens / (Math.max(latencyMs, 100) / 1000)) * 10) / 10
      }
    });
    return res.end();
  }

  try {
    sendEvent('status', { message: 'Spring Boot WebClient connected to Gemini 3.8 Flash. Streaming tokens...' });

    const contents = Array.isArray(messages)
      ? messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      : [{ role: 'user', parts: [{ text: userPrompt }] }];

    const streamPromise = ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: 'You are a Senior Java Architect. Answer clearly in markdown with clean explanations.'
      }
    });

    const streamTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Stream connection timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const stream = await Promise.race([streamPromise, streamTimeoutPromise]) as any;

    let fullText = '';
    let tokenIndex = 0;
    let firstTokenTime = 0;

    for await (const chunk of stream) {
      if (!firstTokenTime) {
        firstTokenTime = Date.now();
      }
      const text = chunk.text || '';
      if (text) {
        fullText += text;
        sendEvent('token', { token: text, index: tokenIndex++ });
      }
    }

    const latencyMs = Date.now() - startTime;
    const ttftMs = firstTokenTime ? firstTokenTime - startTime : latencyMs;
    const promptTokens = Math.ceil(userPrompt.length / 3.5) + 10;
    const completionTokens = Math.ceil(fullText.length / 3.5);

    sendEvent('done', {
      tokenUsage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        latencyMs,
        ttftMs,
        tokensPerSec: Math.round((completionTokens / (Math.max(latencyMs, 100) / 1000)) * 10) / 10
      }
    });
    res.end();
  } catch (err: any) {
    if (simulateError && simulateError !== 'none') {
      sendEvent('error', createSpringProblemDetail(500, 'Stream Error', err.message || 'Stream processing failure', '/api/chat/stream', 1));
      return res.end();
    }
    // Fallback stream (Spring Boot Resilience4j fallbackMethod)
    sendEvent('retry', { attempt: 1, maxRetries: 3, message: 'Upstream spike detected. Engaging Spring AI fallback stream...' });
    const fallback = generateSimulatedResponse(userPrompt, false);
    const words = fallback.reply.split(' ');
    let emitted = '';
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      emitted += chunk;
      sendEvent('token', { token: chunk, index: i });
      await new Promise(r => setTimeout(r, 20));
    }
    const latencyMs = Date.now() - startTime;
    sendEvent('done', {
      tokenUsage: {
        promptTokens: Math.ceil(userPrompt.length / 3.5),
        completionTokens: Math.ceil(emitted.length / 3.5),
        totalTokens: Math.ceil((userPrompt.length + emitted.length) / 3.5),
        latencyMs,
        tokensPerSec: 42.5
      }
    });
    res.end();
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spring Boot AI Gateway server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { useState, useRef, useEffect } from 'react';
import { Message, AppSettings, ArchitectureStep, StructuredOutput, TokenUsage, ErrorDetail } from './types';
import ArchitectureFlow from './components/ArchitectureFlow';
import ControlsBar from './components/ControlsBar';
import ChatMessageItem from './components/ChatMessageItem';
import JavaCodeModal from './components/JavaCodeModal';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  StopCircle, 
  Terminal, 
  Server, 
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: `Welcome to the **Java AI Chat Application**!

This system demonstrates the standard enterprise architecture:
\`\`\`
User  ──►  Spring Boot (WebClient / Filter)  ──►  LLM API (Gemini 3.8 Flash)  ──►  Response
\`\`\`

All 6 requested capabilities are fully configured and ready to test:
1. **Streaming**: Server-Sent Events (\`Flux<ServerSentEvent>\`) for real-time token rendering.
2. **Structured Output**: Type-safe Java 21 Record mapping with Jackson / Spring AI schemas.
3. **Token Usage**: Prompt tokens, completion tokens, latency, TTFT, and tokens/sec telemetry.
4. **Error Handling**: Spring Boot RFC 7807 \`ProblemDetail\` with actionable remediation.
5. **Retry**: Resilience4j \`@Retry\` with exponential backoff (e.g. 500ms → 1000ms → 2000ms).
6. **Timeout**: Strict WebClient deadline enforcement (\`@TimeLimiter\` / 5s - 30s).

Try typing a question below, or pick a quick prompt to see the pipeline in action!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'done',
    tokenUsage: {
      promptTokens: 18,
      completionTokens: 142,
      totalTokens: 160,
      latencyMs: 180,
      tokensPerSec: 45.2
    }
  }
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [architectureStep, setArchitectureStep] = useState<ArchitectureStep>('idle');
  const [retryAttemptCount, setRetryAttemptCount] = useState(0);
  const [activeLatency, setActiveLatency] = useState<number | undefined>(undefined);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Enterprise feature settings
  const [settings, setSettings] = useState<AppSettings>({
    streaming: true,
    structuredOutput: false,
    timeoutSeconds: 10,
    maxRetries: 3,
    backoffIntervalMs: 500,
    simulateError: 'none'
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Aggregate telemetry
  const totalTokens = messages.reduce((acc, m) => acc + (m.tokenUsage?.totalTokens || 0), 0);
  const totalRequests = messages.filter(m => m.role === 'user').length;

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isLoading) return;

    setInputText('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'done'
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage, initialAssistantMessage]);
    setIsLoading(true);
    setArchitectureStep('user');
    setRetryAttemptCount(0);
    setActiveLatency(undefined);

    const startTime = Date.now();

    // Step transition: Spring Boot middleware processing
    setTimeout(() => {
      setArchitectureStep('spring_boot');
    }, 150);

    // Abort controller for timeout
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (settings.streaming && !settings.structuredOutput) {
        // STREAMING FLOW (SSE)
        setTimeout(() => {
          setArchitectureStep('llm_api');
        }, 350);

        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            timeoutMs: settings.timeoutSeconds * 1000,
            maxRetries: settings.maxRetries,
            simulateError: settings.simulateError
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorJson = await response.json().catch(() => ({}));
          throw errorJson;
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to obtain stream reader');

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';
        let retryLogs: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';
          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              const rawData = line.replace('data:', '').trim();
              if (!rawData) continue;

              try {
                const data = JSON.parse(rawData);

                if (currentEvent === 'retry') {
                  setRetryAttemptCount(data.attempt || 1);
                  retryLogs.push(`Attempt ${data.attempt}/${data.maxRetries}: ${data.message || 'Transient error, retrying...'}`);
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, retryLog: [...retryLogs] } 
                      : m
                  ));
                } else if (currentEvent === 'token') {
                  setArchitectureStep('response');
                  accumulatedText += (data.token || '');
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, content: accumulatedText, status: 'streaming' } 
                      : m
                  ));
                } else if (currentEvent === 'done') {
                  const latency = Date.now() - startTime;
                  setActiveLatency(latency);
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { 
                          ...m, 
                          content: accumulatedText, 
                          status: 'done',
                          tokenUsage: data.tokenUsage,
                          retryLog: retryLogs.length > 0 ? retryLogs : undefined
                        } 
                      : m
                  ));
                } else if (currentEvent === 'error') {
                  setArchitectureStep('error');
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { 
                          ...m, 
                          status: 'error',
                          errorDetail: data as ErrorDetail,
                          retryLog: retryLogs.length > 0 ? retryLogs : undefined
                        } 
                      : m
                  ));
                }
              } catch (parseErr) {
                console.error('SSE JSON parse error:', parseErr);
              }
            }
          }
        }
      } else {
        // NON-STREAMING OR STRUCTURED OUTPUT FLOW
        setTimeout(() => {
          setArchitectureStep('llm_api');
        }, 350);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            structured: settings.structuredOutput,
            timeoutMs: settings.timeoutSeconds * 1000,
            maxRetries: settings.maxRetries,
            simulateError: settings.simulateError
          }),
          signal: controller.signal
        });

        const latency = Date.now() - startTime;
        setActiveLatency(latency);

        if (!response.ok) {
          const errorData: ErrorDetail = await response.json();
          setArchitectureStep('error');
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId 
              ? { 
                  ...m, 
                  status: 'error', 
                  errorDetail: errorData 
                } 
              : m
          ));
          return;
        }

        const resData = await response.json();
        setArchitectureStep('response');

        if (settings.structuredOutput && typeof resData.data === 'object') {
          const structured: StructuredOutput = resData.data;
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId 
              ? { 
                  ...m, 
                  content: structured.reply || '',
                  structuredData: structured,
                  status: 'done',
                  tokenUsage: resData.tokenUsage
                } 
              : m
          ));
        } else {
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId 
              ? { 
                  ...m, 
                  content: typeof resData.data === 'object' ? (resData.data.reply || '') : resData.data,
                  status: 'done',
                  tokenUsage: resData.tokenUsage
                } 
              : m
          ));
        }
      }
    } catch (err: any) {
      setArchitectureStep('error');
      const isAbort = err.name === 'AbortError';
      const errorDetail: ErrorDetail = {
        status: isAbort ? 504 : (err.status || 500),
        title: isAbort ? 'Client Request Timeout' : (err.title || 'Spring Boot Gateway Error'),
        detail: isAbort ? `Request exceeded client timeout deadline of ${settings.timeoutSeconds}s.` : (err.detail || err.message || 'Connection refused or unexpected failure.'),
        timestamp: new Date().toISOString(),
        solutionSuggestion: isAbort ? 'Try increasing the timeout deadline or breaking down your question.' : 'Verify server connection or inspect Resilience4j retry policy.'
      };

      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, status: 'error', errorDetail } 
          : m
      ));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      // Return to idle state after brief visual celebration
      setTimeout(() => {
        setArchitectureStep('idle');
      }, 3000);
    }
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setArchitectureStep('idle');
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
    setArchitectureStep('idle');
    setActiveLatency(undefined);
  };

  return (
    <div 
      id="app-root"
      className="min-h-screen bg-zinc-50 flex flex-col text-zinc-900 selection:bg-indigo-100 selection:text-indigo-900"
    >
      {/* Top App Header */}
      <header 
        id="app-header"
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-6 py-3.5"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-zinc-900">
                  Java AI Chat Application
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
                  Spring Boot 3.3 · WebClient
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                User → Spring Boot → LLM API → Response | Streaming, Structured Output, Token Telemetry & Resilience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="clear-chat-btn"
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 text-xs font-medium transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col gap-4">
        {/* Visual Architecture Flow Diagram */}
        <ArchitectureFlow
          currentStep={architectureStep}
          streaming={settings.streaming}
          structured={settings.structuredOutput}
          activeLatencyMs={activeLatency}
          retryAttempt={retryAttemptCount}
        />

        {/* Enterprise Resilience & Feature Flags Control Bar */}
        <ControlsBar
          settings={settings}
          onChange={setSettings}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
          totalTokensCount={totalTokens}
          totalRequestsCount={totalRequests}
        />

        {/* Chat Stream Window */}
        <div 
          id="chat-window"
          className="flex-1 min-h-[460px] bg-white border border-zinc-200 rounded-2xl shadow-xs flex flex-col overflow-hidden"
        >
          {/* Chat message history */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map(msg => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onSendFollowUp={prompt => handleSendMessage(prompt)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-zinc-50/80 border-t border-zinc-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] text-zinc-400 font-medium shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Quick Tests:
            </span>
            {[
              'Explain Spring AI vs LangChain4j for production Java',
              'How does Spring WebClient handle SSE Streaming without thread exhaustion?',
              'Show Resilience4j Retry config with exponential backoff',
              'Test Simulated 429 Rate Limit Retry',
              'Test Simulated 504 Timeout'
            ].map((qp, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => {
                  if (qp.includes('429')) {
                    setSettings(s => ({ ...s, simulateError: 'ratelimit_429' }));
                  } else if (qp.includes('504')) {
                    setSettings(s => ({ ...s, simulateError: 'timeout_simulated', timeoutSeconds: 3 }));
                  } else if (qp.includes('Structured')) {
                    setSettings(s => ({ ...s, structuredOutput: true }));
                  }
                  handleSendMessage(qp);
                }}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-zinc-200 text-zinc-700 hover:text-indigo-900 font-medium transition-colors shadow-2xs disabled:opacity-50"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Form Bar */}
          <div className="p-3.5 bg-white border-t border-zinc-200">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="user-chat-input"
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={isLoading ? "Spring Boot processing in progress..." : "Ask about Java AI, Spring Boot, streaming, or test resilience..."}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-zinc-400"
              />

              {isLoading ? (
                <button
                  type="button"
                  id="stop-request-btn"
                  onClick={handleStopStream}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Abort</span>
                </button>
              ) : (
                <button
                  type="submit"
                  id="send-message-btn"
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs shrink-0 disabled:text-zinc-400 disabled:cursor-not-allowed"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Java Source Code Viewer Modal */}
      <JavaCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Subtle Footer */}
      <footer className="py-4 border-t border-zinc-200 bg-white text-center text-xs text-zinc-400 font-medium">
        <span>Java AI Chat Application · Architecture: User ➔ Spring Boot ➔ LLM API ➔ Response</span>
      </footer>
    </div>
  );
}

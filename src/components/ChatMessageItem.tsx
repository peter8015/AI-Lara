import { Message, StructuredOutput } from '../types';
import { 
  User, 
  Bot, 
  Gauge, 
  AlertTriangle, 
  Check, 
  Copy, 
  Code, 
  ShieldCheck, 
  RotateCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  key?: string;
  message: Message;
  onSendFollowUp?: (text: string) => void;
}

export default function ChatMessageItem({ message, onSendFollowUp }: Props) {
  const isUser = message.role === 'user';
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-2.5 my-3">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          <div className="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-sm leading-relaxed">
            {message.content}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 font-mono">
            {message.timestamp}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0 shadow-xs">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex items-start gap-3 my-3">
      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex flex-col gap-2 max-w-[90%] sm:max-w-[85%] w-full">
        {/* Main Response Box */}
        <div className={`p-4 rounded-2xl rounded-tl-xs border transition-all text-sm leading-relaxed ${
          message.status === 'error'
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-white border-zinc-200 text-zinc-850 shadow-xs'
        }`}>

          {/* Retry Attempts Banner if any occurred */}
          {message.retryLog && message.retryLog.length > 0 && (
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex flex-col gap-1">
              <span className="font-semibold flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                Resilience4j Retry Telemetry ({message.retryLog.length} attempts):
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                {message.retryLog.map((log, i) => (
                  <li key={i}>{log}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Details if message has error */}
          {message.status === 'error' && message.errorDetail ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Spring Boot ProblemDetail (RFC 7807)
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                  HTTP {message.errorDetail.status}
                </span>
              </div>
              <p className="font-semibold text-rose-900 text-sm">
                {message.errorDetail.title}
              </p>
              <p className="text-xs text-rose-800 font-mono bg-rose-100/60 p-2 rounded-lg">
                {message.errorDetail.detail}
              </p>
              {message.errorDetail.solutionSuggestion && (
                <div className="text-xs text-rose-900 bg-white/80 p-2.5 rounded-lg border border-rose-200 mt-1">
                  💡 <strong>Spring Boot Remediation:</strong> {message.errorDetail.solutionSuggestion}
                </div>
              )}
            </div>
          ) : (
            // Standard / Streaming content
            <div className="flex flex-col gap-3">
              {/* If Structured Output present, render structured card layout */}
              {message.structuredData ? (
                <StructuredCard 
                  data={message.structuredData} 
                  showRaw={showRawJson} 
                  onToggleRaw={() => setShowRawJson(!showRawJson)} 
                  onSendFollowUp={onSendFollowUp}
                />
              ) : (
                // Plain / Streaming Text
                <div className="whitespace-pre-wrap font-sans text-zinc-800 leading-relaxed selection:bg-indigo-100">
                  {message.content}
                  {message.status === 'streaming' && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-600 animate-pulse align-middle" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Action / Copy strip */}
          {message.content && message.status !== 'error' && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 text-xs text-zinc-400">
              <span className="font-mono text-[10px]">
                {message.timestamp} · Spring WebClient
              </span>
              <button
                onClick={() => handleCopy(message.content)}
                className="inline-flex items-center gap-1 hover:text-zinc-700 text-zinc-400 text-xs transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Feature 3: Token Usage Telemetry Badge */}
        {message.tokenUsage && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500 px-2">
            <span className="inline-flex items-center gap-1 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
              <Gauge className="w-3 h-3 text-indigo-600" />
              Total: <strong className="text-zinc-800 font-semibold">{message.tokenUsage.totalTokens}</strong> tokens
            </span>
            <span className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-md">
              Prompt: <strong className="text-zinc-700">{message.tokenUsage.promptTokens}</strong>
            </span>
            <span className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-md">
              Completion: <strong className="text-zinc-700">{message.tokenUsage.completionTokens}</strong>
            </span>
            <span className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-md">
              Latency: <strong className="text-zinc-700">{message.tokenUsage.latencyMs}ms</strong>
            </span>
            {message.tokenUsage.tokensPerSec && (
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-semibold">
                {message.tokenUsage.tokensPerSec} tok/s
              </span>
            )}
            {message.tokenUsage.ttftMs && (
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                TTFT: {message.tokenUsage.ttftMs}ms
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponent: Structured Output Card representation
function StructuredCard({
  data,
  showRaw,
  onToggleRaw,
  onSendFollowUp
}: {
  data: StructuredOutput;
  showRaw: boolean;
  onToggleRaw: () => void;
  onSendFollowUp?: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* Header with Type & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            POJO: StructuredChatResponse.java
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
            Intent: {data.intent || 'GENERAL_QA'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-mono">
            Confidence: <strong className="text-emerald-700 font-semibold">{Math.round((data.confidence || 0.95) * 100)}%</strong>
          </span>
          <button
            onClick={onToggleRaw}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 underline underline-offset-2"
          >
            <Code className="w-3 h-3" />
            {showRaw ? 'Hide JSON' : 'Raw JSON'}
          </button>
        </div>
      </div>

      {/* Raw JSON View or Formatted View */}
      {showRaw ? (
        <pre className="bg-zinc-950 text-emerald-400 p-3 rounded-xl text-xs font-mono overflow-x-auto max-h-60 border border-zinc-800 leading-normal">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <>
          {/* Primary Reply */}
          <div className="whitespace-pre-wrap font-sans text-zinc-800 leading-relaxed">
            {data.reply}
          </div>

          {/* Key Takeaways */}
          {data.keyPoints && data.keyPoints.length > 0 && (
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">
                Key Technical Points
              </span>
              <ul className="space-y-1">
                {data.keyPoints.map((pt, i) => (
                  <li key={i} className="text-xs text-zinc-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Followups */}
          {data.suggestedFollowUps && data.suggestedFollowUps.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Suggested Follow-Up Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.suggestedFollowUps.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onSendFollowUp && onSendFollowUp(q)}
                    className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/70 text-indigo-900 font-medium transition-colors flex items-center gap-1"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-500 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

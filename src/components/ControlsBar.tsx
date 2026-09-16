import { AppSettings } from '../types';
import { 
  Zap, 
  FileJson, 
  Timer, 
  RotateCw, 
  AlertOctagon, 
  Code2, 
  Gauge, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  settings: AppSettings;
  onChange: (newSettings: AppSettings) => void;
  onOpenCodeModal: () => void;
  totalTokensCount: number;
  totalRequestsCount: number;
}

export default function ControlsBar({
  settings,
  onChange,
  onOpenCodeModal,
  totalTokensCount,
  totalRequestsCount
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div 
      id="controls-bar-container"
      className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-700">
            Enterprise Feature Flags & Resilience Controls
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="view-java-code-btn"
            onClick={onOpenCodeModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spring Boot Source Code</span>
          </button>

          <button
            id="toggle-advanced-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition-colors"
          >
            <span>{showAdvanced ? 'Hide Advanced' : 'Configure Faults'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Feature Switches */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Streaming (SSE) */}
        <div 
          id="control-toggle-streaming"
          onClick={() => onChange({ ...settings, streaming: !settings.streaming })}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
            settings.streaming
              ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 shadow-xs'
              : 'border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${settings.streaming ? 'text-indigo-600' : 'text-zinc-400'}`} />
              Streaming (SSE)
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              Flux&lt;ServerSentEvent&gt;
            </span>
          </div>
          <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 ${
            settings.streaming ? 'bg-indigo-600' : 'bg-zinc-300'
          }`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
              settings.streaming ? 'translate-x-3.5' : 'translate-x-0'
            }`} />
          </div>
        </div>

        {/* 2. Structured Output */}
        <div 
          id="control-toggle-structured"
          onClick={() => onChange({ ...settings, structuredOutput: !settings.structuredOutput })}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
            settings.structuredOutput
              ? 'border-purple-500 bg-purple-50/50 text-purple-950 shadow-xs'
              : 'border-zinc-200 bg-zinc-50/60 text-zinc-600 hover:border-zinc-300'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <FileJson className={`w-3.5 h-3.5 ${settings.structuredOutput ? 'text-purple-600' : 'text-zinc-400'}`} />
              Structured Output
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              Java 21 Record DTO
            </span>
          </div>
          <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 ${
            settings.structuredOutput ? 'bg-purple-600' : 'bg-zinc-300'
          }`}>
            <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
              settings.structuredOutput ? 'translate-x-3.5' : 'translate-x-0'
            }`} />
          </div>
        </div>

        {/* 3. Timeout */}
        <div className="flex flex-col p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 justify-between">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-zinc-700 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-amber-500" />
              Timeout Deadline
            </span>
            <span className="text-[11px] font-mono font-bold text-indigo-700">
              {settings.timeoutSeconds}s
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            {[3, 5, 10, 30].map(s => (
              <button
                key={s}
                onClick={() => onChange({ ...settings, timeoutSeconds: s })}
                className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${
                  settings.timeoutSeconds === s
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* 4. Retry (Resilience4j) */}
        <div className="flex flex-col p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 justify-between">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-zinc-700 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
              Max Retries
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-700">
              {settings.maxRetries}x
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 5].map(r => (
              <button
                key={r}
                onClick={() => onChange({ ...settings, maxRetries: r })}
                className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${
                  settings.maxRetries === r
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Fault Injection / Error Handling Simulator */}
      {showAdvanced && (
        <div 
          id="fault-injection-panel"
          className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
              Error Handling & Resilience Injection (Simulate Upstream Faults):
            </span>
            <span className="text-[10px] text-amber-700 font-medium">
              Tests Spring Boot @RestControllerAdvice & ProblemDetail
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'none', label: 'Normal (200 OK)', desc: 'Standard execution' },
              { id: 'unauthorized_401', label: '401 Unauthorized', desc: 'Invalid API Key' },
              { id: 'ratelimit_429', label: '429 Rate Limit', desc: 'Triggers exponential retry' },
              { id: 'timeout_simulated', label: '504 Timeout', desc: 'Exceeds deadline' },
              { id: 'model_error_500', label: '500 Server Error', desc: 'Provider crash' }
            ].map((err) => (
              <button
                key={err.id}
                onClick={() => onChange({ ...settings, simulateError: err.id as any })}
                className={`flex flex-col text-left p-2 rounded-lg border text-xs transition-all ${
                  settings.simulateError === err.id
                    ? 'border-amber-600 bg-amber-100/80 text-amber-950 font-semibold shadow-xs'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span>{err.label}</span>
                <span className="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5">
                  {err.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session Telemetry strip */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Gauge className="w-3 h-3 text-indigo-500" />
            Session Total Tokens: <strong className="text-zinc-800 font-semibold">{totalTokensCount}</strong>
          </span>
          <span className="text-zinc-300">|</span>
          <span className="font-mono text-[11px]">
            Requests: <strong className="text-zinc-800 font-semibold">{totalRequestsCount}</strong>
          </span>
        </div>

        <div className="text-[11px] text-zinc-400">
          Spring Boot WebClient · Timeout: <span className="font-mono text-zinc-600">{settings.timeoutSeconds}s</span> · Backoff: <span className="font-mono text-zinc-600">{settings.backoffIntervalMs}ms</span>
        </div>
      </div>
    </div>
  );
}

import { ArchitectureStep } from '../types';
import { User, Server, Cpu, MessageSquare, ArrowDown, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  currentStep: ArchitectureStep;
  streaming: boolean;
  structured: boolean;
  activeLatencyMs?: number;
  retryAttempt?: number;
}

export default function ArchitectureFlow({
  currentStep,
  streaming,
  structured,
  activeLatencyMs,
  retryAttempt = 0
}: Props) {
  const steps = [
    {
      id: 'user',
      label: 'User',
      sublabel: 'Client Browser / Mobile UI',
      icon: User,
      activeColor: 'border-blue-500 bg-blue-50 text-blue-700',
      badge: 'HTTP / SSE Consumer'
    },
    {
      id: 'spring_boot',
      label: 'Spring Boot 3.3',
      sublabel: 'WebClient · Resilience4j · Security',
      icon: Server,
      activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700',
      badge: retryAttempt > 0 ? `Retry #${retryAttempt}` : (streaming ? 'Reactive Flux' : (structured ? 'BeanConverter' : 'WebClient'))
    },
    {
      id: 'llm_api',
      label: 'LLM API',
      sublabel: 'Gemini 3.8 Flash / Cloud Model',
      icon: Cpu,
      activeColor: 'border-purple-500 bg-purple-50 text-purple-700',
      badge: 'Token Generator'
    },
    {
      id: 'response',
      label: 'Response',
      sublabel: structured ? 'Structured JSON POJO' : (streaming ? 'SSE Token Stream' : 'Unified Text'),
      icon: MessageSquare,
      activeColor: 'border-indigo-500 bg-indigo-50 text-indigo-700',
      badge: activeLatencyMs ? `${activeLatencyMs}ms` : 'Completed'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (currentStep === 'error' && stepId === 'spring_boot') return 'error';
    if (currentStep === stepId) return 'active';
    
    const order = ['user', 'spring_boot', 'llm_api', 'response'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);
    
    if (currentIndex > stepIndex) return 'completed';
    return 'idle';
  };

  return (
    <section 
      id="architecture-flow-section"
      className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
            JVM
          </div>
          <div>
            <h2 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
              System Architecture Flow
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
                User → Spring Boot → LLM API → Response
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
            streaming ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-zinc-100 text-zinc-600'
          }`}>
            <Zap className="w-3 h-3" />
            {streaming ? 'SSE Streaming ON' : 'Standard Buffered'}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
            structured ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-zinc-100 text-zinc-600'
          }`}>
            <ShieldCheck className="w-3 h-3" />
            {structured ? 'Structured Output POJO' : 'Plain Markdown'}
          </span>
        </div>
      </div>

      {/* Responsive Architecture Pipeline Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative flex flex-col">
              <div
                id={`arch-node-${step.id}`}
                className={`flex flex-col p-3 rounded-xl border transition-all duration-300 relative ${
                  status === 'active'
                    ? `${step.activeColor} shadow-sm ring-2 ring-indigo-500/20 scale-[1.02]`
                    : status === 'completed'
                    ? 'border-zinc-300 bg-zinc-50/80 text-zinc-800'
                    : status === 'error'
                    ? 'border-rose-400 bg-rose-50 text-rose-800'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      status === 'active'
                        ? 'bg-white shadow-xs'
                        : status === 'completed'
                        ? 'bg-zinc-200/70 text-zinc-700'
                        : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-zinc-900">
                      {step.label}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                    status === 'active'
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : status === 'error'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {status === 'error' ? 'Fault Block' : step.badge}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-500 leading-tight">
                  {step.sublabel}
                </p>

                {/* Status indicator bar */}
                <div className="mt-2 w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      status === 'active'
                        ? 'w-full bg-indigo-500 animate-pulse'
                        : status === 'completed'
                        ? 'w-full bg-emerald-500'
                        : status === 'error'
                        ? 'w-full bg-rose-500'
                        : 'w-0'
                    }`}
                  />
                </div>
              </div>

              {/* Connector arrow between columns on desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-zinc-300 pointer-events-none">
                  <span className="text-zinc-400 font-bold text-xs">→</span>
                </div>
              )}

              {/* Connector arrow for mobile vertical flow */}
              {idx < steps.length - 1 && (
                <div className="flex md:hidden justify-center my-0.5 text-zinc-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

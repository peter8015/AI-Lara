export interface StructuredOutput {
  reply: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'CONSTRUCTIVE' | string;
  intent: string;
  keyPoints: string[];
  confidence: number;
  suggestedFollowUps: string[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  ttftMs?: number;
  tokensPerSec?: number;
}

export interface ErrorDetail {
  status: number;
  title: string;
  detail: string;
  timestamp: string;
  retryAttempts?: number;
  solutionSuggestion?: string;
  framework?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status: 'sending' | 'streaming' | 'done' | 'error';
  structuredData?: StructuredOutput;
  tokenUsage?: TokenUsage;
  errorDetail?: ErrorDetail;
  retryLog?: string[];
}

export type ArchitectureStep = 'idle' | 'user' | 'spring_boot' | 'llm_api' | 'response' | 'error';

export interface AppSettings {
  streaming: boolean;
  structuredOutput: boolean;
  timeoutSeconds: number;
  maxRetries: number;
  backoffIntervalMs: number;
  simulateError: 'none' | 'unauthorized_401' | 'ratelimit_429' | 'model_error_500' | 'timeout_simulated';
}

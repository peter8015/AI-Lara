import { useState } from 'react';
import { JAVA_SNIPPETS } from '../data/javaCode';
import { X, Copy, Check, Code2, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function JavaCodeModal({ isOpen, onClose }: Props) {
  const [activeSnippetId, setActiveSnippetId] = useState(JAVA_SNIPPETS[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSnippet = JAVA_SNIPPETS.find(s => s.id === activeSnippetId) || JAVA_SNIPPETS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id="java-code-modal-backdrop"
      className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div 
        id="java-code-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                Spring Boot 3.3 Architecture & Implementation
              </h2>
              <p className="text-xs text-zinc-500">
                Production-ready Java reference code implementing the 6 requested enterprise AI features
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex overflow-x-auto border-b border-zinc-200 bg-zinc-100/60 px-4 pt-2 gap-1 scrollbar-none">
          {JAVA_SNIPPETS.map(snip => (
            <button
              key={snip.id}
              onClick={() => setActiveSnippetId(snip.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSnippetId === snip.id
                  ? 'bg-white text-zinc-900 border-t border-x border-zinc-200 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <span>{snip.filename}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-600 font-mono font-normal">
                {snip.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Code Content View */}
        <div className="flex flex-col flex-1 min-h-0 bg-zinc-950 p-4 relative">
          <div className="flex items-center justify-between mb-2 text-xs font-mono text-zinc-400 pb-2 border-b border-zinc-800">
            <span className="text-zinc-300 font-bold">{currentSnippet.filename} — {currentSnippet.subtitle}</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-sans transition-colors border border-zinc-700 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="flex-1 overflow-auto text-xs font-mono text-zinc-300 leading-relaxed p-2 selection:bg-indigo-700 select-all">
            <code>{currentSnippet.code}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
          <span>Compatible with Spring Boot 3.3+, Spring AI 1.0 M4, and LangChain4j 0.35+</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

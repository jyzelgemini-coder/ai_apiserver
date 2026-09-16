import React, { useState } from 'react';
import {
  Cpu,
  Copy,
  Check,
  Zap,
  Sparkles,
  Layers,
  Code2,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface GeminiModelsViewProps {
  showToast: (msg: string) => void;
  onSelectModelForVsCode?: (modelId: string) => void;
}

interface ModelItem {
  id: string;
  name: string;
  category: 'agent' | 'reasoning' | 'fast' | 'stable';
  badge: string;
  description: string;
  contextWindow: string;
  bestFor: string;
  recommended?: boolean;
}

export const GeminiModelsView: React.FC<GeminiModelsViewProps> = ({ showToast }) => {
  const [filter, setFilter] = useState<'all' | 'agent' | 'reasoning' | 'fast' | 'stable'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const models: ModelItem[] = [
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      category: 'agent',
      badge: 'Recommended for VS Code',
      description:
        'Next-generation flagship agent model optimized for high-speed file editing, multi-turn reasoning, and complex tool-use workflows in Cline and Roo Code.',
      contextWindow: '1,000,000 Tokens',
      bestFor: 'Autonomous Coding Agents, Repository Audits, Refactoring',
      recommended: true,
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      category: 'reasoning',
      badge: 'Deep Architecture & Math',
      description:
        'Google’s most powerful reasoning model. Excels at complex architectural refactoring, algorithmic problem solving, and difficult bug localization.',
      contextWindow: '1,000,000 Tokens',
      bestFor: 'System Design, Intricate Bug Hunting, Deep Thinking',
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      category: 'fast',
      badge: 'Ultra-Low Latency',
      description:
        'Extremely lightweight and responsive model with sub-second response times. Ideal for inline tab autocomplete in Continue.dev.',
      contextWindow: '1,000,000 Tokens',
      bestFor: 'Inline Code Completion (Tab autocomplete), Quick Fixes',
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash Latest',
      category: 'stable',
      badge: 'Production Stable',
      description:
        'Continuously updated production endpoint ensuring consistent behavior and high availability for developer environments.',
      contextWindow: '1,000,000 Tokens',
      bestFor: 'Daily Development, Unit Test Generation, Documentation',
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      category: 'reasoning',
      badge: 'Code Synthesis Specialist',
      description:
        'Enterprise coding workhorse with deep benchmark strength in TypeScript, Python, Go, Rust, and SQL code generation.',
      contextWindow: '1,000,000 Tokens',
      bestFor: 'Full-Stack Code Generation, API Implementations',
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      category: 'fast',
      badge: 'Balanced Speed & Quality',
      description:
        'High-efficiency model providing near-Pro quality outputs at 3x the token generation speed, perfectly balanced for interactive chat.',
      contextWindow: '1,000,000 Tokens',
      bestFor: 'Interactive Chat, Code Reviews, Quick Explanations',
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      category: 'stable',
      badge: 'High Throughput',
      description:
        'High-capacity baseline model with instant cold-start time and sustained token generation velocity.',
      contextWindow: '1,000,000 Tokens',
      bestFor: 'Continuous Integration, Test Scripts, Repetitive Transforms',
    },
  ];

  const filteredModels = models.filter((m) => filter === 'all' || m.category === filter);

  const copyModelId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied model ID '${id}' to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
          Supported Gemini Models
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          All models are accessible through your redeemed API key using the OpenAI-compatible gateway.
          Copy any Model ID directly into your VS Code extension settings.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {[
          { key: 'all', label: 'All Models (7)' },
          { key: 'agent', label: 'Autonomous Agent' },
          { key: 'reasoning', label: 'Deep Reasoning' },
          { key: 'fast', label: 'Fast & Autocomplete' },
          { key: 'stable', label: 'Production Stable' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filter === tab.key
                ? 'bg-slate-800 text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModels.map((m) => (
          <div
            key={m.id}
            className={`p-5 rounded-xl border bg-slate-900/80 transition flex flex-col justify-between space-y-4 ${
              m.recommended
                ? 'border-sky-500/50 ring-1 ring-sky-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100 text-base">{m.name}</h3>
                    {m.recommended && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{m.badge}</span>
                </div>

                <button
                  onClick={() => copyModelId(m.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Copy Model ID for VS Code"
                >
                  {copiedId === m.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Model ID:</span>
                <code className="font-mono text-sky-300 bg-slate-950 px-2 py-0.5 rounded text-[11px] select-all">
                  {m.id}
                </code>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Context Window:</span>
                <span className="font-mono text-slate-300 text-[11px]">{m.contextWindow}</span>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                <span className="text-slate-400 font-medium">Best For: </span>
                <span>{m.bestFor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

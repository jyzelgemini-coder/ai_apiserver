import React from 'react';
import { Sliders, Cpu, Brain, CheckCircle, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import { AccuracySettings, GeminiModelId, AccuracyPreset, ThinkingLevelOption } from '../types';

interface AccuracyConfigPanelProps {
  settings: AccuracySettings;
  onChange: (updated: AccuracySettings) => void;
  tokenTier: '1M' | '10M' | '20M';
}

export function AccuracyConfigPanel({ settings, onChange, tokenTier }: AccuracyConfigPanelProps) {
  const models: { id: GeminiModelId; name: string; tag: string; description: string }[] = [
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      tag: 'Recommended Default',
      description: 'Ultra-fast, high-accuracy model for code refactoring and rapid patch generation.',
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro Preview',
      tag: 'Deep Reasoning',
      description: 'Maximum intelligence for multi-file architectural planning, complex algorithms & logic.',
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      tag: 'Low Latency',
      description: 'Extremely lightweight, high-throughput model for quick syntax checks and micro-edits.',
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash Latest',
      tag: 'Latest Stable',
      description: 'Always routes to the freshest stable flash release.',
    },
  ];

  const presets: { id: AccuracyPreset; title: string; desc: string; icon: any }[] = [
    {
      id: 'max_precision',
      title: 'Zero Hallucination',
      desc: 'Temp 0.1 • TopP 0.8 • Strict Types',
      icon: ShieldCheck,
    },
    {
      id: 'deep_thinking',
      title: 'Deep Thinking',
      desc: 'High Reasoning Budget • Architecture',
      icon: Brain,
    },
    {
      id: 'balanced',
      title: 'Balanced Dev',
      desc: 'Standard Production Flow',
      icon: Layers,
    },
    {
      id: 'fast_prototype',
      title: 'Rapid Prototyping',
      desc: 'Temp 0.7 • High Creativity',
      icon: Zap,
    },
  ];

  const applyPreset = (preset: AccuracyPreset) => {
    if (preset === 'max_precision') {
      onChange({
        ...settings,
        preset,
        temperature: 0.1,
        topP: 0.8,
        topK: 20,
        thinkingLevel: 'HIGH',
        strictSyntaxValidation: true,
      });
    } else if (preset === 'deep_thinking') {
      onChange({
        ...settings,
        preset,
        temperature: 0.25,
        topP: 0.95,
        topK: 40,
        thinkingLevel: 'HIGH',
        strictSyntaxValidation: true,
      });
    } else if (preset === 'balanced') {
      onChange({
        ...settings,
        preset,
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        thinkingLevel: 'LOW',
        strictSyntaxValidation: true,
      });
    } else if (preset === 'fast_prototype') {
      onChange({
        ...settings,
        preset,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        thinkingLevel: 'MINIMAL',
        strictSyntaxValidation: false,
      });
    }
  };

  return (
    <div id="accuracy-config-panel" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
      {/* Header with Context Window Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Model & High-Accuracy Configurations</h3>
            <p className="text-xs text-slate-400">Tuned for precision code generation and repository intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300">Context Window Tier:</span>
          <span className="font-semibold text-amber-400 font-mono">{tokenTier}</span>
        </div>
      </div>

      {/* Accuracy Presets */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
          Accuracy & Reasoning Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = settings.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`p-3 rounded-xl border text-left transition relative ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500/80 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <div className="text-xs font-semibold">{p.title}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
          Select Gemini Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {models.map((m) => {
            const isSelected = settings.model === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChange({ ...settings, model: m.id })}
                className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-800 border-sky-500 text-white shadow-md shadow-sky-500/5'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold text-slate-200">{m.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{m.description}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md shrink-0 ${
                  isSelected ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  {m.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granular Reasoning & Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-slate-800/80">
        {/* Thinking Level */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>Thinking Budget</span>
            <span className="text-sky-400 font-mono">{settings.thinkingLevel}</span>
          </label>
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5">
            {(['HIGH', 'LOW', 'MINIMAL'] as ThinkingLevelOption[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onChange({ ...settings, thinkingLevel: lvl })}
                className={`flex-1 py-1 text-[11px] rounded-md font-medium transition ${
                  settings.thinkingLevel === lvl
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>Temperature (Precision)</span>
            <span className="font-mono text-slate-200">{settings.temperature.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.temperature}
            onChange={(e) => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Deterministic (0.0)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>

        {/* Top-P */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>Top-P Sampling</span>
            <span className="font-mono text-slate-200">{settings.topP.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={settings.topP}
            onChange={(e) => onChange({ ...settings, topP: parseFloat(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Focused (0.5)</span>
            <span>Broad (1.0)</span>
          </div>
        </div>
      </div>

      {/* Strict Syntax Verification Checkbox */}
      <div className="pt-2 flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-slate-200">Strict Syntax & Diff Validation</div>
            <div className="text-[11px] text-slate-400">Enforces TypeScript type safety and unified diff formatting on all responses.</div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.strictSyntaxValidation}
            onChange={(e) => onChange({ ...settings, strictSyntaxValidation: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
        </label>
      </div>
    </div>
  );
}

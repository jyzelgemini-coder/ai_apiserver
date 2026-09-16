import React, { useState } from 'react';
import { GitCommit, Check, X, Copy, Split, AlignJustify, ArrowRight } from 'lucide-react';
import { PatchChange } from '../types';

interface DiffViewerProps {
  key?: string;
  patch: PatchChange;
  onApply: (patch: PatchChange) => void;
  onReject: (patchId: string) => void;
}

export function DiffViewer({ patch, onApply, onReject }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  const origLines = patch.originalCode.split('\n');
  const modLines = patch.modifiedCode.split('\n');

  const handleCopyDiff = () => {
    const diffText = `--- a/${patch.filePath}\n+++ b/${patch.filePath}\n${patch.modifiedCode}`;
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/90 overflow-hidden shadow-lg space-y-0 my-3">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Suggested Code Patch:</span>
          <span className="font-mono text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
            {patch.filePath}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
            {patch.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle view mode */}
          <div className="flex rounded-md bg-slate-900 border border-slate-700 p-0.5 text-[11px]">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                viewMode === 'unified' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlignJustify className="w-3 h-3" />
              Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                viewMode === 'split' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3 h-3" />
              Split
            </button>
          </div>

          <button
            onClick={handleCopyDiff}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition"
            title="Copy Unified Diff"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Diff Description */}
      {patch.description && (
        <div className="px-4 py-2 text-xs text-slate-300 bg-slate-900/50 border-b border-slate-800">
          {patch.description}
        </div>
      )}

      {/* Diff Content */}
      <div className="max-h-72 overflow-y-auto font-mono text-xs p-3 bg-slate-950">
        {viewMode === 'unified' ? (
          <div className="space-y-0.5">
            {modLines.map((line, idx) => {
              const isAddition = !origLines.includes(line);
              return (
                <div
                  key={idx}
                  className={`flex px-2 py-0.5 rounded-xs leading-5 ${
                    isAddition ? 'bg-emerald-950/50 text-emerald-300 border-l-2 border-emerald-500' : 'text-slate-300'
                  }`}
                >
                  <span className="w-8 text-slate-600 select-none text-right pr-3">{idx + 1}</span>
                  <span className="w-4 select-none font-bold text-slate-500">{isAddition ? '+' : ' '}</span>
                  <span className="flex-1 whitespace-pre-wrap">{line}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="border-r border-slate-800 pr-2">
              <div className="text-slate-500 font-bold mb-1 pb-1 border-b border-slate-800">Original</div>
              {origLines.map((line, idx) => (
                <div key={idx} className="text-rose-400/80 bg-rose-950/20 px-1 py-0.5 leading-4 whitespace-pre-wrap">
                  {line || ' '}
                </div>
              ))}
            </div>
            <div className="pl-1">
              <div className="text-emerald-400 font-bold mb-1 pb-1 border-b border-slate-800">Modified</div>
              {modLines.map((line, idx) => (
                <div key={idx} className="text-emerald-300 bg-emerald-950/30 px-1 py-0.5 leading-4 whitespace-pre-wrap">
                  {line || ' '}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {patch.status === 'pending' && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 border-t border-slate-700">
          <span className="text-xs text-slate-400">Review and apply code patch to workspace buffer:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject(patch.id)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              Reject
            </button>
            <button
              onClick={() => onApply(patch)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Patch to Repository
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

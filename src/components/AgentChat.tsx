import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Shield, RefreshCw, CheckCircle2, AlertCircle, Wrench, FileCode, Check, Copy } from 'lucide-react';
import { ChatMessage, PatchChange, RepositoryFile } from '../types';
import { DiffViewer } from './DiffViewer';

interface AgentChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeFile: RepositoryFile | null;
  onApplyPatch: (patch: PatchChange) => void;
  onRejectPatch: (patchId: string) => void;
  isVaultUnlocked: boolean;
  modelName: string;
}

export function AgentChat({
  messages,
  onSendMessage,
  isLoading,
  activeFile,
  onApplyPatch,
  onRejectPatch,
  isVaultUnlocked,
  modelName,
}: AgentChatProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="agent-chat-container" className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">AI Developer Agent</span>
            <span className="text-[10px] text-slate-400 ml-2 font-mono">({modelName})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* E2EE indicator badge */}
          <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
            <Shield className="w-3 h-3" />
            <span>{isVaultUnlocked ? 'E2EE Active (AES-256)' : 'Encrypted Vault'}</span>
          </div>
        </div>
      </div>

      {/* Active Buffer Context Notice */}
      {activeFile && (
        <div className="px-4 py-1.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <FileCode className="w-3 h-3 text-sky-400" />
            Active Buffer: <code className="text-sky-300">{activeFile.path}</code> ({activeFile.content.length} chars)
          </span>
          <span className="text-emerald-400 font-mono text-[10px]">Loaded in Context</span>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-semibold text-white">Repository AI Agent Ready</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ask the agent to refactor code, generate surgical unified diffs, add features, or write unit tests against your active files.
              </p>
            </div>

            {/* Quick action chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
              <button
                onClick={() => handleQuickPrompt(`Review "${activeFile?.path || 'active file'}" and refactor for performance, strict typing, and clean error handling.`)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                🛠️ Refactor & Add Types
              </button>
              <button
                onClick={() => handleQuickPrompt(`Generate comprehensive unit tests for "${activeFile?.path || 'active file'}".`)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                🧪 Generate Unit Tests
              </button>
              <button
                onClick={() => handleQuickPrompt(`Audit "${activeFile?.path || 'active file'}" for security vulnerabilities, API key leaks, and input sanitization.`)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                🔒 Security & Sanitization
              </button>
              <button
                onClick={() => handleQuickPrompt(`Implement CDK redeem key verification and token budget tracker logic in "${activeFile?.path || 'active file'}".`)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                🔑 Add CDK Verification
              </button>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role !== 'user' && (
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Box */}
                <div
                  className={`p-3.5 rounded-2xl relative group ${
                    m.role === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-xs'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-xs shadow-md'
                  }`}
                >
                  {/* Tool call traces */}
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mb-2.5 pb-2.5 border-b border-slate-700/50 space-y-1">
                      {m.toolCalls.map((tc, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono bg-slate-900/60 px-2 py-1 rounded">
                          <Wrench className="w-3 h-3 text-amber-400" />
                          <span>Tool: {tc.toolName}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-slate-300">{tc.outputSummary}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed selection:bg-sky-500/40">
                    {m.content}
                  </div>

                  {/* Suggested Diff / Patch Proposals */}
                  {m.suggestedPatches && m.suggestedPatches.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60">
                      {m.suggestedPatches.map((patch) => (
                        <DiffViewer
                          key={patch.id}
                          patch={patch}
                          onApply={onApplyPatch}
                          onReject={onRejectPatch}
                        />
                      ))}
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyMessage(m.content, m.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded bg-slate-900/80 transition"
                    title="Copy message"
                  >
                    {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                {/* Metadata Footer */}
                <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {m.modelUsed && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{m.modelUsed}</span>
                    </>
                  )}
                  {m.tokensUsed && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-400">
                        {m.tokensUsed.totalTokens} tokens
                      </span>
                    </>
                  )}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 text-xs items-start">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/90 text-slate-300 border border-slate-700/60 rounded-tl-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Agent reasoning & generating patch ({modelName})...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/95">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="agent-chat-input"
            type="text"
            placeholder={activeFile ? `Ask agent to modify "${activeFile.name}" or explain repository...` : "Ask AI Agent to inspect repo or write code..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
          />
          <button
            id="agent-chat-send-button"
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

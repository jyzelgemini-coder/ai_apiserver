import React, { useState } from 'react';
import {
  Send,
  Play,
  RefreshCw,
  Terminal,
  Cpu,
  Clock,
  Zap,
  Sparkles,
  CheckCircle2,
  Code2
} from 'lucide-react';
import { RedeemedLicense } from '../types';

interface PlaygroundViewProps {
  license: RedeemedLicense | null;
  onGoToRedeem: () => void;
  showToast: (msg: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  latency?: number;
  tokens?: number;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  license,
  onGoToRedeem,
  showToast,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am connected to the Gemini Agent Gateway. Send me any coding prompt or algorithm to verify your API Key and token balance.',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeKey = license?.generatedApiKey || license?.cdk || '';

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputPrompt.trim();
    if (!prompt || isLoading) return;

    if (!activeKey) {
      showToast('Please redeem a CDK first to get an API Key.');
      onGoToRedeem();
      return;
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    const startTime = Date.now();
    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model: 'gemini-3.8-flash',
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const latency = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to complete prompt.');
      }

      const replyContent =
        data.choices?.[0]?.message?.content || 'No response generated.';
      const tokens = data.usage?.total_tokens || Math.round((prompt.length + replyContent.length) / 4);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyContent,
          latency,
          tokens,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Connection failed'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive API Key Tester</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Live API Key & Gateway Playground</h1>
          <p className="text-xs text-slate-400">
            Verify your generated API key and test model streaming before configuring VS Code.
          </p>
        </div>

        {license ? (
          <div className="text-right">
            <div className="text-xs font-mono text-amber-300">
              Key: {license.generatedApiKey.substring(0, 16)}••••
            </div>
            <div className="text-[11px] text-slate-400">
              Quota: {((license.tokensGranted - license.tokensUsed) / 1_000_000).toFixed(2)}M Tokens Remaining
            </div>
          </div>
        ) : (
          <button
            onClick={onGoToRedeem}
            className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-400 transition cursor-pointer"
          >
            Redeem CDK to Activate →
          </button>
        )}
      </div>

      {/* Chat Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col h-[520px]">
        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800/90 text-slate-200 rounded-tl-none space-y-2'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                {m.role === 'assistant' && m.latency !== undefined && (
                  <div className="pt-2 border-t border-slate-800/70 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>{m.latency}ms</span>
                    </span>
                    {m.tokens !== undefined && (
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>{m.tokens} tokens</span>
                      </span>
                    )}
                    <span className="text-emerald-400">gemini-3.8-flash</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Generating response via /v1/chat/completions...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask a coding question or test prompt..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs sm:text-sm transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Example Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 text-[11px]">Quick Prompts:</span>
        {[
          'Write a TypeScript LRU Cache class',
          'Explain how to configure Cline in VS Code',
          'Write a React custom hook for debouncing input',
        ].map((promptText) => (
          <button
            key={promptText}
            onClick={() => {
              setInputPrompt(promptText);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition cursor-pointer"
          >
            {promptText}
          </button>
        ))}
      </div>
    </div>
  );
};

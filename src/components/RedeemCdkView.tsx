import React, { useState } from 'react';
import {
  Key,
  Check,
  Copy,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  Activity,
  Zap,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { RedeemedLicense } from '../types';

interface RedeemCdkViewProps {
  license: RedeemedLicense | null;
  onRedeemSuccess: (license: RedeemedLicense) => void;
  onGoToVsCode: () => void;
  onGoToCheck?: () => void;
  onClearLicense: () => void;
  showToast: (msg: string) => void;
}

export const RedeemCdkView: React.FC<RedeemCdkViewProps> = ({
  license,
  onRedeemSuccess,
  onGoToVsCode,
  onGoToCheck,
  onClearLicense,
  showToast,
}) => {
  const [cdkInput, setCdkInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRedeem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = cdkInput.trim().toUpperCase();
    if (!code) {
      setErrorMsg('Please enter your CDK activation code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/cdk/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cdk: code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || 'Invalid CDK code. Please verify your activation code or contact support.'
        );
      }

      const newLicense: RedeemedLicense = {
        cdk: data.cdk,
        tier: data.tier,
        name: data.name,
        tokensGranted: data.tokensGranted,
        tokensUsed: 0,
        accuracyTier: data.accuracyTier,
        generatedApiKey: data.apiKey,
        expiresAt: data.expiresAt,
        redeemedAt: new Date().toISOString(),
      };

      onRedeemSuccess(newLicense);
      setCdkInput('');
      showToast(`CDK Redeemed! Generated API Key with ${(data.tokensGranted / 1_000_000).toFixed(0)}M tokens.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to redeem CDK. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const baseUrl = `${originUrl}/v1`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Redeem CDK for VS Code API Key
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Enter your CDK voucher code to generate an OpenAI-compatible API key for Cline, Continue, and VS Code agents.
        </p>
      </div>

      {/* When Customer Has NOT Redeemed Yet (Clean Single Card) */}
      {!license ? (
        <div className="bg-[#0b101c] border border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xl shadow-black/40 space-y-5 relative overflow-hidden">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="cdkInput" className="block text-xs font-medium text-slate-300">
                  CDK Activation Code
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  48-Hex Format (MD-...)
                </span>
              </div>
              <input
                id="cdkInput"
                type="text"
                value={cdkInput}
                onChange={(e) => {
                  setCdkInput(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter CDK (e.g. MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457)"
                className="w-full px-4 py-3 bg-[#050810] border border-slate-800 rounded-xl text-slate-100 font-mono text-xs sm:text-sm placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 uppercase tracking-wider"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !cdkInput.trim()}
              className="w-full h-11 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-sky-600/20"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying CDK...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Redeem CDK & Generate API Key</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center leading-relaxed">
            Your generated API key will have direct access to Gemini models via the OpenAI-compatible gateway.
          </div>
        </div>
      ) : (
        /* When Customer Has Successfully Redeemed their CDK */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="font-semibold text-slate-100 text-sm sm:text-base">
                  API Key Generated Successfully
                </h2>
                <p className="text-xs text-slate-400">
                  CDK: <span className="font-mono text-slate-300">{license.cdk}</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-emerald-400 font-medium">
              {(license.tokensGranted / 1_000_000).toFixed(0)}M Tokens
            </span>
          </div>

          {/* Generated API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium">Your API Key:</span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showKey ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
              <code className="text-xs font-mono text-amber-300 flex-1 truncate select-all">
                {showKey
                  ? license.generatedApiKey
                  : `${license.generatedApiKey.substring(0, 16)}••••••••••••`}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(license.generatedApiKey, 'API Key')}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Copy API Key"
              >
                {copiedField === 'API Key' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300 block">
              OpenAI Base URL for VS Code:
            </span>
            <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
              <code className="text-xs font-mono text-sky-300 flex-1 truncate select-all">
                {baseUrl}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(baseUrl, 'Base URL')}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Copy Base URL"
              >
                {copiedField === 'Base URL' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Action: Open Guide & Diagnostics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onGoToVsCode}
              className="h-11 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>VS Code Setup Guide</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onGoToCheck && (
              <button
                type="button"
                onClick={onGoToCheck}
                className="h-11 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Test & Quota Inspector</span>
              </button>
            )}
          </div>

          {/* Reset / Redeem another */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onClearLicense}
              className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Redeem another CDK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

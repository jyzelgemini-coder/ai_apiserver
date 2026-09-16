import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  Gauge,
  Zap,
  RefreshCw,
  Play,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Radio,
  ExternalLink
} from 'lucide-react';
import { ApiKeyDetails, DiagnosticResult, RedeemedLicense } from '../types';

interface ApiKeyLiveStatusProps {
  license: RedeemedLicense | null;
  selectedModel?: string;
  onGoToRedeem?: () => void;
  showToast: (msg: string) => void;
  className?: string;
}

export const ApiKeyLiveStatus: React.FC<ApiKeyLiveStatusProps> = ({
  license,
  selectedModel = 'gemini-3.8-flash',
  onGoToRedeem,
  showToast,
  className = '',
}) => {
  const defaultKey = license?.generatedApiKey || '';
  const [apiKeyInput, setApiKeyInput] = useState<string>(defaultKey);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [keyDetails, setKeyDetails] = useState<ApiKeyDetails | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Live countdown state (seconds remaining until expiration)
  const [liveSecondsRemaining, setLiveSecondsRemaining] = useState<number | null>(null);

  // Keep input synced if user redeems a new license
  useEffect(() => {
    if (license?.generatedApiKey && !apiKeyInput) {
      setApiKeyInput(license.generatedApiKey);
    }
  }, [license?.generatedApiKey]);

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // Inspect API Key and Quota
  const inspectKey = async (keyToTest?: string, silent = false) => {
    const key = (keyToTest || apiKeyInput).trim();
    if (!key) {
      setErrorMessage('Please enter an API key or redeem a CDK first.');
      return;
    }

    setHasChecked(true);

    if (!silent) {
      setIsInspecting(true);
      setErrorMessage(null);
    }

    try {
      const res = await fetch('/api/key/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });

      const data: ApiKeyDetails = await res.json();
      setKeyDetails(data);

      if (data.expiresInSeconds !== undefined) {
        setLiveSecondsRemaining(data.expiresInSeconds);
      }

      if (!data.valid && !silent) {
        setErrorMessage(data.error || 'The API key is invalid, revoked, or expired.');
      }
    } catch (err: any) {
      if (!silent) {
        setErrorMessage(err.message || 'Failed to inspect key status.');
      }
    } finally {
      if (!silent) {
        setIsInspecting(false);
      }
    }
  };

  // Run Gateway Diagnostic Test
  const runDiagnosticTest = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setErrorMessage('Please enter or redeem an API key before running diagnostics.');
      return;
    }

    setHasChecked(true);
    setIsDiagnosing(true);
    setDiagnosticResult(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/key/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, model: selectedModel }),
      });

      const data: DiagnosticResult = await res.json();
      setDiagnosticResult(data);

      if (data.inspection) {
        setKeyDetails(data.inspection);
        if (data.inspection.expiresInSeconds !== undefined) {
          setLiveSecondsRemaining(data.inspection.expiresInSeconds);
        }
      }

      if (data.success) {
        showToast('Gateway diagnostic passed: Key is active & healthy!');
      } else {
        setErrorMessage(data.message || 'Diagnostic failed: Gateway rejected the key.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing diagnostic request to API Gateway.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Live Auto-Refresh interval (every 6 seconds if enabled and already checked)
  useEffect(() => {
    if (!autoRefresh || !apiKeyInput || !hasChecked || !keyDetails?.valid) return;

    const interval = setInterval(() => {
      inspectKey(apiKeyInput, true);
    }, 6000);

    return () => clearInterval(interval);
  }, [autoRefresh, apiKeyInput, hasChecked, keyDetails?.valid]);

  // Live countdown timer ticking down every 1 second
  useEffect(() => {
    if (liveSecondsRemaining === null || liveSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setLiveSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [liveSecondsRemaining]);

  // Format seconds into human readable countdown
  const formatCountdown = (totalSeconds: number | null) => {
    if (totalSeconds === null) return 'Calculating...';
    if (totalSeconds <= 0) return 'Expired';

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not specified';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Format relative time helper
  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return 'Not used yet';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${Math.floor(diffHr / 24)}d ago`;
    } catch {
      return isoString;
    }
  };

  // Determine key status badge styling
  const getStatusBadge = () => {
    if (!hasChecked || !keyDetails) return null;
    if (keyDetails.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Active & Ready
        </span>
      );
    }
    if (keyDetails.status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Expired
        </span>
      );
    }
    if (keyDetails.status === 'exhausted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Quota Exhausted
        </span>
      );
    }
    if (keyDetails.status === 'revoked') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          Revoked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        Invalid Key
      </span>
    );
  };

  const tokensTotal = keyDetails?.tokensTotal || 0;
  const tokensUsed = keyDetails?.tokensUsed ?? 0;
  const tokensRemaining = keyDetails ? keyDetails.tokensRemaining : 0;
  const usagePercentage = tokensTotal > 0 ? Math.min(100, Math.max(0, (tokensUsed / tokensTotal) * 100)) : 0;

  return (
    <div className={`bg-[#111622] border border-slate-800 rounded-xl p-5 space-y-5 shadow-lg ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              API Key Live Inspector & Gateway Diagnostics
              {getStatusBadge()}
            </h3>
            <p className="text-[11px] text-slate-400">
              Check real-time token quota, remaining balance, active usage, and key expiration date.
            </p>
          </div>
        </div>

        {/* Live Auto-Refresh Toggle */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
              autoRefresh
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Automatically poll remaining tokens every 6 seconds while coding"
          >
            <Radio className={`w-3 h-3 ${autoRefresh ? 'text-sky-400 animate-pulse' : ''}`} />
            <span>{autoRefresh ? 'Live Polling ON' : 'Live Polling'}</span>
          </button>
        </div>
      </div>

      {/* Input Field and Action Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setKeyDetails(null);
                setDiagnosticResult(null);
                setHasChecked(false);
                setErrorMessage(null);
              }}
              placeholder="Paste generated API key (sk_agent_...) or CDK voucher (e.g. MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 outline-none transition pr-16"
            />
            {license?.generatedApiKey && apiKeyInput !== license.generatedApiKey && (
              <button
                type="button"
                onClick={() => {
                  setApiKeyInput(license.generatedApiKey);
                  setKeyDetails(null);
                  setDiagnosticResult(null);
                  setHasChecked(false);
                  setErrorMessage(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 cursor-pointer transition"
              >
                Use Active
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Run Diagnostic Button */}
            <button
              onClick={runDiagnosticTest}
              disabled={isDiagnosing || isInspecting}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-sky-900/30"
              title="Performs an instant test request to the API Gateway using your key"
            >
              {isDiagnosing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>{isDiagnosing ? 'Testing Gateway...' : 'Run Gateway Diagnostics'}</span>
            </button>

            {/* Check Token & Quota Button */}
            <button
              onClick={() => inspectKey()}
              disabled={isInspecting || isDiagnosing}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Check quota balance and expiration data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin text-sky-400' : ''}`} />
              <span>{isInspecting ? 'Checking...' : 'Check Key & Quota'}</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Key Verification Notice:</span>
              <p>{errorMessage}</p>
              {onGoToRedeem && (
                <button
                  onClick={onGoToRedeem}
                  className="text-sky-400 hover:underline text-[11px] font-medium block pt-1 cursor-pointer"
                >
                  Redeem a new CDK to generate an active API key &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Token & Expiration Dashboard Grid & Quota Bar */}
      {!hasChecked || !keyDetails ? (
        <div className="p-6 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Gauge className="w-5 h-5 text-sky-400/80" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
              Enter API Key and Click Check to Inspect Quota
            </h4>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
              Paste your API key above and click <strong className="text-slate-200">Check Key & Quota</strong> or <strong className="text-sky-400">Run Gateway Diagnostics</strong> to view your real-time token balance, usage, and expiration date.
            </p>
          </div>
          {license?.generatedApiKey && (
            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setApiKeyInput(license.generatedApiKey);
                  inspectKey(license.generatedApiKey);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Check Active License Key ({license.generatedApiKey.slice(0, 14)}...)</span>
              </button>
            </div>
          )}
        </div>
      ) : keyDetails && !keyDetails.valid ? (
        <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <h4 className="text-xs sm:text-sm font-semibold text-rose-200">
            Unrecognized or Inactive API Key
          </h4>
          <p className="text-xs text-rose-300 max-w-md mx-auto">
            {keyDetails.error || 'The entered key is not recognized or has expired. Please verify the characters or redeem an active CDK.'}
          </p>
          {onGoToRedeem && (
            <button
              onClick={onGoToRedeem}
              className="text-sky-400 hover:underline text-xs font-medium inline-block pt-1 cursor-pointer"
            >
              Go to CDK Redemption &rarr;
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Metric 1: Remaining Tokens */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  Tokens Remaining
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {(tokensRemaining / 1_000_000).toFixed(2)}M
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 tracking-tight">
                {tokensRemaining.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Granted: <strong className="text-slate-300 font-mono">{tokensTotal.toLocaleString()}</strong>
              </span>
            </div>

            {/* Metric 2: Tokens Used */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  Tokens Used
                </span>
                <span className="text-[10px] text-sky-400 font-mono">
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-sky-300 tracking-tight">
                {tokensUsed.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Total consumed across sessions
              </span>
            </div>

            {/* Metric 3: Expiration Date */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Expiration Date
                </span>
                {keyDetails?.isExpired && (
                  <span className="text-[10px] text-rose-400 font-semibold">Expired</span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate pt-0.5">
                {formatDate(keyDetails?.expiresAt)}
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Valid 1-Year production lifecycle
              </span>
            </div>

            {/* Metric 4: Real-time Countdown & Last Used */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Time Remaining
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">Real-time</span>
              </div>
              <div className="text-sm sm:text-base font-bold font-mono text-indigo-300 tracking-tight pt-0.5">
                {formatCountdown(liveSecondsRemaining)}
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                Last active: <strong className="text-slate-300">{formatRelativeTime(keyDetails?.lastUsedAt)}</strong>
              </span>
            </div>
          </div>

          {/* Visual Quota Bar */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Quota Allocation & Depletion:</span>
              <span className="font-mono text-[11px] text-slate-300">
                <strong className="text-emerald-400">{tokensRemaining.toLocaleString()}</strong> remaining / {tokensTotal.toLocaleString()} total
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${Math.min(100, usagePercentage)}%` }}
                className={`h-full transition-all duration-500 ${
                  usagePercentage > 90
                    ? 'bg-rose-500'
                    : usagePercentage > 70
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                }`}
              />
              <div
                style={{ width: `${Math.max(0, 100 - usagePercentage)}%` }}
                className="h-full bg-emerald-500/70"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Used: {tokensUsed.toLocaleString()} ({usagePercentage.toFixed(1)}%)</span>
              <span>{keyDetails?.tier || 'Studio Token Tier'}</span>
            </div>
          </div>
        </>
      )}

      {/* Diagnostic Test Results Box (Shown when user runs diagnostics) */}
      {diagnosticResult && (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            diagnosticResult.success
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-rose-950/20 border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {diagnosticResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span className="text-xs font-semibold text-slate-100">
                {diagnosticResult.success ? 'Gateway Diagnostic Passed' : 'Gateway Diagnostic Failed'}
              </span>
            </div>
            {diagnosticResult.gateway?.latencyMs !== undefined && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800">
                Latency: {diagnosticResult.gateway.latencyMs}ms
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Gateway Status:</span>
              <strong className="text-emerald-400 font-mono">
                {diagnosticResult.gateway?.httpStatus === 200 ? '200 OK (Online)' : 'Failed'}
              </strong>
            </div>

            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Model Handshake:</span>
              <strong className="text-sky-300 font-mono truncate block">
                {diagnosticResult.gateway?.testedModel || selectedModel}
              </strong>
            </div>

            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Probe Response:</span>
              <strong className="text-slate-200 font-mono truncate block">
                {diagnosticResult.testResponse || 'OK'}
              </strong>
            </div>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/50">
            {diagnosticResult.message}
          </div>
        </div>
      )}
    </div>
  );
};

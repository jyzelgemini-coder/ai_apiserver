import { useState } from 'react';
import { Key, ShieldCheck, Zap, Sparkles, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, Cpu, Server, Lock } from 'lucide-react';
import { RedeemedLicense, ApiConfiguration } from '../types';

interface CdkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLicense: RedeemedLicense | null;
  onLicenseUpdate: (license: RedeemedLicense) => void;
  apiConfig: ApiConfiguration;
  onApiConfigUpdate: (config: ApiConfiguration) => void;
  tokenBalance: { total: number; used: number };
}

export function CdkModal({
  isOpen,
  onClose,
  currentLicense,
  onLicenseUpdate,
  apiConfig,
  onApiConfigUpdate,
  tokenBalance,
}: CdkModalProps) {
  const [cdkInput, setCdkInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Custom connection test
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Local API config state
  const [localBaseUrl, setLocalBaseUrl] = useState(apiConfig.apiBaseUrl);
  const [localApiKey, setLocalApiKey] = useState(apiConfig.customApiKey);
  const [useCustomKey, setUseCustomKey] = useState(apiConfig.useCustomKey);

  // CDK generator for customer distribution
  const [generatedCustomerCdk, setGeneratedCustomerCdk] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRedeem = async (codeToRedeem?: string) => {
    const code = (codeToRedeem || cdkInput).trim();
    if (!code) {
      setError('Please enter a valid CDK code.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/cdk/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cdk: code }),
      });
      const data = await res.json();

      if (data.success) {
        const newLicense: RedeemedLicense = {
          cdk: data.cdk,
          tier: data.tier,
          name: data.name,
          tokensGranted: data.tokensGranted,
          tokensUsed: 0,
          accuracyTier: data.accuracyTier,
          generatedApiKey: data.generatedApiKey,
          expiresAt: data.expiresAt,
          redeemedAt: new Date().toISOString(),
        };
        onLicenseUpdate(newLicense);
        setSuccessMsg(`Successfully redeemed ${data.name}! ${data.tokensGranted.toLocaleString()} tokens unlocked.`);
        setCdkInput('');
      } else {
        setError(data.error || 'Failed to redeem CDK key.');
      }
    } catch {
      setError('Network error while redeeming CDK.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: useCustomKey ? localApiKey : undefined,
          apiBaseUrl: localBaseUrl || undefined,
          model: 'gemini-3.8-flash',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Connected successfully (${data.model}) - Latency: ${data.latencyMs}ms`,
          latency: data.latencyMs,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Failed to test connection endpoint.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const saveApiConfiguration = () => {
    onApiConfigUpdate({
      apiBaseUrl: localBaseUrl,
      customApiKey: localApiKey,
      useCustomKey,
    });
    setSuccessMsg('API Gateway configurations updated.');
  };

  const generateNewCustomerCdk = (tierTokens: '1M' | '10M' | '20M') => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const tokenPart = tierTokens;
    const key = `CDK-${tokenPart}-${randomHex}`;
    setGeneratedCustomerCdk(key);
  };

  const usedPercent = Math.min(
    100,
    Math.round((tokenBalance.used / (tokenBalance.total || 1_000_000)) * 100)
  );

  return (
    <div id="cdk-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div id="cdk-modal-container" className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">CDK License & Token Manager</h2>
              <p className="text-xs text-slate-400">Redeem customer activation keys & configure custom API endpoints</p>
            </div>
          </div>
          <button
            id="cdk-close-button"
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Active Token Balance Meter */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-200">Active Token Balance</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentLicense ? currentLicense.tier : '1M Developer Base'}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-300">
                {(tokenBalance.total - tokenBalance.used).toLocaleString()} / {tokenBalance.total.toLocaleString()} tokens left
              </span>
            </div>

            <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  usedPercent > 85 ? 'bg-rose-500' : usedPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(2, 100 - usedPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Used: {tokenBalance.used.toLocaleString()} tokens ({usedPercent}%)</span>
              <span>Capacity: {tokenBalance.total >= 20_000_000 ? '20M Ultra Tier' : tokenBalance.total >= 10_000_000 ? '10M Studio Tier' : '1M Base Tier'}</span>
            </div>
          </div>

          {/* CDK Redeem Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Redeem Customer Activation CDK
            </label>
            <div className="flex gap-2">
              <input
                id="cdk-code-input"
                type="text"
                placeholder="e.g. MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457"
                value={cdkInput}
                onChange={(e) => setCdkInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono uppercase"
              />
              <button
                id="cdk-redeem-submit-button"
                onClick={() => handleRedeem()}
                disabled={loading || !cdkInput.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/10"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Redeem
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Customer API Gateway & Custom Base URL Configuration */}
          <div className="border-t border-slate-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                API Base URL & Customer Key Settings
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomKey}
                  onChange={(e) => setUseCustomKey(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
                />
                <span>Use Customer Key / Gateway</span>
              </label>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Custom API Base URL (optional proxy / gateway)</label>
                <input
                  type="text"
                  placeholder="https://generativelanguage.googleapis.com (or enterprise reverse proxy)"
                  value={localBaseUrl}
                  onChange={(e) => setLocalBaseUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 font-mono"
                />
              </div>

              {useCustomKey && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Customer API Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="AIzaSy... (leave blank to use server environment default)"
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 font-mono pr-10"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  id="test-connection-button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition flex items-center gap-1.5 border border-slate-700"
                >
                  {testingConnection ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3 text-sky-400" />}
                  Test Connection & Latency
                </button>

                <button
                  id="save-api-config-button"
                  onClick={saveApiConfiguration}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition"
                >
                  Save Settings
                </button>
              </div>

              {testResult && (
                <div
                  className={`text-xs p-2.5 rounded-lg border flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Provisioning: Generate CDK for Customer */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Customer CDK Key Generator
              </label>
            </div>
            <p className="text-xs text-slate-400">Generate activation CDK keys to deliver to clients or team members:</p>

            <div className="flex gap-2">
              <button
                onClick={() => generateNewCustomerCdk('1M')}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                + 1M Token CDK
              </button>
              <button
                onClick={() => generateNewCustomerCdk('10M')}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50 transition"
              >
                + 10M Token CDK
              </button>
              <button
                onClick={() => generateNewCustomerCdk('20M')}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 transition"
              >
                + 20M Token CDK
              </button>
            </div>

            {generatedCustomerCdk && (
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-xs font-mono text-amber-300">
                <span>{generatedCustomerCdk}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCustomerCdk);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy CDK'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

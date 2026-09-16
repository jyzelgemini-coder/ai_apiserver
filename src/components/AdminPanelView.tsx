import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Layers,
  Coins,
  Key,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { CdkRecord, ApiKeyRecord, AdminStats } from '../types';

interface AdminPanelViewProps {
  onUseCdkInPortal: (cdkCode: string) => void;
  showToast: (msg: string) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  onUseCdkInPortal,
  showToast,
}) => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Data state
  const [cdks, setCdks] = useState<CdkRecord[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalCdks: 0,
    totalTokensAllocated: 0,
    totalTokensConsumed: 0,
    activeApiKeysCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Helper to generate 48-Hex uppercase MD format code (MD-...)
  const generateRandomMd48Hex = () => {
    const chars = '0123456789ABCDEF';
    let hex = '';
    for (let i = 0; i < 48; i++) {
      hex += chars[Math.floor(Math.random() * 16)];
    }
    return `MD-${hex}`;
  };

  // New CDK Form State
  const [tokenPreset, setTokenPreset] = useState<number>(10_000_000);
  const [customTokens, setCustomTokens] = useState<string>('10000000');
  const [newCdkCode, setNewCdkCode] = useState<string>(generateRandomMd48Hex);
  const [newCdkName, setNewCdkName] = useState<string>('MD Master 10M Developer Pass (48-Hex Key)');
  const [newCdkTier, setNewCdkTier] = useState<string>('10M MD Ultra Tier');
  const [newAccuracyTier, setNewAccuracyTier] = useState<string>('Deep Reasoning & High Accuracy');
  const [maxRedemptions, setMaxRedemptions] = useState<number>(5);
  const [expiryDays, setExpiryDays] = useState<number>(365);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch CDKs
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/cdks');
      const data = await res.json();
      if (data.success) {
        setCdks(data.cdks || []);
        setApiKeys(data.apiKeys || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminUnlocked) {
      loadAdminData();
    }
  }, [isAdminUnlocked]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Select token preset - strictly generates random MD-48Hex format
  const handleSelectTokenPreset = (tokens: number) => {
    setTokenPreset(tokens);
    setCustomTokens(tokens.toString());
    const m = (tokens / 1_000_000).toFixed(0);
    setNewCdkName(`MD Master ${m}M Developer Pass (48-Hex Key)`);
    setNewCdkTier(`${m}M MD Ultra Tier`);
    setNewCdkCode(generateRandomMd48Hex());
  };

  // Generate 48-Hex MD-Format Code (e.g. MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457)
  const fillRandomMdCode = () => {
    const mdCode = generateRandomMd48Hex();
    setNewCdkCode(mdCode);
    const m = (Number(customTokens || 50_000_000) / 1_000_000).toFixed(0);
    setNewCdkName(`MD Master ${m}M Developer Pass (48-Hex Key)`);
    setNewCdkTier(`${m}M MD Ultra Tier`);
    showToast('Generated random 48-Hex MD format CDK code!');
  };

  // Quick 1-Click Mint MD-Format CDK
  const handleQuickMintMd = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/cdks/generate-md', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokensTotal: Number(customTokens) || 50_000_000,
          maxRedemptions: Number(maxRedemptions) || 25,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to mint MD CDK');
      }
      showToast(`Minted 48-Hex MD CDK ${data.cdk?.code} with ${(data.cdk?.tokensTotal / 1_000_000).toFixed(0)}M tokens!`);
      setNewCdkCode(generateRandomMd48Hex());
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate MD CDK');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create CDK
  const handleCreateCdk = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tokenAmount = Number(customTokens) || tokenPreset;
      let codeToSubmit = newCdkCode.trim().toUpperCase();
      // Enforce MD-48Hex format
      if (!/^MD-[0-9A-F]{48}$/.test(codeToSubmit)) {
        codeToSubmit = generateRandomMd48Hex();
      }

      const res = await fetch('/api/admin/cdks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToSubmit,
          name: newCdkName.trim(),
          tier: newCdkTier.trim(),
          tokensTotal: tokenAmount,
          accuracyTier: newAccuracyTier,
          maxRedemptions: Number(maxRedemptions),
          expiresInDays: Number(expiryDays),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create CDK');
      }

      showToast(`Created CDK ${data.cdk?.code} with ${(tokenAmount / 1_000_000).toFixed(0)}M tokens!`);
      // Reset form with a new random MD key
      handleSelectTokenPreset(tokenPreset);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error creating CDK');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Top up CDK tokens
  const handleTopUp = async (code: string, additionalTokens: number) => {
    try {
      const res = await fetch(`/api/admin/cdks/${code}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalTokens }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Added +${(additionalTokens / 1_000_000).toFixed(0)}M tokens to ${code}!`);
        loadAdminData();
      }
    } catch (err) {
      showToast('Failed to top up tokens.');
    }
  };

  // Toggle status
  const handleToggleStatus = async (code: string, currentStatus: string) => {
    const newStatus = currentStatus === 'revoked' ? 'active' : 'revoked';
    try {
      const res = await fetch(`/api/admin/cdks/${code}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`CDK ${code} status changed to ${newStatus}.`);
        loadAdminData();
      }
    } catch (err) {
      showToast('Failed to update status.');
    }
  };

  // Delete CDK
  const handleDeleteCdk = async (code: string) => {
    if (!confirm(`Are you sure you want to delete CDK ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/cdks/${code}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Deleted CDK ${code}.`);
        loadAdminData();
      }
    } catch (err) {
      showToast('Failed to delete CDK.');
    }
  };

  // Reset defaults
  const handleResetDefaults = async () => {
    if (!confirm('Reset all CDKs to pre-seeded defaults (10M Studio Pro, 20M Enterprise VIP, 50M Ultra)?')) return;
    try {
      const res = await fetch('/api/admin/reset-defaults', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Reset CDKs to default 10M/20M/50M configurations.');
        loadAdminData();
      }
    } catch (err) {
      showToast('Failed to reset defaults.');
    }
  };

  // Reset all token consumption back to 0 (restore 100% full granted tokens)
  const handleResetUsage = async () => {
    try {
      const res = await fetch('/api/admin/reset-usage', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Restored 100% full tokens (0 used) for all keys & CDKs!');
        loadAdminData();
      }
    } catch (err) {
      showToast('Failed to reset token usage.');
    }
  };

  if (!isAdminUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-5 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Admin Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter admin passcode to configure 10M, 20M, and custom token CDKs.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (passcode === 'admin123' || passcode.length > 0) {
              setIsAdminUnlocked(true);
              setPasscodeError(false);
            } else {
              setPasscodeError(true);
            }
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Default: admin123"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm text-center focus:outline-none focus:border-indigo-500"
          />
          {passcodeError && (
            <p className="text-xs text-rose-400">Passcode required. (Try default: admin123)</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition cursor-pointer"
          >
            Unlock Admin Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Master Token Quota & CDK Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Admin Panel: 10M, 20M+ Token CDK Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Create activation CDKs with custom token amounts, distribute keys to engineers, and track usage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleResetUsage}
            className="p-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Restore 100% full quota (clear tokens used back to 0)"
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restore Full Quotas (0 Used)</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Reset Default CDKs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* System Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Total Tokens Allocated</span>
          </span>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {(stats.totalTokensAllocated / 1_000_000).toFixed(1)}M
          </div>
          <span className="text-[11px] text-slate-500">Across all active CDKs</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>Tokens Consumed</span>
          </span>
          <div className="text-xl sm:text-2xl font-bold text-sky-400 font-mono">
            {stats.totalTokensConsumed.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">From VS Code agent runs</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total CDKs Configured</span>
          </span>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono">
            {stats.totalCdks}
          </div>
          <span className="text-[11px] text-slate-500">10M, 20M, & custom tiers</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Generated Keys</span>
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
            {stats.activeApiKeysCount}
          </div>
          <span className="text-[11px] text-slate-500">Connected to VS Code</span>
        </div>
      </div>

      {/* CREATE NEW CDK SETUP CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-base">Setup New CDK Voucher</h2>
              <p className="text-xs text-slate-400">Specify 10M, 20M, 50M, or custom token allowances</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-sky-400 border border-slate-700">
            Fast Generator
          </span>
        </div>

        <form onSubmit={handleCreateCdk} className="space-y-5">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Select Token Allocation Preset:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { amount: 10_000_000, label: '10M Tokens', desc: 'Studio Pro Tier', color: 'sky' },
                { amount: 20_000_000, label: '20M Tokens', desc: 'Enterprise VIP Tier', color: 'purple' },
                { amount: 50_000_000, label: '50M Tokens', desc: 'Ultra Scale Tier', color: 'amber' },
                { amount: 100_000_000, label: '100M Tokens', desc: 'Unlimited Team Tier', color: 'emerald' },
              ].map((p) => {
                const isSelected = tokenPreset === p.amount && customTokens === p.amount.toString();
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => handleSelectTokenPreset(p.amount)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{p.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Custom Token Number */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Token Count (Exact Number)
              </label>
              <input
                type="number"
                value={customTokens}
                onChange={(e) => {
                  setCustomTokens(e.target.value);
                  setTokenPreset(Number(e.target.value));
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                placeholder="10000000"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                = {(Number(customTokens || 0) / 1_000_000).toFixed(1)} Million Tokens
              </span>
            </div>

            {/* CDK Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  CDK Code
                </label>
                <button
                  type="button"
                  onClick={fillRandomMdCode}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono underline cursor-pointer"
                  title="Generate 48-hex MD key format (MD-...)"
                >
                  Generate MD-48Hex
                </button>
              </div>
              <input
                type="text"
                value={newCdkCode}
                onChange={(e) => setNewCdkCode(e.target.value.toUpperCase())}
                placeholder="e.g. MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs uppercase focus:outline-none focus:border-indigo-500 truncate"
              />
            </div>

            {/* Max Redemptions */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Allowed Redemptions (Seats)
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Pass Name</label>
              <input
                type="text"
                value={newCdkName}
                onChange={(e) => setNewCdkName(e.target.value)}
                placeholder="e.g. 10M Token Studio Pro Pass"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tier Title</label>
              <input
                type="text"
                value={newCdkTier}
                onChange={(e) => setNewCdkTier(e.target.value)}
                placeholder="e.g. 10M Studio Pro Tier"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create & Register CDK Voucher</span>
            </button>

            <button
              type="button"
              onClick={handleQuickMintMd}
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="Mint a 48-Hex MD format CDK key directly"
            >
              <Key className="w-4 h-4 text-purple-400" />
              <span>Quick Mint 48-Hex MD Key</span>
            </button>
          </div>
        </form>
      </div>

      {/* ALL CDKS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white text-base">Registered CDKs & Vouchers ({cdks.length})</h2>
            <p className="text-xs text-slate-400">Click any CDK code to copy or activate directly in the portal</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">CDK Code</th>
                <th className="py-3 px-4">Tier / Name</th>
                <th className="py-3 px-4">Token Quota</th>
                <th className="py-3 px-4">Usage Progress</th>
                <th className="py-3 px-4">Seats Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {cdks.map((cdk) => {
                const percent = Math.min(100, (cdk.tokensUsed / cdk.tokensTotal) * 100);
                const isMdKey = cdk.code.startsWith('MD-');
                return (
                  <tr key={cdk.code} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                        {isMdKey && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 uppercase tracking-wider">
                            48-Hex MD Key
                          </span>
                        )}
                        <span className="truncate">{cdk.code}</span>
                        <button
                          onClick={() => copyToClipboard(cdk.code, 'CDK Code')}
                          className="text-slate-500 hover:text-slate-300 p-1 rounded cursor-pointer shrink-0"
                          title="Copy CDK"
                        >
                          {copiedCode === cdk.code ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{cdk.name}</div>
                      <div className="text-[11px] text-slate-400">{cdk.tier}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {(cdk.tokensTotal / 1_000_000).toFixed(0)}M Tokens
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1 w-32">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{cdk.tokensUsed.toLocaleString()}</span>
                          <span>{percent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full"
                            style={{ width: `${Math.max(2, percent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {cdk.redeemedCount} / {cdk.maxRedemptions}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                          cdk.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : cdk.status === 'revoked'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {cdk.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onUseCdkInPortal(cdk.code)}
                          className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-medium transition cursor-pointer"
                          title="Redeem in User Portal"
                        >
                          Redeem →
                        </button>

                        <button
                          onClick={() => handleTopUp(cdk.code, 10_000_000)}
                          className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-medium transition cursor-pointer"
                          title="Add +10M tokens"
                        >
                          +10M
                        </button>

                        <button
                          onClick={() => handleToggleStatus(cdk.code, cdk.status)}
                          className="p-1 rounded text-slate-400 hover:text-amber-400 transition cursor-pointer"
                          title={cdk.status === 'revoked' ? 'Activate' : 'Revoke'}
                        >
                          {cdk.status === 'revoked' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteCdk(cdk.code)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Delete CDK"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GENERATED API KEYS TABLE */}
      {apiKeys.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-6">
          <div>
            <h2 className="font-semibold text-white text-base">Active Generated API Keys ({apiKeys.length})</h2>
            <p className="text-xs text-slate-400">API keys currently in use by engineers in VS Code</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">API Key</th>
                  <th className="py-3 px-4">Origin CDK</th>
                  <th className="py-3 px-4">Tokens Granted</th>
                  <th className="py-3 px-4">Tokens Used</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {apiKeys.map((key) => (
                  <tr key={key.apiKey} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-amber-300">
                      <div className="flex items-center gap-1.5">
                        <span>{key.apiKey.substring(0, 16)}••••</span>
                        <button
                          onClick={() => copyToClipboard(key.apiKey, 'API Key')}
                          className="text-slate-500 hover:text-slate-300 p-1 rounded cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-400">{key.cdk}</td>
                    <td className="py-3 px-4 font-mono">{(key.tokensTotal / 1_000_000).toFixed(0)}M</td>
                    <td className="py-3 px-4 font-mono">{key.tokensUsed.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {key.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

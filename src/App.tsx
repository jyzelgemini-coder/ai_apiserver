import { useState, useEffect } from 'react';
import {
  Key,
  Terminal,
  Sliders,
  Cpu,
  Copy,
  Check,
  CheckCircle,
  Menu,
  X,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { RedeemedLicense } from './types';
import { RedeemCdkView } from './components/RedeemCdkView';
import { VsCodeGuideView } from './components/VsCodeGuideView';
import { GeminiModelsView } from './components/GeminiModelsView';
import { AdminPanelView } from './components/AdminPanelView';
import { ApiKeyLiveStatus } from './components/ApiKeyLiveStatus';

const STORAGE_KEY_LICENSE = 'cdk_portal_license_v3';

type ActiveView = 'redeem' | 'vscode' | 'check' | 'models' | 'admin';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('redeem');
  const [license, setLicense] = useState<RedeemedLicense | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showIframeNotice, setShowIframeNotice] = useState(true);

  // Check if loaded inside iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Initialize license ONLY if the user previously redeemed one
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LICENSE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.generatedApiKey && parsed.cdk) {
          setLicense(parsed);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY_LICENSE);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRedeemSuccess = (newLicense: RedeemedLicense) => {
    setLicense(newLicense);
    localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(newLicense));
  };

  const handleClearLicense = () => {
    setLicense(null);
    localStorage.removeItem(STORAGE_KEY_LICENSE);
    showToast('Cleared active key. You can now redeem a new CDK.');
  };

  const handleAdminUseCdk = (cdkCode: string) => {
    setActiveView('redeem');
    showToast(`Loaded CDK ${cdkCode}. Enter it to redeem.`);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const baseUrl = `${originUrl}/v1`;

  return (
    <div className="min-h-screen bg-[#06080e] bg-security-grid text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300 relative overflow-x-hidden">
      {/* Ambient Lighting Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[360px] bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-indigo-500/5 blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="bg-[#090d18]/90 backdrop-blur-md border-b border-slate-800/90 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-4">
          {/* Brand Logo - 𝐒𝐨𝐌𝐚𝐃𝐞𝐭𝐡 AI */}
          <div
            onClick={() => setActiveView('redeem')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/15 group-hover:shadow-sky-500/30 transition">
              <Key className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base sm:text-lg tracking-tight">
                  𝐒𝐨𝐌𝐚𝐃𝐞𝐭𝐡 AI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                OpenAI-Compatible AI Gateway & CDK Portal
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/90 text-xs">
            <button
              onClick={() => setActiveView('redeem')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeView === 'redeem'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Redeem CDK
            </button>

            <button
              onClick={() => setActiveView('vscode')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeView === 'vscode'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              VS Code Guide
            </button>

            <button
              onClick={() => setActiveView('check')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'check'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Check Key & Quota
            </button>

            <button
              onClick={() => setActiveView('models')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeView === 'models'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Models
            </button>

            <button
              onClick={() => setActiveView('admin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Admin Setup
            </button>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-800 bg-[#0c101b] px-4 py-3 space-y-1">
            <button
              onClick={() => {
                setActiveView('redeem');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeView === 'redeem' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Redeem CDK
            </button>
            <button
              onClick={() => {
                setActiveView('vscode');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeView === 'vscode' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              VS Code Setup Guide
            </button>
            <button
              onClick={() => {
                setActiveView('check');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeView === 'check' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Check Key & Quota
            </button>
            <button
              onClick={() => {
                setActiveView('models');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeView === 'models' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Gemini Models
            </button>
            <button
              onClick={() => {
                setActiveView('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                activeView === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Admin Setup (10M / 20M)
            </button>
          </div>
        )}
      </header>

      {/* Iframe Cookie / Preview Helper Notice */}
      {isInIframe && showIframeNotice && (
        <aside aria-label="Preview notice" className="bg-gradient-to-r from-sky-950/60 via-indigo-950/50 to-slate-950 border-b border-sky-800/40 px-4 py-2 text-xs">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sky-200">
              <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span>
                <strong>Preview Tip:</strong> If your browser blocks 3rd-party cookies or shows a white screen, open in a new tab for native first-party access.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition shadow-sm cursor-pointer"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setShowIframeNotice(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Subheader: Only shows user credentials if they have actually redeemed a key */}
      {license && (
        <div className="bg-[#10141d] border-b border-slate-800/80 px-4 py-2 text-xs">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">Active Key:</span>
              <code className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono text-[11px]">
                {license.generatedApiKey.substring(0, 12)}••••
              </code>
              <button
                onClick={() => copyToClipboard(license.generatedApiKey, 'API Key')}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                title="Copy API Key"
              >
                {copiedText === 'API Key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono text-[11px]">
                Token Quota: {(license.tokensGranted / 1_000_000).toFixed(0)}M Tokens
              </span>
              <button
                onClick={() => setActiveView('check')}
                className="text-[11px] text-sky-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                title="Open Diagnostics and live quota"
              >
                <span>Diagnostics & Status</span>
              </button>
              <button
                onClick={handleClearLicense}
                className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer flex items-center gap-1"
                title="Clear current key to redeem another"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'redeem' && (
          <RedeemCdkView
            license={license}
            onRedeemSuccess={handleRedeemSuccess}
            onGoToVsCode={() => setActiveView('vscode')}
            onGoToCheck={() => setActiveView('check')}
            onClearLicense={handleClearLicense}
            showToast={showToast}
          />
        )}

        {activeView === 'vscode' && (
          <VsCodeGuideView
            license={license}
            onGoToRedeem={() => setActiveView('redeem')}
            showToast={showToast}
          />
        )}

        {activeView === 'check' && (
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                API Key Real-Time Quota & Gateway Diagnostics
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Inspect your generated API key, check real-time tokens remaining and consumed usage, live expiration countdown, and perform automated gateway tests.
              </p>
            </div>
            <ApiKeyLiveStatus
              license={license}
              onGoToRedeem={() => setActiveView('redeem')}
              showToast={showToast}
            />
          </div>
        )}

        {activeView === 'models' && (
          <GeminiModelsView
            showToast={showToast}
            onSelectModelForVsCode={() => setActiveView('vscode')}
          />
        )}

        {activeView === 'admin' && (
          <AdminPanelView
            onUseCdkInPortal={handleAdminUseCdk}
            showToast={showToast}
          />
        )}
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-900/90 bg-[#04060c] py-6 px-4 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">© 2026 𝐒𝐨𝐌𝐚𝐃𝐞𝐭𝐡 AI</span>
            <span>•</span>
            <span className="text-slate-500">OpenAI-Compatible AI Gateway</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>Fast Streaming</span>
            <span>•</span>
            <span>Cline & VS Code Ready</span>
            <span>•</span>
            <span>Gemini 2.5 & 3 Pro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  Download,
  Play,
  ArrowRight,
  ExternalLink,
  Code,
  ShieldCheck,
  Key
} from 'lucide-react';
import { RedeemedLicense, ApiConfiguration, AccuracySettings } from '../types';

interface VsCodeIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: RedeemedLicense | null;
  onSelectCdk?: (cdk: string) => void;
  apiConfig: ApiConfiguration;
  accuracySettings: AccuracySettings;
}

type TabType = 'cline' | 'continue' | 'cursor' | 'settings_json' | 'terminal_curl';

export function VsCodeIntegrationModal({
  isOpen,
  onClose,
  license,
  onSelectCdk,
  apiConfig,
  accuracySettings,
}: VsCodeIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('cline');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; latency?: number; modelsCount?: number; message?: string } | null>(null);

  // Live Agent Test state
  const [testingAgentChat, setTestingAgentChat] = useState(false);
  const [agentTestResponse, setAgentTestResponse] = useState<string | null>(null);

  // Derive origin and endpoints
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const openAiBaseUrl = `${origin}/v1`;
  const studioApiBaseUrl = `${origin}/api`;
  const activeCdk = license?.cdk || 'MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457';

  // Available website CDKs
  const availableCdks = [
    { code: 'MD-7A33AB6C0EA116AC9FD95F2C65A05B5A5E90CD6E33390457', name: 'MD 50M Master Developer Pass', tier: '50M Ultra Enterprise', tokens: '50,000,000' },
    { code: 'MD-8F4C2A10E7B359D601F82AC4E9B71035D2A684C9E01B7F32', name: 'MD 20M Enterprise Pass', tier: '20M Enterprise VIP', tokens: '20,000,000' },
    { code: 'MD-3C9A15F08E27B4D6A1F3902E4C78B1D50A2F69CE831B4D70', name: 'MD 10M Studio Pro Pass', tier: '10M Studio Pro', tokens: '10,000,000' },
  ];

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2200);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ping /v1/models endpoint using the active CDK
  const testV1Endpoint = async () => {
    setTestingPing(true);
    setPingResult(null);
    const startTime = performance.now();
    try {
      const res = await fetch('/v1/models', {
        headers: {
          Authorization: `Bearer ${activeCdk}`,
        },
      });
      const data = await res.json();
      const latency = Math.round(performance.now() - startTime);

      if (res.ok && data.data && Array.isArray(data.data)) {
        setPingResult({
          success: true,
          latency,
          modelsCount: data.data.length,
          message: `Endpoint online and ready! Found ${data.data.length} models.`,
        });
      } else {
        setPingResult({
          success: false,
          latency,
          message: data.error?.message || 'Received unexpected response from /v1/models.',
        });
      }
    } catch (err: any) {
      setPingResult({
        success: false,
        message: err.message || 'Failed to reach /v1/models endpoint.',
      });
    } finally {
      setTestingPing(false);
    }
  };

  // Test live agent completion through /v1/chat/completions
  const testAgentCompletion = async () => {
    setTestingAgentChat(true);
    setAgentTestResponse(null);
    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeCdk}`,
        },
        body: JSON.stringify({
          model: accuracySettings.model || 'gemini-3.8-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a code agent assisting in VS Code. Reply in 1 concise sentence verifying connection.',
            },
            {
              role: 'user',
              content: 'Verify that VS Code agent connection through this Base URL and CDK works.',
            },
          ],
          temperature: 0.1,
          stream: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        setAgentTestResponse(data.choices[0].message.content);
      } else {
        setAgentTestResponse(`Error: ${data.error?.message || 'Request failed'}`);
      }
    } catch (err: any) {
      setAgentTestResponse(`Error: ${err.message || 'Network failure'}`);
    } finally {
      setTestingAgentChat(false);
    }
  };

  // Continue.dev config YAML
  const continueConfigYaml = `name: VS Code Agent Setup
models:
  - name: Gemini 3.8 Flash (Website Agent)
    provider: openai
    model: ${accuracySettings.model || 'gemini-3.8-flash'}
    apiKey: ${activeCdk}
    apiBase: ${openAiBaseUrl}

  - name: Gemini 3.1 Pro (Deep Reasoning)
    provider: openai
    model: gemini-3.1-pro-preview
    apiKey: ${activeCdk}
    apiBase: ${openAiBaseUrl}

tabAutocompleteModel:
  title: Gemini Flash Autocomplete
  provider: openai
  model: gemini-3.1-flash-lite
  apiKey: ${activeCdk}
  apiBase: ${openAiBaseUrl}

contextProviders:
  - name: diff
  - name: codebase
  - name: file
  - name: terminal
`;

  // VS Code Workspace settings.json
  const vsCodeSettingsJson = JSON.stringify(
    {
      "continue.serverUrl": openAiBaseUrl,
      "continue.apiKey": activeCdk,
      "aiAgent.baseApiUrl": openAiBaseUrl,
      "aiAgent.websiteCdk": activeCdk,
      "aiAgent.model": accuracySettings.model,
      "aiAgent.accuracyPreset": accuracySettings.preset,
      "aiAgent.thinkingLevel": accuracySettings.thinkingLevel,
      "aiAgent.strictSyntaxValidation": accuracySettings.strictSyntaxValidation,
      "aiAgent.bridgeUrl": origin,
    },
    null,
    2
  );

  // VS Code tasks.json snippet
  const vsCodeTasksJson = JSON.stringify(
    {
      "version": "2.0.0",
      "tasks": [
        {
          "label": "AI Agent: Verify Codebase Diff",
          "type": "shell",
          "command": `curl -s -X POST "${openAiBaseUrl}/chat/completions" -H "Authorization: Bearer ${activeCdk}" -H "Content-Type: application/json" -d '{"model":"${accuracySettings.model}","messages":[{"role":"user","content":"Review staged diff for potential syntax bugs."}]}'`,
          "problemMatcher": []
        }
      ]
    },
    null,
    2
  );

  // Terminal cURL command
  const curlTestSnippet = `curl -s -X POST "${openAiBaseUrl}/chat/completions" \\
  -H "Authorization: Bearer ${activeCdk}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${accuracySettings.model || 'gemini-3.8-flash'}",
    "messages": [
      {"role": "user", "content": "Hello from VS Code agent terminal! Return a quick confirmation."}
    ]
  }'`;

  return (
    <div id="vscode-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5">
      <div id="vscode-modal-container" className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">VS Code Agent Setup & Configuration</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  OpenAI /v1 Compatible
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect Cline, Continue, Roo Code, Cursor, or your local terminal to this website's agent engine
              </p>
            </div>
          </div>
          <button
            id="vscode-modal-close-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-sm hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Parameters Cards: Base URL & Website CDK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Card 1: Base URL */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  Agent Base URL (OpenAI /v1)
                </span>
                <button
                  id="copy-base-url-button"
                  onClick={() => handleCopy(openAiBaseUrl, 'base-url')}
                  className="text-xs flex items-center gap-1 text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
                >
                  {copiedType === 'base-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedType === 'base-url' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80 text-xs font-mono text-sky-300 select-all break-all">
                {openAiBaseUrl}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Paste as <code className="text-slate-300">Base URL</code> or <code className="text-slate-300">apiBase</code></span>
                <button
                  id="test-base-url-ping-btn"
                  onClick={testV1Endpoint}
                  disabled={testingPing}
                  className="text-[11px] flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  {testingPing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3 text-sky-400" />}
                  Test Ping
                </button>
              </div>

              {pingResult && (
                <div className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                  pingResult.success
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}>
                  {pingResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Cpu className="w-3.5 h-3.5 shrink-0" />}
                  <span>{pingResult.message} ({pingResult.latency}ms)</span>
                </div>
              )}
            </div>

            {/* Card 2: Website CDK */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Website CDK (License & Auth Key)
                </span>
                <button
                  id="copy-cdk-button"
                  onClick={() => handleCopy(activeCdk, 'cdk-key')}
                  className="text-xs flex items-center gap-1 text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
                >
                  {copiedType === 'cdk-key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedType === 'cdk-key' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800/80 text-xs font-mono text-amber-300 select-all font-semibold">
                {activeCdk}
              </div>

              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="text-[11px] text-slate-400 mr-1">Switch CDK:</span>
                {availableCdks.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      if (onSelectCdk) onSelectCdk(c.code);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer border ${
                      activeCdk === c.code
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                  >
                    {c.tier}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400">
                Paste as <code className="text-slate-300">API Key</code> or Bearer Token in VS Code
              </div>
            </div>
          </div>

          {/* Quick Live Agent Verification Bar */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-950/40 border border-sky-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Live Gateway Ready for VS Code Extensions</div>
                <div className="text-[11px] text-slate-400">
                  Model: <span className="text-sky-300 font-mono">{accuracySettings.model}</span> | Tokens: 1M context buffer
                </div>
              </div>
            </div>
            <button
              id="test-live-agent-btn"
              onClick={testAgentCompletion}
              disabled={testingAgentChat}
              className="text-xs px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              {testingAgentChat ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Send Test Agent Prompt
            </button>
          </div>

          {agentTestResponse && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-[11px] text-sky-400 font-semibold">Agent Gateway Response:</span>
              <p className="text-slate-200 font-mono text-[11px]">{agentTestResponse}</p>
            </div>
          )}

          {/* Setup Guide Navigation Tabs */}
          <div className="space-y-3">
            <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
              <button
                id="tab-cline"
                onClick={() => setActiveTab('cline')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'cline'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Cline & Roo Code
              </button>
              <button
                id="tab-continue"
                onClick={() => setActiveTab('continue')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'continue'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Continue.dev
              </button>
              <button
                id="tab-cursor"
                onClick={() => setActiveTab('cursor')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'cursor'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Cursor / Windsurf
              </button>
              <button
                id="tab-settings"
                onClick={() => setActiveTab('settings_json')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'settings_json'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                4. VS Code settings.json
              </button>
              <button
                id="tab-curl"
                onClick={() => setActiveTab('terminal_curl')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'terminal_curl'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                5. VS Code Terminal (cURL)
              </button>
            </div>

            {/* TAB CONTENT 1: Cline & Roo Code */}
            {activeTab === 'cline' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Cline & Roo Code Setup Steps (Autonomous Coding Agent in VS Code)
                    </h3>
                  </div>

                  <ol className="space-y-2.5 text-xs text-slate-300 list-decimal list-inside">
                    <li>
                      In VS Code, install <strong className="text-white">Cline</strong> or <strong className="text-white">Roo Code</strong> from the Extensions Marketplace (<code className="text-slate-400">Ctrl+Shift+X</code>).
                    </li>
                    <li>
                      Open the Cline sidebar, click the <strong className="text-white">Settings Gear (⚙️)</strong> icon.
                    </li>
                    <li>
                      Set <strong className="text-white">API Provider</strong> to: <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-sky-300">OpenAI Compatible</span>
                    </li>
                    <li className="space-y-1">
                      <div>Set <strong className="text-white">Base URL</strong> to:</div>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-slate-900 rounded border border-slate-800 font-mono text-sky-300 text-[11px] select-all">
                          {openAiBaseUrl}
                        </code>
                        <button
                          onClick={() => handleCopy(openAiBaseUrl, 'cline-url')}
                          className="text-[11px] text-sky-400 hover:underline cursor-pointer"
                        >
                          {copiedType === 'cline-url' ? 'Copied!' : 'Copy URL'}
                        </button>
                      </div>
                    </li>
                    <li className="space-y-1">
                      <div>Set <strong className="text-white">API Key</strong> to your Website CDK:</div>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-slate-900 rounded border border-slate-800 font-mono text-amber-300 text-[11px] select-all">
                          {activeCdk}
                        </code>
                        <button
                          onClick={() => handleCopy(activeCdk, 'cline-cdk')}
                          className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                        >
                          {copiedType === 'cline-cdk' ? 'Copied!' : 'Copy CDK'}
                        </button>
                      </div>
                    </li>
                    <li>
                      Set <strong className="text-white">Model ID</strong> to: <code className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-200">{accuracySettings.model || 'gemini-3.8-flash'}</code>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Continue.dev */}
            {activeTab === 'continue' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    Paste this into your <code className="text-sky-300">~/.continue/config.yaml</code>:
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadFile('config.yaml', continueConfigYaml)}
                      className="text-xs flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Download config.yaml
                    </button>
                    <button
                      onClick={() => handleCopy(continueConfigYaml, 'continue')}
                      className="text-xs flex items-center gap-1 text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                    >
                      {copiedType === 'continue' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedType === 'continue' ? 'Copied' : 'Copy YAML'}
                    </button>
                  </div>
                </div>

                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
                  {continueConfigYaml}
                </pre>
              </div>
            )}

            {/* TAB CONTENT 3: Cursor / Windsurf */}
            {activeTab === 'cursor' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                  <div className="font-semibold text-white">Cursor & Windsurf Custom Model Configuration:</div>
                  <div className="space-y-2 text-slate-300">
                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400">Settings Field</span>
                      <span className="col-span-2 text-slate-200 font-semibold">Value to Enter</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/50 rounded border border-slate-800/60">
                      <span className="text-slate-400">OpenAI API Key</span>
                      <span className="col-span-2 font-mono text-amber-300 flex items-center justify-between">
                        <span>{activeCdk}</span>
                        <button onClick={() => handleCopy(activeCdk, 'cursor-cdk')} className="text-sky-400 text-[11px]">Copy</button>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/50 rounded border border-slate-800/60">
                      <span className="text-slate-400">Override OpenAI Base URL</span>
                      <span className="col-span-2 font-mono text-sky-300 flex items-center justify-between">
                        <span>{openAiBaseUrl}</span>
                        <button onClick={() => handleCopy(openAiBaseUrl, 'cursor-url')} className="text-sky-400 text-[11px]">Copy</button>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-900/50 rounded border border-slate-800/60">
                      <span className="text-slate-400">Model Name</span>
                      <span className="col-span-2 font-mono text-slate-200">{accuracySettings.model || 'gemini-3.8-flash'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: VS Code settings.json */}
            {activeTab === 'settings_json' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Workspace Settings (<code className="text-sky-300">.vscode/settings.json</code>):</span>
                  <button
                    onClick={() => handleCopy(vsCodeSettingsJson, 'settings-json')}
                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
                  >
                    {copiedType === 'settings-json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedType === 'settings-json' ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {vsCodeSettingsJson}
                </pre>
              </div>
            )}

            {/* TAB CONTENT 5: Terminal cURL */}
            {activeTab === 'terminal_curl' && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    Run in VS Code Integrated Terminal (<code className="text-sky-300">Ctrl+`</code>):
                  </span>
                  <button
                    onClick={() => handleCopy(curlTestSnippet, 'curl')}
                    className="text-xs flex items-center gap-1 text-sky-400 hover:text-sky-300 px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
                  >
                    {copiedType === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedType === 'curl' ? 'Copied' : 'Copy cURL'}
                  </button>
                </div>
                <pre className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto">
                  {curlTestSnippet}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Token Gateway • VS Code Bridge Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

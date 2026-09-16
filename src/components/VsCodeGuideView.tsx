import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Code2,
  Cpu,
  FileCode,
  Download,
  Play,
  RefreshCw,
  AlertCircle,
  FileText,
  Settings,
  Zap,
  Info,
  ChevronRight,
  ShieldCheck,
  Globe,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { RedeemedLicense } from '../types';
import { ApiKeyLiveStatus } from './ApiKeyLiveStatus';

interface VsCodeGuideViewProps {
  license: RedeemedLicense | null;
  onGoToRedeem: () => void;
  showToast: (msg: string) => void;
}

type ExtensionTab =
  | 'cline'
  | 'powershell'
  | 'cmd'
  | 'macos_linux'
  | 'manual_config'
  | 'continue'
  | 'cursor';

type ManualConfigType = 'settings_json' | 'env_file' | 'continue_json' | 'cline_modes';

export const VsCodeGuideView: React.FC<VsCodeGuideViewProps> = ({
  license,
  onGoToRedeem,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<ExtensionTab>('powershell');
  const [activeManualConfig, setActiveManualConfig] = useState<ManualConfigType>('settings_json');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [showCookieTroubleshoot, setShowCookieTroubleshoot] = useState<boolean>(true);

  // Live Diagnostics state
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [testPromptStatus, setTestPromptStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testPromptResult, setTestPromptResult] = useState<{ reply: string; latency: number; model: string } | null>(null);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const baseUrl = `${originUrl}/v1`;
  const activeKey = license?.generatedApiKey || 'sk_agent_YOUR_REDEEMED_KEY';

  const geminiModels = [
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Autonomous Coding Agent - Recommended)' },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Deep Architecture & Reasoning)' },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (Ultra-fast Autocomplete)' },
    { id: 'gemini-flash-latest', label: 'Gemini Flash Latest (Production Stable)' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Deep Code Synthesis)' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast Adaptive Assistant)' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (High Throughput)' },
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const downloadFile = (filename: string, content: string, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}!`);
  };

  const handlePingModels = async () => {
    setPingStatus('loading');
    setPingResult(null);
    try {
      const res = await fetch('/v1/models', {
        headers: {
          Authorization: `Bearer ${activeKey}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to connect');
      setPingStatus('success');
      setPingResult(`Success! Models available: ${data.data?.map((m: any) => m.id).join(', ')}`);
    } catch (err: any) {
      setPingStatus('error');
      setPingResult(err.message || 'Error pinging /v1/models');
    }
  };

  const handleTestPrompt = async () => {
    setTestPromptStatus('loading');
    setTestPromptResult(null);
    const start = Date.now();
    try {
      const res = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Say: SoMaDeth AI Gateway Connected!' }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Chat completion request failed.');
      }

      const latency = Date.now() - start;
      setTestPromptStatus('success');
      setTestPromptResult({
        reply: data.choices?.[0]?.message?.content || 'Success!',
        latency,
        model: data.model || selectedModel,
      });
    } catch (err: any) {
      setTestPromptStatus('error');
      setTestPromptResult({
        reply: `Error: ${err.message}`,
        latency: Date.now() - start,
        model: selectedModel,
      });
    }
  };

  // -------------------------------------------------------------
  // SCRIPTS GENERATION
  // -------------------------------------------------------------

  // PowerShell 1-Liner (Instant setup and test)
  const powershellOneLiner = `$env:OPENAI_BASE_URL="${baseUrl}"; $env:OPENAI_API_KEY="${activeKey}"; $env:OPENAI_MODEL="${selectedModel}"; Write-Host "Variables set! Testing connection..." -ForegroundColor Cyan; (Invoke-RestMethod -Uri "$env:OPENAI_BASE_URL/chat/completions" -Method Post -Headers @{Authorization="Bearer $env:OPENAI_API_KEY"} -ContentType "application/json" -Body (@{model=$env:OPENAI_MODEL; messages=@(@{role="user"; content="Hi SoMaDeth AI!"})} | ConvertTo-Json)).choices[0].message.content`;

  const powershellSessionScript = `# Set environment variables for current PowerShell session
$env:OPENAI_BASE_URL = "${baseUrl}"
$env:OPENAI_API_KEY = "${activeKey}"
$env:OPENAI_MODEL = "${selectedModel}"

Write-Host ">>> SoMaDeth AI configured for current PowerShell session!" -ForegroundColor Green`;

  const powershellPermanentScript = `# Save environment variables permanently to Windows User Profile (persists across reboots)
[System.Environment]::SetEnvironmentVariable('OPENAI_BASE_URL', '${baseUrl}', 'User')
[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', '${activeKey}', 'User')
[System.Environment]::SetEnvironmentVariable('OPENAI_MODEL', '${selectedModel}', 'User')

Write-Host ">>> Saved permanent Windows user environment variables! Restart terminal or VS Code to apply." -ForegroundColor Green`;

  const powershellTestCommand = `# Test connection with native PowerShell Invoke-RestMethod
$headers = @{
    "Authorization" = "Bearer ${activeKey}"
    "Content-Type"  = "application/json"
}
$body = @{
    model    = "${selectedModel}"
    messages = @(@{ role = "user"; content = "Hello from Windows PowerShell! Confirming agent gateway connection." })
} | ConvertTo-Json -Depth 4

$response = Invoke-RestMethod -Uri "${baseUrl}/chat/completions" -Method Post -Headers $headers -Body $body
$response.choices[0].message.content`;

  const powershellFullFile = `# ============================================================
# SoMaDeth AI - Windows PowerShell Setup & Test Script
# Base URL: ${baseUrl}
# Model:    ${selectedModel}
# ============================================================

Write-Host ">>> Setting up SoMaDeth AI Gateway Environment..." -ForegroundColor Cyan

# 1. Set current session variables
$env:OPENAI_BASE_URL = "${baseUrl}"
$env:OPENAI_API_KEY = "${activeKey}"
$env:OPENAI_MODEL = "${selectedModel}"

# 2. Persist to Windows User Profile (survives reboots)
[System.Environment]::SetEnvironmentVariable('OPENAI_BASE_URL', '${baseUrl}', 'User')
[System.Environment]::SetEnvironmentVariable('OPENAI_API_KEY', '${activeKey}', 'User')
[System.Environment]::SetEnvironmentVariable('OPENAI_MODEL', '${selectedModel}', 'User')

Write-Host "[OK] Environment variables set successfully!" -ForegroundColor Green
Write-Host ">>> Testing gateway connectivity..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer ${activeKey}"
    "Content-Type"  = "application/json"
}
$body = @{
    model    = "${selectedModel}"
    messages = @(@{ role = "user"; content = "Hello from PowerShell! Confirming gateway status." })
} | ConvertTo-Json -Depth 4

try {
    $res = Invoke-RestMethod -Uri "${baseUrl}/chat/completions" -Method Post -Headers $headers -Body $body
    Write-Host ""
    Write-Host "Agent Response:" -ForegroundColor Green
    Write-Host $res.choices[0].message.content -ForegroundColor White
} catch {
    Write-Host "Error connecting to gateway: $_" -ForegroundColor Red
}
`;

  // CMD 1-Liner
  const cmdOneLiner = `set OPENAI_BASE_URL=${baseUrl}&& set OPENAI_API_KEY=${activeKey}&& set OPENAI_MODEL=${selectedModel}&& echo Variables configured! Testing gateway...&& curl -s -X POST "%OPENAI_BASE_URL%/chat/completions" -H "Authorization: Bearer %OPENAI_API_KEY%" -H "Content-Type: application/json" -d "{\"model\": \"%OPENAI_MODEL%\", \"messages\": [{\"role\": \"user\", \"content\": \"Hi from Windows CMD!\"}]}"`;

  const cmdSessionScript = `:: Set variables for current CMD session
set OPENAI_BASE_URL=${baseUrl}
set OPENAI_API_KEY=${activeKey}
set OPENAI_MODEL=${selectedModel}
echo SoMaDeth AI configured for this Command Prompt window!`;

  const cmdPermanentScript = `:: Save permanent Windows user variables (applied to all future CMD windows)
setx OPENAI_BASE_URL "${baseUrl}"
setx OPENAI_API_KEY "${activeKey}"
setx OPENAI_MODEL "${selectedModel}"
echo Variables saved to Windows User Profile! Restart CMD to apply globally.`;

  const cmdTestCommand = `curl -s -X POST "%OPENAI_BASE_URL%/chat/completions" ^
  -H "Authorization: Bearer %OPENAI_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"${selectedModel}\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello from Windows CMD!\"}]}"`;

  const cmdBatchFullFile = `@echo off
rem ============================================================
rem SoMaDeth AI - Windows Command Prompt (CMD) Setup & Test
rem ============================================================

echo [SoMaDeth AI] Setting environment variables...

:: 1. Current session
set OPENAI_BASE_URL=${baseUrl}
set OPENAI_API_KEY=${activeKey}
set OPENAI_MODEL=${selectedModel}

:: 2. Permanent Windows environment
setx OPENAI_BASE_URL "${baseUrl}" >nul
setx OPENAI_API_KEY "${activeKey}" >nul
setx OPENAI_MODEL "${selectedModel}" >nul

echo [OK] Variables configured successfully!
echo OPENAI_BASE_URL = %OPENAI_BASE_URL%
echo OPENAI_MODEL    = %OPENAI_MODEL%
echo.
echo Testing connection with curl...
curl -s -X POST "%OPENAI_BASE_URL%/chat/completions" ^
  -H "Authorization: Bearer %OPENAI_API_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"model\": \"${selectedModel}\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello from Windows CMD!\"}]}"

echo.
echo Done!
pause
`;

  // macOS / Linux 1-Liner
  const macosOneLiner = `export OPENAI_BASE_URL="${baseUrl}" OPENAI_API_KEY="${activeKey}" OPENAI_MODEL="${selectedModel}" && echo "Environment set! Testing connection..." && curl -s -X POST "$OPENAI_BASE_URL/chat/completions" -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" -d '{"model":"'"$OPENAI_MODEL"'","messages":[{"role":"user","content":"Hi from Terminal!"}]}'`;

  const macosSessionScript = `# Export variables for current Terminal session
export OPENAI_BASE_URL="${baseUrl}"
export OPENAI_API_KEY="${activeKey}"
export OPENAI_MODEL="${selectedModel}"
echo "SoMaDeth AI configured for current shell session"`;

  const macosPermanentScript = `# Append to your shell profile (~/.zshrc for macOS / ~/.bashrc for Linux)
PROFILE_FILE="$([ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ] && echo "$HOME/.zshrc" || echo "$HOME/.bashrc")"

echo '' >> "$PROFILE_FILE"
echo '# SoMaDeth AI Gateway Environment' >> "$PROFILE_FILE"
echo 'export OPENAI_BASE_URL="${baseUrl}"' >> "$PROFILE_FILE"
echo 'export OPENAI_API_KEY="${activeKey}"' >> "$PROFILE_FILE"
echo 'export OPENAI_MODEL="${selectedModel}"' >> "$PROFILE_FILE"

source "$PROFILE_FILE"
echo "Added and reloaded $PROFILE_FILE!"`;

  const macosTestCommand = `curl -X POST "${baseUrl}/chat/completions" \\
  -H "Authorization: Bearer ${activeKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "'"${selectedModel}"'",
    "messages": [
      {"role": "user", "content": "Hello from macOS/Linux Terminal! Gateway verified."}
    ]
  }'`;

  const macosShellFullFile = `#!/usr/bin/env bash
# ============================================================
# SoMaDeth AI - macOS / Linux Shell Setup & Verification
# ============================================================

echo ">>> Setting up SoMaDeth AI Gateway Environment..."

export OPENAI_BASE_URL="${baseUrl}"
export OPENAI_API_KEY="${activeKey}"
export OPENAI_MODEL="${selectedModel}"

SHELL_RC="$HOME/.bashrc"
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ] || [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
fi

if ! grep -q "OPENAI_BASE_URL" "$SHELL_RC" 2>/dev/null; then
  echo "" >> "$SHELL_RC"
  echo "# SoMaDeth AI Gateway Environment" >> "$SHELL_RC"
  echo 'export OPENAI_BASE_URL="${baseUrl}"' >> "$SHELL_RC"
  echo 'export OPENAI_API_KEY="${activeKey}"' >> "$SHELL_RC"
  echo 'export OPENAI_MODEL="${selectedModel}"' >> "$SHELL_RC"
  echo "[OK] Added variables to $SHELL_RC"
else
  echo "[INFO] OPENAI_BASE_URL already present in $SHELL_RC"
fi

echo ">>> Testing connection via curl..."
curl -s -X POST "${baseUrl}/chat/completions" \\
  -H "Authorization: Bearer ${activeKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "'"${selectedModel}"'",
    "messages": [{"role": "user", "content": "Hello from macOS/Linux Terminal! Gateway verified."}]
  }'
echo ""
`;

  // Manual Config Files
  const vsCodeSettingsJson = `{
  "cline.apiProvider": "openai",
  "cline.openAiBaseUrl": "${baseUrl}",
  "cline.openAiApiKey": "${activeKey}",
  "cline.openAiModelId": "${selectedModel}",
  "openai.baseUrl": "${baseUrl}",
  "openai.apiKey": "${activeKey}",
  "github.copilot.advanced": {
    "debug.overrideEngine": "${selectedModel}"
  }
}`;

  const envFileContent = `# ============================================================
# SoMaDeth AI - Project Environment Variables (.env)
# Compatible with Aider, Claude-Dev, LangChain, LlamaIndex, OpenAI SDKs
# ============================================================
OPENAI_BASE_URL=${baseUrl}
OPENAI_API_KEY=${activeKey}
OPENAI_MODEL=${selectedModel}

# Additional provider aliases
AI_GATEWAY_URL=${baseUrl}
GEMINI_API_BASE=${baseUrl}
`;

  const continueConfigJson = `{
  "models": [
    {
      "title": "Gemini Agent (${selectedModel})",
      "provider": "openai",
      "model": "${selectedModel}",
      "apiBase": "${baseUrl}",
      "apiKey": "${activeKey}"
    },
    {
      "title": "Gemini 3.1 Pro (Deep Reasoning)",
      "provider": "openai",
      "model": "gemini-3.1-pro-preview",
      "apiBase": "${baseUrl}",
      "apiKey": "${activeKey}"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Gemini 3.1 Flash Lite",
    "provider": "openai",
    "model": "gemini-3.1-flash-lite",
    "apiBase": "${baseUrl}",
    "apiKey": "${activeKey}"
  }
}`;

  const clineModesJson = `{
  "customModes": [
    {
      "slug": "somadeth-agent",
      "name": "SoMaDeth Autonomous Agent",
      "roleDefinition": "You are an expert autonomous software engineer powered by SoMaDeth AI Gemini 3.8 Gateway.",
      "groups": ["read", "edit", "browser", "command"],
      "customInstructions": "Use the high-precision ${selectedModel} model at ${baseUrl} with token quota optimization."
    }
  ]
}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Title & Introduction */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal OpenAI-Compatible Connection Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          SoMaDeth AI Setup Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Connect your Windows PowerShell, Command Prompt, macOS/Linux, VS Code Cline, or AI tools directly to the SoMaDeth Gemini gateway in under 30 seconds.
        </p>
      </div>

      {/* RECOVERY & TROUBLESHOOTING CALLOUT: Cookie / Blank Screen / Iframe Issue */}
      {showCookieTroubleshoot && (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-300 font-semibold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Fixing "The cookie could not be set" or Blank Preview Errors</span>
            </div>
            <button
              onClick={() => setShowCookieTroubleshoot(false)}
              className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              If you saw an error mentioning{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-950 text-amber-200 font-mono text-[11px]">
                verifyCanSetCookies() / error-ui
              </code>{' '}
              or a blank screen, this occurs because modern web browsers block <strong>third-party cookies</strong> inside the embedded preview iframe.
            </p>
            <p className="text-slate-400">
              <strong>The 2-second fix:</strong> Open this application directly in a new browser tab. Running outside the iframe grants native first-party cookie access and guarantees uninterrupted connectivity for your external tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={originUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              <span>Open Portal in Full Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => copyToClipboard(originUrl, 'App Portal URL')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer"
            >
              {copiedLabel === 'App Portal URL' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Direct Portal URL</span>
            </button>
          </div>
        </div>
      )}

      {/* Model Selection & Quick Credentials Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200 text-sm">Active Gateway Credentials</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Gemini Engine:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-sky-300 text-xs rounded-lg px-2.5 py-1 font-mono focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {geminiModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Base URL */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">1. Base URL</span>
              <button
                onClick={() => copyToClipboard(baseUrl, 'Base URL')}
                className="text-slate-400 hover:text-sky-400 p-0.5 cursor-pointer"
                title="Copy Base URL"
              >
                {copiedLabel === 'Base URL' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono text-sky-300 block truncate select-all">{baseUrl}</code>
          </div>

          {/* API Key */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">2. API Key</span>
              <button
                onClick={() => copyToClipboard(activeKey, 'API Key')}
                className="text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer"
                title="Copy API Key"
              >
                {copiedLabel === 'API Key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono text-amber-300 block truncate select-all">{activeKey}</code>
          </div>

          {/* Model ID */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">3. Selected Model</span>
              <button
                onClick={() => copyToClipboard(selectedModel, 'Model ID')}
                className="text-slate-400 hover:text-indigo-400 p-0.5 cursor-pointer"
                title="Copy Model ID"
              >
                {copiedLabel === 'Model ID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono text-indigo-300 block truncate select-all">{selectedModel}</code>
          </div>
        </div>

        {!license && (
          <div className="pt-1 text-center bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
            <button
              onClick={onGoToRedeem}
              className="text-xs text-amber-300 hover:text-amber-200 font-medium underline cursor-pointer"
            >
              ⚠️ No CDK redeemed yet! Click here to redeem a key and activate your full token quota →
            </button>
          </div>
        )}
      </div>

      {/* Live API Key & Quota Inspector */}
      <ApiKeyLiveStatus
        license={license}
        selectedModel={selectedModel}
        onGoToRedeem={onGoToRedeem}
        showToast={showToast}
      />

      {/* Environment Selector Navigation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Select Your Environment:</h2>
          <span className="text-xs text-slate-400">Click any tab for instant setup</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { id: 'powershell', name: 'PowerShell', badge: 'Windows', icon: Terminal, color: 'text-sky-400' },
            { id: 'cmd', name: 'CMD Prompt', badge: 'Windows', icon: Terminal, color: 'text-emerald-400' },
            { id: 'macos_linux', name: 'macOS/Linux', badge: 'Bash / Zsh', icon: Terminal, color: 'text-indigo-400' },
            { id: 'cline', name: 'Cline / Roo', badge: 'VS Code', icon: Cpu, color: 'text-purple-400' },
            { id: 'manual_config', name: 'Config Files', badge: '.env / JSON', icon: Settings, color: 'text-amber-400' },
            { id: 'cursor', name: 'Cursor IDE', badge: 'Windsurf', icon: Code2, color: 'text-teal-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ExtensionTab)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'bg-sky-500/15 border-sky-500/80 shadow-md shadow-sky-500/10'
                    : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : tab.color}`} />
                  <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-950">
                    {tab.badge}
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {tab.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
        
        {/* ============================================================ */}
        {/* WINDOWS POWERSHELL                                           */}
        {/* ============================================================ */}
        {activeTab === 'powershell' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-sky-400" />
                  <span>Windows PowerShell Setup</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compatible with Windows PowerShell 5.1, PowerShell 7 (pwsh), and the VS Code PowerShell integrated terminal.
                </p>
              </div>

              <button
                onClick={() => downloadFile('setup_somadeth_ai.ps1', powershellFullFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download setup_somadeth_ai.ps1</span>
              </button>
            </div>

            {/* Quick 1-Liner: Fastest option */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/50 to-slate-950 border border-sky-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>⚡ 1-Second Fast Setup (Copy & Run in PowerShell)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(powershellOneLiner, 'PowerShell 1-Liner')}
                  className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2.5 py-1 rounded border border-slate-800"
                >
                  {copiedLabel === 'PowerShell 1-Liner' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy 1-Liner</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Sets all environment variables for your current session and instantly executes a test query to verify connection:
              </p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-sky-300 overflow-x-auto select-all">
                {powershellOneLiner}
              </pre>
            </div>

            {/* Step-by-Step Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Step-by-Step PowerShell Guide
              </h4>

              {/* Step 1: Session */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 1: Set Session Variables (Active in current window)
                  </span>
                  <button
                    onClick={() => copyToClipboard(powershellSessionScript, 'PowerShell Session Script')}
                    className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'PowerShell Session Script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed">
                  {powershellSessionScript}
                </pre>
              </div>

              {/* Step 2: Permanent */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 2: Permanent User Environment (Persists across PC reboots)
                  </span>
                  <button
                    onClick={() => copyToClipboard(powershellPermanentScript, 'PowerShell Permanent Script')}
                    className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'PowerShell Permanent Script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed">
                  {powershellPermanentScript}
                </pre>
                <p className="text-[11px] text-slate-500">
                  Tip: After running Step 2, close and reopen VS Code or PowerShell for new processes to inherit permanent variables.
                </p>
              </div>

              {/* Step 3: Test */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 3: Verification Test in PowerShell
                  </span>
                  <button
                    onClick={() => copyToClipboard(powershellTestCommand, 'PowerShell Test Command')}
                    className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'PowerShell Test Command' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                  {powershellTestCommand}
                </pre>
              </div>
            </div>

            {/* PowerShell Troubleshooting Note */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>PowerShell ExecutionPolicy tip:</span>
              </span>
              <p className="text-slate-400">
                If running scripts is blocked on Windows, execute:{' '}
                <code className="text-sky-300 font-mono select-all">
                  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
                </code>{' '}
                in your PowerShell window.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* WINDOWS CMD                                                  */}
        {/* ============================================================ */}
        {activeTab === 'cmd' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>Windows Command Prompt (CMD.EXE) Setup</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure environment variables for Command Prompt, Windows batch scripts (.bat), and automated build runners.
                </p>
              </div>

              <button
                onClick={() => downloadFile('setup_somadeth_ai.bat', cmdBatchFullFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download setup_somadeth_ai.bat</span>
              </button>
            </div>

            {/* Quick 1-Liner: CMD */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 to-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>⚡ 1-Second Fast Setup (Copy & Run in CMD)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(cmdOneLiner, 'CMD 1-Liner')}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2.5 py-1 rounded border border-slate-800"
                >
                  {copiedLabel === 'CMD 1-Liner' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy 1-Liner</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Sets session variables in CMD and runs a curl test command:
              </p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto select-all">
                {cmdOneLiner}
              </pre>
            </div>

            {/* Step-by-Step Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Step-by-Step Command Prompt Guide
              </h4>

              {/* Step 1: Session */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 1: Current CMD Session (set command)
                  </span>
                  <button
                    onClick={() => copyToClipboard(cmdSessionScript, 'CMD Session Script')}
                    className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'CMD Session Script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                  {cmdSessionScript}
                </pre>
              </div>

              {/* Step 2: Permanent */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 2: Permanent User Variables (setx command)
                  </span>
                  <button
                    onClick={() => copyToClipboard(cmdPermanentScript, 'CMD Permanent Script')}
                    className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'CMD Permanent Script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed">
                  {cmdPermanentScript}
                </pre>
                <p className="text-[11px] text-slate-500">
                  Note: <code>setx</code> applies to all subsequent CMD and terminal windows opened after executing.
                </p>
              </div>

              {/* Step 3: Test */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 3: Verification with curl in CMD
                  </span>
                  <button
                    onClick={() => copyToClipboard(cmdTestCommand, 'CMD Test Command')}
                    className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'CMD Test Command' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
                  {cmdTestCommand}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MACOS / LINUX                                                */}
        {/* ============================================================ */}
        {activeTab === 'macos_linux' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span>macOS & Linux Terminal Setup (Bash / Zsh)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure your shell environment, terminal profiles (~/.zshrc or ~/.bashrc), and CLI agents like Aider.
                </p>
              </div>

              <button
                onClick={() => downloadFile('setup_somadeth_ai.sh', macosShellFullFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download setup_somadeth_ai.sh</span>
              </button>
            </div>

            {/* Quick 1-Liner: macOS/Linux */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 to-slate-950 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>⚡ 1-Second Fast Setup (Copy & Run in Terminal)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(macosOneLiner, 'macOS/Linux 1-Liner')}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2.5 py-1 rounded border border-slate-800"
                >
                  {copiedLabel === 'macOS/Linux 1-Liner' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy 1-Liner</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Exports variables in your current shell and triggers a verified curl test:
              </p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto select-all">
                {macosOneLiner}
              </pre>
            </div>

            {/* Step-by-Step Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Step-by-Step Terminal Guide
              </h4>

              {/* Step 1: Session */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 1: Current Session Variables (export)
                  </span>
                  <button
                    onClick={() => copyToClipboard(macosSessionScript, 'macOS/Linux Session Script')}
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'macOS/Linux Session Script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed">
                  {macosSessionScript}
                </pre>
              </div>

              {/* Step 2: Permanent */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 2: Append to Shell Profile (~/.zshrc or ~/.bashrc)
                  </span>
                  <button
                    onClick={() => copyToClipboard(macosPermanentScript, 'macOS/Linux Profile Script')}
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'macOS/Linux Profile Script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed">
                  {macosPermanentScript}
                </pre>
              </div>

              {/* Step 3: Test */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    Step 3: Test with curl
                  </span>
                  <button
                    onClick={() => copyToClipboard(macosTestCommand, 'macOS/Linux cURL')}
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLabel === 'macOS/Linux cURL' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                  {macosTestCommand}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CLINE & ROO CODE (VS CODE EXTENSION)                        */}
        {/* ============================================================ */}
        {activeTab === 'cline' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <span>Cline / Roo Code Setup in VS Code</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cline operates autonomously in your workspace: reads files, creates changes, runs terminal commands.
              </p>
            </div>

            {/* Visual Settings Form with Individual Copy Buttons */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Fill in Cline Settings (Settings ⚙️ in the Cline sidebar):
                </span>
                <button
                  onClick={() => copyToClipboard(vsCodeSettingsJson, 'Complete VS Code Settings')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                >
                  {copiedLabel === 'Complete VS Code Settings' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy as JSON</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Field 1: API Provider */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-medium">1. API Provider</span>
                    <button
                      onClick={() => copyToClipboard('OpenAI Compatible', 'API Provider')}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      {copiedLabel === 'API Provider' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <code className="text-emerald-400 font-semibold font-mono block">OpenAI Compatible</code>
                </div>

                {/* Field 2: Base URL */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-medium">2. Base URL</span>
                    <button
                      onClick={() => copyToClipboard(baseUrl, 'Base URL')}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      {copiedLabel === 'Base URL' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <code className="text-sky-300 font-mono block truncate">{baseUrl}</code>
                </div>

                {/* Field 3: API Key */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-medium">3. API Key</span>
                    <button
                      onClick={() => copyToClipboard(activeKey, 'API Key')}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      {copiedLabel === 'API Key' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <code className="text-amber-300 font-mono block truncate">{activeKey}</code>
                </div>

                {/* Field 4: Model ID */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-medium">4. Model ID</span>
                    <button
                      onClick={() => copyToClipboard(selectedModel, 'Model ID')}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    >
                      {copiedLabel === 'Model ID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <code className="text-indigo-300 font-mono block truncate">{selectedModel}</code>
                </div>
              </div>
            </div>

            {/* Simple Step Checklist */}
            <ol className="space-y-3 text-xs text-slate-300">
              <li className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <span className="font-semibold text-slate-200 block mb-0.5">Install the Extension</span>
                  <span>
                    In VS Code, press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px] font-mono">Ctrl+Shift+X</kbd>, search for <strong>Cline</strong> (or Roo Code) and click <strong>Install</strong>.
                  </span>
                </div>
              </li>
              <li className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <span className="font-semibold text-slate-200 block mb-0.5">Open Extension Settings</span>
                  <span>
                    Click the robot/Cline icon in your left sidebar, then click the gear icon ⚙️ at the top right of the Cline panel.
                  </span>
                </div>
              </li>
              <li className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <span className="font-semibold text-slate-200 block mb-0.5">Paste Credentials & Save</span>
                  <span>
                    Select <strong>OpenAI Compatible</strong>, paste the Base URL, API Key, and Model ID from above, and click <strong>Done</strong>.
                  </span>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* ============================================================ */}
        {/* MANUAL CONFIG FILES                                          */}
        {/* ============================================================ */}
        {activeTab === 'manual_config' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>Manual Configuration Files & Direct Downloads</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Download pre-configured environment files or JSON settings directly into your workspace.
              </p>
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
              {[
                { id: 'settings_json', name: 'VS Code settings.json', icon: FileCode },
                { id: 'env_file', name: 'Project .env File', icon: FileText },
                { id: 'continue_json', name: 'Continue config.json', icon: Cpu },
                { id: 'cline_modes', name: 'Cline Custom Modes', icon: Zap },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveManualConfig(item.id as ManualConfigType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    activeManualConfig === item.id
                      ? 'bg-slate-800 text-amber-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Sub-tab 1: VS Code settings.json */}
            {activeManualConfig === 'settings_json' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 text-xs block">File Paths:</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Windows: %APPDATA%\Code\User\settings.json • macOS: ~/Library/Application Support/Code/User/settings.json
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(vsCodeSettingsJson, 'settings.json')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedLabel === 'settings.json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => downloadFile('settings.json', vsCodeSettingsJson, 'application/json')}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-200 overflow-x-auto leading-relaxed">
                  {vsCodeSettingsJson}
                </pre>
              </div>
            )}

            {/* Sub-tab 2: .env File */}
            {activeManualConfig === 'env_file' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 text-xs block">File Location:</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Place in your project's root folder (<code className="text-emerald-300">./.env</code>)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(envFileContent, '.env file')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedLabel === '.env file' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => downloadFile('.env', envFileContent, 'text/plain')}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                  {envFileContent}
                </pre>
              </div>
            )}

            {/* Sub-tab 3: Continue config.json */}
            {activeManualConfig === 'continue_json' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 text-xs block">File Location:</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ~/.continue/config.json
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(continueConfigJson, 'Continue config.json')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedLabel === 'Continue config.json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => downloadFile('config.json', continueConfigJson, 'application/json')}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed">
                  {continueConfigJson}
                </pre>
              </div>
            )}

            {/* Sub-tab 4: Cline Modes */}
            {activeManualConfig === 'cline_modes' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-200 text-xs block">File Location:</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      .roomodes or cline_custom_modes.json in workspace root
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(clineModesJson, 'cline_custom_modes.json')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedLabel === 'cline_custom_modes.json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => downloadFile('cline_custom_modes.json', clineModesJson, 'application/json')}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
                  {clineModesJson}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* CONTINUE.DEV                                                 */}
        {/* ============================================================ */}
        {activeTab === 'continue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Continue.dev Configuration</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add this block to your <code className="text-sky-300 font-mono">~/.continue/config.json</code> file.
                </p>
              </div>

              <button
                onClick={() => downloadFile('config.json', continueConfigJson, 'application/json')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download config.json</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                {continueConfigJson}
              </pre>
              <button
                onClick={() => copyToClipboard(continueConfigJson, 'Continue Config')}
                className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer flex items-center gap-1"
              >
                {copiedLabel === 'Continue Config' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CURSOR & WINDSURF                                           */}
        {/* ============================================================ */}
        {activeTab === 'cursor' && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100">Cursor & Windsurf IDE Setup</h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure OpenAI endpoint overriding in Cursor or Windsurf.
              </p>
            </div>

            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-300">
              <li>Open Cursor and navigate to <strong>Cursor Settings</strong> (<kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px] font-mono">Ctrl+Shift+J</kbd>).</li>
              <li>Go to <strong>Models</strong> in the sidebar.</li>
              <li>Toggle on <strong>Override OpenAI Base URL</strong>.</li>
              <li>In <strong>OpenAI Base URL</strong>, paste: <code className="text-sky-300 font-mono select-all">{baseUrl}</code></li>
              <li>In <strong>OpenAI API Key</strong>, paste: <code className="text-amber-300 font-mono select-all">{activeKey}</code></li>
              <li>Add <code className="text-indigo-300 font-mono select-all">{selectedModel}</code> under Model Names and enable it.</li>
            </ol>
          </div>
        )}

        {/* LIVE IN-BROWSER GATEWAY DIAGNOSTICS */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>In-Browser Gateway Connectivity Checker</span>
            </h4>
            <span className="text-[11px] text-slate-500">Test live before connecting external tools</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ping Models */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Ping /v1/models</span>
                <button
                  onClick={handlePingModels}
                  disabled={pingStatus === 'loading'}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs transition cursor-pointer"
                >
                  {pingStatus === 'loading' ? 'Testing...' : 'Test Ping'}
                </button>
              </div>
              {pingResult && (
                <div
                  className={`text-[11px] font-mono p-2 rounded ${
                    pingStatus === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {pingResult}
                </div>
              )}
            </div>

            {/* Test Prompt */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Test /v1/chat/completions</span>
                <button
                  onClick={handleTestPrompt}
                  disabled={testPromptStatus === 'loading'}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs transition cursor-pointer"
                >
                  {testPromptStatus === 'loading' ? 'Sending...' : 'Test Completion'}
                </button>
              </div>
              {testPromptResult && (
                <div
                  className={`text-[11px] p-2 rounded ${
                    testPromptStatus === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span className="text-slate-400 block font-mono text-[10px]">
                    {testPromptResult.latency}ms • {testPromptResult.model}
                  </span>
                  <div>{testPromptResult.reply}</div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

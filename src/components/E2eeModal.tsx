import React, { useState } from 'react';
import { Lock, Unlock, Shield, Key, Eye, EyeOff, Download, Upload, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { EncryptedPayload, SessionHistory } from '../types';

interface E2eeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onSetPassphrase: (passphrase: string) => Promise<boolean>;
  onLockVault: () => void;
  keyFingerprint: string | null;
  sessions: SessionHistory[];
  activeEncryptedPayload?: EncryptedPayload;
  onImportVault: (vaultData: { sessions: SessionHistory[] }) => void;
}

export function E2eeModal({
  isOpen,
  onClose,
  isUnlocked,
  onSetPassphrase,
  onLockVault,
  keyFingerprint,
  sessions,
  activeEncryptedPayload,
  onImportVault,
}: E2eeModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vault' | 'inspector' | 'backup'>('vault');
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUnlockOrSet = async () => {
    if (!passphrase || passphrase.length < 6) {
      setError('Passphrase must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ok = await onSetPassphrase(passphrase);
      if (ok) {
        setPassphrase('');
      } else {
        setError('Incorrect passphrase for existing encrypted sessions.');
      }
    } catch {
      setError('Cryptographic error processing key.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportVault = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      schema: 'ai-agent-e2ee-vault-v1',
      exportedAt: new Date().toISOString(),
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        isEncrypted: true,
        encryptedPayload: s.encryptedPayload,
      }))
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `agent-vault-backup-${new Date().toISOString().slice(0, 10)}.e2ee-vault.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.sessions && Array.isArray(parsed.sessions)) {
          onImportVault({ sessions: parsed.sessions });
          alert(`Successfully imported ${parsed.sessions.length} encrypted sessions into vault.`);
        } else {
          alert('Invalid vault backup structure.');
        }
      } catch {
        alert('Failed to parse vault file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="e2ee-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div id="e2ee-modal-container" className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isUnlocked
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}>
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                End-to-End Encryption (E2EE) Vault
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isUnlocked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isUnlocked ? 'VAULT UNLOCKED' : 'VAULT LOCKED'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">AES-GCM 256-bit client-side zero-knowledge encryption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('vault')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'vault' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vault Security & Key
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'inspector' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Inspect Ciphertext
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Backup & Export
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {activeTab === 'vault' && (
            <div className="space-y-5">
              {/* Crypto Spec Card */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Zero-Knowledge Storage Specification
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Symmetric Cipher:</span>
                    <span className="font-mono text-slate-200">AES-GCM (256-bit)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Key Derivation:</span>
                    <span className="font-mono text-slate-200">PBKDF2-SHA256 (100k rounds)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Initialization Vector:</span>
                    <span className="font-mono text-slate-200">12-Byte Cryptographic IV</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Key Fingerprint:</span>
                    <span className="font-mono text-emerald-400">{keyFingerprint || 'Not Initialized'}</span>
                  </div>
                </div>
              </div>

              {/* Passphrase Input / Lock Control */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  {isUnlocked ? 'Vault Passphrase Active' : 'Enter Master Vault Passphrase'}
                </label>

                {!isUnlocked ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter master passphrase to unlock or initialize..."
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlockOrSet()}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleUnlockOrSet}
                        disabled={loading || !passphrase.trim()}
                        className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Unlock & Decrypt Sessions
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-emerald-300">Vault is Active & Decrypting in Browser Memory</div>
                        <div className="text-[11px] text-emerald-400/80">Stored chats remain encrypted in persistent storage at all times.</div>
                      </div>
                    </div>
                    <button
                      onClick={onLockVault}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1.5 border border-slate-700"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Lock Vault Now
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inspector' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 leading-relaxed">
                Security verification: Below is the actual ciphertext snapshot stored in browser persistence. Notice that no developer prompts, source code fragments, or responses are readable without the AES-GCM master key.
              </div>

              {activeEncryptedPayload ? (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans">Salt (Base64 PBKDF2):</span>
                    <span className="text-amber-400 break-all">{activeEncryptedPayload.salt}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans">IV (Base64 GCM Nonce):</span>
                    <span className="text-sky-400 break-all">{activeEncryptedPayload.iv}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans">Ciphertext (Base64 AES-GCM Tagged):</span>
                    <div className="max-h-40 overflow-y-auto p-2 rounded bg-slate-900/80 text-emerald-400 break-all text-[11px]">
                      {activeEncryptedPayload.ciphertext}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    Encrypted at: {new Date(activeEncryptedPayload.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  No active session encrypted yet. Start a chat or lock your vault to view the raw cryptographic ciphertext.
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Safely backup your encrypted sessions or migrate between workstations without exposing plain code or keys:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Download className="w-4 h-4 text-sky-400" />
                    Export Encrypted Vault
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Exports all {sessions.length} sessions as an encrypted <code className="text-slate-300">.e2ee-vault.json</code> file.
                  </p>
                  <button
                    onClick={handleExportVault}
                    className="w-full px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {exportSuccess ? 'Downloaded Vault!' : 'Export Vault File'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Upload className="w-4 h-4 text-amber-400" />
                    Import Encrypted Vault
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Restore previously backed-up sessions from an <code className="text-slate-300">.e2ee-vault.json</code> file.
                  </p>
                  <label className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700">
                    <Upload className="w-3.5 h-3.5" />
                    Choose File to Import
                    <input type="file" accept=".json,.e2ee-vault.json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

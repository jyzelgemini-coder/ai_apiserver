import React, { useState } from 'react';
import { Users, Wifi, Copy, Check, Plus, Radio, ArrowRight } from 'lucide-react';
import { CollabPeer } from '../types';

interface CollabBarProps {
  roomId: string;
  onRoomChange: (newRoomId: string) => void;
  peers: CollabPeer[];
  isConnected: boolean;
  myPeerId: string;
  activeFile?: string;
  activeLine?: number;
}

export function CollabBar({
  roomId,
  onRoomChange,
  peers,
  isConnected,
  myPeerId,
  activeFile,
  activeLine,
}: CollabBarProps) {
  const [copied, setCopied] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinInput, setJoinInput] = useState('');

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinInput.trim()) {
      onRoomChange(joinInput.trim().toUpperCase());
      setShowJoinInput(false);
      setJoinInput('');
    }
  };

  return (
    <div id="collab-bar" className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
      {/* Left: Room Status & Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            )}
          </span>
          <span className="font-medium text-slate-400">Collab Room:</span>
          <span className="font-mono font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-900/50">
            {roomId}
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
          title="Copy Live Collaboration Invite Link"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Invite'}</span>
        </button>

        {!showJoinInput ? (
          <button
            onClick={() => setShowJoinInput(true)}
            className="text-slate-400 hover:text-slate-200 hover:underline flex items-center gap-1 text-[11px]"
          >
            <Plus className="w-3 h-3" />
            Switch Room
          </button>
        ) : (
          <form onSubmit={handleJoin} className="flex items-center gap-1">
            <input
              type="text"
              placeholder="ROOM-ID"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white uppercase font-mono"
            />
            <button
              type="submit"
              className="p-1 bg-sky-600 hover:bg-sky-500 text-white rounded"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setShowJoinInput(false)}
              className="text-slate-500 hover:text-slate-300 px-1 text-xs"
            >
              ✕
            </button>
          </form>
        )}
      </div>

      {/* Right: Connected Peers with Avatars & Cursor info */}
      <div className="flex items-center gap-3">
        {activeFile && (
          <span className="hidden md:inline-block text-slate-500 font-mono text-[11px]">
            You: {activeFile.split('/').pop()} {activeLine ? `:L${activeLine}` : ''}
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400 font-medium">
            {peers.length + 1} online:
          </span>

          <div className="flex -space-x-1.5 overflow-hidden items-center">
            {/* Self */}
            <div
              className="w-5 h-5 rounded-full bg-sky-500 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
              title={`You (${myPeerId})`}
            >
              Y
            </div>

            {/* Remote Peers */}
            {peers.map((peer) => (
              <div
                key={peer.id}
                className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: peer.avatarColor || '#a855f7' }}
                title={`${peer.name} ${peer.cursorFile ? `editing ${peer.cursorFile.split('/').pop()}` : ''}`}
              >
                {peer.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

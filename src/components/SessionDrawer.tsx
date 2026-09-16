import { useState } from 'react';
import { MessageSquare, Plus, Trash2, Edit2, Check, X, Shield, Clock } from 'lucide-react';
import { SessionHistory } from '../types';

interface SessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionHistory[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
}

export function SessionDrawer({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
}: SessionDrawerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const handleStartRename = (session: SessionHistory) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-80 bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Agent Sessions</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs"
          >
            ✕
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Agent Session</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {sessions.map((session) => {
            const isSelected = session.id === currentSessionId;
            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`group p-3 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-800 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                {editingId === session.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 bg-slate-900 border border-sky-500 rounded px-2 py-1 text-xs text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(session.id)}
                      className="p-1 text-emerald-400 hover:text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium truncate flex-1 pr-2">
                        {session.title}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(session);
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this encrypted session?')) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(session.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>

                      <span className="flex items-center gap-1 text-emerald-400 font-mono">
                        <Shield className="w-3 h-3" />
                        AES-256 E2EE
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Persistent & Client-Side Encrypted
        </div>
      </div>
    </div>
  );
}

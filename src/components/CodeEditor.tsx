import React, { useState, useEffect } from 'react';
import { Save, Send, RotateCcw, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';
import { RepositoryFile, CollabPeer } from '../types';

interface CodeEditorProps {
  file: RepositoryFile | null;
  onUpdateContent: (path: string, newContent: string) => void;
  onSendToAgent: (file: RepositoryFile) => void;
  onCursorChange: (line: number) => void;
  peers: CollabPeer[];
}

export function CodeEditor({
  file,
  onUpdateContent,
  onSendToAgent,
  onCursorChange,
  peers,
}: CodeEditorProps) {
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const [currentLine, setCurrentLine] = useState(1);

  useEffect(() => {
    if (file) {
      setContent(file.content);
    } else {
      setContent('');
    }
  }, [file?.path, file?.content]);

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-8">
        <FileCode className="w-12 h-12 mb-3 opacity-40 text-slate-400" />
        <p className="text-sm font-medium text-slate-400">No file selected in workspace</p>
        <p className="text-xs text-slate-600 mt-1">Select a file from the repository explorer on the left.</p>
      </div>
    );
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    onUpdateContent(file.path, val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      onUpdateContent(file.path, newContent);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const textUpToCursor = content.substring(0, target.selectionStart);
    const line = textUpToCursor.split('\n').length;
    setCurrentLine(line);
    onCursorChange(line);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdateContent(file.path, content);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  };

  const lines = content.split('\n');
  const peersOnThisFile = peers.filter((p) => p.cursorFile === file.path);

  return (
    <div id="code-editor-container" className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden border-r border-slate-800">
      {/* Editor Tab Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-200 font-medium flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-sky-400" />
            {file.path}
          </span>
          {file.isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved modifications" />
          )}
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase">
            {file.language}
          </span>
        </div>

        {/* Editor Actions */}
        <div className="flex items-center gap-1.5">
          {savedBadge && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 mr-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}

          {peersOnThisFile.length > 0 && (
            <div className="flex items-center gap-1 mr-2 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-[11px] text-purple-300">
              <span>{peersOnThisFile.map((p) => p.name).join(', ')} co-editing</span>
            </div>
          )}

          <button
            onClick={() => onSendToAgent(file)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition shadow-xs"
            title="Send this file buffer as active context to the AI Agent"
          >
            <Send className="w-3 h-3" />
            <span>Send to Agent</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition border border-slate-700"
            title="Save Buffer"
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs relative">
        {/* Line Numbers Gutter */}
        <div className="w-12 py-3 bg-slate-950 text-slate-600 text-right pr-3 select-none border-r border-slate-900 overflow-hidden leading-5">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const peerOnLine = peersOnThisFile.find((p) => p.cursorLine === lineNum);
            return (
              <div
                key={i}
                className={`relative flex items-center justify-end ${
                  lineNum === currentLine ? 'text-sky-400 font-bold' : ''
                }`}
              >
                {peerOnLine && (
                  <span
                    className="absolute -left-2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: peerOnLine.avatarColor || '#a855f7' }}
                    title={`${peerOnLine.name} is on line ${lineNum}`}
                  />
                )}
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Code Buffer */}
        <textarea
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelection}
          onClick={handleSelection}
          onKeyUp={handleSelection}
          spellCheck={false}
          className="flex-1 h-full p-3 bg-slate-950 text-slate-200 font-mono text-xs resize-none focus:outline-none leading-5 overflow-auto selection:bg-sky-600/30 whitespace-pre"
        />
      </div>

      {/* Editor Status Bar */}
      <div className="px-4 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <div className="flex items-center gap-4">
          <span>Ln {currentLine}, Col 1</span>
          <span>{lines.length} lines</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Repository Mode:</span>
          <span className="text-emerald-400">Integrated</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Folder, FileCode, Plus, Trash2, GitBranch, Search, RotateCcw, Check, Sparkles } from 'lucide-react';
import { RepositoryFile } from '../types';

interface RepoExplorerProps {
  files: RepositoryFile[];
  activeFile: RepositoryFile | null;
  onSelectFile: (file: RepositoryFile) => void;
  onAddFile: (path: string, content?: string) => void;
  onDeleteFile: (path: string) => void;
  onResetRepo: () => void;
}

export function RepoExplorer({
  files,
  activeFile,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onResetRepo,
}: RepoExplorerProps) {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  const dirtyFilesCount = files.filter((f) => f.isDirty).length;

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFilePath.trim();
    if (clean) {
      onAddFile(clean, '// Newly created file buffer\n');
      setNewFilePath('');
      setIsAdding(false);
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'typescript':
        return 'text-sky-400';
      case 'json':
        return 'text-amber-400';
      case 'markdown':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div id="repo-explorer" className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col text-xs select-none">
      {/* Repo Title & Git Status */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200">Repository</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            <GitBranch className="w-3 h-3 text-emerald-400" />
            main
          </span>
          {dirtyFilesCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono" title={`${dirtyFilesCount} modified files`}>
              *{dirtyFilesCount}
            </span>
          )}
        </div>
      </div>

      {/* Search & Actions */}
      <div className="p-2 border-b border-slate-800/80 space-y-1.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition"
          >
            <Plus className="w-3 h-3" />
            <span>New File</span>
          </button>
          <button
            onClick={onResetRepo}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition"
            title="Reset repository to original clean snapshot"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreateFile} className="pt-1">
            <input
              type="text"
              placeholder="e.g. src/utils/helper.ts"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-sky-500 rounded px-2 py-1 text-[11px] text-white font-mono"
            />
          </form>
        )}
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono">
        {filteredFiles.map((file) => {
          const isSelected = activeFile?.path === file.path;
          return (
            <div
              key={file.path}
              onClick={() => onSelectFile(file)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                isSelected
                  ? 'bg-sky-950/60 text-sky-200 border border-sky-800/60 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${getLanguageColor(file.language)}`} />
                <span className="truncate text-[11px]">{file.path}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {file.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${file.path}?`)) {
                      onDeleteFile(file.path);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 rounded transition"
                  title="Delete file"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 flex items-center justify-between">
        <span>{files.length} workspace files</span>
        <span>TypeScript/ESNext</span>
      </div>
    </div>
  );
}

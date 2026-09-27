import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  RotateCcw, 
  RotateCw, 
  Search, 
  Replace, 
  Play, 
  Eye, 
  FileCode, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Check, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Site, HostedFile, Deployment } from '../../types';
import { buildSandboxedSiteHtml } from '../../utils/siteSandbox';
import { generateRandomId } from '../../utils/crypto';

interface EditorTabProps {
  site: Site;
  activeFilePath?: string;
  onUpdateSite: (updated: Site) => void;
  onDeploySuccess?: () => void;
}

export const EditorTab: React.FC<EditorTabProps> = ({
  site,
  activeFilePath = 'index.html',
  onUpdateSite,
  onDeploySuccess,
}) => {
  const editableFiles = site.files.filter(f => !f.isBinary);
  const [currentFilePath, setCurrentFilePath] = useState(activeFilePath);
  
  // Find current file or fallback to index.html
  const currentFile = site.files.find(f => f.path === currentFilePath) || editableFiles[0];

  const [code, setCode] = useState(currentFile ? currentFile.content : '');
  const [history, setHistory] = useState<string[]>([currentFile ? currentFile.content : '']);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Search & Replace
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  // Live preview & UI states
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaved, setIsSaved] = useState(true);
  const [deployNotification, setDeployNotification] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when file changes
  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.content);
      setHistory([currentFile.content]);
      setHistoryIdx(0);
      setIsSaved(true);
    }
  }, [currentFilePath]);

  // Handle Code Change with Undo/Redo stack
  const handleCodeChange = (newVal: string) => {
    setCode(newVal);
    setIsSaved(false);

    // Debounce history additions to avoid huge arrays
    const nextHistory = [...history.slice(0, historyIdx + 1), newVal];
    if (nextHistory.length > 50) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevVal = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setCode(prevVal);
      setIsSaved(false);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextVal = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setCode(nextVal);
      setIsSaved(false);
    }
  };

  // Auto indentation & Tab key handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const nextCode = code.substring(0, start) + '  ' + code.substring(end);
      handleCodeChange(nextCode);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }

    // Ctrl+S or Cmd+S shortcut
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveAndRedeploy();
    }

    // Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }

    // Ctrl+Y or Ctrl+Shift+Z
    if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      handleRedo();
    }

    // Ctrl+F
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      setShowSearch(prev => !prev);
    }
  };

  // Search & Replace execution
  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const replaced = code.replace(regex, replaceQuery);
    handleCodeChange(replaced);
  };

  // Save changes & Trigger new deployment version
  const handleSaveAndRedeploy = () => {
    if (!currentFile) return;

    // Update the file in site.files
    const updatedFiles = site.files.map(f => {
      if (f.path === currentFile.path) {
        return {
          ...f,
          content: code,
          size: new Blob([code]).size,
          lastModified: Date.now(),
        };
      }
      return f;
    });

    const newDepVersion = (site.deployments[0]?.version || 1) + 1;
    const newDepId = 'dep_' + generateRandomId(8);
    const totalBytes = updatedFiles.reduce((acc, f) => acc + f.size, 0);

    const newDeployment: Deployment = {
      id: newDepId,
      version: newDepVersion,
      status: 'production',
      createdAt: Date.now(),
      buildTimeMs: Math.floor(Math.random() * 400) + 600,
      summary: `「${currentFile.path}」をオンラインエディタから更新`,
      filesCount: updatedFiles.length,
      totalSize: totalBytes,
      logs: [
        `[1/4] ファイル差分をコミット: ${currentFile.path}`,
        `[2/4] アセット最適化とキャッシュ更新を実施`,
        `[3/4] エッジノードへ最新ファイルを同期完了`,
        `[4/4] デプロイ #${newDepVersion} を全世界に反映完了`,
      ],
      snapshotFiles: JSON.parse(JSON.stringify(updatedFiles)),
    };

    const updatedSite: Site = {
      ...site,
      files: updatedFiles,
      storageBytes: totalBytes,
      updatedAt: Date.now(),
      currentDeploymentId: newDepId,
      deployments: [newDeployment, ...site.deployments],
    };

    onUpdateSite(updatedSite);
    setIsSaved(true);
    setDeployNotification(`デプロイ #${newDepVersion} が本番に反映されました！`);

    setTimeout(() => {
      setDeployNotification(null);
    }, 3500);

    if (onDeploySuccess) onDeploySuccess();
  };

  // Construct virtual preview HTML using the current uncommitted code for real-time live preview!
  const previewSite: Site = {
    ...site,
    files: site.files.map(f => f.path === currentFile?.path ? { ...f, content: code } : f),
  };
  const livePreviewHtml = buildSandboxedSiteHtml(previewSite, 'index.html', true);

  // Line numbers calculation
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#090d16] p-3 shadow-md">
        
        {/* File Switcher & Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={currentFilePath}
              onChange={(e) => setCurrentFilePath(e.target.value)}
              className="appearance-none rounded-xl bg-slate-900 border border-slate-800 py-1.5 pl-3 pr-8 text-xs font-mono font-semibold text-cyan-400 focus:border-cyan-500 focus:outline-none"
            >
              {editableFiles.map(f => (
                <option key={f.path} value={f.path} className="bg-slate-900 text-white">
                  {f.path}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="元に戻す (Ctrl+Z)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="やり直す (Ctrl+Y)"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`rounded-lg p-1.5 transition-colors ${
                showSearch ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="検索・置換 (Ctrl+F)"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className={`text-[11px] font-medium ${isSaved ? 'text-slate-500' : 'text-amber-400'}`}>
            {isSaved ? '● 保存済み' : '● 未保存の変更あり'}
          </span>
        </div>

        {/* Right Action: Save & Redeploy */}
        <div className="flex items-center gap-2">
          {deployNotification && (
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 animate-fadeIn">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{deployNotification}</span>
            </div>
          )}

          <button
            onClick={handleSaveAndRedeploy}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="h-4 w-4" />
            <span>保存して再デプロイ</span>
          </button>
        </div>

      </div>

      {/* Search & Replace Floating Bar */}
      {showSearch && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs animate-fadeIn">
          <div className="flex items-center gap-1 bg-slate-950 rounded-lg px-2 py-1 border border-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="検索文字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-36 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 rounded-lg px-2 py-1 border border-slate-800">
            <Replace className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="置換後..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-36 text-xs"
            />
          </div>

          <button
            onClick={handleReplaceAll}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1 font-semibold text-slate-200 border border-slate-700"
          >
            すべて置換
          </button>
        </div>
      )}

      {/* Split Pane: Code Editor (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px]">
        
        {/* Left: Code Editor with Line Numbers */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-slate-800 bg-[#060912] overflow-hidden shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2 text-xs font-mono text-slate-400">
            <span>{currentFilePath}</span>
            <span>{lineCount} 行 • UTF-8</span>
          </div>

          <div className="flex-1 flex overflow-hidden font-mono text-xs">
            {/* Line numbers column */}
            <div className="select-none bg-[#080d1a] border-r border-slate-800/80 px-3 py-3 text-right text-slate-600 font-mono overflow-hidden">
              {lineNumbers.map(n => (
                <div key={n} className="leading-6">{n}</div>
              ))}
            </div>

            {/* Code input area */}
            <div className="flex-1 relative overflow-auto">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="w-full h-full resize-none bg-transparent p-3 text-slate-200 font-mono leading-6 focus:outline-none whitespace-pre selection:bg-cyan-500/30 selection:text-cyan-200"
              />
            </div>
          </div>
        </div>

        {/* Right: Live Preview Pane */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-slate-800 bg-[#090d16] overflow-hidden shadow-inner">
          
          {/* Preview Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">リアルタイムプレビュー</span>
            </div>

            {/* Viewport switch */}
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1 rounded ${previewViewport === 'desktop' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                title="Desktop"
              >
                <Monitor className="h-3 w-3" />
              </button>
              <button
                onClick={() => setPreviewViewport('tablet')}
                className={`p-1 rounded ${previewViewport === 'tablet' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                title="Tablet"
              >
                <Tablet className="h-3 w-3" />
              </button>
              <button
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1 rounded ${previewViewport === 'mobile' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                title="Mobile"
              >
                <Smartphone className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Sandboxed iframe container */}
          <div className="flex-1 bg-slate-950 p-2 overflow-auto flex items-center justify-center">
            <div
              className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-white ${
                previewViewport === 'mobile'
                  ? 'w-[375px]'
                  : previewViewport === 'tablet'
                  ? 'w-[500px]'
                  : 'w-full'
              }`}
            >
              <iframe
                srcDoc={livePreviewHtml}
                title="Live Editor Preview"
                sandbox="allow-scripts allow-forms allow-same-origin"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { 
  Folder, 
  FolderPlus, 
  FilePlus, 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Edit3, 
  Upload, 
  Eye, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Site, HostedFile } from '../../types';
import { getMimeType, isBinaryMime, createZipFromFiles } from '../../utils/zip';
import { generateRandomId, formatBytes } from '../../utils/crypto';

interface FilesTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
  onSelectFileForEditor?: (filePath: string) => void;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  file?: HostedFile;
  children: Record<string, TreeNode>;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  site,
  onUpdateSite,
  onSelectFileForEditor,
}) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('index.html');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '': true });
  const [previewFile, setPreviewFile] = useState<HostedFile | null>(null);

  // New file/folder modals
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<HostedFile | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Upload additional files
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Build tree from site.files
  const rootNode: TreeNode = { name: 'root', fullPath: '', isFolder: true, children: {} };

  for (const file of site.files) {
    const parts = file.path.split('/');
    let current = rootNode;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: parts.slice(0, i + 1).join('/'),
          isFolder: !isLast,
          file: isLast ? file : undefined,
          children: {},
        };
      }
      current = current.children[part];
    }
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Delete file
  const handleDeleteFile = (path: string) => {
    if (path === 'index.html') {
      if (!confirm('index.html はトップページとして必須です。本当に削除しますか？')) return;
    } else {
      if (!confirm(`「${path}」を削除してもよろしいですか？`)) return;
    }

    const nextFiles = site.files.filter(f => f.path !== path);
    const updatedSize = nextFiles.reduce((acc, f) => acc + f.size, 0);

    onUpdateSite({
      ...site,
      files: nextFiles,
      storageBytes: updatedSize,
      updatedAt: Date.now(),
    });

    if (selectedFilePath === path) {
      setSelectedFilePath(nextFiles[0]?.path || '');
    }
  };

  // Download single file
  const handleDownloadFile = (file: HostedFile) => {
    const link = document.createElement('a');
    if (file.isBinary) {
      link.href = file.content;
    } else {
      const blob = new Blob([file.content], { type: file.mimeType });
      link.href = URL.createObjectURL(blob);
    }
    link.download = file.name;
    link.click();
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    const zipBlob = await createZipFromFiles(site.files);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${site.subdomain}-backup.zip`;
    a.click();
  };

  // Create new file
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let path = newFileName.trim().replace(/^\/+/, '');
    if (site.files.some(f => f.path === path)) {
      alert('同名のファイルが既に存在します。');
      return;
    }

    const mime = getMimeType(path);
    const isBinary = isBinaryMime(mime);
    const newFile: HostedFile = {
      id: generateRandomId(10),
      path,
      name: path.split('/').pop() || path,
      size: 0,
      mimeType: mime,
      content: path.endsWith('.html') ? '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  <h1>New Page</h1>\n</body>\n</html>' : '',
      isBinary,
      lastModified: Date.now(),
    };

    const nextFiles = [...site.files, newFile];
    onUpdateSite({
      ...site,
      files: nextFiles,
      updatedAt: Date.now(),
    });

    setShowNewFileModal(false);
    setNewFileName('');
    setSelectedFilePath(path);
  };

  // Upload additional files
  const handleAdditionalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const newHostedList: HostedFile[] = [...site.files];

    for (const f of filesArray) {
      const relPath = f.name;
      const mime = getMimeType(relPath);
      const isBinary = isBinaryMime(mime);
      let content = '';

      if (isBinary) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
      } else {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(f);
        });
      }

      // Check if replace existing
      const existingIdx = newHostedList.findIndex(x => x.path === relPath);
      const fileObj: HostedFile = {
        id: generateRandomId(10),
        path: relPath,
        name: f.name,
        size: f.size,
        mimeType: mime,
        content,
        isBinary,
        lastModified: Date.now(),
      };

      if (existingIdx !== -1) {
        newHostedList[existingIdx] = fileObj;
      } else {
        newHostedList.push(fileObj);
      }
    }

    const updatedSize = newHostedList.reduce((acc, f) => acc + f.size, 0);

    onUpdateSite({
      ...site,
      files: newHostedList,
      storageBytes: updatedSize,
      updatedAt: Date.now(),
    });
  };

  // Rename commit
  const handleRenameCommit = () => {
    if (!renameTarget || !renameValue.trim()) return;
    const oldPath = renameTarget.path;
    const newPath = renameValue.trim().replace(/^\/+/, '');

    const nextFiles = site.files.map(f => {
      if (f.path === oldPath) {
        return {
          ...f,
          path: newPath,
          name: newPath.split('/').pop() || newPath,
        };
      }
      return f;
    });

    onUpdateSite({
      ...site,
      files: nextFiles,
      updatedAt: Date.now(),
    });

    setRenameTarget(null);
    setRenameValue('');
    if (selectedFilePath === oldPath) setSelectedFilePath(newPath);
  };

  // Recursive Tree Renderer
  const renderTree = (node: TreeNode, depth: number = 0) => {
    const keys = Object.keys(node.children).sort((a, b) => {
      const aIsFolder = node.children[a].isFolder;
      const bIsFolder = node.children[b].isFolder;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });

    return (
      <div className="space-y-0.5">
        {keys.map((key) => {
          const child = node.children[key];
          const isExpanded = expandedFolders[child.fullPath] !== false;

          if (child.isFolder) {
            return (
              <div key={child.fullPath}>
                <button
                  type="button"
                  onClick={() => toggleFolder(child.fullPath)}
                  style={{ paddingLeft: `${depth * 14 + 8}px` }}
                  className="flex w-full items-center gap-1.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 rounded-lg group transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <Folder className="h-4 w-4 text-cyan-400" />
                  <span className="font-semibold text-slate-200">{child.name}</span>
                </button>

                {isExpanded && (
                  <div className="border-l border-slate-800 ml-3">
                    {renderTree(child, depth + 1)}
                  </div>
                )}
              </div>
            );
          } else {
            const file = child.file!;
            const isSelected = selectedFilePath === file.path;

            return (
              <div
                key={file.path}
                style={{ paddingLeft: `${depth * 14 + 16}px` }}
                className={`group flex items-center justify-between py-1.5 px-2 text-xs rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
                onClick={() => setSelectedFilePath(file.path)}
              >
                <div className="flex items-center gap-2 truncate">
                  {file.path.endsWith('.html') ? (
                    <FileCode className="h-4 w-4 text-cyan-400 shrink-0" />
                  ) : file.isBinary ? (
                    <ImageIcon className="h-4 w-4 text-purple-400 shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{file.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    className="p-1 hover:text-white"
                    title="プレビュー"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFile(file);
                    }}
                    className="p-1 hover:text-white"
                    title="ダウンロード"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameTarget(file);
                      setRenameValue(file.path);
                    }}
                    className="p-1 hover:text-white"
                    title="名前変更"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.path);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400"
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const currentActiveFile = site.files.find(f => f.path === selectedFilePath);

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">ファイルマネージャー</h2>
          <p className="text-xs text-slate-400">
            サイトのファイル構造をブラウザ上で作成・編集・管理
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleAdditionalUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-cyan-400" />
            <span>ファイル追加</span>
          </button>

          <button
            onClick={() => setShowNewFileModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <FilePlus className="h-3.5 w-3.5 text-emerald-400" />
            <span>新規ファイル</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Archive className="h-3.5 w-3.5 text-amber-400" />
            <span>ZIP一括DL</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Tree View (Left) & File Details/Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tree Navigator */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-2 mb-2 border-b border-slate-800">
            <span>ファイルツリー ({site.files.length} 件)</span>
            <span>{formatBytes(site.storageBytes)}</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto pr-1">
            {renderTree(rootNode)}
          </div>
        </div>

        {/* Selected File Details / Quick Preview */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between">
          {currentActiveFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono text-sm font-bold text-white">{currentActiveFile.path}</span>
                </div>
                <span className="font-mono text-xs text-slate-400">{formatBytes(currentActiveFile.size)}</span>
              </div>

              {/* Text snippet or Image preview */}
              {currentActiveFile.isBinary ? (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-xl border border-slate-800">
                  <img
                    src={currentActiveFile.content}
                    alt={currentActiveFile.name}
                    className="max-h-64 max-w-full rounded-lg object-contain shadow-lg"
                  />
                  <p className="text-xs text-slate-400 mt-3 font-mono">{currentActiveFile.mimeType}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>ファイル内容プレビュー</span>
                    {onSelectFileForEditor && (
                      <button
                        onClick={() => onSelectFileForEditor(currentActiveFile.path)}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        エディターで開く →
                      </button>
                    )}
                  </div>
                  <pre className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed border border-slate-800/80">
                    {currentActiveFile.content.slice(0, 2000)}
                    {currentActiveFile.content.length > 2000 && '\n... (省略されました)'}
                  </pre>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleDownloadFile(currentActiveFile)}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>ダウンロード</span>
                </button>
                <button
                  onClick={() => handleDeleteFile(currentActiveFile.path)}
                  className="flex items-center gap-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 text-xs hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>ファイルを削除</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs">
              左のツリーからファイルを選択してください
            </div>
          )}
        </div>

      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateFile} className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">新規ファイルを作成</h3>
            <p className="text-xs text-slate-400 mb-4">
              ファイルパスを入力してください (例: <code>about.html</code>, <code>css/custom.css</code>)
            </p>
            <input
              type="text"
              required
              autoFocus
              placeholder="ファイル名またはパス..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                作成する
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename File Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">ファイル名を変更</h3>
            <input
              type="text"
              required
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                キャンセル
              </button>
              <button
                onClick={handleRenameCommit}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col items-center">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-bold text-white mb-4">{previewFile.name}</h4>
            <img src={previewFile.content} alt={previewFile.name} className="max-h-[60vh] max-w-full rounded-lg object-contain" />
          </div>
        </div>
      )}

    </div>
  );
};

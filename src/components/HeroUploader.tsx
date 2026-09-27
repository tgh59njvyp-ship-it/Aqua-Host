import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FolderArchive, 
  FileCode, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  Lock, 
  Globe2, 
  ArrowRight,
  RefreshCw,
  FolderOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { HostedFile } from '../types';
import { extractZipArchive, getMimeType, isBinaryMime } from '../utils/zip';
import { generateRandomId, formatBytes } from '../utils/crypto';
import { APP_CONFIG } from '../config/constants';
import { SAMPLE_TEMPLATES } from '../utils/templates';

interface HeroUploaderProps {
  onStartDeploy: (config: {
    name: string;
    subdomain: string;
    description: string;
    visibility: 'public' | 'private' | 'password_protected';
    password?: string;
    files: HostedFile[];
  }) => void;
  existingSubdomains: string[];
}

export const HeroUploader: React.FC<HeroUploaderProps> = ({
  onStartDeploy,
  existingSubdomains,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<HostedFile[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Form states
  const [siteName, setSiteName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'password_protected'>('public');
  const [sitePassword, setSitePassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const hasIndexHtml = parsedFiles.some(f => f.path === 'index.html');
  const totalBytes = parsedFiles.reduce((sum, f) => sum + f.size, 0);

  const cleanSubdomain = (val: string) => {
    return val.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
  };

  const isSubdomainTaken = existingSubdomains.includes(subdomain.toLowerCase());

  // Handle files list (from drop or input)
  const processUploadedFileList = async (filesList: FileList | File[]) => {
    setIsProcessing(true);
    setAnalysisError(null);

    try {
      const filesArray = Array.from(filesList);
      if (filesArray.length === 0) return;

      const zipFile = filesArray.find(f => f.name.toLowerCase().endsWith('.zip'));
      let extractedFiles: HostedFile[] = [];

      if (zipFile) {
        extractedFiles = await extractZipArchive(zipFile);
        if (!siteName) {
          const autoName = zipFile.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
          setSiteName(autoName.charAt(0).toUpperCase() + autoName.slice(1));
          const autoSub = cleanSubdomain(zipFile.name.replace(/\.zip$/i, ''));
          setSubdomain(autoSub || 'site-' + generateRandomId(6));
        }
      } else {
        for (const f of filesArray) {
          const webkitPath = (f as any).webkitRelativePath;
          let relPath = webkitPath ? webkitPath : f.name;

          if (webkitPath && webkitPath.includes('/')) {
            const parts = webkitPath.split('/');
            parts.shift();
            relPath = parts.join('/');
          }

          if (!relPath) relPath = f.name;

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

          extractedFiles.push({
            id: generateRandomId(10),
            path: relPath,
            name: f.name,
            size: f.size,
            mimeType: mime,
            content,
            isBinary,
            lastModified: f.lastModified || Date.now(),
          });
        }

        if (!siteName && extractedFiles.length > 0) {
          const candidate = extractedFiles[0].name.split('.')[0] || 'My Static Site';
          setSiteName(candidate.charAt(0).toUpperCase() + candidate.slice(1));
          setSubdomain(cleanSubdomain(candidate) || 'site-' + generateRandomId(6));
        }
      }

      if (extractedFiles.length === 0) {
        setAnalysisError('有効なWebファイルが見つかりませんでした。');
      } else {
        setParsedFiles(extractedFiles);
        if (!subdomain) {
          setSubdomain('site-' + generateRandomId(6));
        }
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError('ファイルの読み込み中にエラーが発生しました: ' + (err.message || '不明なエラー'));
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFileList(e.dataTransfer.files);
    }
  }, []);

  const handleAutoCreateIndexHtml = () => {
    const defaultIndex: HostedFile = {
      id: generateRandomId(10),
      path: 'index.html',
      name: 'index.html',
      size: 1200,
      mimeType: 'text/html; charset=utf-8',
      isBinary: false,
      lastModified: Date.now(),
      content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${siteName || 'AquaHost Site'}</title>
  <style>
    body { background: #070a11; color: #f8fafc; font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .box { background: #0f172a; padding: 2.5rem; border-radius: 1rem; border: 1px solid #1e293b; max-width: 440px; }
    h1 { color: #38bdf8; margin-top: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🚀 ${siteName || 'Hello World'}</h1>
    <p>AquaHost で即座にホスティングされました。</p>
  </div>
</body>
</html>`
    };
    setParsedFiles(prev => [defaultIndex, ...prev]);
  };

  const handleSelectTemplate = (tpl: typeof SAMPLE_TEMPLATES[0]) => {
    const randomSuffix = generateRandomId(4);
    const sub = cleanSubdomain(`${tpl.subdomainSuggestion}-${randomSuffix}`);
    setSiteName(tpl.name);
    setSubdomain(sub);
    setDescription(tpl.description);
    setParsedFiles(JSON.parse(JSON.stringify(tpl.files)));
  };

  const handleSubmitDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedFiles.length === 0 || !subdomain.trim()) return;

    onStartDeploy({
      name: siteName.trim() || 'Untitled Site',
      subdomain: subdomain.trim(),
      description: description.trim(),
      visibility,
      password: visibility === 'password_protected' ? sitePassword : undefined,
      files: parsedFiles,
    });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#0e1626]/90 via-[#0a0f1d]/95 to-[#070a11] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"></div>

      <div className="relative z-10 max-w-3xl mx-auto">
        
        {/* Simple Clean Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{APP_CONFIG.taglineJa}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            ファイルを置くだけ、<span className="bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">数秒でWeb公開</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            ZIPアーカイブ・HTML・静的フォルダをドラッグ＆ドロップ。無料SSL・CDN完備。
          </p>
        </div>

        {/* Upload Drop Zone */}
        {parsedFiles.length === 0 ? (
          <div className="space-y-6">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                  : 'border-slate-700/80 bg-slate-900/40 hover:border-cyan-500/60 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip,.html,.htm,.css,.js,.mjs,.json,.svg,.png,.jpg,.jpeg,.webp,.gif,.txt,.md"
                onChange={(e) => e.target.files && processUploadedFileList(e.target.files)}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                {...({ webkitdirectory: '', directory: '' } as any)}
                onChange={(e) => e.target.files && processUploadedFileList(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  {isProcessing ? (
                    <RefreshCw className="h-7 w-7 animate-spin text-cyan-400" />
                  ) : (
                    <Upload className="h-7 w-7" />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {isProcessing ? 'ファイルを解析中...' : 'ZIPまたはWebファイルをドロップ'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    ZIPファイル、HTML、CSS、JS、またはフォルダ一式
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
                  >
                    <FolderArchive className="h-3.5 w-3.5" />
                    <span>ファイルを選択</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      folderInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-sky-400" />
                    <span>フォルダを選択</span>
                  </button>
                </div>
              </div>
            </div>

            {analysisError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Quick Template Chips */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 font-medium">💡 ワンクリックで試すテンプレート:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {SAMPLE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors"
                    >
                      {tpl.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Streamlined Site Configuration Form */
          <form onSubmit={handleSubmitDeploy} className="space-y-4">
            
            {/* File Structure Banner */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {parsedFiles.length} ファイルを検出 ({formatBytes(totalBytes)})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {hasIndexHtml ? 'index.html 正常検出' : 'index.html なし'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setParsedFiles([]);
                  setSiteName('');
                  setSubdomain('');
                }}
                className="text-xs text-slate-400 hover:text-red-400"
              >
                ファイルを変更
              </button>
            </div>

            {/* Warning if missing index.html */}
            {!hasIndexHtml && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
                <span>index.html が含まれていません。</span>
                <button
                  type="button"
                  onClick={handleAutoCreateIndexHtml}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 transition-colors"
                >
                  自動生成する
                </button>
              </div>
            )}

            {/* Site Name and Subdomain Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-300">サイト名</label>
                <input
                  type="text"
                  required
                  placeholder="マイサイト"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-300">公開サブドメイン</label>
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 overflow-hidden focus-within:border-cyan-500">
                  <input
                    type="text"
                    required
                    placeholder="my-site"
                    value={subdomain}
                    onChange={(e) => setSubdomain(cleanSubdomain(e.target.value))}
                    className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <span className="bg-slate-800 px-2.5 py-2 text-[11px] font-mono text-cyan-400 border-l border-slate-700 shrink-0">
                    .{APP_CONFIG.defaultDomainSuffix}
                  </span>
                </div>
                {isSubdomainTaken && (
                  <p className="text-[10px] text-amber-400">⚠️ サブドメインが重複しています</p>
                )}
              </div>
            </div>

            {/* Advanced toggle (collapsed by default for ultra-clean UI) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 font-medium"
              >
                {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span>{showAdvanced ? '詳細設定を閉じる' : '詳細設定 (パスワード保護・説明文)'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-300">サイト説明文</label>
                    <input
                      type="text"
                      placeholder="ポートフォリオやプロジェクトの概要"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-300">公開設定</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibility('public')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          visibility === 'public' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        一般公開
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibility('password_protected')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          visibility === 'password_protected' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        パスワード保護
                      </button>
                    </div>

                    {visibility === 'password_protected' && (
                      <input
                        type="password"
                        placeholder="パスワードを入力"
                        value={sitePassword}
                        onChange={(e) => setSitePassword(e.target.value)}
                        className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs font-mono text-cyan-400 truncate max-w-[200px] sm:max-w-xs">
                https://{subdomain || 'my-site'}.{APP_CONFIG.defaultDomainSuffix}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setParsedFiles([])}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 transition-colors"
                >
                  やり直す
                </button>
                <button
                  type="submit"
                  disabled={!hasIndexHtml || isSubdomainTaken || !subdomain.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  <span>今すぐデプロイ</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

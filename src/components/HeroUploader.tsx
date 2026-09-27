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
  FolderOpen
} from 'lucide-react';
import { HostedFile } from '../types';
import { extractZipArchive, getMimeType, isBinaryMime } from '../utils/zip';
import { generateRandomId, formatBytes } from '../utils/crypto';
import { APP_CONFIG } from '../config/constants';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Detect index.html entry point
  const hasIndexHtml = parsedFiles.some(f => f.path === 'index.html');
  const totalBytes = parsedFiles.reduce((sum, f) => sum + f.size, 0);

  // Subdomain validation
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

      // Check if user uploaded a ZIP file
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
        // Individual files or folder
        for (const f of filesArray) {
          // relativePath if folder upload via webkitRelativePath
          const webkitPath = (f as any).webkitRelativePath;
          let relPath = webkitPath ? webkitPath : f.name;

          // Strip common parent folder if folder upload
          if (webkitPath && webkitPath.includes('/')) {
            const parts = webkitPath.split('/');
            parts.shift(); // remove root directory name
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

  // Drag and drop handlers
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

  // 1-Click Auto generate index.html if missing
  const handleAutoCreateIndexHtml = () => {
    const defaultIndex: HostedFile = {
      id: generateRandomId(10),
      path: 'index.html',
      name: 'index.html',
      size: 1450,
      mimeType: 'text/html; charset=utf-8',
      isBinary: false,
      lastModified: Date.now(),
      content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName || 'Welcome to AquaHost'}</title>
  <style>
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 3rem 2rem;
      border-radius: 16px;
      max-width: 500px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #38bdf8, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #94a3b8; font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem; }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.9rem;
      background: rgba(14, 165, 233, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🚀 Deployed via AquaHost</div>
    <h1>${siteName || 'Hello World'}</h1>
    <p>AquaHostによって正常にホスティングされました。エディタータブからコードを直接編集できます。</p>
  </div>
</body>
</html>`
    };

    setParsedFiles(prev => [defaultIndex, ...prev]);
  };

  // Submit deploy
  const handleSubmitDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedFiles.length === 0) return;
    if (!subdomain.trim()) return;

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
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-[#090d16] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-24 right-10 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* Title & value prop */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4 shadow-sm shadow-cyan-500/10">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>{APP_CONFIG.taglineJa}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            ファイルをドロップするだけで、<br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              数秒で専用URLを発行＆全世界公開
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            ZIPアーカイブ・HTML・CSS・JavaScript・画像を自動解析。高速CDN・無料SSL・オンラインエディター完備。
          </p>
        </div>

        {/* Upload Drop Zone */}
        {parsedFiles.length === 0 ? (
          <div>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
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

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                  {isProcessing ? (
                    <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                  ) : (
                    <Upload className="h-8 w-8 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {isProcessing ? 'ファイルを解析中...' : 'ZIPまたはWebファイルをここにドロップ'}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-400">
                    ZIPファイル、index.html、スタイルシート、画像、またはフォルダ一式
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
                  >
                    <FolderArchive className="h-4 w-4" />
                    <span>ファイルを選択</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      folderInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 border border-slate-700 transition-all"
                  >
                    <FolderOpen className="h-4 w-4 text-sky-400" />
                    <span>フォルダを選択</span>
                  </button>
                </div>

                {/* Supported file format pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/50">.ZIP</span>
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/50">.HTML</span>
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/50">.CSS</span>
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/50">.JS</span>
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 border border-slate-700/50">.PNG / .JPG / .SVG</span>
                </div>
              </div>
            </div>

            {analysisError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{analysisError}</span>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: File Structure Inspection & Site Configuration Form */
          <form onSubmit={handleSubmitDeploy} className="space-y-6">
            
            {/* File Analysis Result Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">ファイル構造を解析完了</h4>
                    <p className="text-xs text-slate-400">
                      計 <strong className="text-slate-200">{parsedFiles.length}</strong> 個のファイル ({formatBytes(totalBytes)})
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
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>ファイルをリセット</span>
                </button>
              </div>

              {/* Warning if missing index.html */}
              {!hasIndexHtml && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <strong className="block font-semibold">エントリーポイント (index.html) が見つかりません</strong>
                      <span>Webサイトのトップページとして表示される index.html が必要です。</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoCreateIndexHtml}
                    className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 transition-colors"
                  >
                    index.htmlを自動生成
                  </button>
                </div>
              )}

              {/* File list preview pill */}
              <div className="mt-4 max-h-36 overflow-y-auto space-y-1.5 pr-2 font-mono text-xs">
                {parsedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-1.5 border border-slate-800/60 text-slate-300"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.path === 'index.html' ? (
                        <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      ) : file.isBinary ? (
                        <FileText className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className={`truncate ${file.path === 'index.html' ? 'text-cyan-300 font-semibold' : ''}`}>
                        {file.path}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Settings Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Site Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  サイト名 (表示名) <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: マイポートフォリオ 2026"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
                />
              </div>

              {/* Subdomain */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  サブドメイン (専用URL) <span className="text-cyan-400">*</span>
                </label>
                <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all overflow-hidden">
                  <input
                    type="text"
                    required
                    placeholder="my-site"
                    value={subdomain}
                    onChange={(e) => setSubdomain(cleanSubdomain(e.target.value))}
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <span className="bg-slate-800/80 px-3 py-2.5 text-xs font-mono text-cyan-400 border-l border-slate-800 shrink-0">
                    .{APP_CONFIG.defaultDomainSuffix}
                  </span>
                </div>
                {isSubdomainTaken && (
                  <p className="text-[11px] text-amber-400">
                    ⚠️ このサブドメインは既存サイトと重複しています。別の名前に変更してください。
                  </p>
                )}
              </div>

            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                サイトの説明 (SEOメタ情報)
              </label>
              <input
                type="text"
                placeholder="例: 私の最新Web制作実績やスキルセットをまとめたポートフォリオサイトです。"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Access Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                公開アクセス設定
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    visibility === 'public'
                      ? 'border-cyan-500 bg-cyan-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Globe2 className={`h-4 w-4 ${visibility === 'public' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-xs font-semibold">一般公開 (Public)</div>
                    <div className="text-[10px] text-slate-500">誰でもURLからアクセス可能</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('password_protected')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    visibility === 'password_protected'
                      ? 'border-cyan-500 bg-cyan-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Lock className={`h-4 w-4 ${visibility === 'password_protected' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-xs font-semibold">パスワード保護</div>
                    <div className="text-[10px] text-slate-500">合言葉で閲覧制限</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    visibility === 'private'
                      ? 'border-cyan-500 bg-cyan-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 ${visibility === 'private' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-xs font-semibold">非公開 (Private)</div>
                    <div className="text-[10px] text-slate-500">一般アクセスを遮断</div>
                  </div>
                </button>

              </div>

              {/* Password Input if selected */}
              {visibility === 'password_protected' && (
                <div className="mt-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 p-3.5 space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-medium text-cyan-300">
                    設定するパスワード (SHA-256で安全に保護されます)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="パスワードを入力..."
                    value={sitePassword}
                    onChange={(e) => setSitePassword(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Globe2 className="h-4 w-4 text-cyan-400" />
                <span>発行URL: </span>
                <span className="font-mono text-cyan-300 font-semibold">
                  https://{subdomain || 'my-site'}.{APP_CONFIG.defaultDomainSuffix}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setParsedFiles([])}
                  className="w-1/2 sm:w-auto rounded-xl px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
                >
                  キャンセル
                </button>

                <button
                  type="submit"
                  disabled={!hasIndexHtml || isSubdomainTaken || !subdomain.trim()}
                  className="w-1/2 sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>今すぐデプロイ・公開</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

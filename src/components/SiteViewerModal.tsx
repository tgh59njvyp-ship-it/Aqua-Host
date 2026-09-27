import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  Smartphone, 
  Tablet, 
  Monitor, 
  QrCode, 
  ShieldCheck, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Site } from '../types';
import { buildSandboxedSiteHtml } from '../utils/siteSandbox';
import { hashPassword } from '../utils/crypto';
import { APP_CONFIG } from '../config/constants';
import { recordPageView } from '../utils/storage';

interface SiteViewerModalProps {
  site: Site | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SiteViewerModal: React.FC<SiteViewerModalProps> = ({
  site,
  isOpen,
  onClose,
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentPath, setCurrentPath] = useState('index.html');
  const [pathHistory, setPathHistory] = useState<string[]>(['index.html']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fullDomain = site ? `${site.subdomain}.${APP_CONFIG.defaultDomainSuffix}` : '';
  const currentUrl = `https://${fullDomain}/${currentPath === 'index.html' ? '' : currentPath}`;

  // Record page view on open
  useEffect(() => {
    if (isOpen && site) {
      recordPageView(site.id, currentPath);
    }
  }, [isOpen, site?.id, currentPath]);

  // Handle messages from the sandboxed iframe (navigation, password submission)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data || !site) return;

      // Internal page navigation
      if (event.data.type === 'AQUA_NAVIGATE') {
        const newPath = event.data.path.replace(/^\/+/, '');
        setCurrentPath(newPath);
        setPathHistory(prev => [...prev.slice(0, historyIndex + 1), newPath]);
        setHistoryIndex(prev => prev + 1);
        recordPageView(site.id, newPath);
      }

      // Password submission
      if (event.data.type === 'AQUA_SUBMIT_PASSWORD') {
        const submitted = event.data.password;
        const hashed = await hashPassword(submitted);
        if (site.access.passwordHash && hashed === site.access.passwordHash) {
          setIsPasswordUnlocked(true);
        } else {
          // Send error back to iframe
          iframeRef.current?.contentWindow?.postMessage({ type: 'AQUA_PASSWORD_ERROR' }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [site, historyIndex]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setCurrentPath(pathHistory[nextIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCurrentPath(pathHistory[nextIndex]);
    }
  };

  if (!isOpen || !site) return null;

  const htmlContent = buildSandboxedSiteHtml(site, currentPath, isPasswordUnlocked);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      
      {/* Top Browser Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#090d16] px-4 py-2.5 shadow-md">
        
        {/* Left: Window Controls & History */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="閉じる (Esc)"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleBack}
              disabled={historyIndex <= 0}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="戻る"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleForward}
              disabled={historyIndex >= pathHistory.length - 1}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="進む"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setReloadKey(k => k + 1)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="再読み込み"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center: Address Bar */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200">
            <div className="flex items-center gap-2 truncate">
              {site.access.visibility === 'password_protected' ? (
                <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="font-mono text-cyan-400 font-semibold truncate">
                https://{fullDomain}
              </span>
              <span className="font-mono text-slate-400">
                /{currentPath === 'index.html' ? '' : currentPath}
              </span>
            </div>

            <button
              onClick={handleCopyUrl}
              className="shrink-0 ml-2 rounded p-1 text-slate-400 hover:text-white transition-colors"
              title="URLをコピー"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Right: Viewport Modes, QR, External Open */}
        <div className="flex items-center gap-1.5">
          
          {/* Viewport switcher */}
          <div className="hidden md:flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setViewportMode('desktop')}
              className={`rounded-md p-1.5 transition-colors ${
                viewportMode === 'desktop' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="デスクトップ表示 (100%)"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('tablet')}
              className={`rounded-md p-1.5 transition-colors ${
                viewportMode === 'tablet' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="タブレット表示 (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewportMode('mobile')}
              className={`rounded-md p-1.5 transition-colors ${
                viewportMode === 'mobile' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="スマートフォン表示 (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* QR Code toggle */}
          <button
            onClick={() => setShowQr(!showQr)}
            className={`rounded-lg p-2 text-xs transition-colors border ${
              showQr ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
            title="スマホで実機確認用QRコード"
          >
            <QrCode className="h-4 w-4" />
          </button>

          {/* Open in real standalone tab using Blob URL */}
          <button
            onClick={() => {
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}
            className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="別タブで開く"
          >
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">別タブで開く</span>
          </button>

        </div>

      </div>

      {/* QR Code Popup Popover */}
      {showQr && (
        <div className="absolute top-16 right-4 z-50 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl text-center max-w-xs animate-scaleUp">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-white">スマートフォンで実機テスト</h4>
            <button onClick={() => setShowQr(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          {/* Quick QR representation */}
          <div className="bg-white p-3 rounded-xl mx-auto inline-block mb-3">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`} 
              alt="QR Code" 
              className="w-36 h-36"
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            スマホのカメラでスキャンしてプレビューをテストできます。
          </p>
        </div>
      )}

      {/* Main Sandbox Iframe Viewport Container */}
      <div className="flex-1 overflow-auto bg-[#04060a] p-3 sm:p-6 flex items-center justify-center">
        <div 
          className={`h-full transition-all duration-300 overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl bg-white ${
            viewportMode === 'mobile'
              ? 'w-[375px] max-w-full shadow-cyan-500/10'
              : viewportMode === 'tablet'
              ? 'w-[768px] max-w-full'
              : 'w-full'
          }`}
        >
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={htmlContent}
            title={site.name}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>

    </div>
  );
};

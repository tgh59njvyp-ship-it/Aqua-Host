import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Globe, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { APP_CONFIG } from '../config/constants';

export interface DeployStep {
  id: string;
  label: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  detail?: string;
}

interface DeployModalProps {
  isOpen: boolean;
  siteName: string;
  subdomain: string;
  onComplete: () => void;
  onOpenSite: () => void;
  onGoToDashboard: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  siteName,
  subdomain,
  onComplete,
  onOpenSite,
  onGoToDashboard,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const fullUrl = `https://${subdomain}.${APP_CONFIG.defaultDomainSuffix}`;

  const steps: DeployStep[] = [
    { id: 'parse', label: 'ファイル解析 (File Structure & Assets Analysis)' },
    { id: 'deps', label: '依存関係・エントリーポイント確認 (Dependency & Entry Check)' },
    { id: 'build', label: '静的ビルド＆アセット最適化 (Build & Optimization)' },
    { id: 'distribute', label: 'エッジファイル配置 (Edge Storage Distribution)' },
    { id: 'url', label: '専用URL・DNSルーティング発行 (URL & DNS Routing)' },
    { id: 'ssl', label: 'SSL/TLS自動暗号化証明書設定 (SSL Certificate Provisioning)' },
    { id: 'live', label: '全世界エッジ公開完了 (Production Live)' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setIsFinished(false);
      setLogs([]);
      return;
    }

    // Sequence of steps with realistic timings
    const stepDelays = [400, 600, 700, 650, 500, 600, 400];
    let currentIndex = 0;

    const logMessages = [
      `[1/7] ファイル解析を開始しました: index.html および関連静的アセットを検出`,
      `[2/7] エントリーポイントの整合性チェック完了: HTML5準拠`,
      `[3/7] CSS/JSキャッシュバスター＆GZIP/Brotli最適化を適用中...`,
      `[4/7] グローバルAnycast CDNエッジストレージへ同期完了 (Latency < 12ms)`,
      `[5/7] サブドメイン "${subdomain}.${APP_CONFIG.defaultDomainSuffix}" をルーティング登録`,
      `[6/7] Automated Let's Encrypt Wildcard SSL証明書を発行 & HSTS有効化`,
      `[7/7] デプロイが正常に完了しました！ サイトは全世界からアクセス可能です。`,
    ];

    const timer = setInterval(() => {
      if (currentIndex < steps.length) {
        const nextIdx = currentIndex;
        setCurrentStepIndex(nextIdx);
        setLogs(prev => [...prev, logMessages[nextIdx]]);
        currentIndex++;
      } else {
        clearInterval(timer);
        setIsFinished(true);
        onComplete();
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#0ea5e9', '#38bdf8', '#ffffff']
        });
      }
    }, 550);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-[#090d16] p-6 sm:p-8 shadow-2xl">
        
        {/* Glowing background */}
        <div className="absolute top-0 right-1/4 -z-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none"></div>

        {!isFinished ? (
          <div>
            {/* Deploying state */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">「{siteName}」をデプロイ中...</h3>
                <p className="text-xs text-slate-400">エッジネットワークへファイルを展開しています</p>
              </div>
            </div>

            {/* Step progress list */}
            <div className="space-y-3 mb-6">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStepIndex || isFinished;
                const isCurrent = idx === currentStepIndex && !isFinished;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                      isCurrent
                        ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-semibold'
                        : isCompleted
                        ? 'bg-slate-900/60 border border-slate-800/80 text-slate-300'
                        : 'opacity-40 text-slate-500'
                    }`}
                  >
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-slate-700"></div>
                      )}
                    </div>
                    <span className="truncate">{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Terminal log stream */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-400 h-28 overflow-y-auto space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-900">
                <Terminal className="h-3 w-3" />
                <span>Build Terminal Output</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="text-slate-300 leading-relaxed font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Finished state */
          <div className="text-center py-2 space-y-5 animate-scaleUp">
            
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10">
              <Sparkles className="h-8 w-8 text-emerald-400" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>デプロイ成功 • SSL有効</span>
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                Webサイトが公開されました！
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                専用URLが発行され、全世界のユーザーがアクセス可能です。
              </p>
            </div>

            {/* Published URL Card */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-3.5 shadow-inner">
              <div className="flex items-center gap-2.5 truncate">
                <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="font-mono text-sm font-semibold text-cyan-300 truncate">
                  {fullUrl}
                </span>
              </div>

              <button
                onClick={handleCopyUrl}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 transition-colors ml-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">コピー完了</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>URLをコピー</span>
                  </>
                )}
              </button>
            </div>

            {/* Next actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <button
                onClick={onOpenSite}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ExternalLink className="h-4 w-4" />
                <span>サイトを開く</span>
              </button>

              <button
                onClick={onGoToDashboard}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-xs sm:text-sm font-bold text-slate-200 border border-slate-700 transition-all"
              >
                <span>管理ダッシュボードへ</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

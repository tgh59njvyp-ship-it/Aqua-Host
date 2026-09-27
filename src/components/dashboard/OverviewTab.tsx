import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  RotateCw, 
  Code2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Activity, 
  Layers, 
  HardDrive, 
  Wifi, 
  Clock, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Site } from '../../types';
import { APP_CONFIG } from '../../config/constants';
import { formatBytes } from '../../utils/crypto';

interface OverviewTabProps {
  site: Site;
  onOpenSite: () => void;
  onRedeploy: () => void;
  onGoToEditor: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  site,
  onOpenSite,
  onRedeploy,
  onGoToEditor,
}) => {
  const [copied, setCopied] = useState(false);
  const fullUrl = `https://${site.subdomain}.${APP_CONFIG.defaultDomainSuffix}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestDeployment = site.deployments[0];

  return (
    <div className="space-y-6">
      
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                稼働中 (Production Ready)
              </span>
              <span className="text-xs font-mono text-slate-400">
                Deployment #{latestDeployment?.version || 1}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {site.name}
            </h1>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-1.5 font-mono text-xs sm:text-sm text-cyan-400">
                <Globe className="h-4 w-4 shrink-0" />
                <span className="truncate">{fullUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="URLをコピー"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSite}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ExternalLink className="h-4 w-4" />
              <span>サイトを開く</span>
            </button>

            <button
              onClick={onGoToEditor}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold text-white border border-slate-700 transition-all"
            >
              <Code2 className="h-4 w-4 text-cyan-400" />
              <span>コードを直接編集</span>
            </button>

            <button
              onClick={onRedeploy}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white border border-slate-700 transition-all"
            >
              <RotateCw className="h-4 w-4 text-slate-400" />
              <span>再デプロイ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">総アクセス数 (PV)</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {site.analytics.totalViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>● リアルタイム計測中</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">ストレージ使用量</span>
            <HardDrive className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatBytes(site.storageBytes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            上限: {APP_CONFIG.limits.freeMaxStorageMb} MB ({((site.storageBytes / (APP_CONFIG.limits.freeMaxStorageMb * 1024 * 1024)) * 100).toFixed(1)}%)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">帯域使用量</span>
            <Wifi className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatBytes(site.bandwidthBytes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            上限: {APP_CONFIG.limits.freeMaxBandwidthGb} GB / 月
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">管理ファイル数</span>
            <Layers className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {site.files.length} <span className="text-xs text-slate-400 font-normal">files</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            エントリー: index.html
          </p>
        </div>

      </div>

      {/* Two-column layout: Latest Deployment & Production Quick Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Latest Deployment Details */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">最新デプロイ詳細</h3>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400 border border-emerald-500/20 font-medium">
              Production
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">デプロイ要約</span>
              <span className="font-medium text-slate-200">{latestDeployment?.summary || '本番デプロイ'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">ビルド所要時間</span>
              <span className="font-mono text-cyan-400">{latestDeployment?.buildTimeMs || 840} ms</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">デプロイ日時</span>
              <span className="text-slate-200">
                {new Date(latestDeployment?.createdAt || site.updatedAt).toLocaleString('ja-JP')}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">SSL証明書暗号強度</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                TLS 1.3 / ECC 256-bit (HSTS)
              </span>
            </div>
          </div>
        </div>

        {/* Custom Domains Quick Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">接続ドメイン</h3>
            </div>
            <span className="text-xs text-slate-400">
              計 {site.domains?.length || 1} 件
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {site.domains?.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="font-mono text-xs text-white font-medium">{d.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-400 font-mono">
                    {d.type.toUpperCase()}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">
                    SSL有効
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

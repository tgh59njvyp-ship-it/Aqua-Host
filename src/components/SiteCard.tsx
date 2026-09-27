import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Settings, 
  Eye, 
  Lock, 
  ShieldAlert, 
  Clock, 
  Copy, 
  Check, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Site } from '../types';
import { APP_CONFIG } from '../config/constants';
import { formatBytes } from '../utils/crypto';

interface SiteCardProps {
  site: Site;
  onManage: () => void;
  onOpenLive: () => void;
}

export const SiteCard: React.FC<SiteCardProps> = ({ site, onManage, onOpenLive }) => {
  const [copied, setCopied] = useState(false);
  const fullUrl = `https://${site.subdomain}.${APP_CONFIG.defaultDomainSuffix}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(site.updatedAt));

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-lg hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-2xl transition-all duration-300">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 border border-slate-700/80 group-hover:scale-105 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all">
              <Globe className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="truncate text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {site.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <span className="truncate">{site.subdomain}.{APP_CONFIG.defaultDomainSuffix}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="URLをコピー"
                  className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Visibility and Cloud badge */}
          <div className="flex flex-col items-end gap-1">
            <div>
              {site.access.visibility === 'public' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  公開中
                </span>
              )}
              {site.access.visibility === 'password_protected' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                  <Lock className="h-3 w-3" />
                  保護中
                </span>
              )}
              {site.access.visibility === 'private' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-400">
                  <ShieldAlert className="h-3 w-3" />
                  非公開
                </span>
              )}
            </div>

            {site.ownerId ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse"></span>
                Firestore同期済
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/50 border border-slate-700/50 px-1.5 py-0.5 rounded">
                ローカル保存
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail mockup preview */}
        <div 
          onClick={onOpenLive}
          className="relative my-3 h-28 w-full cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-[#060912] p-2 transition-all hover:border-cyan-500/40"
        >
          {/* Mini browser chrome */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-1.5 px-1">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500/60"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60"></span>
            </div>
            <div className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[9px] text-slate-500 truncate max-w-[160px]">
              https://{site.subdomain}.{APP_CONFIG.defaultDomainSuffix}
            </div>
            <div className="h-1.5 w-1.5"></div>
          </div>

          {/* Mini preview content */}
          <div className="flex flex-col items-center justify-center h-16 text-center text-slate-500 hover:text-slate-400 transition-colors">
            <Sparkles className="h-4 w-4 text-cyan-400/70 mb-1" />
            <span className="text-[11px] font-medium text-slate-300 truncate max-w-[200px]">
              {site.seo?.title || site.name}
            </span>
            <span className="text-[9px] text-slate-500">クリックしてプレビューを開く</span>
          </div>
        </div>

        {/* Description */}
        {site.description && (
          <p className="text-xs text-slate-400 line-clamp-1 mb-3">
            {site.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-800/70 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              <Eye className="h-3 w-3" />
              <span>アクセス</span>
            </div>
            <div className="font-semibold text-xs text-slate-200 mt-0.5">
              {site.analytics.totalViews} <span className="text-[10px] text-slate-500 font-normal">PV</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              <Layers className="h-3 w-3" />
              <span>ファイル</span>
            </div>
            <div className="font-semibold text-xs text-slate-200 mt-0.5">
              {site.files.length} <span className="text-[10px] text-slate-500 font-normal">({formatBytes(site.storageBytes)})</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>更新</span>
            </div>
            <div className="font-semibold text-[11px] text-slate-300 mt-0.5 truncate">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-4">
        <button
          onClick={onOpenLive}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
          <span>サイトを開く</span>
        </button>

        <button
          onClick={onManage}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-400 border border-cyan-500/30 transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>管理する</span>
        </button>
      </div>

    </div>
  );
};

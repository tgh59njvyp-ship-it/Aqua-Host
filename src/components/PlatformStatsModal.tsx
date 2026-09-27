import React from 'react';
import { 
  Activity, 
  X, 
  Server, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Globe2, 
  CheckCircle2, 
  HardDrive,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { Site } from '../types';
import { APP_CONFIG } from '../config/constants';
import { formatBytes } from '../utils/crypto';

interface PlatformStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
}

export const PlatformStatsModal: React.FC<PlatformStatsModalProps> = ({
  isOpen,
  onClose,
  sites,
}) => {
  if (!isOpen) return null;

  const totalStorage = sites.reduce((acc, s) => acc + s.storageBytes, 0);
  const totalBandwidth = sites.reduce((acc, s) => acc + s.bandwidthBytes, 0);
  const totalDeployments = sites.reduce((acc, s) => acc + s.deployments.length, 0);
  const totalViews = sites.reduce((acc, s) => acc + s.analytics.totalViews, 0);

  const edgePoPs = [
    { city: 'Tokyo (HND1)', latency: '8ms', status: 'Operational', load: '18%' },
    { city: 'Osaka (KIX1)', latency: '12ms', status: 'Operational', load: '14%' },
    { city: 'Silicon Valley (SJC1)', latency: '78ms', status: 'Operational', load: '22%' },
    { city: 'Frankfurt (FRA1)', latency: '140ms', status: 'Operational', load: '19%' },
    { city: 'Singapore (SIN1)', latency: '45ms', status: 'Operational', load: '16%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-800 bg-[#090d16] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AquaHost プラットフォーム稼働状況</h3>
              <p className="text-xs text-slate-400">
                グローバルエッジインフラ、リソース消費量、正直な帯域・ストレージ制限設計
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-400 text-xs block">ホスト中のサイト数</span>
            <span className="text-2xl font-bold text-white mt-1 block">{sites.length} サイト</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-400 text-xs block">総デプロイ回数</span>
            <span className="text-2xl font-bold text-cyan-400 mt-1 block">{totalDeployments} 回</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-400 text-xs block">総ストレージ使用量</span>
            <span className="text-2xl font-bold text-sky-400 mt-1 block">{formatBytes(totalStorage)}</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-slate-400 text-xs block">総トラフィック (PV)</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">{totalViews.toLocaleString()}</span>
          </div>
        </div>

        {/* Honest Infrastructure Limits & Tier Plans */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            リソース上限 & プラン設計 (インフラ整合性)
          </h4>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>「完全無制限」を偽装せず、持続可能なエッジ分散アーキテクチャを採用</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              ユーザーがサイトを削除しない限り、専用サブドメイン（xxxxx.aquahost.app）のURLは永続的に維持されます。
              無料枠ではストレージ {APP_CONFIG.limits.freeMaxStorageMb}MB / 帯域 {APP_CONFIG.limits.freeMaxBandwidthGb}GB / 最大 {APP_CONFIG.limits.freeMaxFilesPerSite} ファイルまで高速配信されます。
            </p>
          </div>
        </div>

        {/* Edge POP Network Status */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            グローバル Anycast CDN ノード稼働状況
          </h4>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 bg-slate-900/60">
                  <th className="py-2 px-3 font-medium">エッジPoP拠点</th>
                  <th className="py-2 px-3 font-medium">応答レイテンシ</th>
                  <th className="py-2 px-3 font-medium">稼働ステータス</th>
                  <th className="py-2 px-3 font-medium text-right">サーバー負荷</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {edgePoPs.map((pop, i) => (
                  <tr key={i} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span>{pop.city}</span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400">{pop.latency}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{pop.status}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{pop.load}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};

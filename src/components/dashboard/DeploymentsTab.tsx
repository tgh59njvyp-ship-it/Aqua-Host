import React, { useState } from 'react';
import { 
  GitCommit, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Clock, 
  Layers, 
  ShieldCheck, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Site, Deployment } from '../../types';
import { formatBytes, generateRandomId } from '../../utils/crypto';

interface DeploymentsTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const DeploymentsTab: React.FC<DeploymentsTabProps> = ({ site, onUpdateSite }) => {
  const [expandedId, setExpandedId] = useState<string | null>(site.deployments[0]?.id || null);

  // Rollback to selected deployment snapshot
  const handleRollback = (targetDep: Deployment) => {
    if (!targetDep.snapshotFiles || targetDep.snapshotFiles.length === 0) {
      alert('このデプロイのスナップショットは保存されていません。');
      return;
    }

    if (!confirm(`デプロイ #${targetDep.version} へロールバックしますか？現在の本番ファイルが復元されます。`)) {
      return;
    }

    const newVersion = (site.deployments[0]?.version || 1) + 1;
    const newDepId = 'dep_' + generateRandomId(8);
    const restoredFiles = JSON.parse(JSON.stringify(targetDep.snapshotFiles));
    const totalBytes = restoredFiles.reduce((acc: number, f: any) => acc + f.size, 0);

    const rollbackDeployment: Deployment = {
      id: newDepId,
      version: newVersion,
      status: 'production',
      createdAt: Date.now(),
      buildTimeMs: 720,
      summary: `デプロイ #${targetDep.version} からロールバック復元`,
      filesCount: restoredFiles.length,
      totalSize: totalBytes,
      logs: [
        `[1/4] スナップショット #${targetDep.version} をロード`,
        `[2/4] ファイル一括復元 (${restoredFiles.length} ファイル)`,
        `[3/4] エッジストレージをロールバック状態へ同期`,
        `[4/4] ロールバックデプロイ #${newVersion} が本番に適用されました`,
      ],
      snapshotFiles: restoredFiles,
    };

    onUpdateSite({
      ...site,
      files: restoredFiles,
      storageBytes: totalBytes,
      updatedAt: Date.now(),
      currentDeploymentId: newDepId,
      deployments: [rollbackDeployment, ...site.deployments],
    });
  };

  return (
    <div className="space-y-6">
      
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">デプロイ履歴 (Deployments)</h2>
        <p className="text-xs text-slate-400">
          過去のすべてのビルドとデプロイログの閲覧、ワンクリックロールバックに対応
        </p>
      </div>

      <div className="space-y-3">
        {site.deployments.map((dep, index) => {
          const isLatest = index === 0;
          const isExpanded = expandedId === dep.id;

          const formattedTime = new Intl.DateTimeFormat('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date(dep.createdAt));

          return (
            <div
              key={dep.id}
              className={`rounded-2xl border transition-all ${
                isLatest
                  ? 'border-cyan-500/40 bg-slate-900/80 shadow-md'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              {/* Card Header Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : dep.id)}
                className="flex flex-wrap items-center justify-between gap-4 p-5 cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      dep.status === 'production'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    <GitCommit className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Deployment #{dep.version}</h4>
                      {isLatest ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                          ● Current Production
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">過去バージョン</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">{dep.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="hidden sm:flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formattedTime}</span>
                  </div>

                  <div className="hidden md:flex items-center gap-1 font-mono text-cyan-400">
                    <span>{dep.buildTimeMs} ms</span>
                  </div>

                  {/* Rollback button if not latest */}
                  {!isLatest && dep.snapshotFiles && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRollback(dep);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-cyan-400 border border-slate-700 transition-colors"
                      title="このバージョンへ巻き戻す"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>ロールバック</span>
                    </button>
                  )}

                  <div className="text-slate-500">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Logs & Snapshot Details */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 p-5 bg-slate-950/60 rounded-b-2xl space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">デプロイID</span>
                      <span className="font-mono text-slate-200">{dep.id}</span>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">ファイル総数</span>
                      <span className="font-mono text-slate-200">{dep.filesCount} ファイル</span>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">合計容量</span>
                      <span className="font-mono text-slate-200">{formatBytes(dep.totalSize)}</span>
                    </div>
                    <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">SSLステータス</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        TLS Active
                      </span>
                    </div>
                  </div>

                  {/* Build Logs Terminal */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-mono">
                      <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                      <span>ビルド＆デプロイ詳細ログ</span>
                    </div>
                    <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-xs text-slate-300 border border-slate-800 space-y-1 overflow-x-auto">
                      {dep.logs.map((log, i) => (
                        <div key={i} className="leading-relaxed">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

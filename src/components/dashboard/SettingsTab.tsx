import React, { useState } from 'react';
import { 
  Settings, 
  Copy, 
  Check, 
  Save, 
  Trash2, 
  Archive, 
  CopyCheck, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2,
  Globe
} from 'lucide-react';
import { Site } from '../../types';
import { APP_CONFIG } from '../../config/constants';
import { createZipFromFiles } from '../../utils/zip';
import { generateRandomId } from '../../utils/crypto';

interface SettingsTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
  onDeleteSite: () => void;
  onDuplicateSite: (newSite: Site) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  site,
  onUpdateSite,
  onDeleteSite,
  onDuplicateSite,
}) => {
  const [siteName, setSiteName] = useState(site.name);
  const [subdomain, setSubdomain] = useState(site.subdomain);
  const [description, setDescription] = useState(site.description || '');
  const [copiedId, setCopiedId] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const cleanSubdomain = (val: string) => {
    return val.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(site.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim()) return;

    const oldSubdomain = site.subdomain;
    const newSubdomain = cleanSubdomain(subdomain.trim());

    // Update default domain in domains list
    const nextDomains = site.domains.map(d => {
      if (d.domain === `${oldSubdomain}.${APP_CONFIG.defaultDomainSuffix}`) {
        return {
          ...d,
          domain: `${newSubdomain}.${APP_CONFIG.defaultDomainSuffix}`,
        };
      }
      return d;
    });

    onUpdateSite({
      ...site,
      name: siteName.trim(),
      subdomain: newSubdomain,
      description: description.trim(),
      domains: nextDomains,
      updatedAt: Date.now(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Duplicate entire site with all files and configurations
  const handleDuplicate = () => {
    const cloneId = 'site_' + generateRandomId(8);
    const cloneSubdomain = cleanSubdomain(`${site.subdomain}-copy-${generateRandomId(4)}`);
    const now = Date.now();

    const clonedSite: Site = {
      ...JSON.parse(JSON.stringify(site)),
      id: cloneId,
      name: `${site.name} (複製)`,
      subdomain: cloneSubdomain,
      createdAt: now,
      updatedAt: now,
      domains: [
        {
          domain: `${cloneSubdomain}.${APP_CONFIG.defaultDomainSuffix}`,
          status: 'verified',
          sslStatus: 'active',
          configuredAt: now,
          type: 'cname',
          dnsTarget: APP_CONFIG.dns.cnameTarget,
        }
      ],
      analytics: {
        totalViews: 0,
        uniqueVisitors: 0,
        dailyViews: [{ date: '今日', views: 0, visitors: 0 }],
        devices: [],
        browsers: [],
        referrers: [],
        countries: [],
      },
      rawAnalytics: [],
    };

    onDuplicateSite(clonedSite);
  };

  // Download all as ZIP
  const handleDownloadBackup = async () => {
    const zipBlob = await createZipFromFiles(site.files);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${site.subdomain}-full-backup.zip`;
    a.click();
  };

  const handleDelete = () => {
    const confirmed = prompt(`サイト「${site.name}」を完全に削除するには、サイト名を入力してください:`);
    if (confirmed === site.name) {
      onDeleteSite();
    } else if (confirmed !== null) {
      alert('サイト名が一致しませんでした。削除を中止しました。');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">サイト基本設定 (Settings)</h2>
        <p className="text-xs text-slate-400">
          サイト名、専用URLサブドメインの変更、サイトの複製、フルバックアップZIPエクスポート
        </p>
      </div>

      {/* General Settings */}
      <form onSubmit={handleSaveGeneral} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white mb-2">基本情報</h3>

        {/* Site ID (Read-only identifier) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            内部サイト識別ID (Site ID)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={site.id}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-400 focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyId}
              className="shrink-0 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
              title="IDをコピー"
            >
              {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Site Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            サイト名 (Site Name) <span className="text-cyan-400">*</span>
          </label>
          <input
            type="text"
            required
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Subdomain (URL) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            専用サブドメイン (URLの変更) <span className="text-cyan-400">*</span>
          </label>
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-cyan-500">
            <input
              type="text"
              required
              value={subdomain}
              onChange={(e) => setSubdomain(cleanSubdomain(e.target.value))}
              className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none"
            />
            <span className="bg-slate-900 px-3 py-2.5 text-xs font-mono text-cyan-400 border-l border-slate-800 shrink-0">
              .{APP_CONFIG.defaultDomainSuffix}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            変更すると直ちに新しいURLが有効になり、SSL証明書が自動で再構成されます。
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            サイトの説明文
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>基本設定を更新しました</span>
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20"
          >
            <Save className="h-4 w-4" />
            <span>変更を保存</span>
          </button>
        </div>
      </form>

      {/* Duplicate & Backup Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">エクスポート & サイト複製</h3>
        <p className="text-xs text-slate-400">
          全ファイル・設定をまるごと複製してテスト環境を作成、またはZIPアーカイブとしてダウンロード
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <CopyCheck className="h-4 w-4 text-cyan-400" />
            <span>このサイトを丸ごと複製 (Clone Site)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Archive className="h-4 w-4 text-amber-400" />
            <span>全ファイルZIPバックアップを保存</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Delete Site */}
      <div className="rounded-2xl border border-red-500/30 bg-red-950/10 p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-sm font-bold">Danger Zone (危険な操作)</h3>
        </div>
        <p className="text-xs text-slate-400">
          サイトを削除すると、ホスティングされているすべてのファイル、デプロイ履歴、アクセス解析データが永久に消去されます。発行されたサブドメインは解放されます。
        </p>

        <div>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2.5 text-xs font-bold transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>このサイトを完全に削除する</span>
          </button>
        </div>
      </div>

    </div>
  );
};

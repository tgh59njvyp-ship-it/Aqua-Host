import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { Site, RedirectRule, ErrorPageConfig } from '../../types';
import { generateRandomId } from '../../utils/crypto';

interface RedirectsTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const RedirectsTab: React.FC<RedirectsTabProps> = ({ site, onUpdateSite }) => {
  const [redirects, setRedirects] = useState<RedirectRule[]>(site.redirects || []);
  const [sourcePath, setSourcePath] = useState('');
  const [destPath, setDestPath] = useState('');
  const [statusCode, setStatusCode] = useState<301 | 302 | 200>(301);

  // 404 page config
  const [errorConfig, setErrorConfig] = useState<ErrorPageConfig>(site.errorPages || {
    useCustom404: false,
    theme: 'aquahost_dark',
    title: '404 - Page Not Found',
    message: 'お探しのページは見つかりませんでした。',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath.trim() || !destPath.trim()) return;

    let src = sourcePath.trim();
    if (!src.startsWith('/')) src = '/' + src;
    let dst = destPath.trim();

    const newRule: RedirectRule = {
      id: generateRandomId(8),
      source: src,
      destination: dst,
      statusCode,
    };

    const nextRules = [...redirects, newRule];
    setRedirects(nextRules);
    onUpdateSite({
      ...site,
      redirects: nextRules,
      updatedAt: Date.now(),
    });

    setSourcePath('');
    setDestPath('');
  };

  const handleDelete = (id: string) => {
    const nextRules = redirects.filter(r => r.id !== id);
    setRedirects(nextRules);
    onUpdateSite({
      ...site,
      redirects: nextRules,
      updatedAt: Date.now(),
    });
  };

  const handleSaveErrorConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSite({
      ...site,
      errorPages: errorConfig,
      updatedAt: Date.now(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8">
      
      {/* Redirects Section */}
      <div className="space-y-4">
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">URLリダイレクト設定</h2>
          <p className="text-xs text-slate-400">
            旧URLから新URLへの301恒久転送、302一時転送、またはSPAリライティング (200 Rewrite) を設定
          </p>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAddRedirect} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold text-white">新しい転送ルールを追加</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">転送元パス (Source)</label>
              <input
                type="text"
                required
                placeholder="/old-page"
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">転送先パス (Destination)</label>
              <input
                type="text"
                required
                placeholder="/new-page または index.html"
                value={destPath}
                onChange={(e) => setDestPath(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">ステータスコード</label>
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value) as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-cyan-400 focus:border-cyan-500 focus:outline-none font-mono font-semibold"
              >
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
                <option value={200}>200 Rewrite</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>ルールを追加</span>
            </button>
          </div>
        </form>

        {/* Rules Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          {redirects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              設定されたリダイレクトルールはありません
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-2.5 px-4">Source</th>
                  <th className="py-2.5 px-4">Destination</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {redirects.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 text-cyan-300">{r.source}</td>
                    <td className="py-2.5 px-4">{r.destination}</td>
                    <td className="py-2.5 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-400 font-bold">
                        {r.statusCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 404 Custom Error Page Section */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <div className="pb-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-cyan-400" />
            <span>カスタム 404 ページ設定</span>
          </h2>
          <p className="text-xs text-slate-400">
            存在しないURLにアクセスされた際のエラー画面をカスタマイズ、または「404.html」を自動ロード
          </p>
        </div>

        <form onSubmit={handleSaveErrorConfig} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="custom404Check"
              checked={errorConfig.useCustom404}
              onChange={(e) => setErrorConfig({ ...errorConfig, useCustom404: e.target.checked })}
              className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="custom404Check" className="text-xs font-semibold text-white cursor-pointer">
              ファイルツリー内の「404.html」を最優先で使用する
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">エラータイトル</label>
              <input
                type="text"
                value={errorConfig.title}
                onChange={(e) => setErrorConfig({ ...errorConfig, title: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">エラースタイルテーマ</label>
              <select
                value={errorConfig.theme}
                onChange={(e) => setErrorConfig({ ...errorConfig, theme: e.target.value as any })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-cyan-400 focus:border-cyan-500 focus:outline-none font-semibold"
              >
                <option value="aquahost_dark">AquaHost Dark (標準)</option>
                <option value="clean_minimal">Clean Minimalist (ミニマル)</option>
                <option value="cyberpunk">Cyberpunk Neon (サイバー)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">エラーメッセージ本文</label>
            <input
              type="text"
              value={errorConfig.message}
              onChange={(e) => setErrorConfig({ ...errorConfig, message: e.target.value })}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>エラーページ設定を保存しました</span>
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20"
            >
              <Save className="h-4 w-4" />
              <span>エラー設定を保存</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { 
  KeyRound, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Save, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Site, EnvVariable } from '../../types';
import { generateRandomId } from '../../utils/crypto';

interface EnvVarsTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const EnvVarsTab: React.FC<EnvVarsTabProps> = ({ site, onUpdateSite }) => {
  const [envVars, setEnvVars] = useState<EnvVariable[]>(site.envVars || []);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newTarget, setNewTarget] = useState<'production' | 'preview' | 'all'>('all');
  const [newIsSecret, setNewIsSecret] = useState(true);

  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const cleanKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (envVars.some(v => v.key === cleanKey)) {
      alert(`「${cleanKey}」は既に登録されています。`);
      return;
    }

    const newItem: EnvVariable = {
      id: generateRandomId(8),
      key: cleanKey,
      value: newValue,
      target: newTarget,
      isSecret: newIsSecret,
      updatedAt: Date.now(),
    };

    const nextVars = [...envVars, newItem];
    setEnvVars(nextVars);
    onUpdateSite({
      ...site,
      envVars: nextVars,
      updatedAt: Date.now(),
    });

    setNewKey('');
    setNewValue('');
  };

  const handleDelete = (id: string) => {
    const nextVars = envVars.filter(v => v.id !== id);
    setEnvVars(nextVars);
    onUpdateSite({
      ...site,
      envVars: nextVars,
      updatedAt: Date.now(),
    });
  };

  // Export .env file
  const handleExportEnv = () => {
    const lines = envVars.map(v => `${v.key}="${v.value}"`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${site.subdomain}.env`;
    a.click();
  };

  const handleCopyVal = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">環境変数 (Environment Variables)</h2>
          <p className="text-xs text-slate-400">
            動的APIやサーバー処理・外部サービス連携向けの暗号化キー・シークレット管理
          </p>
        </div>

        <button
          onClick={handleExportEnv}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <Download className="h-3.5 w-3.5 text-cyan-400" />
          <span>.env をエクスポート</span>
        </button>
      </div>

      {/* Add New Var Form */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Plus className="h-4 w-4 text-cyan-400" />
          <span>新しい環境変数を追加</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">KEY (キー名)</label>
            <input
              type="text"
              required
              placeholder="API_KEY / DATABASE_URL"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">VALUE (値)</label>
            <input
              type="text"
              required
              placeholder="sk_live_..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>変数を保存</span>
            </button>
          </div>

        </div>
      </form>

      {/* Variables List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span>登録済み変数 ({envVars.length} 件)</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            画面上マスキング保護
          </span>
        </div>

        {envVars.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            登録された環境変数はありません
          </div>
        ) : (
          <div className="divide-y divide-slate-800 font-mono text-xs">
            {envVars.map(v => {
              const isRevealed = revealedIds[v.id];

              return (
                <div key={v.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cyan-300 min-w-[140px]">{v.key}</span>
                    <span className="text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800/80 min-w-[200px] select-all">
                      {isRevealed ? v.value : '••••••••••••••••••••'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleReveal(v.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title={isRevealed ? '隠す' : '表示する'}
                    >
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyVal(v.key, v.value)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="値をコピー"
                    >
                      {copiedKey === v.key ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

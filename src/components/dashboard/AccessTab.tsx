import React, { useState } from 'react';
import { 
  Globe2, 
  Lock, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  KeyRound, 
  Eye, 
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { Site, AccessSettings } from '../../types';
import { hashPassword } from '../../utils/crypto';

interface AccessTabProps {
  site: Site;
  onUpdateSite: (updated: Site) => void;
}

export const AccessTab: React.FC<AccessTabProps> = ({ site, onUpdateSite }) => {
  const [visibility, setVisibility] = useState<'public' | 'private' | 'password_protected'>(
    site.access?.visibility || 'public'
  );
  const [plainPassword, setPlainPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let passwordHash = site.access?.passwordHash;
    if (visibility === 'password_protected') {
      if (plainPassword.trim()) {
        passwordHash = await hashPassword(plainPassword.trim());
      } else if (!passwordHash) {
        alert('パスワードを入力してください。');
        return;
      }
    }

    const updatedAccess: AccessSettings = {
      visibility,
      passwordHash: visibility === 'password_protected' ? passwordHash : undefined,
    };

    onUpdateSite({
      ...site,
      access: updatedAccess,
      updatedAt: Date.now(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">アクセス権限 & パスワード保護</h2>
        <p className="text-xs text-slate-400">
          サイト全体の公開範囲（一般公開、パスワード制限、完全非公開）を即時切り替え
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        
        {/* Three Modes */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">公開ステータス</label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                visibility === 'public'
                  ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Globe2 className={`h-5 w-5 mb-2 ${visibility === 'public' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="text-sm font-bold">一般公開 (Public)</span>
              <span className="text-xs text-slate-500 mt-1">誰でもURLから無制限にアクセス可能</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('password_protected')}
              className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                visibility === 'password_protected'
                  ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Lock className={`h-5 w-5 mb-2 ${visibility === 'password_protected' ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-sm font-bold">パスワード保護</span>
              <span className="text-xs text-slate-500 mt-1">正しい合言葉を知っている人のみ閲覧可能</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                visibility === 'private'
                  ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <ShieldAlert className={`h-5 w-5 mb-2 ${visibility === 'private' ? 'text-red-400' : 'text-slate-500'}`} />
              <span className="text-sm font-bold">非公開 (Private)</span>
              <span className="text-xs text-slate-500 mt-1">403 Forbiddenとなり一時停止</span>
            </button>

          </div>
        </div>

        {/* Password input section */}
        {visibility === 'password_protected' && (
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <KeyRound className="h-4 w-4" />
              <span>閲覧パスワードの設定</span>
            </div>
            
            <p className="text-xs text-slate-400">
              パスワードは平文保存されず、安全な不可逆ハッシュ（SHA-256）で暗号化して管理されます。
            </p>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={site.access.passwordHash ? '変更する場合のみ入力（設定済み）' : 'パスワードを入力...'}
                value={plainPassword}
                onChange={(e) => setPlainPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {site.access.passwordHash && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SHA-256 ハッシュ保護中: {site.access.passwordHash.slice(0, 16)}...</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>アクセス設定を更新しました</span>
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
          >
            <Save className="h-4 w-4" />
            <span>アクセス設定を保存</span>
          </button>
        </div>

      </form>

    </div>
  );
};

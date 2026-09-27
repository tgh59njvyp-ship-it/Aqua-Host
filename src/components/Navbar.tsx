import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  Plus, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Menu, 
  X,
  Search,
  User,
  LogOut,
  Cloud,
  ChevronDown,
  Layers,
  Database
} from 'lucide-react';
import { APP_CONFIG } from '../config/constants';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onNewSite: () => void;
  onOpenTemplates: () => void;
  onOpenStats: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onHomeClick: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  isDashboardActive?: boolean;
  sitesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewSite,
  onOpenTemplates,
  onOpenStats,
  searchQuery,
  onSearchChange,
  onHomeClick,
  onOpenAuth,
  isDashboardActive = false,
  sitesCount,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button 
            onClick={onHomeClick}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <Globe className="h-5 w-5 text-slate-950 font-bold" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-[#090d16]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  {APP_CONFIG.serviceName}
                </span>
                <span className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/20">
                  Firebase Cloud
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block -mt-0.5 font-medium">
                {APP_CONFIG.taglineJa}
              </p>
            </div>
          </button>

          {/* Search Sites (Desktop) */}
          {!isDashboardActive && (
            <div className="relative hidden md:block w-64 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="サイト名・URLを検索..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 border border-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          
          <button
            onClick={onOpenStats}
            title="システム状態 & クラウドインフラメトリクス"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700"
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>インフラ状態</span>
          </button>

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>テンプレート</span>
          </button>

          <button
            onClick={onNewSite}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>サイトをデプロイ</span>
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-850 px-2.5 py-1.5 hover:bg-slate-800 transition-all"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="text-left hidden md:block max-w-[120px]">
                  <p className="text-[11px] font-semibold text-slate-200 truncate leading-none">
                    {user.displayName || user.email?.split('@')[0] || 'ユーザー'}
                  </p>
                  <p className="text-[9px] text-cyan-400 font-medium leading-none mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Cloud Sync
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-[#0d131f] p-2 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">
                      {user.displayName || 'マイアカウント'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email || 'Googleログイン認証済み'}
                    </p>
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-medium">
                        <Database className="h-3 w-3 text-cyan-400" />
                        <span>Firestore クラウド同期中</span>
                      </div>
                      <span className="rounded bg-cyan-500/20 px-1 text-[9px] font-mono text-cyan-300">
                        {sitesCount} サイト
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>ログアウト</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('signin')}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all shadow-sm"
              >
                <Cloud className="h-3.5 w-3.5 text-cyan-400" />
                <span>ログイン</span>
              </button>
            </div>
          )}

        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          {user ? (
            <button
              onClick={() => onOpenAuth('signin')}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 overflow-hidden"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2 py-1 text-[11px] font-semibold text-cyan-300"
            >
              ログイン
            </button>
          )}

          <button
            onClick={onNewSite}
            className="flex items-center gap-1 rounded-lg bg-cyan-500 px-2.5 py-1.5 text-xs font-semibold text-slate-950"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>作成</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-[#090d16] px-4 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="サイトを検索..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-200 border border-slate-800"
            />
          </div>

          {user ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{user.displayName || 'ログイン中'}</p>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                >
                  ログアウト
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 pt-1">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                <span>Firestore クラウド同期中 ({sitesCount} サイト)</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-cyan-300">アカウント未登録 (ゲスト利用可)</p>
                <p className="text-[10px] text-slate-400">ログインでクラウドに永久自動同期</p>
              </div>
              <button
                onClick={() => { onOpenAuth('signin'); setMobileMenuOpen(false); }}
                className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20"
              >
                ログイン
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { onOpenTemplates(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 p-2.5 text-xs font-medium text-slate-200 border border-slate-700"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>テンプレート</span>
            </button>
            <button
              onClick={() => { onOpenStats(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 p-2.5 text-xs font-medium text-slate-200 border border-slate-700"
            >
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>システム状況</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

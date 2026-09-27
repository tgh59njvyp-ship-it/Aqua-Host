import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Cloud, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink, 
  Info, 
  Zap,
  Settings,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin'
}) => {
  const { 
    signInWithGoogle, 
    signInWithGithub, 
    signInWithApple, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithDemoUser,
    error, 
    unauthorizedDomain,
    lastFailedProvider,
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [activeView, setActiveView] = useState<'auth' | 'provider_guide'>('auth');
  const [guideTab, setGuideTab] = useState<'github' | 'apple' | 'domain'>('github');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Copy states
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId;
  const authCallbackUrl = `https://${firebaseConfig.authDomain}/__/auth/handler`;
  const consoleProvidersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
  const consoleSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  useEffect(() => {
    if (unauthorizedDomain) {
      setGuideTab('domain');
    } else if (lastFailedProvider === 'github') {
      setGuideTab('github');
    } else if (lastFailedProvider === 'apple') {
      setGuideTab('apple');
    }
  }, [unauthorizedDomain, lastFailedProvider]);

  if (!isOpen) return null;

  const handleClose = () => {
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    setActiveView('auth');
    onClose();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'apple') => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      if (provider === 'google') await signInWithGoogle();
      else if (provider === 'github') await signInWithGithub();
      else if (provider === 'apple') await signInWithApple();

      setSuccessMessage('ログインに成功しました！');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 600);
    } catch (err: any) {
      // Auto open guide if not configured
      if (err.code === 'auth/unauthorized-domain') {
        setGuideTab('domain');
      } else if (err.code === 'auth/operation-not-allowed') {
        if (provider === 'github') setGuideTab('github');
        if (provider === 'apple') setGuideTab('apple');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    clearError();
    try {
      await signInWithDemoUser('demo-developer@aquahost.app', 'aquahost2026!', 'Aqua Developer');
      setSuccessMessage('体験アカウントでログインしました (Firebase Auth / Firestore同期有効)');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err: any) {
      setLocalError(err.message || '体験ログインに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('メールアドレスとパスワードを入力してください');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName || undefined);
        setSuccessMessage('アカウントを作成しログインしました！');
      } else {
        await signInWithEmail(email, password);
        setSuccessMessage('ログインに成功しました！');
      }
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err: any) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('developer@aquahost.app');
    setPassword('aquahost2026!');
    setDisplayName('Aqua Developer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-lg my-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0d131f] p-6 sm:p-7 shadow-2xl shadow-cyan-950/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Header & View Switcher */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 shadow-md shadow-cyan-500/20">
              <Cloud className="h-5 w-5 font-bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {activeView === 'auth' ? (mode === 'signin' ? 'AquaHost ログイン' : '新規アカウント登録') : 'Firebase プロバイダ設定ガイド'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {activeView === 'auth' ? 'Firebase Auth & Cloud Firestore 連携' : 'GitHub / Apple / ドメイン認証設定'}
              </p>
            </div>
          </div>

          {/* Toggle between Auth View and Setup Guide */}
          <button
            type="button"
            onClick={() => setActiveView(activeView === 'auth' ? 'provider_guide' : 'auth')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all ${
              activeView === 'provider_guide'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
            }`}
          >
            {activeView === 'auth' ? (
              <>
                <Settings className="h-3.5 w-3.5 text-cyan-400" />
                <span>プロバイダ設定</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-3.5 w-3.5" />
                <span>ログイン画面へ</span>
              </>
            )}
          </button>
        </div>

        {/* VIEW 1: AUTHENTICATION INTERFACE */}
        {activeView === 'auth' && (
          <div>
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => { setMode('signin'); clearError(); setLocalError(null); }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  mode === 'signin'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); clearError(); setLocalError(null); }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                無料アカウント登録
              </button>
            </div>

            {/* Error Message */}
            {(error || localError) && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="flex-1 leading-relaxed whitespace-pre-line">
                    {error || localError}
                  </div>
                </div>
                {(unauthorizedDomain || lastFailedProvider) && (
                  <div className="mt-2.5 pt-2 border-t border-red-500/20 flex items-center justify-between">
                    <span className="text-[11px] text-red-400/90">
                      設定手順を確認して解決できます:
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveView('provider_guide')}
                      className="inline-flex items-center gap-1 rounded bg-red-500/20 hover:bg-red-500/30 px-2 py-0.5 text-[11px] font-semibold text-red-200 transition-colors"
                    >
                      <span>設定ガイドを開く</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Identity Providers (Google, GitHub, Apple) */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                ソーシャルログイン (Identity Providers)
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-850 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-[0.99] disabled:opacity-50 shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.27 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.73 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google アカウントでログイン</span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-cyan-400 font-normal">
                  推奨
                </span>
              </button>

              {/* GitHub & Apple Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* GitHub */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-850 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-850 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.36-.57.66-.99 1.72-.88 2.74 1.01.08 2.05-.51 2.59-1.25z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </div>

            {/* Quick Instant Demo Bypass Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 py-2.5 px-3.5 text-xs font-semibold text-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />
                  <span>ワンクリック体験ログイン</span>
                </div>
                <span className="text-[10px] text-emerald-300/80 group-hover:text-emerald-200">
                  ドメイン制限なし・即Firestore同期
                </span>
              </button>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative bg-[#0d131f] px-3 text-[11px] uppercase tracking-wider text-slate-500">
                またはメールアドレスで
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    表示名 / ニックネーム
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="例: 佐藤 健二"
                      className="w-full rounded-xl bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 border border-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 border border-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上のパスワード"
                    className="w-full rounded-xl bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 border border-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'ログインする' : 'アカウントを作成して始める'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Quick Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="h-3 w-3" />
                <span>テスト入力を自動入力</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('provider_guide')}
                className="text-slate-400 hover:text-cyan-400 flex items-center gap-1 text-[11px]"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>各プロバイダ設定手順</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: FIREBASE CONSOLE & IDENTITY PROVIDER SETUP GUIDE */}
        {activeView === 'provider_guide' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">Firebase Console プロジェクト</p>
                <p className="text-[11px] font-mono text-cyan-400">{projectId}</p>
              </div>
              <a
                href={consoleProvidersUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-300 transition-colors"
              >
                <span>Consoleを開く</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Sub Tabs for Guide */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setGuideTab('github')}
                className={`flex-1 rounded-lg py-1.5 font-medium transition-all ${
                  guideTab === 'github' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GitHub 設定
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('apple')}
                className={`flex-1 rounded-lg py-1.5 font-medium transition-all ${
                  guideTab === 'apple' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Apple 設定
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('domain')}
                className={`flex-1 rounded-lg py-1.5 font-medium transition-all ${
                  guideTab === 'domain' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                承認済みドメイン
              </button>
            </div>

            {/* TAB: GITHUB */}
            {guideTab === 'github' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs text-slate-300">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>GitHub OAuth アプリケーションの登録手順</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-300">
                  <li>
                    GitHubの <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Developer settings &gt; OAuth Apps &gt; New OAuth App</a> を開きます。
                  </li>
                  <li>
                    <strong>Authorization callback URL</strong> に以下のURLを入力して登録します：
                    <div className="mt-1 flex items-center justify-between gap-2 rounded bg-slate-950 p-2 font-mono text-[10px] text-cyan-300 border border-slate-800">
                      <span className="truncate">{authCallbackUrl}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(authCallbackUrl, 'github_callback')}
                        className="shrink-0 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200 flex items-center gap-1"
                      >
                        {copiedItem === 'github_callback' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedItem === 'github_callback' ? 'コピー済' : 'コピー'}</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    生成された <strong>Client ID</strong> と <strong>Client Secret</strong> をコピーします。
                  </li>
                  <li>
                    <a href={consoleProvidersUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Firebase Console</a> の <strong>Sign-in method &gt; 新しいプロバイダを追加 &gt; GitHub</strong> を選択し、有効化してIDとSecretを貼り付けます。
                  </li>
                </ol>
              </div>
            )}

            {/* TAB: APPLE */}
            {guideTab === 'apple' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs text-slate-300">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>Apple でサインインの設定手順</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-300">
                  <li>
                    <a href="https://developer.apple.com/account/resources/identifiers/list/serviceId" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Apple Developer Portal</a> の <strong>Identifiers &gt; Services IDs</strong> でサービスを作成します。
                  </li>
                  <li>
                    <strong>Sign in with Apple</strong> を有効にし、Configure で <strong>Return URLs</strong> に以下を追加します：
                    <div className="mt-1 flex items-center justify-between gap-2 rounded bg-slate-950 p-2 font-mono text-[10px] text-cyan-300 border border-slate-800">
                      <span className="truncate">{authCallbackUrl}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(authCallbackUrl, 'apple_callback')}
                        className="shrink-0 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200 flex items-center gap-1"
                      >
                        {copiedItem === 'apple_callback' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedItem === 'apple_callback' ? 'コピー済' : 'コピー'}</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    Keys で認証キー（.p8ファイル）を作成・ダウンロードします。
                  </li>
                  <li>
                    <a href={consoleProvidersUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Firebase Console</a> の <strong>Sign-in method &gt; Apple</strong> を選択し、Services ID, Team ID, Key ID, 秘密鍵を入力して有効化します。
                  </li>
                </ol>
              </div>
            )}

            {/* TAB: AUTHORIZED DOMAINS */}
            {guideTab === 'domain' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs text-slate-300">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>Authorized Domains（承認済みドメイン）の追加手順</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Google/GitHub/AppleなどのOAuthポップアップを実行するために、以下のプレビューホスト名をFirebaseの承認ドメインに追加します：
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 rounded bg-slate-950 p-2 font-mono text-[10px] text-cyan-300 border border-slate-800">
                    <span className="truncate">{currentHost}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentHost, 'current_host')}
                      className="shrink-0 rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200 flex items-center gap-1"
                    >
                      {copiedItem === 'current_host' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedItem === 'current_host' ? 'コピー済' : 'コピー'}</span>
                    </button>
                  </div>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-300">
                  <li>
                    <a href={consoleSettingsUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Firebase Console &gt; Authentication &gt; Settings</a> を開きます。
                  </li>
                  <li>
                    <strong>承認済みドメイン (Authorized domains)</strong> セクションで <strong>「ドメインを追加」</strong> をクリックします。
                  </li>
                  <li>
                    上記でコピーしたホスト名を貼り付けて <strong>保存</strong> します。
                  </li>
                </ol>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveView('auth')}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
              >
                ← ログイン画面に戻る
              </button>

              <button
                type="button"
                onClick={handleDemoSignIn}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition-all shadow-md shadow-emerald-500/20"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>ワンクリック体験ログインですぐ試す</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

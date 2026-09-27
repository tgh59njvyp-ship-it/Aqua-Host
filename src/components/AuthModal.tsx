import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  ExternalLink,
  Zap,
  Globe2
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
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    clearError();
    setLocalError(null);
    onClose();
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'apple') => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      if (provider === 'google') await signInWithGoogle();
      if (provider === 'github') await signInWithGithub();
      if (provider === 'apple') await signInWithApple();
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('メールアドレスとパスワードを入力してください');
      return;
    }
    if (password.length < 6) {
      setLocalError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName || undefined);
      }
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      setLocalError(err.message || '認証に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInWithDemoUser('demo.developer@aquahost.app', 'AquaHost2026!', 'AquaHost Developer');
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      setLocalError('体験ログインに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0b101b] shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Globe2 className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'signin' ? 'AquaHost にログイン' : 'アカウントを作成'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signin' 
              ? 'サイトのデプロイとFirestoreクラウド同期を管理' 
              : '無料で即座にサイトを公開＆管理開始'}
          </p>
        </div>

        {/* Error Alert with Quick Bypass */}
        {activeError && (
          <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 whitespace-pre-line leading-relaxed font-sans">
                {activeError}
              </div>
            </div>
            {unauthorizedDomain && (
              <div className="pt-2 border-t border-rose-500/20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span>体験アカウントで即座にログイン（推奨）</span>
                </button>
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center justify-center gap-1"
                >
                  <span>Firebase設定でドメイン「{unauthorizedDomain}」を承認</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* 3 OAuth Social Login Buttons */}
        <div className="space-y-2.5">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google でログイン</span>
          </button>

          {/* GitHub */}
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>GitHub でログイン</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-1 .04-2.15.66-2.82 1.44-.57.66-.96 1.76-.83 2.82 1.11.08 2.08-.56 2.71-1.33z"/>
            </svg>
            <span>Apple でログイン</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-[#0b101b] px-3 text-slate-500 font-medium">またはメールアドレスで</span>
          </div>
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">お名前 (任意)</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="山田 太郎"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">メールアドレス</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">パスワード</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'ログイン' : 'アカウント作成'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* One-Click Quick Demo User Button */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isSubmitting}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1.5 hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>ワンクリック体験アカウントでログイン</span>
          </button>
        </div>

        {/* Footer Mode Switcher */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              アカウントをお持ちでないですか？{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearError();
                  setLocalError(null);
                }}
                className="font-semibold text-cyan-400 hover:underline"
              >
                新規登録
              </button>
            </p>
          ) : (
            <p>
              既にアカウントをお持ちですか？{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setLocalError(null);
                }}
                className="font-semibold text-cyan-400 hover:underline"
              >
                ログイン
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/constants';

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
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    clearError();
    setLocalError(null);
    setSuccessMessage(null);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
      setSuccessMessage('Googleアカウントでログインしました');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 600);
    } catch (err: any) {
      // Error is set in AuthContext
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0d131f] p-6 sm:p-8 shadow-2xl shadow-cyan-950/30"
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

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-400 text-slate-950 mb-3 shadow-lg shadow-cyan-500/25">
            <Cloud className="h-6 w-6 font-bold" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === 'signin' ? 'AquaHostにログイン' : '新規アカウント登録'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Firebase AuthenticationとFirestoreでサイトデータを永続保存
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setMode('signin'); clearError(); setLocalError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
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
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            無料アカウント登録
          </button>
        </div>

        {/* Status Alerts */}
        {(error || localError) && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error || localError}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-750 hover:border-slate-600 transition-all active:scale-[0.99] disabled:opacity-50 shadow-sm"
        >
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
          <span>Googleアカウントでログイン</span>
        </button>

        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-[#0d131f] px-3 text-[11px] uppercase tracking-wider text-slate-500">
            またはメールアドレスで
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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

        {/* Footer Helper Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={fillDemoAccount}
            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium"
          >
            <Sparkles className="h-3 w-3" />
            <span>テスト用入力を自動補完</span>
          </button>

          <div className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>SSL暗号化保護</span>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  signInAnonymously
} from 'firebase/auth';
import { 
  auth, 
  googleAuthProvider, 
  githubAuthProvider, 
  appleAuthProvider 
} from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  unauthorizedDomain: string | null;
  lastFailedProvider: 'google' | 'github' | 'apple' | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInWithDemoUser: (demoEmail?: string, demoPassword?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [lastFailedProvider, setLastFailedProvider] = useState<'google' | 'github' | 'apple' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => {
    setError(null);
    setUnauthorizedDomain(null);
    setLastFailedProvider(null);
  };

  const handleOAuthError = (err: any, providerKey: 'google' | 'github' | 'apple', providerName: string) => {
    console.error(`${providerName} Sign-In Error:`, err);
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    setLastFailedProvider(providerKey);

    if (err.code === 'auth/unauthorized-domain') {
      setUnauthorizedDomain(hostname);
      setError(
        `【未承認ドメイン (auth/unauthorized-domain)】\n現在のドメイン「${hostname}」がFirebaseの「Authorized domains」に登録されていません。\nFirebase Console > Authentication > Settings > Authorized domains に追加するか、ドメイン制限のない「メール・パスワード」または「体験ログイン」をご利用ください。`
      );
    } else if (err.code === 'auth/operation-not-allowed') {
      setError(
        `Firebase Consoleで「${providerName}」プロバイダが有効化されていません。Authentication > Sign-in method で有効化するか、「メール・パスワード」をご利用ください。`
      );
    } else if (err.code === 'auth/popup-blocked') {
      setError('ポップアップがブラウザにブロックされました。ポップアップを許可するか、メール/パスワードでログインしてください。');
    } else if (err.code === 'auth/popup-closed-by-user') {
      setError('ログインポップアップが閉じられました。');
    } else if (err.code === 'auth/account-exists-with-different-credential') {
      setError('同じメールアドレスの別のアカウントが既に存在します。他のログイン方法をお試しください。');
    } else {
      setError(err.message || `${providerName}でのログインに失敗しました。`);
    }
  };

  const signInWithGoogle = async () => {
    clearError();
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      handleOAuthError(err, 'google', 'Google');
      throw err;
    }
  };

  const signInWithGithub = async () => {
    clearError();
    try {
      await signInWithPopup(auth, githubAuthProvider);
    } catch (err: any) {
      handleOAuthError(err, 'github', 'GitHub');
      throw err;
    }
  };

  const signInWithApple = async () => {
    clearError();
    try {
      await signInWithPopup(auth, appleAuthProvider);
    } catch (err: any) {
      handleOAuthError(err, 'apple', 'Apple');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    clearError();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      let msg = 'ログインに失敗しました。';
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (err.code === 'auth/invalid-email') {
        msg = '有効なメールアドレスを入力してください。';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'ログイン試行回数が上限を超えました。しばらく待ってから再試行してください。';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    clearError();
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName });
      }
    } catch (err: any) {
      console.error('Email Sign-Up Error:', err);
      let msg = 'アカウント登録に失敗しました。';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'このメールアドレスは既に登録されています。ログインをお試しください。';
      } else if (err.code === 'auth/weak-password') {
        msg = 'パスワードは6文字以上で設定してください。';
      } else if (err.code === 'auth/invalid-email') {
        msg = '有効なメールアドレスを入力してください。';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  // One-click demo login that registers or signs in a real Firebase Auth user via Email/Password
  // This bypasses the OAuth authorized-domain requirement while giving a 100% genuine Firebase Auth user & UID
  const signInWithDemoUser = async (
    demoEmail = 'demo-developer@aquahost.app',
    demoPassword = 'aquahost2026!',
    name = 'Aqua Developer'
  ) => {
    clearError();
    try {
      // First try signing in
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (signInErr: any) {
        // If user doesn't exist, create it
        if (
          signInErr.code === 'auth/user-not-found' || 
          signInErr.code === 'auth/invalid-credential'
        ) {
          const res = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          if (res.user) {
            await updateProfile(res.user, { displayName: name });
          }
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('Demo User Sign-In Error:', err);
      setError(err.message || '体験ログインに失敗しました。');
      throw err;
    }
  };

  const signInAsGuest = async () => {
    clearError();
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error('Guest Sign-In Error:', err);
      setError('ゲストログインに失敗しました: ' + (err.message || ''));
      throw err;
    }
  };

  const logout = async () => {
    clearError();
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setError('ログアウトに失敗しました。');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        unauthorizedDomain,
        lastFailedProvider,
        signInWithGoogle,
        signInWithGithub,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signInWithDemoUser,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

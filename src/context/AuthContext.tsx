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
import { auth, googleAuthProvider } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('ポップアップがブラウザにブロックされました。ポップアップを許可するか、メール/パスワードでログインしてください。');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('ログインポップアップが閉じられました。');
      } else {
        setError(err.message || 'Googleログインに失敗しました。');
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      let msg = 'ログインに失敗しました。';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
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
    setError(null);
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

  const signInAsGuest = async () => {
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error('Guest Sign-In Error:', err);
      setError('ゲストログインに失敗しました: ' + (err.message || ''));
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
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
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
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

import React, { useState } from 'react';
import { X, LogIn, User, Mail, Lock, Sparkles, CheckCircle2, LogOut, ShieldCheck, PackageCheck } from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, user, setAppUser, logout, setActiveTab, latestActiveOrder } = useCart();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setError(null);
    setSuccessMsg(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setAppUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      setSuccessMsg('Successfully signed in with Google!');
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed or blocked. Please try again or use email sign-in.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          setError('Please provide your name');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCredential.user, {
          displayName: displayName.trim()
        });
        setAppUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName.trim(),
        });
        setSuccessMsg(`Welcome to Spice Tree, ${displayName.trim()}!`);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        setAppUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split('@')[0],
        });
        setSuccessMsg('Signed in successfully!');
      }

      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err: any) {
      console.warn('Email auth notice:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please verify your credentials or create a new account.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is disabled in Firebase Console. Please sign in with Google or enable it in Console.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md bg-[#fbfaee] rounded-3xl shadow-2xl border border-[#e5e1d5] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 bg-white border-b border-[#e5e1d5] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ffdad2] flex items-center justify-center text-[#a03f28]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1b1c15]">
                  {user ? 'My Spice Tree Profile' : isRegisterMode ? 'Create an Account' : 'Welcome Back'}
                </h3>
                <p className="text-[11px] text-[#56423d]">Spice Tree Pure Veg, Phagwara</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* If Already Logged In */}
            {user ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#beead1] flex items-center justify-center text-[#1b4332] text-xl font-bold mx-auto border-2 border-[#a3d9bc] shadow-sm">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()
                  )}
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-serif font-bold text-lg text-[#1b1c15]">
                    {user.displayName || 'Spice Tree Member'}
                  </h4>
                  <p className="text-xs text-stone-500 font-mono">
                    {user.email || 'Logged in user'}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-[#e5e1d5] text-left text-xs space-y-1.5 text-[#56423d]">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Membership:</span>
                    <span className="font-bold text-[#1b4332] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Pure Veg Patron
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Status:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  {/* Dedicated My Orders & Live Status Button */}
                  <button
                    id="auth-modal-my-orders-btn"
                    onClick={() => {
                      handleClose();
                      setActiveTab('orders');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#a03f28] hover:bg-[#853420] text-white font-bold text-xs flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-[#ffdad2]" />
                      <span>My Orders & Live Food Tracker</span>
                    </div>
                    {latestActiveOrder && latestActiveOrder.status !== 'Delivered' && (
                      <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {latestActiveOrder.status}
                      </span>
                    )}
                  </button>

                  {user?.email && user.email.toLowerCase() === 'tyagiaayush3030@gmail.com' && (
                    <button
                      onClick={() => {
                        handleClose();
                        setActiveTab('admin');
                      }}
                      className="w-full py-2.5 rounded-xl border border-[#e5e1d5] bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#1b1c15] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#a03f28]" />
                      <span>Open Staff & Admin Terminal</span>
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await logout();
                      handleClose();
                    }}
                    className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 rounded-xl bg-[#1b1c15] text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Continue Browsing Menu
                  </button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Google Sign In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-[#e5e1d5] rounded-xl text-xs font-bold text-[#1b1c15] flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 border-t border-[#e5e1d5]" />
                  <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider whitespace-nowrap">
                    or with email
                  </span>
                  <div className="flex-1 border-t border-[#e5e1d5]" />
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {isRegisterMode && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1b1c15] mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="e.g. Aayush Tyagi"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                          required={isRegisterMode}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b1c15] mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1b1c15] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{loading ? 'Please wait...' : isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                  </button>
                </form>

                {/* Toggle Sign in / Register */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setError(null);
                    }}
                    className="text-xs text-[#a03f28] hover:underline font-semibold"
                  >
                    {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

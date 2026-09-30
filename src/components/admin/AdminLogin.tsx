import React, { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Lock, Mail, ShieldAlert, ArrowLeft, KeyRound, UserCheck, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { INITIAL_ADMINS } from '../../data/seedData';

interface AdminLoginProps {
  onAdminAuthenticated?: () => void;
  revocationNotice?: string | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onAdminAuthenticated, revocationNotice }) => {
  const { setActiveTab, setAppUser } = useCart();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to verify if an email is in the authorized admin registry
  const checkAdminAuthorized = async (cleanEmail: string) => {
    // Master Super Admin account check
    if (cleanEmail.toLowerCase() === 'tyagiaayush3030@gmail.com') {
      return {
        id: auth.currentUser?.uid || 'admin-super-owner',
        email: 'tyagiaayush3030@gmail.com',
        name: auth.currentUser?.displayName || 'Aayush Tyagi',
        role: 'Super Admin'
      };
    }

    try {
      // 1. Direct document lookup by email doc ID
      const directEmailDoc = await getDoc(doc(db, 'admins', cleanEmail.toLowerCase()));
      if (directEmailDoc.exists()) {
        return {
          id: directEmailDoc.id,
          ...(directEmailDoc.data() as { email?: string; name?: string; role?: string })
        };
      }

      // 2. Direct document lookup by auth UID
      if (auth.currentUser?.uid) {
        const uidDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
        if (uidDoc.exists()) {
          return {
            id: uidDoc.id,
            ...(uidDoc.data() as { email?: string; name?: string; role?: string })
          };
        }
      }

      // 3. Collection query
      const adminsSnapshot = await getDocs(collection(db, 'admins'));
      if (!adminsSnapshot.empty) {
        const adminDocs = adminsSnapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as { email?: string; name?: string; role?: string })
        }));
        const matched = adminDocs.find(
          a => a.email && a.email.toLowerCase() === cleanEmail.toLowerCase()
        );
        if (matched) return matched;
      }
    } catch (e) {
      console.warn('Firestore admin lookup warning:', e);
    }

    // For all other users, reject authorization
    return null;
  };

  // Google Sign-In with Authorized Check
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email?.toLowerCase() || '';

      const matchedAdmin = await checkAdminAuthorized(userEmail);

      if (matchedAdmin) {
        const adminData = {
          id: result.user.uid,
          email: userEmail,
          name: matchedAdmin.name || result.user.displayName || 'Authorized Admin',
          role: matchedAdmin.role || 'Staff Admin',
          addedAt: Date.now()
        };
        localStorage.setItem('spicetree_admin_session', JSON.stringify(adminData));
        setAppUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: adminData.name,
          photoURL: result.user.photoURL,
        });
        setSuccessMessage(`Welcome back, ${adminData.name}! Opening Admin Terminal...`);
        setTimeout(() => {
          if (onAdminAuthenticated) onAdminAuthenticated();
          window.location.reload();
        }, 500);
      } else {
        await signOut(auth);
        localStorage.removeItem('spicetree_admin_session');
        setErrorMessage(
          `Access Denied: Google Account "${userEmail}" is not registered in the authorized Spice Tree administrators list. Please contact the Super Admin.`
        );
      }
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      console.warn('Google Admin Auth notice:', err);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        setErrorMessage('Google sign-in popup was closed or blocked. Please try again or sign in with your email below.');
      } else {
        setErrorMessage(error.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle standard email/password authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter an admin email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Perform authentic Firebase Auth FIRST
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (signInErr: unknown) {
        const authError = signInErr as { code?: string };
        if (authError.code === 'auth/user-not-found') {
          // If first-time sign in for Super Admin owner
          if (cleanEmail === 'tyagiaayush3030@gmail.com') {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
            await updateProfile(userCredential.user, { displayName: 'Aayush Tyagi' });
          } else {
            throw new Error('Admin account not found. Please contact the Super Admin to register your staff email.');
          }
        } else if (
          authError.code === 'auth/wrong-password' ||
          authError.code === 'auth/invalid-credential'
        ) {
          throw new Error('Incorrect password. Please verify your admin credentials.');
        } else if (authError.code === 'auth/operation-not-allowed') {
          throw new Error('Email/Password login is not enabled in Firebase Console. Please sign in with Google or enable it in Console.');
        } else {
          throw signInErr;
        }
      }

      if (!userCredential || !userCredential.user) {
        throw new Error('Authentication failed. No valid user returned.');
      }

      // 2. Now with active authenticated user token, verify authorization in admins registry
      const matchedAdmin = await checkAdminAuthorized(cleanEmail);

      if (!matchedAdmin) {
        await signOut(auth);
        localStorage.removeItem('spicetree_admin_session');
        setIsLoading(false);
        setErrorMessage(
          `Access Denied: "${cleanEmail}" is not listed in the authorized restaurant admins database. Contact the Super Admin to request staff access.`
        );
        return;
      }

      let authenticatedName = matchedAdmin.name || userCredential.user.displayName || cleanEmail.split('@')[0];
      const authenticatedUid = userCredential.user.uid;

      // Save authorized admin session
      const adminData = {
        id: authenticatedUid,
        email: cleanEmail,
        name: authenticatedName,
        role: matchedAdmin.role || 'Staff Admin',
        addedAt: Date.now()
      };

      localStorage.setItem('spicetree_admin_session', JSON.stringify(adminData));
      setAppUser({
        uid: authenticatedUid,
        email: cleanEmail,
        displayName: authenticatedName,
      });

      setSuccessMessage(`Authenticated as ${authenticatedName}! Loading Admin Terminal...`);
      setTimeout(() => {
        if (onAdminAuthenticated) onAdminAuthenticated();
        window.location.reload();
      }, 500);

    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      console.error('Admin authentication error:', err);
      setErrorMessage(error.message || 'Failed to authenticate. Please check connection and credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1b1c15] text-[#fbfaee] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Back Link */}
        <button
          id="admin-back-to-store-btn"
          onClick={() => setActiveTab('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Restaurant</span>
        </button>

        {/* Login Box */}
        <div className="bg-[#24251c] rounded-3xl p-7 sm:p-8 border border-stone-700/60 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#a03f28]/20 border border-[#a03f28]/40 flex items-center justify-center mx-auto text-[#ffdad2]">
              <Lock className="w-6 h-6 text-[#ff8c73]" />
            </div>
            <h1 className="font-serif font-bold text-2xl text-white">
              Spice Tree Admin Terminal
            </h1>
            <p className="text-xs text-stone-400">
              Restricted staff portal for menu management, live order dispatch & restaurant controls.
            </p>
          </div>

          {/* Revocation Alert Banner */}
          {revocationNotice && (
            <div className="p-4 bg-red-950/90 border border-red-700 rounded-2xl flex items-start gap-3 text-xs text-red-200 shadow-lg">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-100 text-sm">Access Revoked</div>
                <p className="mt-1 leading-relaxed text-red-200/90">{revocationNotice}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-700/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1-Click Google Sign In (Gmail) */}
          <button
            id="admin-google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-stone-100 text-stone-900 rounded-xl font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
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
            <span>Sign In with Google (Gmail)</span>
          </button>

          <div className="flex items-center gap-3 text-stone-500">
            <div className="flex-1 h-px bg-stone-700"></div>
            <span className="text-[10px] font-semibold uppercase tracking-wider">or sign in with email & password</span>
            <div className="flex-1 h-px bg-stone-700"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  id="admin-email-input"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#1b1c15] border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Must be an authorized email registered in Spice Tree staff registry.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  id="admin-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#1b1c15] border border-stone-700 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>
            </div>

            <button
              id="admin-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#a03f28] hover:bg-[#b84a30] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Permissions...</span>
                </div>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In to Admin Panel</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security badge */}
        <div className="text-center text-[11px] text-stone-500">
          Protected by Firestore Role-Based Access Control & Firebase Authentication.
        </div>
      </div>
    </div>
  );
};

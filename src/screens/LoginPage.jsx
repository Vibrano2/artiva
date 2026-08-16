import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApp } from '../context/AppContext';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function LoginPage() {
  const { navigateTo, setCurrentUser, setUserRole, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const uid = userCredential.user.uid;

      // 2. Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      let userObj = userDoc.exists() ? userDoc.data() : { uid, email, role: 'client' };

      localStorage.setItem('artiva_current_user', JSON.stringify({ ...userObj, token: idToken }));

      setLoading(false);
      setCurrentUser(userObj);
      setUserRole(userObj.role || 'client');
      showToast('Logged in successfully!', 'success');
      
      if (userObj.role === 'artisan') {
        navigateTo('artisan_dashboard'); // Or 'artisan_signup' if they haven't finished profile, but for now dashboard
      } else {
        navigateTo('client_dash');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] flex flex-col justify-between">
      <Navbar activeTab="login" />

      <main className="flex-1 flex flex-col justify-center px-4 py-12">
        <div className="max-w-md mx-auto w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card space-y-6 animate-fade-in">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F6] text-[#16858F] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold font-['Outfit'] text-[#0E3B40]">
              Log In to Artiva
            </h1>
            <p className="text-xs text-slate-500">
              Enter your email and password to log in.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0E3B40] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden px-3 py-3.5 focus-within:border-[#16858F]">
                <Mail className="w-5 h-5 text-slate-400 mr-2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent font-medium text-[#0E3B40] text-sm focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B40] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden px-3 py-3.5 focus-within:border-[#16858F]">
                <KeyRound className="w-5 h-5 text-slate-400 mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent font-medium text-[#0E3B40] text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#16858F] hover:bg-[#0E5C63] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all btn-press touch-target disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <button
              onClick={() => navigateTo('signup')}
              className="text-[#16858F] font-bold hover:underline"
            >
              Sign Up
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

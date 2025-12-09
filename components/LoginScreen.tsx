import React, { useState } from 'react';
import { HardDrive, Lock, ArrowRight, Loader2, ShieldCheck, Server, Mail, Key } from 'lucide-react';
import { Button } from './Button';
import { api } from '../services/api';
import { User } from '../types';

import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onLogin?: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_CONFIRM';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ... rest of state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      // onLogin is optional now, mostly for redirect
      if (onLogin) onLogin({ email } as User); // Context already has user, this is just for trigger
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.forgotPassword(email);
      setSuccessMsg('Reset code sent to your email (Check server console if testing)');
      setTimeout(() => {
        setMode('FORGOT_CONFIRM');
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.resetPasswordConfirm(email, resetToken, newPassword);
      setSuccessMsg('Password reset successful. Please login.');
      setTimeout(() => {
        setMode('LOGIN');
        setPassword('');
        setSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md z-10 relative">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-4 border border-indigo-400/20">
            <HardDrive className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Private<span className="text-indigo-400">Stream</span></h1>
          <p className="text-zinc-500 mt-2 text-sm flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            Secure Hybrid-Cloud Gateway
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wider">Username / Email</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pl-11"
                    placeholder="admin"
                    required
                  />
                  <div className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                    <Server size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                  <button type="button" onClick={() => setMode('FORGOT_REQUEST')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pl-11"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={18} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  {successMsg}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Decrypting Vault...
                  </>
                ) : (
                  <>
                    Authenticate Access
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          )}

          {mode === 'FORGOT_REQUEST' && (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-white font-medium">Account Recovery</h3>
                <p className="text-zinc-500 text-xs mt-1">Enter your email to receive a secure reset code.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pl-11"
                    placeholder="admin@privatestream.local"
                    required
                  />
                  <div className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                    <Mail size={18} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  {successMsg}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Send Reset Code'}
                </Button>
                <button type="button" onClick={() => setMode('LOGIN')} className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {mode === 'FORGOT_CONFIRM' && (
            <form onSubmit={handleConfirmReset} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-white font-medium">Verify Identity</h3>
                <p className="text-zinc-500 text-xs mt-1">Check your email (or server log) for the code.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wider">Reset Code</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pl-11 font-mono tracking-widest text-center"
                    placeholder="ABCDEF"
                    maxLength={6}
                    required
                  />
                  <div className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                    <Key size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 ml-1 uppercase tracking-wider">New Password</label>
                <div className="relative group">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pl-11"
                    placeholder="••••••••"
                    required
                  />
                  <div className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={18} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Set New Password'}
                </Button>
                <button type="button" onClick={() => setMode('FORGOT_REQUEST')} className="text-sm text-zinc-400 hover:text-white transition-colors">
                  Back
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Lock size={12} />
            <span>256-bit End-to-End Encryption Active</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-xs">
            Protected by Fail2Ban. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
};
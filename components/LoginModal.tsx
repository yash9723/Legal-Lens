import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Loader2, User, ArrowRight, Chrome } from 'lucide-react';
import { logger } from '../services/loggerService';
import { AuthService } from '../services/authService';
import { GoogleLogin } from '@react-oauth/google';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: any) => void;
  initialMode?: 'login' | 'signup' | 'forgot' | 'reset';
  resetToken?: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, initialMode = 'login', resetToken = null }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | '2fa' | 'reset-otp'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 2FA State
  const [twoFactorTempToken, setTwoFactorTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handle2FASubmit = async () => {
    if (!twoFactorTempToken || !twoFactorCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await AuthService.validate2FA(twoFactorTempToken, twoFactorCode);
      if (result) {
        onLogin({ ...result, id: result.uid || result.id });
        onClose();
      }
    } catch (err: any) {
      setError("Invalid 2FA Code");
    } finally {
      setIsLoading(false);
    }
  };

  const [resetOtp, setResetOtp] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(resetToken ? 'reset' : initialMode);
      setEmail('');
      setPassword('');
      setName('');
      setResetOtp('');
      setError(null);
      setSuccessMessage(null);
      logger.debug('ui', `Auth modal opened in ${resetToken ? 'reset' : initialMode} mode`);
    }
  }, [isOpen, initialMode, resetToken]);

  if (!isOpen) return null;

  /* handleGoogleLogin removed, using GoogleLogin component directly */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!email || !password || !name) return;
        const result = await AuthService.signupWithEmail(email, password, name);
        if (result) {
          onLogin({ ...result, id: result.uid || result.id });
          onClose(); // Explicitly close the modal after signup
        }
      } else if (mode === 'login') {
        if (!email || !password) return;
        const result = await AuthService.loginWithEmail(email, password);

        if (result.twoFactorRequired) {
          setTwoFactorTempToken(result.tempToken);
          setMode('2fa');
        } else if (result) {
          onLogin({ ...result, id: result.uid || result.id });
        }
      } else if (mode === 'forgot') {
        if (!email) return;
        await AuthService.forgotPassword(email);
        setSuccessMessage("OTP sent to your email (check console).");
        setMode('reset-otp'); // Switch to OTP mode
      } else if (mode === 'reset-otp') {
        if (!email || !resetOtp || !password) return;
        await AuthService.resetPassword(email, resetOtp, password);
        setSuccessMessage("Password reset successful! You can now log in.");
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      // Enhanced error handling
      const msg = err.response?.data?.message || err.message;
      if (mode === 'signup' && msg.includes('Password')) {
        setError(msg); // Show Joi validation error
      } else if (err.code === 'auth/invalid-credential' || msg === 'Invalid Credentials') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use' || msg === 'User already exists') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(msg || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 overflow-hidden transform transition-all page-enter border border-slate-200/50 dark:border-slate-700/50">

        {/* Header with Toggle (Hide for Reset Mode) */}
        {mode !== 'reset-otp' && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex space-x-6">
              <button
                onClick={() => handleModeSwitch('login')}
                className={`text-sm font-bold pb-1 transition-colors relative ${mode === 'login' || mode === 'forgot'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                Log In
                {(mode === 'login' || mode === 'forgot') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </button>
              <button
                onClick={() => handleModeSwitch('signup')}
                className={`text-sm font-bold pb-1 transition-colors relative ${mode === 'signup'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                Sign Up
                {mode === 'signup' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {mode === 'reset-otp' && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white">Enter OTP</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 text-sm rounded-lg border border-green-100 dark:border-green-900/30">
              {successMessage}
            </div>
          )}

          {mode !== 'forgot' && mode !== 'reset-otp' && (
            <div className="w-full flex justify-center mb-4">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    setIsLoading(true);
                    try {
                      const user = await AuthService.loginWithGoogle(credentialResponse.credential);
                      if (user) onLogin({ ...user, id: user.uid || user.id });
                      onClose();
                    } catch (e: any) {
                      const msg = e.response?.data?.message || e.message || "Google Login Failed";
                      setError(msg);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                onError={() => {
                  setError("Google Login Failed");
                }}
                theme="outline"
                size="large"
                width="100%"
              />
            </div>
          )}

          {mode !== 'forgot' && mode !== 'reset-otp' && (
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-400">Or continue with email</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === 'signup' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required={mode === 'signup'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus-glow outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot' || mode === 'reset-otp') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus-glow outline-none transition-all"
                    placeholder="you@example.com"
                    disabled={mode === 'reset-otp'}
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset-otp') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {mode === 'reset-otp' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus-glow outline-none transition-all"
                    placeholder={mode === 'reset-otp' ? "Min 6 chars" : "••••••••"}
                  />
                </div>
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => handleModeSwitch('forgot')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'reset-otp' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">One-Time Password (OTP)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 btn-gradient font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : mode === 'signup' ? 'Creating account...' : mode === 'forgot' ? 'Sending OTP...' : 'Resetting...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send OTP' : 'Reset Password'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>

            {mode !== 'reset-otp' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleModeSwitch(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {mode === 'login'
                    ? "Don't have an account? Sign up"
                    : mode === 'signup'
                      ? "Already have an account? Sign in"
                      : "Back to Login"}
                </button>
              </div>
            )}
          </form>

          {mode === 'login' && error && error.includes('Two-Factor') && (
            // This state is handled by the 2FA input mode switch below
            <></>
          )}
        </div>

        {/* 2FA Input Overlay */}
        {mode === '2fa' && (
          <div className="absolute inset-0 bg-white dark:bg-slate-800 z-20 flex flex-col p-6 animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Two-Factor Authentication</h3>
              <button onClick={() => { setMode('login'); setTwoFactorTempToken(null); }} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Enter the 6-digit code from your authenticator app.
            </p>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="000 000"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 border border-slate-300 rounded-lg"
                maxLength={6}
                autoFocus
              />

              {error && <p className="text-xs text-red-600 text-center">{error}</p>}

              <button
                onClick={handle2FASubmit}
                disabled={isLoading || twoFactorCode.length < 6}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
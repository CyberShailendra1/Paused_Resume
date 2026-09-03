import React, { useState } from 'react';
import { 
  X, Mail, Lock, User as UserIcon, Sparkles, Check, AlertCircle, 
  ArrowRight, RefreshCw, Eye, EyeOff, KeyRound, ShieldCheck, Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  actionReason?: 'download' | 'save' | 'general';
  customTitle?: string;
  customSubtitle?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  actionReason,
  customTitle,
  customSubtitle,
  onSuccess
}) => {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    signInAsGuest, 
    resetPassword,
    error: authError,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
  };

  const handleClose = () => {
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
    onClose();
  };

  const notifySuccessAndClose = () => {
    handleClose();
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    if (mode === 'forgot') {
      if (!email.trim()) {
        setLocalError('Please enter your email address to receive reset instructions.');
        return;
      }
      setIsSubmitting(true);
      try {
        await resetPassword(email.trim());
        setSuccessMessage('Password reset link sent! Check your inbox.');
      } catch (err: any) {
        setLocalError(err.message || 'Failed to send reset link.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setLocalError('Please provide your full name.');
        return;
      }
      if (!email.trim()) {
        setLocalError('Please provide a valid email address.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please re-type.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signUpWithEmail(email.trim(), password, displayName.trim());
        notifySuccessAndClose();
      } catch (err: any) {
        setLocalError(err.message || 'Failed to create account.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'signin') {
      if (!email.trim() || !password) {
        setLocalError('Please enter both email and password.');
        return;
      }

      setIsSubmitting(true);
      try {
        await signInWithEmail(email.trim(), password);
        notifySuccessAndClose();
      } catch (err: any) {
        setLocalError(err.message || 'Sign in failed.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      notifySuccessAndClose();
    } catch (err: any) {
      setLocalError(err.message || 'Google sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInAsGuest();
      handleClose();
    } catch (err: any) {
      setLocalError(err.message || 'Guest sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              {actionReason === 'download' ? (
                <Download className="w-5 h-5 text-blue-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-base font-bold text-white leading-snug">
                {customTitle ? customTitle : (
                  <>
                    {mode === 'signin' && (actionReason === 'download' ? 'Sign In to Download' : 'Sign In to Paused AI')}
                    {mode === 'signup' && (actionReason === 'download' ? 'Create Account to Download' : 'Create Your Account')}
                    {mode === 'forgot' && 'Reset Password'}
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                {customSubtitle ? customSubtitle : (
                  <>
                    {mode === 'signin' && (actionReason === 'download' ? 'Sign in with your account to download your ATS resume' : 'Access your saved resumes and cloud ATS scans')}
                    {mode === 'signup' && (actionReason === 'download' ? 'Free instant sign up to export vector PDF & Word files' : 'Save and sync your ATS resumes across all devices')}
                    {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector (Sign In vs Sign Up) */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => resetFormState('signin')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => resetFormState('signup')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">

          {/* Action reason banner when trying to download */}
          {actionReason === 'download' && (
            <div className="p-3.5 rounded-xl bg-blue-50/90 border border-blue-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Sign In or Sign Up to Download</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-semibold rounded">Required</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sign in or register your free account to export ATS-compatible vector PDFs and Word files. Once authenticated, your download will start automatically.
                </p>
              </div>
            </div>
          )}

          {/* Social Auth (Google Sign In) */}
          {mode !== 'forgot' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs transition-all disabled:opacity-50"
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

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[11px] text-slate-400 font-medium uppercase tracking-wider shrink-0">
                  Or continue with email
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Display Name (Only in Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => resetFormState('forgot')}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-[10px] text-slate-500 mt-1">Must be at least 6 characters</p>
                )}
              </div>
            )}

            {/* Confirm Password (Only in Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Error Message Notification */}
            {displayError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{displayError}</span>
              </div>
            )}

            {/* Success Message Notification */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {mode === 'signin' && <span>Sign In</span>}
                  {mode === 'signup' && <span>Create Account</span>}
                  {mode === 'forgot' && <span>Send Reset Instructions</span>}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back to sign in if in forgot mode */}
            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => resetFormState('signin')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

          </form>

          {/* Guest sign-in option */}
          {mode !== 'forgot' && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {actionReason === 'download' ? (
                <p className="text-[11px] text-slate-500 italic">
                  * A free signed-in account is required to generate & download ATS resumes.
                </p>
              ) : (
                <>
                  <span className="text-xs text-slate-500">Just exploring?</span>
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={isSubmitting}
                    className="text-xs text-slate-700 hover:text-blue-600 font-semibold underline disabled:opacity-50"
                  >
                    Continue as Guest
                  </button>
                </>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

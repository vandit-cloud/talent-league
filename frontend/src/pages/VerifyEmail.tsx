import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, Brain, Sparkles } from 'lucide-react';
import { getApiUrl } from '../lib/api/base';
import { useTheme } from '../context/ThemeContext';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || 'candidate';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && next.every(d => d)) {
      verifyOtp(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (code: string) => {
    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch(getApiUrl('/auth/register/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Verification failed');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/login?registered=1&role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError('');

    try {
      const res = await fetch(getApiUrl('/auth/register/resend-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to resend OTP');
        return;
      }

      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center ${
      isDark
        ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#111827_45%,#1e1b4b_100%)]'
        : 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)]'
    }`}>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)", backgroundSize: '42px 42px' }} />
      </div>

      <div className={`relative w-full max-w-md rounded-[2rem] border p-8 shadow-2xl backdrop-blur-2xl ${
        isDark ? 'border-white/10 bg-slate-950/55' : 'border-white/70 bg-white/88'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative h-10 w-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>TalentLeague</span>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Verification</span>
            </div>
          </div>
        </div>

        {success ? (
          /* Success State */
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Verified!</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Redirecting to login page...</p>
          </div>
        ) : (
          /* OTP Input State */
          <>
            <div className="text-center mb-8">
              <div className={`mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'
              }`}>
                <Mail className={`h-7 w-7 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Check your email</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                We sent a 6-digit verification code to
              </p>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{email}</p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={isVerifying}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    isDark
                      ? 'bg-slate-800 border-slate-600 text-white focus:border-indigo-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                  } ${isVerifying ? 'opacity-50' : ''}`}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className={`rounded-xl border px-4 py-3 text-sm mb-4 text-center ${
                isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}>
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={() => verifyOtp(otp.join(''))}
              disabled={isVerifying || otp.some(d => !d)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verifying...
                </div>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Verify Email
                </>
              )}
            </button>

            {/* Resend */}
            <div className="mt-6 text-center">
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Didn't receive the code?{' '}
                <button
                  onClick={resendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className={`font-semibold transition-colors ${
                    resendCooldown > 0
                      ? isDark ? 'text-slate-500' : 'text-slate-400'
                      : isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  {isResending ? (
                    <span className="inline-flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Sending...</span>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              </p>
            </div>

            {/* Back */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/signup')}
                className={`inline-flex items-center gap-1 text-sm transition-colors ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to signup
              </button>
            </div>
          </>
        )}

        {/* Security badge */}
        <div className={`mt-6 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
              <ShieldCheck className={`h-4 w-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Secure verification</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>The code expires in 10 minutes. Never share your OTP with anyone.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Brain, Check, Lock, Mail, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { getApiUrl } from '../lib/api/base';
import { isValidPassword, PASSWORD_RULE_TEXT } from '../utils/passwordValidation';

type ResetStep = 'email' | 'otp' | 'password';

const passwordChecks = (password: string) => [
  { label: 'At least 8 characters', passed: password.length >= 8 },
  { label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
  { label: 'One lowercase letter', passed: /[a-z]/.test(password) },
  { label: 'One number', passed: /\d/.test(password) },
  { label: 'One special character like @ or _', passed: /[^A-Za-z\d]/.test(password) }
];

const stepTitle: Record<ResetStep, string> = {
  email: 'Send OTP',
  otp: 'Verify OTP',
  password: 'Set new password'
};

async function readJsonResponse(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return { raw, data: {} as { message?: string } };
  }

  try {
    return { raw, data: JSON.parse(raw) as { message?: string } };
  } catch {
    return { raw, data: {} as { message?: string } };
  }
}

export function ForgotPassword() {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const passwordRules = useMemo(() => passwordChecks(password), [password]);

  const resetAlerts = () => {
    setMessage('');
    setError('');
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    resetAlerts();

    try {
      const response = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const { raw, data } = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.message || raw || 'Failed to send OTP');
      }

      setStep('otp');
      setMessage(data.message || 'OTP sent. Please check your email.');
    } catch (err) {
      setError((err as Error).message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetAlerts();

    try {
      const response = await fetch(getApiUrl('/auth/forgot-password/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const { raw, data } = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.message || raw || 'Failed to verify OTP');
      }

      setStep('password');
      setMessage(data.message || 'OTP verified. You can now set a new password.');
    } catch (err) {
      setError((err as Error).message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const saveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAlerts();

    if (!isValidPassword(password)) {
      setError(PASSWORD_RULE_TEXT);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(getApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password, confirmPassword })
      });

      const { raw, data } = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.message || raw || 'Failed to reset password');
      }

      setMessage(data.message || 'Password updated successfully.');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError((err as Error).message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const goBackOneStep = () => {
    resetAlerts();

    if (step === 'password') {
      setStep('otp');
      return;
    }

    if (step === 'otp') {
      setStep('email');
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-8 ${
      isDark
        ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_28%),linear-gradient(135deg,#020617_0%,#111827_45%,#1e1b4b_100%)]'
        : 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)]'
    }`}>
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className={`w-full max-w-2xl rounded-[2rem] border p-8 shadow-2xl backdrop-blur-2xl ${
          isDark ? 'border-white/10 bg-slate-950/60' : 'border-white/70 bg-white/90'
        }`}>
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Forgot password</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>We will email you a secure OTP code</p>
              </div>
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Reset your account password</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter your email, verify the OTP sent to your inbox, then create and confirm your new password.
            </p>
          </div>

          <div className={`mb-6 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['email', 'otp', 'password'] as ResetStep[]).map((item, index) => {
                const active = item === step;
                const completed =
                  (item === 'email' && (step === 'otp' || step === 'password')) ||
                  (item === 'otp' && step === 'password');

                return (
                  <div
                    key={item}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      active
                        ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-300'
                        : completed
                          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                          : isDark
                            ? 'border-white/10 bg-slate-900/70 text-slate-400'
                            : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.18em] opacity-80">Step {index + 1}</p>
                    <p className="mt-1 font-semibold">{stepTitle[item]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {message ? (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              isDark ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {message}
            </div>
          ) : null}

          {error ? (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              {error}
            </div>
          ) : null}

          {step === 'email' ? (
            <form className="space-y-5" onSubmit={sendOtp}>
              <div>
                <label htmlFor="email" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                    }`}
                    placeholder="Enter your account email"
                  />
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>What happens next</p>
                    <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      We email you a 6-digit OTP. Enter it on the next step, then choose your new password.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : (
                  <>
                    Send OTP
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          ) : null}

          {step === 'otp' ? (
            <form className="space-y-5" onSubmit={verifyOtp}>
              <div>
                <label htmlFor="otp" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`block w-full rounded-2xl px-4 py-3.5 text-center text-2xl tracking-[0.45em] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                    isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                  placeholder="000000"
                />
                <p className={`mt-2 text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  We sent a 6-digit OTP to <span className="font-semibold">{email}</span>. It expires in 10 minutes, and only the latest OTP works.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          ) : null}

          {step === 'password' ? (
            <form className="space-y-5" onSubmit={saveNewPassword}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    New password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                        isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                      placeholder="Create your new password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Confirm new password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`block w-full rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                        isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                      placeholder="Confirm your new password"
                    />
                  </div>
                  <p className={`mt-2 text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{PASSWORD_RULE_TEXT}</p>
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Password checklist</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {passwordRules.map((item) => (
                    <div key={item.label} className={`flex items-center gap-2 text-sm ${item.passed ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${item.passed ? 'bg-emerald-500/15' : isDark ? 'bg-white/8' : 'bg-slate-200'}`}>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving new password...' : (
                  <>
                    Save new password
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {step === 'email' ? (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`inline-flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
            ) : (
              <button
                type="button"
                onClick={goBackOneStep}
                className={`inline-flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Current step: <span className="font-semibold">{stepTitle[step]}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { isValidPassword, PASSWORD_RULE_TEXT } from '../utils/passwordValidation';

const roleConfig = {
  candidate: {
    label: 'Candidate',
    title: 'Start your AI-powered career journey',
    subtitle: 'Upload resumes, take proctored tests, and review your results in one place.',
    icon: UserRound,
    highlights: ['TalentLeague AI scan', 'MCQ + coding rounds', 'Detailed result dashboard']
  }
} as const;

const passwordChecks = (password: string) => [
  { label: 'At least 8 characters', passed: password.length >= 8 },
  { label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
  { label: 'One lowercase letter', passed: /[a-z]/.test(password) },
  { label: 'One number', passed: /\d/.test(password) },
  { label: 'One special character like @ or _', passed: /[^A-Za-z\d]/.test(password) }
];

const getStrengthState = (password: string) => {
  const passedCount = passwordChecks(password).filter((item) => item.passed).length;

  if (!password) {
    return { label: 'Not started', width: '0%', tone: 'bg-slate-300 dark:bg-slate-700' };
  }

  if (passedCount <= 2) {
    return { label: 'Weak', width: '30%', tone: 'bg-rose-500' };
  }

  if (passedCount <= 4) {
    return { label: 'Medium', width: '68%', tone: 'bg-amber-500' };
  }

  return { label: 'Strong', width: '100%', tone: 'bg-emerald-500' };
};

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState('');

  // SECURITY: This page only creates candidate accounts
  const role = 'candidate' as const;

  const { signup } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isDark = resolvedTheme === 'dark';
  const activeRole = roleConfig.candidate;
  const ActiveRoleIcon = activeRole.icon;
  const passwordRules = useMemo(() => passwordChecks(password), [password]);
  const strengthState = useMemo(() => getStrengthState(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      showToast('Passwords do not match', 'error');
      return;
    }

    if (!isValidPassword(password)) {
      setFormError(PASSWORD_RULE_TEXT);
      showToast(PASSWORD_RULE_TEXT, 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const result: any = await signup(name, email, password, role);
      if (result?.emailVerificationPending) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&role=candidate`);
      } else {
        navigate(`/login?registered=1&role=candidate&email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error('Signup failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setFormError(message);
      showToast(`Signup failed: ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8 ${isDark
          ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.16),_transparent_28%),linear-gradient(135deg,#020617_0%,#111827_44%,#1e1b4b_100%)]'
          : 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.10),_transparent_30%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)]'
        }`}
    >
      <div className="absolute inset-0 opacity-30">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: '42px 42px'
          }}
        />
      </div>

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>TalentLeague</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Advanced onboarding for career and hiring workflows</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-500/15 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20">
              <Sparkles className="h-4 w-4" />
              Advanced signup with stronger security
            </div>
            <h1 className={`max-w-2xl text-4xl font-bold leading-tight sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Create a polished workspace before you enter the platform.
            </h1>
            <p className={`max-w-xl text-base sm:text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Choose your role, create a secure account, and continue to login when you are ready to use the website.
            </p>
          </div>

          <div
            className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl ${isDark ? 'border-white/10 bg-white/6 text-white' : 'border-white/70 bg-white/85 text-slate-900'
              }`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-indigo-200/80' : 'text-indigo-500'}`}>Selected role</p>
                <h2 className="mt-2 text-2xl font-bold">{activeRole.title}</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <ActiveRoleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{activeRole.subtitle}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {activeRole.highlights.map((item) => (
                <div
                  key={item}
                  className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/10 text-slate-200' : 'border-slate-200 bg-white/70 text-slate-700'
                    }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium leading-6">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-2xl sm:p-8 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-white/70 bg-white/88'
            }`}
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Create account</p>
              <h2 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Sign up</h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Set up your account first, then continue from the login page.</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Verified signup flow
              </div>
            </div>
          </div>

          {formError ? (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${isDark
                ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}>
              {formError}
            </div>
          ) : null}

          {/* Candidate-only signup - Recruiters go to /recruiter-signup */}
          <div className={`mb-6 rounded-2xl border px-4 py-3 ${isDark ? 'border-indigo-400/30 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50'}`}>
            <p className={`text-sm ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>
              Are you a recruiter?{' '}
              <button type="button" onClick={() => navigate('/recruiter-signup')} className="font-semibold underline">
                Register your company here
              </button>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="group">
                <label htmlFor="name" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Full name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full rounded-2xl pl-12 pr-4 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="group">
                <label htmlFor="email" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full rounded-2xl pl-12 pr-4 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="group">
                <label htmlFor="password" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}"
                    title={PASSWORD_RULE_TEXT}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full rounded-2xl pl-12 pr-12 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className={`absolute inset-y-0 right-0 pr-4 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className={`mt-2 text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{PASSWORD_RULE_TEXT}</p>
              </div>

              <div className="group">
                <label htmlFor="confirmPassword" className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Confirm password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}"
                    title={PASSWORD_RULE_TEXT}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full rounded-2xl pl-12 pr-4 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Password strength</p>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{strengthState.label}</span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className={`h-full rounded-full transition-all duration-300 ${strengthState.tone}`} style={{ width: strengthState.width }} />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
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

            <label className="group flex cursor-pointer items-start">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
              />
              <span className={`ml-3 text-sm leading-6 transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`}>
                I agree to the{' '}
                <a href="#" className="font-medium text-indigo-500 hover:text-indigo-400">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-indigo-500 hover:text-indigo-400">
                  Privacy Policy
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !agreed}
              className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-2xl hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full border-2 border-white/30 border-t-white spinner" />
                  Creating account...
                </div>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className={`font-semibold transition-colors ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}
              >
                Sign in
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

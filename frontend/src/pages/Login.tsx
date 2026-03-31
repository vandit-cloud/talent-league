import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  Linkedin,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, getBackendBaseUrl } from '../lib/api/base';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { isValidPassword, PASSWORD_RULE_TEXT } from '../utils/passwordValidation';

const roleCards = {
  candidate: {
    label: 'Candidate',
    title: 'Take skill tests with confidence',
    description: 'Resume screening, AI assessments, and guided interview preparation in one flow.',
    icon: UserRound
  },
  recruiter: {
    label: 'Recruiter',
    title: 'Review verified talent faster',
    description: 'Track candidate results, hiring signals, and coding performance from one dashboard.',
    icon: BriefcaseBusiness
  }
} as const;

const designHighlights = [
  'AI-powered resume and assessment flow',
  'Secure social sign-in and password login',
  'Theme-aware experience for light and dark mode'
];

export function Login() {
  const params = new URLSearchParams(window.location.search);
  const initialRole = (params.get('role') === 'recruiter' ? 'recruiter' : 'candidate') as 'candidate' | 'recruiter';
  const initialEmail = params.get('email') || '';
  const registered = params.get('registered') === '1';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login, setAuthSession } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const isDark = resolvedTheme === 'dark';
  const activeRoleCard = roleCards[role];
  const ActiveRoleIcon = activeRoleCard.icon;

  const handleGoogleSuccess = async (response: any) => {
    try {
      const token = response.credential;
      const res = await axios.post(getApiUrl('/auth/google/verify'), { token, role });

      if (res.data.token) {
        setAuthSession(
          {
            ...res.data,
            id: res.data._id || res.data.id,
            onboardingComplete: res.data.onboardingComplete ?? true,
            contactInfo: res.data.contactInfo || {}
          },
          res.data.token
        );
        alert(`Welcome back, ${res.data.name}!`);
        navigate(res.data.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setErrorMsg('Google Login Failed');
      const message = (error as any)?.response?.data?.message || 'Unknown error';
      alert(`Google Login Failed: ${message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPassword(password)) {
      setErrorMsg(PASSWORD_RULE_TEXT);
      alert(PASSWORD_RULE_TEXT);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const signedInUser = await login(email, password, role);
      navigate(signedInUser.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard');
    } catch (error) {
      const message = (error as Error)?.message || 'Login failed';
      setErrorMsg(message);
      alert('Sign in failed: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8 ${isDark
          ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#111827_45%,#1e1b4b_100%)]'
          : 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)]'
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

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>TalentLeague</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Advanced hiring and assessment workspace</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-500/15 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20">
              <Sparkles className="h-4 w-4" />
              Secure sign in for candidates and recruiters
            </div>
            <h1 className={`max-w-2xl text-4xl font-bold leading-tight sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
              One clean login experience for testing, hiring, and verified results.
            </h1>
            <p className={`max-w-xl text-base sm:text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Sign in to continue with AI resume analysis, proctored assessments, recruiter dashboards, and detailed exam insights.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {designHighlights.map((item) => (
              <div
                key={item}
                className={`rounded-2xl border p-4 backdrop-blur-xl ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white/80 text-slate-700'
                  }`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium leading-6">{item}</p>
              </div>
            ))}
          </div>

          <div
            className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl ${isDark ? 'border-white/10 bg-white/6 text-white' : 'border-white/70 bg-white/85 text-slate-900'
              }`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-indigo-200/80' : 'text-indigo-500'}`}>Active role</p>
                <h2 className="mt-2 text-2xl font-bold">{activeRoleCard.title}</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <ActiveRoleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{activeRoleCard.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {Object.entries(roleCards).map(([cardRole, card]) => {
                const CardIcon = card.icon;
                const active = role === cardRole;

                return (
                  <button
                    key={cardRole}
                    type="button"
                    onClick={() => setRole(cardRole as 'candidate' | 'recruiter')}
                    className={`rounded-2xl border p-4 text-left transition-all ${active
                        ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 to-purple-500/15 shadow-lg shadow-indigo-500/15'
                        : isDark
                          ? 'border-white/10 bg-black/10 hover:bg-white/8'
                          : 'border-slate-200 bg-white/75 hover:bg-slate-50'
                      }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500">
                        <CardIcon className="h-5 w-5" />
                      </div>
                      {active ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500 dark:text-emerald-300">
                          Selected
                        </span>
                      ) : null}
                    </div>
                    <p className="font-semibold">{card.label}</p>
                    <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{card.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur-2xl sm:p-8 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-white/70 bg-white/88'
            }`}
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Welcome back</p>
              <h2 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Sign in</h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Access your workspace with email, Google, or LinkedIn.</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Protected login
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            {(['candidate', 'recruiter'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${role === item
                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : isDark
                      ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {item === 'candidate' ? 'Candidate login' : 'Recruiter login'}
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {registered ? (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                Account created successfully. Please sign in to continue.
              </div>
            ) : null}

            {errorMsg ? (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark
                  ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                {errorMsg}
              </div>
            ) : null}

            <div className="space-y-4">
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
                    autoComplete="current-password"
                    required
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}"
                    title={PASSWORD_RULE_TEXT}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full rounded-2xl pl-12 pr-12 py-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                    placeholder="Enter your password"
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
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="group flex items-center cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400" />
                <span className={`ml-2 transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-medium text-indigo-500 hover:text-indigo-400"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-2xl hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="mr-2 h-5 w-5 rounded-full border-2 border-white/30 border-t-white spinner" />
                  Signing in...
                </div>
              ) : (
                <>
                  Continue to workspace
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`} />
            </div>
            <div className="relative flex justify-center">
              <span className={`px-4 text-sm ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-white text-slate-500'}`}>Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`overflow-hidden rounded-2xl ${isDark ? 'border border-white/10 bg-white/5' : 'border border-slate-200 bg-white'}`}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.log('Login Failed');
                  setErrorMsg('Google Login Failed');
                }}
                theme={isDark ? 'filled_black' : 'outline'}
                shape="rectangular"
                size="large"
                text="signin_with"
                width="100%"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const backendUrl = getBackendBaseUrl();
                window.location.href = `${backendUrl}/api/auth/oauth/linkedin/start?role=${role}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
              }}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isDark
                  ? 'border border-white/10 bg-black text-white hover:bg-slate-950'
                  : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </button>
          </div>

          <div className={`mt-6 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Secure password policy</p>
                <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{PASSWORD_RULE_TEXT}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className={`font-semibold transition-colors ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}
              >
                Create account
              </button>
              <span className={`mx-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>|</span>
              <button
                onClick={() => navigate('/signup?role=recruiter')}
                className={`font-semibold transition-colors ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}
              >
                Create recruiter account
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
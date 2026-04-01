import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Brain, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

export function ResetPassword() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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
        <div className={`w-full max-w-xl rounded-[2rem] border p-8 shadow-2xl backdrop-blur-2xl ${
          isDark ? 'border-white/10 bg-slate-950/60' : 'border-white/70 bg-white/90'
        }`}>
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Password reset updated</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>OTP-based reset is now active</p>
              </div>
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Use email OTP to reset password</h1>
            <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Password reset now works with an OTP sent to your email. Request a fresh OTP, verify it, then create your new password.
            </p>
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50/80'}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>What changed</p>
                <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Old reset links are no longer used. Start the new OTP flow from the forgot password page.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:translate-y-[-1px]"
            >
              Go to OTP reset
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`flex-1 rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="mr-2 inline h-4 w-4" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

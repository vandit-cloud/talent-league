import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  LogOut,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-400/30',
    title: 'Company Verification Pending',
    description: 'Your company details are being reviewed. This typically takes 1-2 business days. You will receive full access once verified.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-400/30',
    title: 'Verification Rejected',
    description: 'Your company verification was rejected. Please contact support or re-register with valid GST/CIN details.',
  },
  verified: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-400/30',
    title: 'Company Verified',
    description: 'Your company has been verified. Redirecting to your dashboard...',
  },
  not_required: {
    icon: ShieldCheck,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/15',
    borderColor: 'border-slate-400/30',
    title: 'Verification Not Required',
    description: 'Your account does not require company verification.',
  },
};

export function RecruiterVerificationPending() {
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const isDark = resolvedTheme === 'dark';
  const status = user?.verificationStatus || 'pending';
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  // If already verified, redirect
  if (user?.companyVerified || status === 'verified') {
    navigate('/recruiter/dashboard', { replace: true });
    return null;
  }

  // If not a recruiter, redirect
  if (user && user.role !== 'recruiter') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8 ${isDark
        ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.16),_transparent_28%),linear-gradient(135deg,#020617_0%,#111827_44%,#1e1b4b_100%)]'
        : 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.10),_transparent_30%),linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)]'
      }`}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full" style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
          backgroundSize: '42px 42px'
        }} />
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className={`w-full rounded-[2rem] border p-8 shadow-2xl backdrop-blur-2xl sm:p-10 ${isDark ? 'border-white/10 bg-slate-950/55' : 'border-white/70 bg-white/88'}`}>
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>TalentLeague</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Recruiter Verification</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`mb-8 flex items-start gap-4 rounded-2xl border p-6 ${isDark ? `${config.borderColor} bg-white/5` : `${config.borderColor} bg-slate-50`}`}>
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${config.bgColor}`}>
              <StatusIcon className={`h-7 w-7 ${config.color}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{config.title}</h1>
              <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{config.description}</p>
            </div>
          </div>

          {/* Company Details */}
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
            <h3 className={`mb-4 text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Submitted company details
            </h3>
            <div className="space-y-4">
              {user?.companyName && (
                <div className="flex items-center gap-3">
                  <Building2 className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Company Name</p>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.companyName}</p>
                  </div>
                </div>
              )}
              {user?.gstNumber && (
                <div className="flex items-center gap-3">
                  <FileText className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>GST Number</p>
                    <p className={`text-sm font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.gstNumber}</p>
                  </div>
                </div>
              )}
              {user?.cinNumber && (
                <div className="flex items-center gap-3">
                  <FileText className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>CIN Number</p>
                    <p className={`text-sm font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.cinNumber}</p>
                  </div>
                </div>
              )}
              {user?.udyamNumber && (
                <div className="flex items-center gap-3">
                  <FileText className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>UDYAM Number</p>
                    <p className={`text-sm font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.udyamNumber}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <ShieldCheck className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Verification Status</p>
                  <p className={`text-sm font-semibold capitalize ${config.color}`}>{status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className={`mt-6 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-indigo-500/10' : 'border-indigo-200 bg-indigo-50'}`}>
            <div className="flex items-start gap-3">
              <ShieldCheck className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>Why is verification required?</p>
                <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-indigo-300/80' : 'text-indigo-700'}`}>
                  GST/CIN verification ensures only legitimate businesses can access recruiter features like posting jobs, creating assessments, and viewing candidate data. This protects both candidates and employers.
                </p>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.reload()}
              className={`text-sm font-medium transition-colors ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-700'}`}
            >
              Refresh status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

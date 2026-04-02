import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Video,
  XCircle,
  Zap,
  AlertCircle,
  Phone,
  Users,
  Eye
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';

/* ── Types ── */
interface TestData {
  _id?: string;
  testToken?: string;
  assessmentTitle?: string;
  requiredSkills?: string[];
  status?: string;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  completedAt?: string;
  sentAt?: string;
  createdAt?: string;
  companyName?: string;
  recruiterCompany?: string;
  candidateName?: string;
}

interface InterviewData {
  _id?: string;
  jobTitle?: string;
  company?: string;
  date?: string;
  time?: string;
  duration?: string;
  type?: 'video' | 'phone' | 'in-person';
  status?: 'upcoming' | 'completed' | 'cancelled';
  round?: string;
  interviewer?: string;
}

interface SkillScore {
  name: string;
  correct: number;
  total: number;
  percentage: number;
}

/* ── Helpers ── */
const formatDate = (d?: string) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return d; }
};

const formatDateFull = (d?: string) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
};

const daysUntil = (d?: string) => {
  if (!d) return 999;
  try { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); } catch { return 999; }
};

const interviewIcon: Record<string, typeof Video> = { video: Video, phone: Phone, 'in-person': Users };

/* ================================================================== */
export function Dashboard() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';

  const [tests, setTests] = useState<TestData[]>([]);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const email = user?.email;
      if (!email) { setLoading(false); return; }

      try {
        const [testsRes, intRes] = await Promise.allSettled([
          axios.get(getApiUrl(`/mcq/all?candidateEmail=${encodeURIComponent(email)}`), { headers }),
          axios.get(getApiUrl(`/interviews?candidateEmail=${encodeURIComponent(email)}`), { headers }),
        ]);

        if (testsRes.status === 'fulfilled') setTests(Array.isArray(testsRes.value.data) ? testsRes.value.data : []);
        if (intRes.status === 'fulfilled') setInterviews(Array.isArray(intRes.value.data) ? intRes.value.data : []);
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchAll();
  }, [user?.email]);

  /* ── Computed stats ── */
  const completedTests = tests.filter(t => t.status === 'completed');
  const pendingTests = tests.filter(t => t.status !== 'completed' && t.status !== 'expired');

  const avgScore = completedTests.length > 0
    ? Math.round(completedTests.reduce((sum, t) => {
        const total = t.totalQuestions || 1;
        const score = t.score ?? t.correctAnswers ?? 0;
        return sum + (score / total) * 100;
      }, 0) / completedTests.length)
    : null;

  const interviewsUpcoming = interviews.filter(i => i.status === 'upcoming');
  const interviewsCompleted = interviews.filter(i => i.status === 'completed');
  const interviewsCancelled = interviews.filter(i => i.status === 'cancelled');

  const nextInterview = interviewsUpcoming
    .filter(i => i.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())[0];

  const uniqueCompanies = new Set([
    ...tests.map(t => t.companyName || t.recruiterCompany).filter(Boolean),
    ...interviews.map(i => i.company).filter(Boolean),
  ]).size;

  /* ── Skill performance ── */
  const skillMap = new Map<string, { correct: number; total: number }>();
  completedTests.forEach(t => {
    const skills = t.requiredSkills || [];
    const score = t.score ?? t.correctAnswers ?? 0;
    const total = t.totalQuestions || 1;
    // Distribute score across skills evenly (best approximation without per-question data)
    const perSkill = skills.length > 0 ? score / skills.length : 0;
    const perSkillTotal = skills.length > 0 ? total / skills.length : 0;
    skills.forEach(skill => {
      const existing = skillMap.get(skill) || { correct: 0, total: 0 };
      existing.correct += perSkill;
      existing.total += perSkillTotal;
      skillMap.set(skill, existing);
    });
  });

  const skillScores: SkillScore[] = Array.from(skillMap.entries())
    .map(([name, { correct, total }]) => ({
      name,
      correct: Math.round(correct),
      total: Math.round(total),
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);

  const strongestSkill = skillScores[0];
  const weakestSkill = skillScores.length > 1 ? skillScores[skillScores.length - 1] : null;

  /* ── Hiring pipeline (top 4) ── */
  const pipeline = [
    ...tests.map(t => ({
      company: t.companyName || t.recruiterCompany || 'Company',
      job: t.assessmentTitle || 'Assessment',
      status: t.status === 'completed' ? 'assessed' : 'pending',
      date: t.completedAt || t.sentAt || t.createdAt || '',
    })),
    ...interviews.map(i => ({
      company: i.company || 'Company',
      job: i.jobTitle || 'Position',
      status: i.status === 'completed' ? 'interviewed' : i.status === 'cancelled' ? 'cancelled' : 'interview',
      date: i.date || '',
    })),
  ].slice(0, 4);

  const pipelineStatus: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    assessed: { icon: FileText, color: 'text-amber-500', label: 'Assessed' },
    pending: { icon: Clock, color: 'text-blue-500', label: 'Pending' },
    interview: { icon: Calendar, color: 'text-indigo-500', label: 'Interview' },
    interviewed: { icon: Eye, color: 'text-purple-500', label: 'Reviewed' },
    cancelled: { icon: XCircle, color: 'text-rose-500', label: 'Cancelled' },
  };

  /* ── Next steps ── */
  const nextSteps: { icon: typeof FileText; text: string; action: string; priority: number }[] = [];
  if (pendingTests.length > 0) nextSteps.push({ icon: AlertCircle, text: `You have ${pendingTests.length} pending assessment${pendingTests.length > 1 ? 's' : ''} — complete to boost your ranking`, action: '/assessments', priority: 1 });
  if (nextInterview) {
    const days = daysUntil(nextInterview.date);
    const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`;
    nextSteps.push({ icon: Calendar, text: `Interview ${label}: ${nextInterview.jobTitle} at ${nextInterview.company}`, action: '/interview', priority: 0 });
  }
  if (completedTests.length === 0) nextSteps.push({ icon: Upload, text: 'Upload your resume to unlock AI-matched job recommendations', action: '/resume-upload', priority: 2 });
  if (weakestSkill && weakestSkill.percentage < 60) nextSteps.push({ icon: Target, text: `Improve ${weakestSkill.name} (${weakestSkill.percentage}%) — practice assessments can help`, action: '/assessments', priority: 3 });
  nextSteps.sort((a, b) => a.priority - b.priority);

  /* ── Styling helpers ── */
  const card = `rounded-2xl border transition-all ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white shadow-sm'}`;
  const heading = `text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`;
  const subtext = `text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`;
  const muted = `text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`;

  const skillBarColor = (pct: number) => pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  const skillBarBg = isDark ? 'bg-white/10' : 'bg-slate-100';

  return (
    <div className="p-6 space-y-6">
      {/* ── HEADER ── */}
      <div className={`${card} p-6 relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? 'from-indigo-500/5 to-purple-500/5' : 'from-indigo-500/[0.03] to-purple-500/[0.03]'}`} />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">Welcome Back</span>
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user?.name ? `Hey, ${user.name.split(' ')[0]}!` : 'Dashboard'}
            </h1>
            <p className={`mt-1 ${subtext}`}>Here's your career snapshot.</p>
          </div>
          <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/20">
            <Brain className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Assessments', value: completedTests.length, icon: Award, gradient: 'from-violet-500 to-purple-600', extra: pendingTests.length > 0 ? `${pendingTests.length} pending` : null },
          { label: 'Avg Score', value: avgScore != null ? `${avgScore}%` : '—', icon: BarChart3, gradient: 'from-blue-500 to-indigo-600', extra: avgScore != null && avgScore >= 80 ? 'Great!' : avgScore != null ? 'Keep going' : null },
          { label: 'Interviews', value: interviews.length, icon: Video, gradient: 'from-emerald-500 to-teal-600', extra: interviewsUpcoming.length > 0 ? `${interviewsUpcoming.length} upcoming` : null },
          { label: 'Companies', value: uniqueCompanies, icon: Building2, gradient: 'from-orange-500 to-pink-600', extra: null },
        ].map((stat) => (
          <div key={stat.label} className={`${card} p-5 group hover:translate-y-[-2px] hover:shadow-lg transition-all`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={muted}>{stat.label}</p>
                <p className={`mt-1 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{loading ? '...' : stat.value}</p>
                {stat.extra && <p className={`mt-1 text-xs font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stat.extra}</p>}
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW: Interview Summary + Skill Performance ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Interview Summary */}
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={heading}>Interview Overview</h2>
            <button onClick={() => navigate('/interview')} className={`flex items-center gap-1 text-xs font-semibold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total', count: interviews.length, icon: Calendar, color: isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600' },
              { label: 'Completed', count: interviewsCompleted.length, icon: CheckCircle2, color: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
              { label: 'Cancelled', count: interviewsCancelled.length, icon: XCircle, color: isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-3 text-center ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                <item.icon className={`mx-auto h-5 w-5 mb-1.5 ${item.color.split(' ')[1]}`} />
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{loading ? '—' : item.count}</p>
                <p className={muted}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Next interview */}
          {nextInterview ? (
            <div className={`rounded-xl border p-4 ${isDark ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-indigo-200 bg-indigo-50/50'}`}>
              <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Next Interview</p>
              <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{nextInterview.jobTitle}</p>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{nextInterview.company}</p>
              <div className={`mt-2 flex flex-wrap items-center gap-3 ${muted}`}>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateFull(nextInterview.date)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{nextInterview.time}</span>
                {nextInterview.type && (() => { const I = interviewIcon[nextInterview.type] || Video; return <span className="flex items-center gap-1"><I className="h-3 w-3" />{nextInterview.type}</span>; })()}
              </div>
            </div>
          ) : (
            <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
              <p className={subtext}>No upcoming interviews</p>
            </div>
          )}
        </div>

        {/* Skill Performance */}
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={heading}>Skill Performance</h2>
            {strongestSkill && (
              <div className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Zap className="h-3 w-3" />
                Best: {strongestSkill.name}
              </div>
            )}
          </div>

          {skillScores.length > 0 ? (
            <div className="space-y-4">
              {skillScores.map((skill) => (
                <div key={skill.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{skill.name}</span>
                    <span className={`text-xs font-bold ${skill.percentage >= 75 ? 'text-emerald-500' : skill.percentage >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {skill.percentage}%
                    </span>
                  </div>
                  <div className={`h-2.5 rounded-full ${skillBarBg} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${skillBarColor(skill.percentage)} transition-all duration-700`}
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {weakestSkill && weakestSkill.percentage < 70 && (
                <div className={`mt-2 rounded-xl p-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-amber-50 border border-amber-100'}`}>
                  <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    <Target className="inline h-3 w-3 mr-1" />
                    Focus area: <strong>{weakestSkill.name}</strong> ({weakestSkill.percentage}%) — practice can help improve your score.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                <BarChart3 className={`h-7 w-7 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
              <p className={subtext}>Complete assessments to see your skill breakdown</p>
              <button onClick={() => navigate('/assessments')} className={`mt-3 text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Take an assessment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── HIRING PIPELINE ── */}
      <div className={`${card} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={heading}>Hiring Pipeline</h2>
          <button onClick={() => navigate('/company-approvals')} className={`flex items-center gap-1 text-xs font-semibold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {pipeline.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.map((item, i) => {
              const config = pipelineStatus[item.status] || pipelineStatus.pending;
              const PIcon = config.icon;
              return (
                <div key={i} className={`rounded-xl border p-4 transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer ${isDark ? 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-100 bg-slate-50/50 hover:bg-white'}`}
                  onClick={() => navigate('/company-approvals')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PIcon className={`h-4 w-4 ${config.color}`} />
                    <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  </div>
                  <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.company}</p>
                  <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.job}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className={subtext}>No company interactions yet. Apply to jobs or wait for recruiter assessments.</p>
          </div>
        )}
      </div>

      {/* ── ROW: Assessment History + Next Steps ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Assessment History */}
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={heading}>Recent Assessments</h2>
            <button onClick={() => navigate('/exam-results')} className={`flex items-center gap-1 text-xs font-semibold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {completedTests.length > 0 ? (
            <div className="space-y-3">
              {completedTests.slice(0, 4).map((test, i) => {
                const score = test.score ?? test.correctAnswers ?? 0;
                const total = test.totalQuestions || 1;
                const pct = Math.round((score / total) * 100);
                return (
                  <div key={test._id || i} className={`flex items-center justify-between rounded-xl p-3 ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {test.assessmentTitle || test.requiredSkills?.join(', ') || 'Assessment'}
                      </p>
                      <p className={muted}>{formatDate(test.completedAt || test.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-sm font-bold ${pct >= 80 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {score}/{total}
                      </span>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                        pct >= 80
                          ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                          : pct >= 60
                            ? (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600')
                            : (isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600')
                      }`}>
                        {pct}%
                      </div>
                    </div>
                  </div>
                );
              })}

              {avgScore != null && (
                <div className={`flex items-center justify-between rounded-xl p-3 ${isDark ? 'bg-indigo-500/5 border border-indigo-500/10' : 'bg-indigo-50 border border-indigo-100'}`}>
                  <span className={`text-sm font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>Average Score</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{avgScore}%</span>
                    <TrendingUp className={`h-4 w-4 ${avgScore >= 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                <Award className={`h-7 w-7 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
              <p className={subtext}>No assessments completed yet</p>
              <button onClick={() => navigate('/assessments')} className={`mt-3 text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                Start your first assessment
              </button>
            </div>
          )}
        </div>

        {/* Suggested Next Steps */}
        <div className={`${card} p-6`}>
          <h2 className={`${heading} mb-5`}>Suggested Next Steps</h2>

          {nextSteps.length > 0 ? (
            <div className="space-y-3">
              {nextSteps.slice(0, 4).map((step, i) => (
                <button
                  key={i}
                  onClick={() => navigate(step.action)}
                  className={`flex w-full items-start gap-3 rounded-xl p-4 text-left transition-all hover:translate-y-[-1px] hover:shadow-md ${isDark ? 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.05]' : 'bg-slate-50 border border-slate-100 hover:bg-white'}`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                    i === 0
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <step.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{step.text}</p>
                  </div>
                  <ChevronRight className={`mt-1 h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Default steps when everything is done */}
              <div className={`rounded-xl p-4 ${isDark ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-100'}`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <p className={`text-sm font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>You're all caught up!</p>
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>Check back for new assessments and interview invitations.</p>
              </div>
              <button
                onClick={() => navigate('/jobs')}
                className={`flex w-full items-center gap-3 rounded-xl p-4 text-left ${isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-slate-50 border border-slate-100'}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <Briefcase className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Browse open positions</span>
                <ChevronRight className={`ml-auto h-4 w-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

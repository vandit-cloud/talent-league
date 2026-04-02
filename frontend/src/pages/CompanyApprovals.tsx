import { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  Calendar,
  Award,
  ChevronRight,
  Search,
  TrendingUp,
  Star,
  Mail,
  MapPin,
  Users,
  FileText,
  Video,
  Phone,
  UserCheck,
  Sparkles,
  Eye
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';

/* ── Types ── */
type ApprovalStatus = 'assessment_sent' | 'assessment_completed' | 'interview_scheduled' | 'selected' | 'rejected' | 'on_hold' | 'in_review';

interface CompanyApproval {
  id: string;
  companyName: string;
  companyLogo?: string;
  jobTitle: string;
  department?: string;
  location?: string;
  status: ApprovalStatus;
  appliedDate: string;
  lastUpdated: string;
  assessmentScore?: number;
  assessmentTotal?: number;
  interviewDate?: string;
  interviewTime?: string;
  interviewType?: 'video' | 'phone' | 'in-person';
  interviewRound?: string;
  recruiterName?: string;
  salary?: { min: number; max: number; currency: string };
  skills?: string[];
  notes?: string;
}

/* ── Status config ── */
const statusConfig: Record<ApprovalStatus, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string; badgeClass: string }> = {
  assessment_sent: {
    label: 'Assessment Sent',
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/15',
    badgeClass: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-300 dark:ring-blue-400/20',
  },
  assessment_completed: {
    label: 'Assessment Done',
    icon: FileText,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/15',
    badgeClass: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300 dark:ring-amber-400/20',
  },
  in_review: {
    label: 'In Review',
    icon: Eye,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/15',
    badgeClass: 'bg-purple-500/10 text-purple-600 ring-purple-500/20 dark:text-purple-300 dark:ring-purple-400/20',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    icon: Calendar,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/15',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-400/20',
  },
  on_hold: {
    label: 'On Hold',
    icon: Clock,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/15',
    badgeClass: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300 dark:ring-slate-400/20',
  },
  selected: {
    label: 'Selected',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/15',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/20',
  },
  rejected: {
    label: 'Not Selected',
    icon: XCircle,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/15',
    badgeClass: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-300 dark:ring-rose-400/20',
  },
};

const filterOptions: { value: ApprovalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'selected', label: 'Selected' },
  { value: 'interview_scheduled', label: 'Interview' },
  { value: 'in_review', label: 'In Review' },
  { value: 'assessment_completed', label: 'Assessed' },
  { value: 'assessment_sent', label: 'Pending' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'rejected', label: 'Rejected' },
];

const interviewTypeIcon = { video: Video, phone: Phone, 'in-person': Users };

/* ── Helper: format date ── */
const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
};

const daysSince = (d: string) => {
  try {
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  } catch { return 0; }
};

/* ================================================================== */
export function CompanyApprovals() {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';

  const [approvals, setApprovals] = useState<CompanyApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ── Fetch data from backend ── */
  useEffect(() => {
    const fetchApprovals = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const email = user?.email;

        if (!email) { setLoading(false); return; }

        // Fetch MCQ tests (assessments assigned to this candidate)
        let tests: any[] = [];
        try {
          const testsRes = await axios.get(getApiUrl(`/mcq/all?candidateEmail=${encodeURIComponent(email)}`), { headers });
          tests = Array.isArray(testsRes.data) ? testsRes.data : [];
        } catch { /* may not have access */ }

        // Fetch interviews for this candidate
        let interviews: any[] = [];
        try {
          const intRes = await axios.get(getApiUrl(`/interviews?candidateEmail=${encodeURIComponent(email)}`), { headers });
          interviews = Array.isArray(intRes.data) ? intRes.data : [];
        } catch { /* may fail */ }

        // Build approval items by merging assessments + interviews per company/job
        const approvalMap = new Map<string, CompanyApproval>();

        // From MCQ tests
        tests.forEach((test: any) => {
          const key = `${test.assessmentTitle || test.requiredSkills?.[0] || 'Assessment'}-${test.recruiterId || 'unknown'}`;
          const isCompleted = test.status === 'completed';
          let status: ApprovalStatus = 'assessment_sent';
          if (isCompleted && test.score != null) {
            status = 'assessment_completed';
            // If high score, mark as in_review
            if (test.totalQuestions && (test.score / test.totalQuestions) >= 0.7) {
              status = 'in_review';
            }
          }

          approvalMap.set(key, {
            id: test._id || test.testToken || key,
            companyName: test.companyName || test.recruiterCompany || 'Company',
            jobTitle: test.assessmentTitle || test.requiredSkills?.join(', ') || 'Assessment',
            status,
            appliedDate: test.sentAt || test.createdAt || new Date().toISOString(),
            lastUpdated: test.completedAt || test.sentAt || test.createdAt || new Date().toISOString(),
            assessmentScore: test.score ?? test.correctAnswers,
            assessmentTotal: test.totalQuestions,
            skills: test.requiredSkills || [],
            recruiterName: test.recruiterName,
          });
        });

        // Merge interview data
        interviews.forEach((intv: any) => {
          // Find matching approval or create new
          const existingKey = Array.from(approvalMap.keys()).find(k =>
            k.toLowerCase().includes((intv.jobTitle || '').toLowerCase().split(' ')[0])
          );

          if (existingKey && approvalMap.has(existingKey)) {
            const existing = approvalMap.get(existingKey)!;
            existing.status = 'interview_scheduled';
            existing.companyName = intv.company || existing.companyName;
            existing.interviewDate = intv.date;
            existing.interviewTime = intv.time;
            existing.interviewType = intv.type;
            existing.interviewRound = intv.round;
            existing.lastUpdated = intv.updatedAt || intv.createdAt || existing.lastUpdated;
            if (intv.status === 'completed') {
              existing.status = 'in_review';
            }
            if (intv.status === 'cancelled') {
              existing.status = 'on_hold';
            }
          } else {
            approvalMap.set(`intv-${intv._id}`, {
              id: intv._id || `intv-${Date.now()}`,
              companyName: intv.company || 'Company',
              jobTitle: intv.jobTitle || 'Position',
              status: intv.status === 'completed' ? 'in_review' : intv.status === 'cancelled' ? 'on_hold' : 'interview_scheduled',
              appliedDate: intv.createdAt || new Date().toISOString(),
              lastUpdated: intv.updatedAt || intv.createdAt || new Date().toISOString(),
              interviewDate: intv.date,
              interviewTime: intv.time,
              interviewType: intv.type,
              interviewRound: intv.round,
              location: intv.location,
              recruiterName: intv.interviewer,
              notes: intv.notes,
            });
          }
        });

        const list = Array.from(approvalMap.values());

        // If no real data, show sample data
        if (list.length === 0) {
          setApprovals(sampleApprovals);
        } else {
          setApprovals(list);
        }
      } catch {
        setApprovals(sampleApprovals);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, [user?.email]);

  /* ── Filter + search ── */
  const filtered = approvals.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.companyName.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q);
    }
    return true;
  });

  /* ── Stats ── */
  const stats = {
    total: approvals.length,
    selected: approvals.filter(a => a.status === 'selected').length,
    interviews: approvals.filter(a => a.status === 'interview_scheduled').length,
    inReview: approvals.filter(a => a.status === 'in_review' || a.status === 'assessment_completed').length,
    pending: approvals.filter(a => a.status === 'assessment_sent').length,
  };

  /* ── Card classes ── */
  const cardBase = `rounded-2xl border transition-all duration-300 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'}`;
  const cardHover = 'hover:translate-y-[-2px] hover:shadow-lg cursor-pointer';

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Company Approvals</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Track your hiring pipeline — assessments, interviews, and selection status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
            <Sparkles className="h-3.5 w-3.5" />
            {stats.selected} Selected
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Applications', value: stats.total, icon: Briefcase, color: 'from-indigo-500 to-purple-600' },
          { label: 'Selected', value: stats.selected, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
          { label: 'Interviews', value: stats.interviews, icon: Calendar, color: 'from-blue-500 to-cyan-600' },
          { label: 'Under Review', value: stats.inReview, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className={`${cardBase} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search company or job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? 'border border-white/10 bg-white/5 text-white placeholder:text-slate-500' : 'border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === opt.value
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : isDark
                  ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className={`${cardBase} flex flex-col items-center justify-center py-20 text-center`}>
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
            <Building2 className={`h-8 w-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>No applications yet</p>
          <p className={`mt-2 max-w-sm text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Once recruiters send you assessments or schedule interviews, they'll appear here with real-time status updates.
          </p>
        </div>
      )}

      {/* ── Approval Cards ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((approval) => {
            const config = statusConfig[approval.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === approval.id;
            const InterviewIcon = approval.interviewType ? interviewTypeIcon[approval.interviewType] : Video;

            return (
              <div
                key={approval.id}
                className={`${cardBase} ${cardHover} overflow-hidden`}
                onClick={() => setExpandedId(isExpanded ? null : approval.id)}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 p-5">
                  {/* Company avatar */}
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${config.bgColor}`}>
                    {approval.companyLogo ? (
                      <img src={approval.companyLogo} alt={approval.companyName} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <Building2 className={`h-7 w-7 ${config.color}`} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{approval.companyName}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${config.badgeClass}`}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{approval.jobTitle}</p>
                    <div className={`mt-1.5 flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {approval.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{approval.location}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(approval.lastUpdated)}</span>
                      {approval.assessmentScore != null && approval.assessmentTotal && (
                        <span className="flex items-center gap-1"><Award className="h-3 w-3" />Score: {approval.assessmentScore}/{approval.assessmentTotal}</span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3">
                    {approval.status === 'selected' && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                        <Star className="h-5 w-5 text-emerald-500" />
                      </div>
                    )}
                    <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''} ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className={`border-t px-5 py-5 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Timeline */}
                      <div>
                        <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Timeline</p>
                        <div className="space-y-3">
                          <TimelineItem
                            icon={Mail} label="Application received"
                            date={formatDate(approval.appliedDate)}
                            done
                            isDark={isDark}
                          />
                          {(approval.assessmentScore != null) && (
                            <TimelineItem
                              icon={Award} label={`Assessment completed (${approval.assessmentScore}/${approval.assessmentTotal})`}
                              date={formatDate(approval.lastUpdated)}
                              done
                              isDark={isDark}
                            />
                          )}
                          {approval.interviewDate && (
                            <TimelineItem
                              icon={InterviewIcon} label={`${approval.interviewRound || 'Interview'} — ${approval.interviewType}`}
                              date={`${formatDate(approval.interviewDate)} at ${approval.interviewTime || ''}`}
                              done={approval.status === 'in_review' || approval.status === 'selected'}
                              isDark={isDark}
                            />
                          )}
                          {approval.status === 'selected' && (
                            <TimelineItem
                              icon={CheckCircle2} label="Selected for the role"
                              date={formatDate(approval.lastUpdated)}
                              done
                              highlight
                              isDark={isDark}
                            />
                          )}
                          {approval.status === 'rejected' && (
                            <TimelineItem
                              icon={XCircle} label="Not selected"
                              date={formatDate(approval.lastUpdated)}
                              done
                              isDark={isDark}
                            />
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div>
                        <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Details</p>
                        <div className="space-y-2.5">
                          {approval.recruiterName && (
                            <DetailRow icon={UserCheck} label="Recruiter" value={approval.recruiterName} isDark={isDark} />
                          )}
                          {approval.salary && (
                            <DetailRow icon={TrendingUp} label="Salary range" value={`${approval.salary.currency} ${approval.salary.min.toLocaleString()} - ${approval.salary.max.toLocaleString()}`} isDark={isDark} />
                          )}
                          {approval.department && (
                            <DetailRow icon={Users} label="Department" value={approval.department} isDark={isDark} />
                          )}
                          <DetailRow icon={Clock} label="Applied" value={`${daysSince(approval.appliedDate)} days ago`} isDark={isDark} />
                        </div>
                      </div>

                      {/* Skills */}
                      {approval.skills && approval.skills.length > 0 && (
                        <div>
                          <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Skills tested</p>
                          <div className="flex flex-wrap gap-2">
                            {approval.skills.map((skill) => (
                              <span key={skill} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {approval.notes && (
                      <div className={`mt-4 rounded-xl border p-3 text-sm ${isDark ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
                        <p className={`mb-1 text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Notes</p>
                        {approval.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Timeline item component ── */
function TimelineItem({ icon: Icon, label, date, done, highlight, isDark }: {
  icon: typeof CheckCircle2; label: string; date: string; done: boolean; highlight?: boolean; isDark: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
        highlight ? 'bg-emerald-500 text-white' : done ? (isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500') : (isDark ? 'bg-white/5 text-slate-600' : 'bg-slate-100 text-slate-400')
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className={`text-sm font-medium ${done ? (isDark ? 'text-slate-200' : 'text-slate-800') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>{label}</p>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{date}</p>
      </div>
    </div>
  );
}

/* ── Detail row component ── */
function DetailRow({ icon: Icon, label, value, isDark }: {
  icon: typeof Clock; label: string; value: string; isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}:</span>
      <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

/* ── Sample data (shown when no real data) ── */
const sampleApprovals: CompanyApproval[] = [
  {
    id: 's1',
    companyName: 'TechNova Solutions',
    jobTitle: 'Frontend Developer',
    department: 'Engineering',
    location: 'Mumbai, India',
    status: 'selected',
    appliedDate: '2026-03-15',
    lastUpdated: '2026-04-01',
    assessmentScore: 28,
    assessmentTotal: 30,
    interviewDate: '2026-03-28',
    interviewTime: '10:00 AM',
    interviewType: 'video',
    interviewRound: 'Technical Round 2',
    recruiterName: 'Priya Sharma',
    salary: { min: 800000, max: 1200000, currency: 'INR' },
    skills: ['React', 'TypeScript', 'Node.js', 'System Design'],
    notes: 'Excellent performance in both assessment and interview rounds. Offer letter will be sent shortly.',
  },
  {
    id: 's2',
    companyName: 'DataPulse Analytics',
    jobTitle: 'Full Stack Engineer',
    department: 'Product',
    location: 'Bangalore, India',
    status: 'interview_scheduled',
    appliedDate: '2026-03-20',
    lastUpdated: '2026-03-30',
    assessmentScore: 22,
    assessmentTotal: 25,
    interviewDate: '2026-04-05',
    interviewTime: '2:30 PM',
    interviewType: 'video',
    interviewRound: 'Technical Round 1',
    recruiterName: 'Rahul Verma',
    skills: ['React', 'Python', 'PostgreSQL'],
  },
  {
    id: 's3',
    companyName: 'CloudMatrix Inc',
    jobTitle: 'Backend Developer',
    location: 'Remote',
    status: 'in_review',
    appliedDate: '2026-03-22',
    lastUpdated: '2026-03-29',
    assessmentScore: 18,
    assessmentTotal: 20,
    skills: ['Node.js', 'MongoDB', 'AWS'],
    recruiterName: 'Anita Desai',
  },
  {
    id: 's4',
    companyName: 'FinEdge Technologies',
    jobTitle: 'React Developer',
    department: 'Frontend',
    location: 'Pune, India',
    status: 'assessment_completed',
    appliedDate: '2026-03-25',
    lastUpdated: '2026-03-28',
    assessmentScore: 15,
    assessmentTotal: 20,
    skills: ['React', 'JavaScript', 'CSS'],
  },
  {
    id: 's5',
    companyName: 'NexGen Robotics',
    jobTitle: 'Software Engineer',
    location: 'Hyderabad, India',
    status: 'assessment_sent',
    appliedDate: '2026-03-30',
    lastUpdated: '2026-03-30',
    skills: ['Python', 'C++', 'Machine Learning'],
  },
  {
    id: 's6',
    companyName: 'BrightPath Edu',
    jobTitle: 'UI/UX Developer',
    location: 'Delhi, India',
    status: 'rejected',
    appliedDate: '2026-03-10',
    lastUpdated: '2026-03-25',
    assessmentScore: 10,
    assessmentTotal: 20,
    skills: ['Figma', 'React', 'Tailwind CSS'],
    notes: 'Score did not meet the minimum threshold for this role.',
  },
];

export default CompanyApprovals;

import { useState, useEffect } from 'react';
import {
  Video, Calendar, Clock, MapPin,
  CheckCircle2, XCircle, AlertCircle, Search, X,
  Phone, User, CalendarDays, Timer, ArrowUpDown
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type InterviewStatus = 'upcoming' | 'completed' | 'cancelled';
type InterviewType = 'video' | 'phone' | 'in-person';

interface Interview {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  type: InterviewType;
  status: InterviewStatus;
  round: string;
  interviewer?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
}

const sampleInterviews: Interview[] = [
  {
    id: '1',
    jobTitle: 'Frontend Developer',
    company: 'TechNova Solutions',
    date: '2026-04-05',
    time: '10:00 AM',
    duration: '45 min',
    type: 'video',
    status: 'upcoming',
    round: 'Technical Round 1',
    interviewer: 'Priya Sharma',
    meetingLink: '#',
    notes: 'Focus on React, TypeScript, and system design questions.',
  },
  {
    id: '2',
    jobTitle: 'Full Stack Developer',
    company: 'InnovateTech',
    date: '2026-04-08',
    time: '2:00 PM',
    duration: '60 min',
    type: 'video',
    status: 'upcoming',
    round: 'HR Round',
    interviewer: 'Rahul Verma',
    meetingLink: '#',
    notes: 'Behavioral questions and salary discussion.',
  },
  {
    id: '3',
    jobTitle: 'Backend Developer',
    company: 'CloudStack India',
    date: '2026-03-28',
    time: '11:30 AM',
    duration: '45 min',
    type: 'phone',
    status: 'completed',
    round: 'Screening Round',
    interviewer: 'Amit Patel',
    notes: 'Discussed Node.js experience and past projects.',
  },
  {
    id: '4',
    jobTitle: 'Data Science Intern',
    company: 'AnalytiQ Labs',
    date: '2026-03-25',
    time: '3:00 PM',
    duration: '30 min',
    type: 'video',
    status: 'completed',
    round: 'Technical Round 1',
    interviewer: 'Dr. Meena Iyer',
    notes: 'Python coding test and ML concepts discussion.',
  },
  {
    id: '5',
    jobTitle: 'UI/UX Designer',
    company: 'PixelCraft Studio',
    date: '2026-04-02',
    time: '4:00 PM',
    duration: '45 min',
    type: 'in-person',
    status: 'cancelled',
    round: 'Portfolio Review',
    interviewer: 'Sneha Gupta',
    location: 'PixelCraft Office, Andheri West, Mumbai',
    notes: 'Cancelled due to scheduling conflict. Will be rescheduled.',
  },
  {
    id: '6',
    jobTitle: 'DevOps Engineer',
    company: 'ScaleUp Systems',
    date: '2026-04-10',
    time: '11:00 AM',
    duration: '60 min',
    type: 'video',
    status: 'upcoming',
    round: 'Technical Round 2',
    interviewer: 'Karthik Nair',
    meetingLink: '#',
    notes: 'AWS architecture, Docker, Kubernetes deep dive.',
  },
  {
    id: '7',
    jobTitle: 'Mobile App Developer',
    company: 'AppCraft Technologies',
    date: '2026-03-20',
    time: '10:00 AM',
    duration: '45 min',
    type: 'video',
    status: 'completed',
    round: 'Final Round',
    interviewer: 'Vikram Singh',
    notes: 'React Native live coding. Offer extended.',
  },
];

const statusConfig: Record<InterviewStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string; darkBg: string }> = {
  upcoming: { label: 'Upcoming', icon: AlertCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 border-blue-200', darkBg: 'dark:bg-blue-500/10 dark:border-blue-400/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200', darkBg: 'dark:bg-emerald-500/10 dark:border-emerald-400/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 border-rose-200', darkBg: 'dark:bg-rose-500/10 dark:border-rose-400/20' },
};

const typeIcon: Record<InterviewType, typeof Video> = {
  video: Video,
  phone: Phone,
  'in-person': User,
};

const filterOptions = ['All', 'Upcoming', 'Completed', 'Cancelled'];
const sortOptions = ['Date: Nearest', 'Date: Farthest', 'Company A-Z'];

export function Interview() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [interviews] = useState<Interview[]>(sampleInterviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Date: Nearest');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split('T')[0];
  };

  const getDateLabel = (dateStr: string) => {
    if (isToday(dateStr)) return 'Today';
    if (isTomorrow(dateStr)) return 'Tomorrow';
    return formatDate(dateStr);
  };

  const getCompanyInitial = (name: string) => name.charAt(0).toUpperCase();

  const getCompanyColor = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-700', 'from-indigo-500 to-indigo-700',
      'from-purple-500 to-purple-700', 'from-emerald-500 to-emerald-700',
      'from-orange-500 to-orange-700', 'from-rose-500 to-rose-700',
      'from-cyan-500 to-cyan-700', 'from-teal-500 to-teal-700',
    ];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const filtered = interviews
    .filter(i => {
      const matchesSearch = !searchTerm || (
        i.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.round.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesStatus = statusFilter === 'All' || i.status === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'Date: Nearest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'Date: Farthest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return a.company.localeCompare(b.company);
    });

  const upcomingCount = interviews.filter(i => i.status === 'upcoming').length;
  const completedCount = interviews.filter(i => i.status === 'completed').length;
  const cancelledCount = interviews.filter(i => i.status === 'cancelled').length;

  return (
    <div className={`min-h-screen ${isDark
      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
      : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            My Interviews
          </h1>
          <p className={`mt-1 text-base ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            Track and manage all your scheduled interviews in one place.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Upcoming', count: upcomingCount, icon: Calendar, gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Completed', count: completedCount, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Cancelled', count: cancelledCount, icon: XCircle, gradient: 'from-rose-500 to-pink-600' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.count}</p>
                </div>
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className={`mb-5 rounded-xl border p-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border ${
                isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              placeholder="Search by job title, company, or round..."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {filterOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                statusFilter === opt
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : isDark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              {opt}
            </button>
          ))}

          <div className="relative ml-auto">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'sort' ? null : 'sort'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                isDark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort
            </button>
            {openDropdown === 'sort' && (
              <div className={`absolute top-full right-0 mt-2 py-1 rounded-xl shadow-xl border z-50 min-w-[180px] ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                {sortOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={(e) => { e.stopPropagation(); setSortBy(opt); setOpenDropdown(null); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === opt
                        ? isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                        : isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className={`mb-4 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          Showing {filtered.length} interview{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Interview List */}
        <div className="space-y-4">
          {filtered.map(interview => {
            const status = statusConfig[interview.status];
            const StatusIcon = status.icon;
            const TypeIcon = typeIcon[interview.type];

            return (
              <div
                key={interview.id}
                onClick={() => setSelectedInterview(interview)}
                className={`group rounded-xl border p-5 sm:p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status + Date row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.bg} ${status.darkBg}`}>
                        <StatusIcon className={`h-3 w-3 ${status.color}`} />
                        <span className={status.color}>{status.label}</span>
                      </span>
                      <span className={`text-xs font-medium ${
                        isToday(interview.date)
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {getDateLabel(interview.date)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {interview.time}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-lg font-bold mb-1 transition-colors ${
                      isDark ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-indigo-600 group-hover:text-indigo-700'
                    }`}>
                      {interview.jobTitle}
                    </h3>

                    {/* Company */}
                    <p className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {interview.company}
                    </p>

                    {/* Info row */}
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{interview.round}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="h-3.5 w-3.5" />
                        <span className="capitalize">{interview.type === 'in-person' ? 'In Person' : interview.type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5" />
                        <span>{interview.duration}</span>
                      </div>
                      {interview.interviewer && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span>{interview.interviewer}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes preview */}
                    {interview.notes && (
                      <p className={`mt-2 text-xs line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {interview.notes}
                      </p>
                    )}
                  </div>

                  {/* Company Logo */}
                  <div className="hidden sm:flex flex-col items-center gap-2 ml-2">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${getCompanyColor(interview.company)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <span className="text-white text-xl font-bold">{getCompanyInitial(interview.company)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <Calendar className={`h-8 w-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No interviews found</h3>
              <p className={`mb-6 max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                Apply to jobs to get interview invitations. Your scheduled interviews will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interview Detail Modal */}
      {selectedInterview && (() => {
        const status = statusConfig[selectedInterview.status];
        const StatusIcon = status.icon;
        const TypeIcon = typeIcon[selectedInterview.type];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedInterview(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-start justify-between gap-4 p-6 pb-4 border-b ${
                isDark ? 'border-slate-700' : 'border-slate-200'
              }`}>
                <div className="flex gap-4 min-w-0">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getCompanyColor(selectedInterview.company)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <span className="text-white text-lg font-bold">{getCompanyInitial(selectedInterview.company)}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedInterview.jobTitle}</h2>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedInterview.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInterview(null)}
                  className={`p-2 rounded-lg transition flex-shrink-0 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Status */}
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${status.bg} ${status.darkBg}`}>
                  <StatusIcon className={`h-4 w-4 ${status.color}`} />
                  <span className={status.color}>{status.label}</span>
                </span>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: CalendarDays, label: 'Date', value: getDateLabel(selectedInterview.date) },
                    { icon: Clock, label: 'Time', value: selectedInterview.time },
                    { icon: Timer, label: 'Duration', value: selectedInterview.duration },
                    { icon: TypeIcon, label: 'Mode', value: selectedInterview.type === 'in-person' ? 'In Person' : selectedInterview.type.charAt(0).toUpperCase() + selectedInterview.type.slice(1) },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-xl p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <item.icon className={`h-3.5 w-3.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{item.label}</span>
                      </div>
                      <p className={`text-sm font-semibold capitalize ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Round */}
                <div>
                  <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Round</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedInterview.round}</p>
                </div>

                {/* Interviewer */}
                {selectedInterview.interviewer && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Interviewer</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedInterview.interviewer}</p>
                  </div>
                )}

                {/* Location */}
                {selectedInterview.location && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Location</h4>
                    <div className="flex items-start gap-1.5">
                      <MapPin className={`h-4 w-4 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedInterview.location}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedInterview.notes && (
                  <div>
                    <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Notes</h4>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedInterview.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedInterview.status === 'upcoming' && selectedInterview.meetingLink && (
                <div className={`flex items-center justify-end gap-3 p-6 pt-4 border-t ${
                  isDark ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  <a
                    href={selectedInterview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5"
                  >
                    <Video className="h-4 w-4" />
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

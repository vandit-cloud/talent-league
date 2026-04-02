import { useState, useEffect } from 'react';
import {
  Video, Phone, User, Calendar, Clock, Search,
  Plus, X, Trash2, Edit3, CheckCircle2, XCircle, AlertCircle,
  Send
} from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface InterviewData {
  _id: string;
  jobTitle: string;
  company: string;
  candidateEmail: string;
  candidateName?: string;
  date: string;
  time: string;
  duration: string;
  type: 'video' | 'phone' | 'in-person';
  status: 'upcoming' | 'completed' | 'cancelled';
  round: string;
  interviewer?: string;
  location?: string;
  notes?: string;
  createdAt?: string;
}

const emptyForm = {
  jobTitle: '',
  company: '',
  candidateEmail: '',
  candidateName: '',
  date: '',
  time: '',
  duration: '45 min',
  type: 'video' as 'video' | 'phone' | 'in-person',
  round: 'Technical Round 1',
  interviewer: '',
  location: '',
  notes: '',
};

const statusConfig = {
  upcoming: { label: 'Upcoming', icon: AlertCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-400/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-400/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-400/20' },
};

const typeIcons = { video: Video, phone: Phone, 'in-person': User };

export function RecruiterInterviews() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy] = useState('Date: Nearest');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInterviews = async () => {
    try {
      const res = await axios.get(getApiUrl(`/interviews?recruiterId=${user?._id || user?.id}`));
      setInterviews(res.data);
    } catch (e) {
      console.error('Failed to fetch interviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterviews(); }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, company: user?.company || '' });
    setEditingId(null);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openEdit = (interview: InterviewData) => {
    setForm({
      jobTitle: interview.jobTitle,
      company: interview.company,
      candidateEmail: interview.candidateEmail,
      candidateName: interview.candidateName || '',
      date: interview.date,
      time: interview.time,
      duration: interview.duration,
      type: interview.type,
      round: interview.round,
      interviewer: interview.interviewer || '',
      location: interview.location || '',
      notes: interview.notes || '',
    });
    setEditingId(interview._id);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.jobTitle || !form.candidateEmail || !form.date || !form.time) {
      setError('Job title, candidate email, date, and time are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await axios.put(getApiUrl(`/interviews/${editingId}`), form);
        setSuccess('Interview updated!');
      } else {
        await axios.post(getApiUrl('/interviews'), {
          ...form,
          recruiterId: user?._id || user?.id,
        });
        setSuccess('Interview created and email sent to candidate!');
      }
      await fetchInterviews();
      setTimeout(() => { setShowModal(false); setSuccess(''); }, 1500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save interview');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this interview?')) return;
    try {
      await axios.delete(getApiUrl(`/interviews/${id}`));
      setInterviews(prev => prev.filter(i => i._id !== id));
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(getApiUrl(`/interviews/${id}`), { status });
      setInterviews(prev => prev.map(i => i._id === id ? { ...i, status: status as any } : i));
    } catch (e) {
      console.error('Status update failed:', e);
    }
  };

  const filtered = interviews
    .filter(i => {
      const matchSearch = !searchTerm || i.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || i.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) || (i.candidateName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || i.status === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'Date: Nearest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'Date: Farthest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return 0;
    });

  const upcoming = interviews.filter(i => i.status === 'upcoming').length;
  const completed = interviews.filter(i => i.status === 'completed').length;
  const cancelled = interviews.filter(i => i.status === 'cancelled').length;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const InputField = ({ label, value, onChange, type = 'text', required = false, placeholder = '' }: any) => (
    <div>
      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}{required && <span className="text-red-500"> *</span>}</label>
      <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" /></div>;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Interview Management</h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Schedule and manage candidate interviews</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />Schedule Interview
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Upcoming', count: upcoming, gradient: 'from-blue-500 to-indigo-600', icon: Calendar },
            { label: 'Completed', count: completed, gradient: 'from-emerald-500 to-teal-600', icon: CheckCircle2 },
            { label: 'Cancelled', count: cancelled, gradient: 'from-rose-500 to-pink-600', icon: XCircle },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.count}</p>
                </div>
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}><s.icon className="h-5 w-5 text-white" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className={`mb-5 rounded-xl border p-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by job, candidate name or email..."
              className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {['All', 'Upcoming', 'Completed', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-full text-sm font-medium border transition ${statusFilter === s ? 'bg-indigo-500 border-indigo-500 text-white' : isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>{s}</button>
          ))}
        </div>

        <p className={`mb-4 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Showing {filtered.length} interview{filtered.length !== 1 ? 's' : ''}</p>

        {/* Interview List */}
        <div className="space-y-4">
          {filtered.map(interview => {
            const sc = statusConfig[interview.status];
            const StatusIcon = sc.icon;
            const TypeIcon = typeIcons[interview.type];

            return (
              <div key={interview._id} className={`rounded-xl border p-5 transition-all hover:shadow-lg ${isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.bg}`}>
                        <StatusIcon className={`h-3 w-3 ${sc.color}`} /><span className={sc.color}>{sc.label}</span>
                      </span>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(interview.date)} at {interview.time}</span>
                    </div>

                    <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{interview.jobTitle}</h3>

                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{interview.candidateName || interview.candidateEmail}</span>
                      <span className="flex items-center gap-1.5"><TypeIcon className="h-3.5 w-3.5" /><span className="capitalize">{interview.type}</span></span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{interview.duration}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{interview.round}</span>
                    </div>

                    {interview.interviewer && <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Interviewer: {interview.interviewer}</p>}
                    {interview.notes && <p className={`text-xs mt-1 line-clamp-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{interview.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {interview.status === 'upcoming' && (
                      <>
                        <button onClick={() => updateStatus(interview._id, 'completed')} title="Mark completed" className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"><CheckCircle2 className="h-4 w-4" /></button>
                        <button onClick={() => updateStatus(interview._id, 'cancelled')} title="Cancel" className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition"><XCircle className="h-4 w-4" /></button>
                      </>
                    )}
                    <button onClick={() => openEdit(interview)} title="Edit" className={`p-2 rounded-lg transition ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(interview._id)} title="Delete" className="p-2 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <Calendar className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No interviews yet</h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Schedule your first interview with a candidate.</p>
              <button onClick={openCreate} className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg transition">Schedule Interview</button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-6 pb-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{editingId ? 'Edit Interview' : 'Schedule Interview'}</h2>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              {error && <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</div>}
              {success && <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{success}</div>}

              <InputField label="Job Title" value={form.jobTitle} onChange={(e: any) => setForm({ ...form, jobTitle: e.target.value })} required placeholder="e.g. Frontend Developer" />
              <InputField label="Company" value={form.company} onChange={(e: any) => setForm({ ...form, company: e.target.value })} placeholder="e.g. TechNova Solutions" />

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Candidate Email" value={form.candidateEmail} onChange={(e: any) => setForm({ ...form, candidateEmail: e.target.value })} required type="email" placeholder="candidate@email.com" />
                <InputField label="Candidate Name" value={form.candidateName} onChange={(e: any) => setForm({ ...form, candidateName: e.target.value })} placeholder="John Doe" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Date" value={form.date} onChange={(e: any) => setForm({ ...form, date: e.target.value })} required type="date" />
                <InputField label="Time" value={form.time} onChange={(e: any) => setForm({ ...form, time: e.target.value })} required type="time" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="in-person">In Person</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Duration</label>
                  <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <option>15 min</option>
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>60 min</option>
                    <option>90 min</option>
                  </select>
                </div>
              </div>

              <InputField label="Round" value={form.round} onChange={(e: any) => setForm({ ...form, round: e.target.value })} placeholder="e.g. Technical Round 1" />
              <InputField label="Interviewer Name" value={form.interviewer} onChange={(e: any) => setForm({ ...form, interviewer: e.target.value })} placeholder="e.g. Priya Sharma" />

              {(form.type as string) === 'in-person' && (
                <InputField label="Location" value={form.location} onChange={(e: any) => setForm({ ...form, location: e.target.value })} placeholder="Office address" />
              )}

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Interview preparation notes..."
                  className={`w-full px-3 py-2.5 rounded-xl text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
              </div>
            </div>

            <div className={`flex items-center justify-end gap-3 p-6 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <button onClick={() => setShowModal(false)} className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg transition disabled:opacity-50">
                {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                {editingId ? 'Update' : 'Schedule & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

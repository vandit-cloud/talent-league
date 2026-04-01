import { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  Mail, 
  Code, 
  Plus, 
  Trash2, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Brain,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function RecruiterAssessmentsAdd() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Array<{ name: string; email: string; skills: string }>>([
    { name: '', email: '', skills: '' }
  ]);
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<Array<{ type: 'success' | 'error' | 'info'; message: string }>>([]);

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Only</h1>
          <p className="mt-2 text-gray-600">Sign in as a recruiter to view this page.</p>
        </div>
      </div>
    );
  }

  const addRow = () => setRows([...rows, { name: '', email: '', skills: '' }]);
  const updateRow = (i: number, key: 'name' | 'email' | 'skills', val: string) => {
    const next = [...rows];
    next[i] = { ...next[i], [key]: val };
    setRows(next);
  };
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const sendAll = async () => {
    setSending(true);
    setLog([]);
    for (const r of rows) {
      if (!r.email || !r.name) {
        setLog(prev => [...prev, { type: 'info', message: `Skipped: ${r.name || '(no name)'} - Missing fields` }]);
        continue;
      }
      try {
        const skillsArr = r.skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => ({ name: s, proficiency: 'Intermediate', category: 'General' }));
          
        const res = await axios.post(getApiUrl('/mcq/create'), {
          candidateEmail: r.email,
          candidateName: r.name,
          skills: skillsArr,
          recruiterId: user?._id
        });
        
        if (res.data?.emailSent) {
          setLog(prev => [...prev, { type: 'success', message: `Email sent to ${r.email}` }]);
        } else if (res.data?.previewUrl) {
          setLog(prev => [...prev, { type: 'success', message: `Preview opened for ${r.email}` }]);
          try { window.open(res.data.previewUrl, '_blank'); } catch {}
        } else {
          setLog(prev => [...prev, { type: 'success', message: `Direct link copied for ${r.email}` }]);
          try { await navigator.clipboard.writeText(res.data.testLink); } catch {}
        }
      } catch (e: any) {
        setLog(prev => [...prev, { type: 'error', message: `Failed for ${r.email}: ${e.response?.data?.message || e.message}` }]);
      }
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl blob blob-delay-1"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl blob blob-delay-2"></div>
      </div>

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="fade-in-up">
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button 
                    onClick={() => navigate('/recruiter/dashboard')}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-indigo-600" />
                  </button>
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                    Assessment Lab
                  </span>
                </div>
                <h1 className="text-4xl font-bold gradient-text">Invite Candidates</h1>
                <p className="mt-2 text-gray-600 text-lg">Send AI-powered MCQ test links to multiple candidates at once.</p>
              </div>
              <div className="hidden sm:flex h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl items-center justify-center shadow-xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="glass-card rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Full Name</div>
              <div className="col-span-4">Email Address</div>
              <div className="col-span-4">Skills (AI Target)</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center group fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="col-span-3 relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500" />
                    <input
                      className="w-full pl-9 pr-3 py-2.5 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-400"
                      placeholder="e.g. John Doe"
                      value={r.name}
                      onChange={(e) => updateRow(i, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500" />
                    <input
                      className="w-full pl-9 pr-3 py-2.5 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-400"
                      type="email"
                      placeholder="john@example.com"
                      value={r.email}
                      onChange={(e) => updateRow(i, 'email', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 relative">
                    <Code className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500" />
                    <input
                      className="w-full pl-9 pr-3 py-2.5 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-gray-400"
                      placeholder="React, Node.js, Python"
                      value={r.skills}
                      onChange={(e) => updateRow(i, 'skills', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-0"
                      onClick={() => removeRow(i)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/20">
              <button 
                className="flex items-center gap-2 px-6 py-2.5 bg-white/80 hover:bg-white text-indigo-600 font-semibold rounded-xl border border-indigo-100 transition-all shadow-sm" 
                onClick={addRow}
              >
                <Plus className="h-4 w-4" />
                Add Candidate
              </button>
              
              <button
                className="group relative flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
                onClick={sendAll}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Send Invites
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        {log.length > 0 && (
          <div className="glass-card rounded-2xl p-6 shadow-xl fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-gray-900">Activity Report</h2>
            </div>
            <div className="space-y-2">
              {log.map((l, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    l.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    l.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                    'bg-blue-50 border-blue-100 text-blue-700'
                  }`}
                >
                  {l.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                   l.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                   <Plus className="h-4 w-4" />}
                  <span className="text-sm font-medium">{l.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

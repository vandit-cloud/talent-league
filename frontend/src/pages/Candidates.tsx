import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Briefcase, Code, Send, Copy, CheckCircle, Sparkles, Users, Target, Zap } from 'lucide-react';

export function Candidates() {
  const { user } = useAuth();
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [skillsCsv, setSkillsCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const parseSkills = () => {
    return skillsCsv
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => ({ name: s, proficiency: 'Intermediate', category: 'General' }));
  };

  const handleSendTest = async () => {
    if (!candidateEmail || !candidateName) {
      alert('Enter candidate name and email');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/mcq/create', {
        candidateEmail,
        candidateName,
        skills: parseSkills(),
        recruiterId: user?._id
      });
      if (res.data?.success) {
        setLastLink(res.data.testLink);
        if (res.data.emailSent) {
          alert(`Sent MCQ link to ${candidateEmail}`);
        } else if (res.data.previewUrl) {
          window.open(res.data.previewUrl, '_blank');
          alert('Email preview opened in a new tab.');
        } else {
          try { await navigator.clipboard.writeText(res.data.testLink); } catch {}
          alert('Email could not be sent. Direct link copied to clipboard.');
        }
      } else {
        alert('Failed to create test');
      }
    } catch (e: any) {
      alert('Failed to send test link: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (lastLink) {
      try {
        await navigator.clipboard.writeText(lastLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        alert('Failed to copy link');
      }
    }
  };

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Only</h1>
          <p className="mt-2 text-gray-600">Sign in as a recruiter to add candidates.</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Zap, title: 'Quick Setup', desc: 'Send tests in seconds' },
    { icon: Target, title: 'AI-Powered', desc: 'Smart assessment' },
    { icon: Users, title: 'Track Progress', desc: 'Real-time monitoring' },
    { icon: Briefcase, title: 'Professional', desc: 'Enterprise ready' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl blob blob-delay-1"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl blob blob-delay-2"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl blob blob-delay-3"></div>
      </div>

      <div className="relative max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-8 fade-in-up">
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                    Candidate Management
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Pro Member
                  </span>
                </div>
                <h1 className="text-4xl font-bold gradient-text">Add Candidate</h1>
                <p className="mt-2 text-gray-600 text-lg">Send AI-powered assessment tests to candidates</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-40"></div>
                  <div className="relative h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="relative flex flex-wrap gap-3 mt-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-xl border border-white/50 shadow-sm">
                    <Icon className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">{feature.title}</span>
                    <span className="text-xs text-gray-400">• {feature.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="px-4 sm:px-0">
          <div className="glass-card rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Enter candidate's full name"
                    className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4 text-indigo-500" />
                    Skills (comma separated)
                  </label>
                  <textarea
                    value={skillsCsv}
                    onChange={(e) => setSkillsCsv(e.target.value)}
                    placeholder="JavaScript, React, Node.js, Python, etc."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple skills with commas</p>
                </div>
              </div>

              {/* Right Column - Info */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    What happens next?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-indigo-600">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Test Link Generated</p>
                        <p className="text-xs text-gray-600">Unique assessment URL created</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-indigo-600">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Sent</p>
                        <p className="text-xs text-gray-600">Candidate receives test invitation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-indigo-600">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">AI Assessment</p>
                        <p className="text-xs text-gray-600">Proctored evaluation begins</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-indigo-600">4</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Results Ready</p>
                        <p className="text-xs text-gray-600">Detailed report generated</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    Assessment Features
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                      AI-powered question generation
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                      Real-time proctoring
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                      Instant results & analytics
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                      Skill-based evaluation
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSendTest}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending Test...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Assessment Link
                  </>
                )}
              </button>

              {lastLink && (
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="px-6 py-4 bg-white/60 text-gray-700 font-medium rounded-xl border border-white/50 hover:bg-white/80 transition-all duration-200 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Link
                      </>
                    )}
                  </button>
                  
                  <a
                    href={lastLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Target className="w-5 h-5" />
                    Preview Test
                  </a>
                </div>
              )}
            </div>

            {/* Success Message */}
            {lastLink && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Assessment link generated successfully!</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Link: {lastLink.slice(0, 50)}...{lastLink.slice(-10)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

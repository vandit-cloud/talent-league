import { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Calendar, Clock, Award, Filter, Search, RefreshCw, Eye, FileText, BarChart3, Sparkles, ChevronRight } from 'lucide-react';

interface TestRow {
  _id: string;
  testToken: string;
  candidateName: string;
  candidateEmail: string;
  testLink: string;
  status: string;
  totalQuestions?: number;
  duration?: number;
  score?: number;
  createdAt?: string;
  sentAt?: string;
  completedAt?: string;
}

export function RecruiterCandidateDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [emailFilter, setEmailFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TestRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { recruiterId: user?._id };
      if (emailFilter) Object.assign(params, { email: emailFilter });
      const res = await axios.get(getApiUrl('/mcq/all'), { params });
      setRows(res.data?.tests || []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Only</h1>
          <p className="mt-2 text-gray-600">Sign in as a recruiter to view this page.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <Award className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'expired': return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl blob blob-delay-1"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl blob blob-delay-2"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl blob blob-delay-3"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
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
                <h1 className="text-4xl font-bold gradient-text">Candidates Details</h1>
                <p className="mt-2 text-gray-600 text-lg">View tests created and their current status</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-40"></div>
                  <div className="relative h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Filter by candidate email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Filter className="w-4 h-4" />
                      Search
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setEmailFilter('')}
                  className="px-6 py-3 bg-white/60 text-gray-700 font-medium rounded-xl border border-white/50 hover:bg-white/80 transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{rows.filter(r => r.status === 'completed').length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{rows.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rows.filter(r => r.score).length > 0 
                      ? Math.round(rows.filter(r => r.score).reduce((acc, r) => acc + (r.score || 0), 0) / rows.filter(r => r.score).length)
                      : '--'
                    }
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-4 sm:px-0">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/60 border-b border-white/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {rows.map((row) => (
                    <tr key={row._id} className="hover:bg-white/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {row.candidateName?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{row.candidateName}</div>
                            <div className="text-xs text-gray-500">ID: {row._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {row.candidateEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(row.status)}`}>
                          {getStatusIcon(row.status)}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {row.score !== undefined && row.score !== null ? (
                            <div className="flex items-center">
                              <span className="font-medium">{row.score}%</span>
                              {row.score >= 80 && <span className="ml-2 text-emerald-600">⭐</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.duration ? `${row.duration}m` : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {row.status === 'completed' && row.testToken ? (
                            <button
                              onClick={() => navigate(`/recruiter/candidate-results/${row.testToken}`)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                            >
                              <Eye className="w-4 h-4" />
                              View Result
                            </button>
                          ) : null}
                          <a
                            href={row.testLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                          >
                            <FileText className="w-4 h-4" />
                            Open Test
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-lg opacity-30"></div>
                          <div className="relative h-20 w-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                            <Users className="h-10 w-10 text-indigo-400" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">Start by adding candidates and sending them assessment links</p>
                        <button
                          onClick={() => navigate('/recruiter/add-candidate')}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5 inline-flex items-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Add First Candidate
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

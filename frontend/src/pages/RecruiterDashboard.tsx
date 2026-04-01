import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';
import { Users, ClipboardList, Briefcase, ChartBar, Sparkles, Target, Zap, ChevronRight } from 'lucide-react';

export function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const quickActions = [
    {
      title: 'Add Candidate',
      description: 'Send MCQ test link via email',
      icon: Users,
      action: () => navigate('/recruiter/add-candidate'),
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/30'
    },
    {
      title: 'Create Assessment',
      description: 'Design and manage assessments',
      icon: ClipboardList,
      action: () => navigate('/recruiter/assessments/add'),
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/30'
    },
    {
      title: 'View Candidates',
      description: 'Track test progress and results',
      icon: ChartBar,
      action: () => navigate('/recruiter/candidates'),
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/30'
    },
    {
      title: 'Job Management',
      description: 'Manage job postings and matches',
      icon: Briefcase,
      action: () => navigate('/recruiter/jobs'),
      gradient: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-500/30'
    }
  ];

  const features = [
    { icon: Zap, title: 'AI-Powered', desc: 'Smart evaluation' },
    { icon: Target, title: 'Precision', desc: 'Accurate assessment' },
    { icon: Briefcase, title: 'Efficient', desc: 'Quick hiring' },
    { icon: Sparkles, title: 'Pro Tools', desc: 'Advanced features' }
  ];

  const [liveStats, setLiveStats] = useState({
    totalCandidates: '0',
    activeTests: '0',
    completedTests: '0',
    avgScore: '--',
    totalJobs: '0',
    activeJobs: '0',
    totalTemplates: '0'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(getApiUrl(`/mcq/stats?recruiterId=${user?._id}`));
        if (res.data) {
          setLiveStats({
            totalCandidates: String(res.data.totalCandidates || '0'),
            activeTests: String(res.data.activeTests || '0'),
            completedTests: String(res.data.completedTests || '0'),
            avgScore: String(res.data.avgScore || '--'),
            totalJobs: String(res.data.totalJobs || '0'),
            activeJobs: String(res.data.activeJobs || '0'),
            totalTemplates: String(res.data.totalTemplates || '0')
          });
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
    };
    if (user?._id) fetchStats();
  }, [user?._id]);

  const stats = [
    { label: 'Total Candidates', value: liveStats.totalCandidates, icon: Users, gradient: 'from-violet-500 to-purple-600', trend: '+12%' },
    { label: 'Active Jobs', value: liveStats.activeJobs, icon: Briefcase, gradient: 'from-blue-500 to-indigo-600', trend: 'Live' },
    { label: 'Templates', value: liveStats.totalTemplates, icon: ClipboardList, gradient: 'from-emerald-500 to-teal-600', trend: 'Saved' },
    { label: 'Avg Success', value: liveStats.avgScore, icon: Target, gradient: 'from-orange-500 to-pink-600', trend: 'N/A' }
  ];

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
                    Recruiter Portal
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Pro Member
                  </span>
                </div>
                <h1 className="text-4xl font-bold gradient-text">Recruiter Dashboard</h1>
                <p className="mt-2 text-gray-600 text-lg">AI-powered talent acquisition platform</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-40"></div>
                  <div className="relative h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Briefcase className="h-8 w-8 text-white" />
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

        {/* Stats */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative glass-card rounded-2xl p-6 card-hover overflow-hidden">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-bl-full`}></div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <button className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group relative text-left"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300`}></div>
                  <div className="relative glass-card rounded-2xl p-6 h-full card-hover overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.gradient} opacity-10 rounded-bl-full transition-transform group-hover:scale-110`}></div>
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg ${action.shadow} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{action.description}</p>
                    <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
                      Get Started
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="glass-card rounded-2xl p-8">
            <div className="text-center py-12">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-lg opacity-30"></div>
                <div className="relative h-20 w-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Start by adding candidates or creating assessments to begin your hiring process</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => navigate('/recruiter/candidates')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  View Candidates
                </button>
                <button
                  onClick={() => navigate('/recruiter/assessments/add')}
                  className="px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
                >
                  Create Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

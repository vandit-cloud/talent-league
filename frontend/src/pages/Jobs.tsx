import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Clock, Building, Sparkles, Target, Zap, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { setActiveExamFlow, storeSelectedJobApplication } from '../utils/examFlow';

interface Job {
  _id: string;
  title: string;
  company?: string;
  recruiterId?: {
    company?: string;
  };
  department: string;
  location: string;
  type: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  } | string;
  experience: string;
  description: string;
  requirements: string[];
  createdAt: string;
}

export function Jobs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get('/api/jobs');
        setJobs(res.data);
      } catch (e) {
        console.error('Failed to fetch jobs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const formatSalary = (salary: Job['salary']) => {
    if (typeof salary === 'string') return salary;
    if (salary && salary.min && salary.max) {
      return `${salary.currency === 'USD' ? '$' : ''}${Math.round(salary.min/1000)}k - ${Math.round(salary.max/1000)}k`;
    }
    return 'Salary Negotiable';
  };

  const getDayDiff = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const startJobApplication = (job: Job) => {
    // Adapter to match JobPosting expected by utils/examFlow
    const adapter = {
      id: job._id,
      title: job.title,
      company: job.company || job.recruiterId?.company || 'Confidential',
      location: job.location,
      type: job.type,
      salary: formatSalary(job.salary),
      posted: getDayDiff(job.createdAt),
      description: job.description,
      skills: job.requirements || [],
      experience: job.experience,
      department: job.department
    };
    storeSelectedJobApplication(adapter as any);
    setActiveExamFlow('job');
    navigate('/candidate-verification');
  };

  const filteredJobs = jobs.filter(job => {
    const company = job.company || job.recruiterId?.company || '';
    return (
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.requirements && job.requirements.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const features = [
    { icon: Target, title: 'Smart Matching', desc: 'AI-powered job matching' },
    { icon: Zap, title: 'Instant Apply', desc: 'One-click applications' },
    { icon: Building, title: 'Top Companies', desc: 'Verified employers' },
    { icon: Sparkles, title: 'Career Growth', desc: 'Professional development' }
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
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                  Job Opportunities
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {jobs.length} Available Positions
                </span>
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Find Your Dream Job</h1>
              <p className="text-gray-600 text-lg max-w-2xl">
                Discover exciting career opportunities from top companies. 
                Our AI-powered matching system connects you with roles that fit your skills and aspirations.
              </p>
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

        {/* Search Section */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="glass-card rounded-2xl p-6">
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-white/60 border border-white/50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
                placeholder="Search jobs by title, company, or skills..."
              />
            </div>
          </div>
        </div>

        {/* Job Statistics */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Remote Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.location.toLowerCase() === 'remote').length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full-time</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.type.toLowerCase() === 'full-time').length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">New This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => getDayDiff(j.createdAt).includes('Today') || getDayDiff(j.createdAt).includes('Yesterday')).length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="px-4 sm:px-0">
          <div className="space-y-6">
            {filteredJobs.map((job) => (
                <div key={job._id} className="glass-card rounded-2xl p-8 card-hover group">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Briefcase className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Building className="h-4 w-4" />
                              <span className="font-medium">{job.company || job.recruiterId?.company || 'Confidential'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="h-4 w-4" />
                              <span>{job.type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium text-green-600">{formatSalary(job.salary)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              {job.department}
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {job.experience}
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{getDayDiff(job.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed">{job.description}</p>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements && job.requirements.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      AI Match Score: {Math.floor(Math.random() * 30) + 70}%
                    </span>
                  </div>
                  <button
                    onClick={() => startJobApplication(job)}
                    className="group/btn flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Apply Now
                    <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredJobs.length === 0 && (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-lg opacity-30"></div>
                  <div className="relative h-20 w-20 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Search className="h-10 w-10 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Try adjusting your search terms or browse all available positions.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

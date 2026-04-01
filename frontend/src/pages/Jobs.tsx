import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Briefcase, DollarSign, Clock, Building, ChevronRight, ChevronLeft,
  ChevronDown, Filter, Heart, Share2, Monitor, Code, BarChart3, PenTool,
  Megaphone, Calculator, Cpu, Palette, Database, Globe, ArrowUpDown,
  X, Users
} from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';
import { setActiveExamFlow, storeSelectedJobApplication } from '../utils/examFlow';
import { useTheme } from '../context/ThemeContext';

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
  applicants?: number;
}

const categories = [
  { label: 'All Jobs', icon: Briefcase, value: '' },
  { label: 'Frontend Developer', icon: Monitor, value: 'frontend' },
  { label: 'Backend Developer', icon: Code, value: 'backend' },
  { label: 'Data Science', icon: BarChart3, value: 'data science' },
  { label: 'Content Writing', icon: PenTool, value: 'content' },
  { label: 'Digital Marketing', icon: Megaphone, value: 'marketing' },
  { label: 'Accounting', icon: Calculator, value: 'accounting' },
  { label: 'Engineering', icon: Cpu, value: 'engineering' },
  { label: 'Design', icon: Palette, value: 'design' },
  { label: 'Database', icon: Database, value: 'database' },
  { label: 'Full Stack', icon: Globe, value: 'full stack' },
];

const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];
const locations = ['All', 'Remote', 'On-site', 'Hybrid'];
const experienceLevels = ['All', 'Entry', 'Mid', 'Senior', 'Lead'];
const sortOptions = ['Newest', 'Oldest', 'Salary: High to Low', 'Salary: Low to High'];

export function Jobs() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterExperience, setFilterExperience] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(getApiUrl('/jobs'));
        setJobs(res.data);
      } catch (e) {
        console.error('Failed to fetch jobs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const formatSalary = (salary: Job['salary']) => {
    if (typeof salary === 'string') return salary;
    if (salary && salary.min && salary.max) {
      const symbol = salary.currency === 'INR' ? '\u20B9' : salary.currency === 'USD' ? '$' : '';
      if (salary.min >= 100000) {
        return `${symbol}${(salary.min / 100000).toFixed(1)} L - ${(salary.max / 100000).toFixed(1)} LPA`;
      }
      return `${symbol}${Math.round(salary.min / 1000)}k - ${Math.round(salary.max / 1000)}k`;
    }
    return 'Negotiable';
  };

  const getDayDiff = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getCompanyName = (job: Job) => job.company || job.recruiterId?.company || 'Confidential';

  const getCompanyInitial = (job: Job) => {
    const name = getCompanyName(job);
    return name.charAt(0).toUpperCase();
  };

  const getCompanyColor = (job: Job) => {
    const name = getCompanyName(job);
    const colors = [
      'from-blue-500 to-blue-700',
      'from-indigo-500 to-indigo-700',
      'from-purple-500 to-purple-700',
      'from-emerald-500 to-emerald-700',
      'from-orange-500 to-orange-700',
      'from-rose-500 to-rose-700',
      'from-cyan-500 to-cyan-700',
      'from-teal-500 to-teal-700',
    ];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const experienceLabel = (exp: string) => {
    const map: Record<string, string> = {
      entry: 'No prior experience required',
      mid: '1-3 years experience',
      senior: '3-5 years experience',
      lead: '5+ years experience',
    };
    return map[exp] || exp;
  };

  const startJobApplication = (job: Job) => {
    const adapter = {
      id: job._id,
      title: job.title,
      company: getCompanyName(job),
      location: job.location,
      type: job.type,
      salary: formatSalary(job.salary),
      posted: getDayDiff(job.createdAt),
      description: job.description,
      skills: job.requirements || [],
      experience: job.experience,
      department: job.department,
    };
    storeSelectedJobApplication(adapter as any);
    setActiveExamFlow('job');
    navigate('/job-resume-upload');
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const activeFilterCount = [filterType, filterLocation, filterExperience].filter(f => f !== 'All').length + (selectedCategory ? 1 : 0) + (searchTerm ? 1 : 0);

  const clearAllFilters = () => {
    setFilterType('All');
    setFilterLocation('All');
    setFilterExperience('All');
    setSelectedCategory('');
    setSearchTerm('');
    setSortBy('Newest');
  };

  const filteredJobs = jobs
    .filter(job => {
      const company = getCompanyName(job);
      const matchesSearch = !searchTerm || (
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.requirements && job.requirements.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
      );
      const matchesCategory = !selectedCategory || (
        job.department.toLowerCase().includes(selectedCategory) ||
        job.title.toLowerCase().includes(selectedCategory) ||
        (job.requirements && job.requirements.some(s => s.toLowerCase().includes(selectedCategory)))
      );
      const matchesType = filterType === 'All' || job.type.toLowerCase() === filterType.toLowerCase();
      const matchesLocation = filterLocation === 'All' || job.location.toLowerCase().includes(filterLocation.toLowerCase());
      const matchesExperience = filterExperience === 'All' || job.experience.toLowerCase() === filterExperience.toLowerCase();
      return matchesSearch && matchesCategory && matchesType && matchesLocation && matchesExperience;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'Oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      const salaryA = typeof a.salary === 'object' ? a.salary.max : 0;
      const salaryB = typeof b.salary === 'object' ? b.salary.max : 0;
      if (sortBy === 'Salary: High to Low') return salaryB - salaryA;
      if (sortBy === 'Salary: Low to High') return salaryA - salaryB;
      return 0;
    });

  const scrollCategories = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const FilterDropdown = ({ label, options, value, onChange, id }: {
    label: string; options: string[]; value: string; onChange: (v: string) => void; id: string;
  }) => (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === id ? null : id); }}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
          value !== 'All'
            ? isDark ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300' : 'bg-indigo-50 border-indigo-300 text-indigo-700'
            : isDark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
        }`}
      >
        <ChevronDown className="h-3.5 w-3.5" />
        {label}{value !== 'All' ? `: ${value}` : ''}
      </button>
      {openDropdown === id && (
        <div className={`absolute top-full left-0 mt-2 py-1 rounded-xl shadow-xl border z-50 min-w-[160px] ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          {options.map(opt => (
            <button
              key={opt}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setOpenDropdown(null); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === opt
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
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark
      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
      : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {jobs.length}+ Jobs Available
          </h1>
          <p className={`mt-1 text-base ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            Search & apply for jobs, work from home and entry-level job vacancies.
          </p>
        </div>

        {/* Category Icons - Scrollable */}
        <div className="relative mb-6">
          <button
            onClick={() => scrollCategories('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-lg border transition ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide px-10 py-2" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(active ? '' : cat.value)}
                  className={`flex flex-col items-center gap-2 w-[100px] flex-shrink-0 px-3 py-3 rounded-2xl border transition-all ${
                    active
                      ? isDark ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300' : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : isDark ? 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    active
                      ? 'bg-indigo-500 text-white'
                      : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight w-[80px] break-words">{cat.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollCategories('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-lg border transition ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className={`mb-5 rounded-xl border p-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              } border`}
              placeholder="Search by job title, company, or skills..."
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={clearAllFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              activeFilterCount > 0
                ? 'bg-indigo-500 border-indigo-500 text-white'
                : isDark ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-white text-indigo-600 text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <FilterDropdown id="type" label="Type" options={jobTypes} value={filterType} onChange={setFilterType} />
          <FilterDropdown id="location" label="Location" options={locations} value={filterLocation} onChange={setFilterLocation} />
          <FilterDropdown id="experience" label="Experience" options={experienceLevels} value={filterExperience} onChange={setFilterExperience} />

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'sort' ? null : 'sort'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                isDark ? 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort By
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

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition ${
                isDark ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className={`mb-4 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const companyName = getCompanyName(job);
            const isSaved = savedJobs.has(job._id);
            const salaryText = formatSalary(job.salary);

            return (
              <div
                key={job._id}
                className={`group rounded-xl border p-5 sm:p-6 transition-all hover:shadow-lg ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex gap-4">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3
                      className={`text-lg font-bold cursor-pointer transition-colors mb-1 ${
                        isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                      }`}
                      onClick={() => setSelectedJob(job)}
                    >
                      {job.title}
                    </h3>

                    {/* Company */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`font-medium text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {companyName}
                      </span>
                    </div>

                    {/* Info Row: Experience | Type | Location */}
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>{experienceLabel(job.experience)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="capitalize">{job.type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {job.requirements.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className={`text-xs font-medium px-2.5 py-1 rounded ${
                              isDark ? 'text-slate-200 bg-slate-700/60' : 'text-slate-700 bg-slate-100'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requirements.length > 4 && (
                          <span className={`text-xs font-medium px-2 py-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                            +{job.requirements.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Department tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        isDark ? 'border-slate-600 text-slate-300 bg-slate-700/40' : 'border-slate-200 text-slate-600 bg-slate-50'
                      }`}>
                        {job.department}
                      </span>
                      {job.applicants !== undefined && job.applicants > 0 && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Users className="h-3 w-3" />
                          {job.applicants} applicant{job.applicants !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Footer: Posted date | Salary | Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed"
                      style={{ borderColor: isDark ? 'rgba(100,116,139,0.3)' : 'rgba(0,0,0,0.08)' }}>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          Posted {formatDate(job.createdAt)}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {getDayDiff(job.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {salaryText !== 'Negotiable' && (
                          <span className={`flex items-center gap-1 text-sm font-semibold ${
                            isDark ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            <DollarSign className="h-3.5 w-3.5" />
                            {salaryText}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          className={`p-1.5 rounded-lg transition ${isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSaveJob(job._id); }}
                          className={`p-1.5 rounded-lg transition ${
                            isSaved
                              ? 'text-rose-500 hover:bg-rose-500/10'
                              : isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title={isSaved ? 'Unsave' : 'Save'}
                        >
                          <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => startJobApplication(job)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                        >
                          Apply Now
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Company Logo */}
                  <div className="hidden sm:flex flex-col items-center gap-2 ml-2">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${getCompanyColor(job)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <span className="text-white text-xl font-bold">{getCompanyInitial(job)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <Search className={`h-8 w-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No jobs found</h3>
              <p className={`mb-6 max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                Try adjusting your search or filters to find more results.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedJob(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
              isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`sticky top-0 z-10 flex items-start justify-between gap-4 p-6 pb-4 border-b ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="flex gap-4 min-w-0">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${getCompanyColor(selectedJob)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <span className="text-white text-xl font-bold">{getCompanyInitial(selectedJob)}</span>
                </div>
                <div className="min-w-0">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedJob.title}</h2>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{getCompanyName(selectedJob)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className={`p-2 rounded-lg transition flex-shrink-0 ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Key Info */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                {[
                  { icon: Briefcase, label: 'Experience', value: experienceLabel(selectedJob.experience) },
                  { icon: Clock, label: 'Type', value: selectedJob.type },
                  { icon: MapPin, label: 'Location', value: selectedJob.location },
                  { icon: DollarSign, label: 'Salary', value: formatSalary(selectedJob.salary) },
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

              {/* Department & Applicants */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  isDark ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                }`}>{selectedJob.department}</span>
                {selectedJob.applicants !== undefined && selectedJob.applicants > 0 && (
                  <span className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Users className="h-3 w-3" />
                    {selectedJob.applicants} applicants
                  </span>
                )}
                <span className={`text-xs px-3 py-1.5 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>Posted {formatDate(selectedJob.createdAt)}</span>
              </div>

              {/* Description */}
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Job Description</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{selectedJob.description}</p>
              </div>

              {/* Requirements */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.requirements.map((skill, idx) => (
                      <span key={idx} className={`text-sm px-3 py-1.5 rounded-lg border ${
                        isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary Details */}
              {typeof selectedJob.salary === 'object' && selectedJob.salary.min && selectedJob.salary.max && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <div className="flex items-center gap-2">
                    <DollarSign className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {formatSalary(selectedJob.salary)}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/70'}`}>Annual compensation package</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`sticky bottom-0 flex items-center justify-between gap-3 p-6 pt-4 border-t ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { toggleSaveJob(selectedJob._id); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                    savedJobs.has(selectedJob._id)
                      ? 'border-rose-300 text-rose-500 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
                      : isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${savedJobs.has(selectedJob._id) ? 'fill-current' : ''}`} />
                  {savedJobs.has(selectedJob._id) ? 'Saved' : 'Save'}
                </button>
              </div>
              <button
                onClick={() => { setSelectedJob(null); startJobApplication(selectedJob); }}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all hover:-translate-y-0.5"
              >
                Apply Now
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

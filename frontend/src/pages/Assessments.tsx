import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentJobs, type AssessmentJob } from '../data/assessmentCatalog';
import {
  ASSESSMENT_START_REQUESTED_STORAGE_KEY,
  SELECTED_ASSESSMENT_STORAGE_KEY
} from '../utils/assessmentMatching';
import { 
  ClipboardList, 
  Clock, 
  Award, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Timer,
  TrendingUp,
  Camera,
  Shield,
  Upload
} from 'lucide-react';

export function Assessments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is verified for proctoring
  const isVerified = localStorage.getItem('candidateVerified') === 'true';

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Hard': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleStartAssessment = (job: AssessmentJob) => {
    localStorage.setItem(SELECTED_ASSESSMENT_STORAGE_KEY, job.id);
    localStorage.setItem(ASSESSMENT_START_REQUESTED_STORAGE_KEY, 'true');
    navigate('/assessment-resume-upload');
  };

  return (
    <div className="app-shell min-h-screen">
      {/* Background Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl blob blob-delay-1"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl blob blob-delay-2"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl blob blob-delay-3"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Verification Status Banner */}
        {!isVerified && (
          <div className="px-4 sm:px-0 mb-6 fade-in-up">
            <div className="app-surface rounded-2xl border border-white/10 border-l-4 border-l-indigo-500 p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="app-title text-lg font-semibold">Camera Verification Required</h3>
                  <p className="app-muted text-sm leading-6">
                    Before starting any assessment, you need to complete identity verification using your camera. 
                    This ensures exam integrity and is required only once.
                  </p>
                </div>
                <div className="app-panel hidden items-center gap-2 rounded-xl px-4 py-2 sm:flex">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <span className="app-title text-sm font-medium">AI-Proctored</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-4 sm:px-0 mb-8 fade-in-up">
          <div className="app-surface relative overflow-hidden rounded-3xl border border-white/10 p-8 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/8 to-purple-500/8"></div>
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-400/12 to-purple-400/12 blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                  Available Now
                </span>
                <span className="app-muted flex items-center gap-1 text-xs">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {assessmentJobs.length} Assessments
                </span>
              </div>
              <h1 className="mb-3 text-4xl font-bold gradient-text">Available Assessments</h1>
              <p className="max-w-3xl text-lg leading-9 app-muted">
                {user ? `Welcome back, ${user.name}! ` : ''}Choose from our curated technical assessments designed to evaluate your skills.
                Each assessment is AI-proctored and tailored to specific job roles.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="app-surface fade-in-up flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 p-6" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="app-muted text-sm">Completed</p>
                <p className="app-title text-xl font-bold">0</p>
              </div>
            </div>
            <div className="app-divider hidden h-8 w-px sm:block"></div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="app-muted text-sm">In Progress</p>
                <p className="app-title text-xl font-bold">0</p>
              </div>
            </div>
            <div className="app-divider hidden h-8 w-px sm:block"></div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="app-muted text-sm">Avg. Score</p>
                <p className="app-title text-xl font-bold">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Cards Grid */}
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
            {assessmentJobs.map((job) => {
              const Icon = job.icon;
              return (
                <div 
                  key={job.id}
                  className="group relative"
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${job.color} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  
                  {/* Card */}
                  <div className="app-surface relative overflow-hidden rounded-2xl border border-white/10 p-6 card-hover shadow-lg">
                    {/* Background Gradient */}
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${job.color} opacity-10 rounded-bl-full transition-transform group-hover:scale-110`}></div>
                    
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${job.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h3 className="app-title text-lg font-bold transition-colors group-hover:text-indigo-500">
                              {job.title}
                            </h3>
                            <p className="app-muted text-sm">{job.company}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(job.difficulty)}`}>
                          {job.difficulty}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="app-muted mb-4 line-clamp-2 text-sm leading-6">
                        {job.description}
                      </p>

                      {/* Meta Info */}
                      <div className="app-muted mb-4 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className="h-4 w-4" />
                          <span>{job.questions} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{job.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="h-4 w-4" />
                          <span>{job.type}</span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {job.skills.map((skill, idx) => (
                          <span 
                            key={idx}
                            className="app-panel rounded-lg border px-2.5 py-1 text-xs font-medium app-title"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Start Button */}
                      <button
                        onClick={() => handleStartAssessment(job)}
                        className={`w-full group/btn relative flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-semibold bg-gradient-to-r ${job.color} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 btn-shine`}
                      >
                        {isVerified ? (
                          <>
                            Start Assessment
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" />
                            Verify & Start
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="px-4 sm:px-0 mt-8">
          <div className="app-surface rounded-2xl border border-white/10 p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <h3 className="app-title text-lg font-semibold">Pro Tip</h3>
            </div>
            <p className="app-muted mx-auto max-w-2xl">
              Complete assessments to unlock your ability score and get matched with top companies. 
              All assessments are AI-proctored for integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

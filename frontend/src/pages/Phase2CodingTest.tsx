import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  FileCode2,
  FolderKanban,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { Phase2ProctorWidget } from '../components/Phase2ProctorWidget';
import { getAssessmentById } from '../data/assessmentCatalog';
import { SELECTED_ASSESSMENT_STORAGE_KEY } from '../utils/assessmentMatching';
import { getActiveExamFlow, getStoredJobApplication } from '../utils/examFlow';

interface ParsedSkill {
  name: string;
  proficiency: string;
  category: string;
  confidence?: number;
}

interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
  complexity?: string;
  impact?: string;
}

interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface ParsedResumeData {
  name: string;
  email: string;
  summary?: string;
  skills: ParsedSkill[];
  projects: ParsedProject[];
  experiences: ParsedExperience[];
}

interface AssessmentContext {
  id?: string | null;
  title?: string | null;
  skills: string[];
}

interface Phase2Question {
  id: string;
  type: 'syntax' | 'logic' | 'coding';
  title: string;
  question: string;
  skill: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  starterCode: string;
  evaluationPoints: string[];
  expectedApproach: string;
}

const getBackendBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) return configured.replace(/\/api\/?$/, '');
  return window.location.origin.replace(/:5173$/, ':5000');
};

const normalizeResumeData = (rawData: Partial<ParsedResumeData> | null | undefined): ParsedResumeData | null => {
  if (!rawData) {
    return null;
  }

  return {
    name: rawData.name || 'Candidate',
    email: rawData.email || '',
    summary: rawData.summary || '',
    skills: Array.isArray(rawData.skills) ? rawData.skills : [],
    projects: Array.isArray(rawData.projects) ? rawData.projects : [],
    experiences: Array.isArray(rawData.experiences) ? rawData.experiences : [],
  };
};

const getTypeStyles = (type: Phase2Question['type']) => {
  switch (type) {
    case 'syntax':
      return 'bg-blue-100 text-blue-700';
    case 'logic':
      return 'bg-amber-100 text-amber-700';
    case 'coding':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export function Phase2CodingTest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [resumeData, setResumeData] = useState<ParsedResumeData | null>(null);
  const [questions, setQuestions] = useState<Phase2Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [remoteAssessmentContext, setRemoteAssessmentContext] = useState<AssessmentContext | null>(null);
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tokenFromQuery = queryParams.get('token');
  const backendFromQuery = queryParams.get('backend');
  const storedPhase1Result = useMemo(() => {
    const raw = localStorage.getItem('phase1McqResult');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);
  const effectiveToken = tokenFromQuery || storedPhase1Result?.token || '';
  const effectiveBackendBaseUrl = backendFromQuery || getBackendBaseUrl();
  const activeFlow = getActiveExamFlow();
  const selectedJob = useMemo(() => getStoredJobApplication(), []);
  const selectedAssessmentId = localStorage.getItem(SELECTED_ASSESSMENT_STORAGE_KEY);
  const selectedAssessment = getAssessmentById(selectedAssessmentId);
  const localQuestionContext = useMemo<AssessmentContext | null>(() => {
    if (activeFlow === 'job' && selectedJob) {
      return {
        id: `job-${selectedJob.id}`,
        title: selectedJob.title,
        skills: selectedJob.skills,
      };
    }

    if (activeFlow === 'assessment' && selectedAssessment) {
      return {
        id: selectedAssessment.id,
        title: selectedAssessment.title,
        skills: selectedAssessment.skills,
      };
    }

    if (activeFlow === 'resume') {
      return null;
    }

    if (selectedAssessment) {
      return {
        id: selectedAssessment.id,
        title: selectedAssessment.title,
        skills: selectedAssessment.skills,
      };
    }

    if (selectedJob) {
      return {
        id: `job-${selectedJob.id}`,
        title: selectedJob.title,
        skills: selectedJob.skills,
      };
    }

    return null;
  }, [activeFlow, selectedAssessment, selectedJob]);
  const effectiveAssessment = useMemo<AssessmentContext | null>(() => {
    return localQuestionContext || remoteAssessmentContext;
  }, [localQuestionContext, remoteAssessmentContext]);

  useEffect(() => {
    const storedResume = localStorage.getItem('parsedResumeData');
    if (!storedResume) {
      if (!tokenFromQuery) {
        setLoading(false);
      }
      return;
    }

    try {
      const parsed = normalizeResumeData(JSON.parse(storedResume) as ParsedResumeData);
      setResumeData(parsed);
    } catch (error) {
      console.error('Failed to parse saved resume data:', error);
      if (!tokenFromQuery) {
        setLoading(false);
      }
    }
  }, [tokenFromQuery]);

  useEffect(() => {
    if (!tokenFromQuery) {
      return;
    }

    let isMounted = true;

    const loadPhase2Context = async () => {
      try {
        const backendBaseUrl = backendFromQuery || getBackendBaseUrl();
        const response = await fetch(`${backendBaseUrl}/api/mcq/phase2-context/${tokenFromQuery}`);

        if (!response.ok) {
          throw new Error('Failed to load Phase 2 context');
        }

        const data = await response.json();
        if (!isMounted) {
          return;
        }

        const normalizedRemoteResume = normalizeResumeData(data.resumeData);
        setResumeData((current) => {
          if (!normalizedRemoteResume) {
            return current;
          }

          if (!current) {
            return normalizedRemoteResume;
          }

          return {
            ...normalizedRemoteResume,
            skills: current.skills.length > 0 ? current.skills : normalizedRemoteResume.skills,
            projects: current.projects.length > 0 ? current.projects : normalizedRemoteResume.projects,
            experiences: current.experiences.length > 0 ? current.experiences : normalizedRemoteResume.experiences,
            summary: current.summary || normalizedRemoteResume.summary,
          };
        });

        if (data.assessmentContext) {
          setRemoteAssessmentContext({
            id: data.assessmentContext.id || null,
            title: data.assessmentContext.title || null,
            skills: Array.isArray(data.assessmentContext.skills) ? data.assessmentContext.skills : [],
          });
        }
      } catch (error) {
        console.error('Failed to load remote Phase 2 context:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPhase2Context();

    return () => {
      isMounted = false;
    };
  }, [backendFromQuery, tokenFromQuery]);

  useEffect(() => {
    if (!resumeData) {
      return;
    }

    let isMounted = true;

    const generateQuestions = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${getBackendBaseUrl()}/api/exams/generate-phase2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumeData,
            assessmentContext: effectiveAssessment,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate Phase 2 questions');
        }

        const data = await response.json();
        if (isMounted) {
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
        }
      } catch (error) {
        console.error('Failed to generate Phase 2 questions:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateQuestions();

    return () => {
      isMounted = false;
    };
  }, [effectiveAssessment, resumeData]);

  useEffect(() => {
    if (loading || submitted) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [loading, submitted]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => Object.values(answers).filter((answer) => answer.trim().length > 0).length,
    [answers]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    const submitPhase2 = async () => {
      setSubmitting(true);

      const payload = {
        submittedAt: new Date().toISOString(),
        answers,
        questions,
        candidateName: resumeData?.name || 'Candidate',
      };

      localStorage.setItem('phase2Submission', JSON.stringify(payload));

      try {
        if (effectiveToken) {
          const response = await fetch(`${effectiveBackendBaseUrl}/api/mcq/phase2-submit/${effectiveToken}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error('Failed to save Phase 2 result');
          }

          const data = await response.json();
          const resultResponse = await fetch(`${effectiveBackendBaseUrl}/api/mcq/assessment-result/${effectiveToken}`);
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            localStorage.setItem('assessmentDetailedResult', JSON.stringify(resultData));
          } else {
            localStorage.setItem('assessmentDetailedResult', JSON.stringify(data));
          }
        }

        setSubmitted(true);
      } catch (error) {
        console.error('Failed to submit Phase 2:', error);
        alert('Failed to save Phase 2 result. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    submitPhase2();
  };

  if (submitted) {
    return (
      <div className="exam-flow-shell p-6">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="exam-flow-card-strong w-full p-10 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="exam-flow-title text-3xl font-bold">Phase 2 Submitted</h1>
            <p className="exam-flow-muted mt-3">
              Your syntax, logic, and code-writing answers have been saved for review.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => navigate(effectiveToken ? `/exam-results?token=${encodeURIComponent(effectiveToken)}${backendFromQuery ? `&backend=${encodeURIComponent(backendFromQuery)}` : ''}` : '/exam-results')}
                className="exam-flow-primary-button"
              >
                See Result
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="exam-flow-secondary-button"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="exam-flow-shell p-6">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="exam-flow-card-strong p-10 text-center">
            <Brain className="mx-auto h-12 w-12 animate-pulse text-cyan-600 dark:text-cyan-300" />
            <h1 className="exam-flow-title mt-4 text-2xl font-bold">Generating Phase 2 Questions</h1>
            <p className="exam-flow-muted mt-2">
              We are creating syntax, logic, and code-writing questions from the candidate resume.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="exam-flow-shell p-6">
        <div className="exam-flow-card-strong mx-auto max-w-3xl p-8">
          <h1 className="exam-flow-title text-2xl font-bold">Resume Data Missing</h1>
          <p className="exam-flow-muted mt-3">
            Upload the candidate resume first so Phase 2 can generate questions from skills and projects.
          </p>
          <button
            onClick={() => navigate('/resume-upload')}
            className="exam-flow-primary-button mt-6"
          >
            Go to Resume Upload
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-flow-shell p-6">
        <div className="exam-flow-card-strong mx-auto max-w-3xl p-8">
          <h1 className="exam-flow-title text-2xl font-bold">No Questions Generated</h1>
          <p className="exam-flow-muted mt-3">
            We could not generate Phase 2 questions right now. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="exam-flow-primary-button mt-6"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-flow-shell p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="exam-flow-card-strong mb-6 flex flex-col gap-4 p-6 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => navigate('/test-phase-2')}
              className="exam-flow-outline-button mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Phase 2 Start
            </button>
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-cyan-300" />
              <div>
                <h1 className="exam-flow-title text-3xl font-bold">Syntax And Logic Assessment</h1>
                <p className="exam-flow-muted">
                    {selectedAssessment
                    ? `Phase 2 questions for ${resumeData.name || 'the candidate'} based on ${selectedAssessment.title}`
                    : effectiveAssessment?.title
                      ? `Phase 2 questions for ${resumeData.name || 'the candidate'} based on ${effectiveAssessment.title}`
                    : `Personalized Phase 2 questions for ${resumeData.name || 'the candidate'}`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="result-stat px-4 py-3">
              <p className="exam-flow-muted text-xs uppercase tracking-wide">Questions</p>
              <p className="exam-flow-title mt-1 text-2xl font-bold">{questions.length}</p>
            </div>
            <div className="result-stat px-4 py-3">
              <p className="exam-flow-muted text-xs uppercase tracking-wide">Answered</p>
              <p className="exam-flow-title mt-1 text-2xl font-bold">{answeredCount}</p>
            </div>
            <div className="result-stat px-4 py-3">
              <p className="exam-flow-muted text-xs uppercase tracking-wide">Time Left</p>
              <p className="exam-flow-title mt-1 flex items-center gap-2 text-2xl font-bold">
                <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="space-y-6">
            <section className="result-section">
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">
                  {effectiveAssessment?.skills.length ? 'Job Required Skills' : 'Resume Skills'}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {((effectiveAssessment?.skills.length ? effectiveAssessment.skills : resumeData.skills.slice(0, 10).map((skill) => skill.name))).map((skill) => (
                  <span
                    key={typeof skill === 'string' ? skill : `${skill.name}-${skill.category}`}
                    className="result-pill"
                  >
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
              </div>
            </section>

            <section className="result-section">
              <div className="mb-3 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-emerald-300" />
                <h2 className="text-lg font-semibold">Projects Used For Generation</h2>
              </div>
              <div className="space-y-3">
                {resumeData.projects.slice(0, 3).map((project) => (
                  <div key={project.name} className="result-soft-block">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-200">{project.name}</p>
                    <p className="exam-flow-muted mt-1 text-sm">{project.description}</p>
                    <p className="exam-flow-muted mt-2 text-xs">
                      {(project.technologies || []).slice(0, 5).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="exam-flow-card-strong p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="exam-flow-muted text-sm">
                  Question {currentIndex + 1} of {questions.length}
                </p>
                <h2 className="exam-flow-title mt-1 text-2xl font-bold">{currentQuestion.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${getTypeStyles(currentQuestion.type)}`}>
                  {currentQuestion.type}
                </span>
                <span className="result-pill">
                  {currentQuestion.skill}
                </span>
                <span className="result-pill">
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>

            <div className="result-soft-block">
              <p className="exam-flow-title text-lg leading-8">{currentQuestion.question}</p>

              {currentQuestion.starterCode ? (
                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-white/10">
                  <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm text-cyan-700 dark:border-white/10 dark:text-cyan-200">
                    <FileCode2 className="h-4 w-4" />
                    Starter Code
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm text-slate-200">
                    <code>{currentQuestion.starterCode}</code>
                  </pre>
                </div>
              ) : null}

              {currentQuestion.evaluationPoints.length > 0 ? (
                  <div className="result-soft-block mt-5">
                   <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-200">
                    <Lightbulb className="h-4 w-4" />
                    Evaluation Focus
                  </div>
                   <ul className="exam-flow-muted space-y-2 text-sm">
                    {currentQuestion.evaluationPoints.map((point) => (
                      <li key={point}>• {point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-5">
                <label className="exam-flow-muted mb-2 block text-sm font-medium">
                  Candidate Answer
                </label>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(event) => handleAnswerChange(currentQuestion.id, event.target.value)}
                  className="app-input min-h-[220px] w-full rounded-2xl p-4 text-sm outline-none transition focus:border-cyan-400/60"
                  placeholder="Write your syntax fix, logic explanation, or code answer here..."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-10 w-10 rounded-xl text-sm font-semibold transition ${
                      index === currentIndex
                          ? 'bg-cyan-500 text-white dark:bg-cyan-400 dark:text-slate-950'
                          : answers[question.id]?.trim()
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400/20'
                            : 'bg-white/70 text-slate-700 hover:bg-white dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="exam-flow-secondary-button disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="exam-flow-primary-button text-sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="exam-flow-success-button text-sm disabled:opacity-60"
                  >
                    <Code2 className="h-4 w-4" />
                    {submitting ? 'Submitting...' : 'Submit Phase 2'}
                  </button>
                )}
              </div>
            </div>
          </main>

          <div className="space-y-6">
            <Phase2ProctorWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle,
  Clock,
  FileText,
  MonitorPlay,
  Shield,
  Trophy,
} from 'lucide-react';
import { getApiUrl } from '../lib/api/base';

interface Phase1Result {
  token: string;
  candidateName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: number;
  violations: string[];
  submittedAt: string;
}

interface LocationState {
  phase1Result?: Phase1Result;
}


export function TestPhase2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fetchedResult, setFetchedResult] = useState<Phase1Result | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tokenFromQuery = queryParams.get('token');

  const phase1Result = useMemo(() => {
    const stateResult = (location.state as LocationState | null)?.phase1Result;
    if (stateResult) {
      return stateResult;
    }

    if (fetchedResult) {
      return fetchedResult;
    }

    const savedResult = localStorage.getItem('phase1McqResult');
    if (!savedResult) {
      return null;
    }

    try {
      return JSON.parse(savedResult) as Phase1Result;
    } catch {
      return null;
    }
  }, [location.state, fetchedResult]);

  useEffect(() => {
    if (!tokenFromQuery) {
      return;
    }

    let isMounted = true;

    const loadResultFromToken = async () => {
      setLoadingResult(true);

      try {
        const response = await fetch(getApiUrl(`/mcq/result/${tokenFromQuery}`));

        if (!response.ok) {
          throw new Error('Failed to load Phase 1 result');
        }

        const result = await response.json();
        const normalizedResult: Phase1Result = {
          token: tokenFromQuery,
          candidateName: result.candidateName || 'Candidate',
          score: result.score || 0,
          correctAnswers: result.correctAnswers || 0,
          totalQuestions: result.totalQuestions || 0,
          answeredQuestions: result.totalQuestions || 0,
          violations: result.violations || [],
          submittedAt: new Date().toISOString(),
        };

        if (isMounted) {
          localStorage.setItem('phase1McqResult', JSON.stringify(normalizedResult));
          setFetchedResult(normalizedResult);
        }
      } catch (error) {
        console.error('Failed to load Phase 1 result:', error);
      } finally {
        if (isMounted) {
          setLoadingResult(false);
        }
      }
    };

    loadResultFromToken();

    return () => {
      isMounted = false;
    };
  }, [tokenFromQuery, backendFromQuery]);

  const startPhase2 = () => {
    const nextSearch = tokenFromQuery
      ? `?token=${encodeURIComponent(tokenFromQuery)}`
      : '';

    navigate(`/phase-2-exam${nextSearch}`);
  };

  const submittedAtLabel = phase1Result
    ? new Date(phase1Result.submittedAt).toLocaleString()
    : 'Just now';

  return (
    <div className="exam-flow-shell p-4">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="exam-flow-card-strong w-full p-8 md:p-10">
          <div className="mb-8 text-center">
            <div className="relative mb-6 inline-flex">
              <div className="absolute inset-0 rounded-full bg-green-400/25 blur-xl" />
              <div className="relative rounded-full bg-gradient-to-br from-green-400 to-emerald-600 p-4">
                <CheckCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="exam-flow-title mb-2 text-3xl font-bold md:text-4xl">Phase 1 Submitted Successfully</h1>
            <p className="exam-flow-muted text-base md:text-lg">
              Your MCQ test result is ready. Review it below, then start Phase 2.
            </p>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6" style={{ color: '#0f172a' }}>
              <div className="mb-4 flex items-center gap-3">
                <Trophy className="h-6 w-6 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Phase 1 MCQ Result</h2>
                  <p className="text-sm text-slate-500">Submitted on {submittedAtLabel}</p>
                </div>
              </div>

              {loadingResult ? (
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                  <p className="text-lg font-semibold text-slate-900">Loading Phase 1 result...</p>
                  <p className="mt-2 text-sm text-slate-500">Please wait while we fetch your MCQ summary.</p>
                </div>
              ) : phase1Result ? (
                <>
                  <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                      <p className="text-sm text-slate-500">Candidate</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{phase1Result.candidateName || 'Candidate'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                      <p className="text-sm text-slate-500">Score</p>
                      <p className="mt-2 text-3xl font-bold text-emerald-600">{phase1Result.score}%</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                      <p className="text-sm text-slate-500">Correct Answers</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {phase1Result.correctAnswers}/{phase1Result.totalQuestions}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-900 p-5 text-white">
                      <div className="mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-300" />
                        <span className="font-medium">Answer Summary</span>
                      </div>
                      <p className="text-sm text-slate-300">Answered Questions</p>
                      <p className="mt-1 text-2xl font-semibold">{phase1Result.answeredQuestions}</p>
                      <p className="mt-3 text-sm text-slate-300">Total Questions</p>
                      <p className="mt-1 text-xl font-semibold">{phase1Result.totalQuestions}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                      <div className="mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        <span className="font-medium text-slate-900">Proctoring Summary</span>
                      </div>
                      <p className="text-sm text-slate-500">Violations Recorded</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{phase1Result.violations.length}</p>
                      <p className="mt-3 text-sm text-slate-500">
                        {phase1Result.violations.length === 0
                          ? 'No violations detected during Phase 1.'
                          : 'Phase 2 will continue with live proctoring enabled.'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
                  <p className="text-lg font-semibold text-slate-900">Phase 1 result not found</p>
                  <p className="mt-2 text-sm text-slate-500">
                    We could not load the saved MCQ result, but you can still continue to Phase 2.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6" style={{ color: '#0f172a' }}>
              <div className="mb-4 flex items-center gap-3">
                <MonitorPlay className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Phase 2 Test Start</h2>
                  <p className="text-sm text-slate-500">Technical assessment and proctored evaluation</p>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="rounded-xl bg-white p-4 shadow-sm" style={{ color: '#0f172a' }}>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Next phase</p>
                      <p className="text-sm" style={{ color: '#64748b' }}>Coding, technical, and problem-solving questions</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm" style={{ color: '#0f172a' }}>
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-violet-600" />
                    <div>
                      <p className="font-medium">Live evaluation</p>
                      <p className="text-sm" style={{ color: '#64748b' }}>Your camera and screen checks continue in Phase 2</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={startPhase2}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                Start Phase 2 Test
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => navigate('/')}
                className="mt-3 w-full rounded-xl border border-slate-300 px-6 py-3 text-sm font-medium transition hover:bg-slate-50"
                style={{ color: '#334155' }}
              >
                Go to Dashboard
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

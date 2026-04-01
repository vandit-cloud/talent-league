import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Download, FileDown, XCircle } from 'lucide-react';

interface Phase1QuestionResult {
  question: string;
  options: string[];
  skill: string;
  difficulty: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean | null;
}

interface Phase2Evaluation {
  questionId: string;
  selectedAnswer: string;
  status: 'right' | 'partial' | 'wrong';
  score: number;
  matchedKeywords: string[];
  expectedPoints: string[];
  expectedApproach: string;
}

interface Phase2Question {
  id: string;
  title: string;
  question: string;
  skill: string;
  difficulty: string;
}

interface DetailedResult {
  candidateName: string;
  candidateEmail: string;
  assessmentTitle: string;
  requiredSkills: string[];
  phase1: {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    violations: string[];
    submittedAt?: string;
    questions: Phase1QuestionResult[];
  };
  phase2: {
    submittedAt?: string;
    questions: Phase2Question[];
    evaluation: Phase2Evaluation[];
    summary: {
      averageScore: number;
      rightCount: number;
      partialCount: number;
      wrongCount: number;
      totalQuestions: number;
    };
  } | null;
}

const getBackendUrl = (backendFromQuery: string | null) => backendFromQuery || window.location.origin.replace(/:5173$/, ':5000');

const buildDownloadContent = (result: DetailedResult) => {
  const phase1Lines = result.phase1.questions.map((question, index) => {
    const selectedOption = question.selectedAnswer >= 0 ? question.options[question.selectedAnswer] : 'Not answered';
    const correctOption = question.options[question.correctAnswer] || 'N/A';
    return [
      `${index + 1}. ${question.question}`,
      `Skill: ${question.skill} | Difficulty: ${question.difficulty}`,
      `Selected: ${selectedOption}`,
      `Correct: ${correctOption}`,
      `Status: ${question.isCorrect ? 'Right' : 'Wrong'}`
    ].join('\n');
  });

  const phase2Lines = (result.phase2?.questions || []).map((question, index) => {
    const evaluation = result.phase2?.evaluation.find((item) => item.questionId === question.id);
    return [
      `${index + 1}. ${question.title}`,
      question.question,
      `Skill: ${question.skill} | Difficulty: ${question.difficulty}`,
      `Status: ${evaluation?.status || 'wrong'} | Score: ${evaluation?.score || 0}%`,
      `Answer: ${evaluation?.selectedAnswer || 'No answer submitted'}`,
      `Expected Points: ${(evaluation?.expectedPoints || []).join(', ') || 'N/A'}`
    ].join('\n');
  });

  return [
    `Assessment Result`,
    `Candidate: ${result.candidateName}`,
    `Email: ${result.candidateEmail}`,
    `Assessment: ${result.assessmentTitle}`,
    `Required Skills: ${result.requiredSkills.join(', ') || 'N/A'}`,
    ``,
    `Phase 1 Summary`,
    `Score: ${result.phase1.score}%`,
    `Correct: ${result.phase1.correctAnswers}/${result.phase1.totalQuestions}`,
    `Violations: ${result.phase1.violations.join(', ') || 'None'}`,
    ``,
    `Phase 1 Details`,
    ...phase1Lines,
    ``,
    `Phase 2 Summary`,
    `Average Score: ${result.phase2?.summary.averageScore || 0}%`,
    `Right: ${result.phase2?.summary.rightCount || 0}`,
    `Partial: ${result.phase2?.summary.partialCount || 0}`,
    `Wrong: ${result.phase2?.summary.wrongCount || 0}`,
    ``,
    `Phase 2 Details`,
    ...phase2Lines
  ].join('\n\n');
};

export function AssessmentResultsDetailed() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ token?: string }>();
  const [result, setResult] = useState<DetailedResult | null>(null);
  const [loading, setLoading] = useState(true);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.token || queryParams.get('token') || '';
  const backend = queryParams.get('backend');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        if (token) {
          const response = await fetch(`${getBackendUrl(backend)}/api/mcq/assessment-result/${token}`);
          if (!response.ok) {
            throw new Error('Failed to load result');
          }

          const data = await response.json();
          if (isMounted) {
            setResult(data);
            localStorage.setItem('assessmentDetailedResult', JSON.stringify(data));
          }
          return;
        }

        const storedResult = localStorage.getItem('assessmentDetailedResult');
        if (storedResult && isMounted) {
          const parsedStored = JSON.parse(storedResult) as { phase2Submission?: DetailedResult['phase2'] };
          const phase1Raw = localStorage.getItem('phase1McqResult');
          const phase1 = phase1Raw ? JSON.parse(phase1Raw) : null;
          setResult({
            candidateName: phase1?.candidateName || 'Candidate',
            candidateEmail: '',
            assessmentTitle: 'Assessment',
            requiredSkills: [],
            phase1: {
              score: phase1?.score || 0,
              correctAnswers: phase1?.correctAnswers || 0,
              totalQuestions: phase1?.totalQuestions || 0,
              violations: phase1?.violations || [],
              submittedAt: phase1?.submittedAt,
              questions: []
            },
            phase2: parsedStored.phase2Submission || null
          });
        }
      } catch (error) {
        console.error('Failed to load assessment result:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [backend, token]);

  const downloadResult = () => {
    if (!result) {
      return;
    }

    const blob = new Blob([buildDownloadContent(result)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(result.candidateName || 'candidate').replace(/\s+/g, '-').toLowerCase()}-assessment-result.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="result-page-shell flex items-center justify-center">
        <div className="result-panel text-center">
          <p className="exam-flow-title text-lg font-semibold">Loading assessment result...</p>
          <p className="exam-flow-muted mt-2">Please wait while we prepare the result details.</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-page-shell flex items-center justify-center">
        <div className="result-panel text-center">
          <p className="exam-flow-title text-lg font-semibold">Result not found.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="exam-flow-primary-button mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isRecruiterView = location.pathname.startsWith('/recruiter/');

  return (
    <div className="result-page-shell">
      <div className="result-page-container max-w-6xl">
        <div className="result-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                onClick={() => navigate(isRecruiterView ? '/recruiter/candidates' : '/dashboard')}
                className="exam-flow-outline-button mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                {isRecruiterView ? 'Back to Recruiter Candidates' : 'Back to Dashboard'}
              </button>
              <h1 className="exam-flow-title text-3xl font-bold">{result.assessmentTitle} Results</h1>
              <p className="exam-flow-muted mt-2">{result.candidateName} {result.candidateEmail ? `| ${result.candidateEmail}` : ''}</p>
            </div>
            <button
              onClick={downloadResult}
              className="exam-flow-primary-button"
            >
              <FileDown className="h-4 w-4" />
              Download Result
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="result-section">
            <h2 className="exam-flow-title text-2xl font-bold">Phase 1 Result</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Score</p>
                <p className="exam-flow-title mt-2 text-2xl font-bold">{result.phase1.score}%</p>
              </div>
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Correct</p>
                <p className="exam-flow-title mt-2 text-2xl font-bold">{result.phase1.correctAnswers}/{result.phase1.totalQuestions}</p>
              </div>
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Violations</p>
                <p className="exam-flow-title mt-2 text-2xl font-bold">{result.phase1.violations.length}</p>
              </div>
            </div>
          </section>

          <section className="result-section">
            <h2 className="exam-flow-title text-2xl font-bold">Phase 2 Result</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Average</p>
                <p className="exam-flow-title mt-2 text-2xl font-bold">{result.phase2?.summary.averageScore || 0}%</p>
              </div>
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Right</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{result.phase2?.summary.rightCount || 0}</p>
              </div>
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Partial</p>
                <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-300">{result.phase2?.summary.partialCount || 0}</p>
              </div>
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Wrong</p>
                <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-300">{result.phase2?.summary.wrongCount || 0}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="result-section">
          <h2 className="exam-flow-title text-2xl font-bold">Phase 1 Detailed Review</h2>
          <div className="mt-6 space-y-4">
            {result.phase1.questions.length > 0 ? result.phase1.questions.map((question, index) => (
              <div key={`${question.question}-${index}`} className="result-soft-block">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="exam-flow-title text-lg font-semibold">{index + 1}. {question.question}</h3>
                  <div className={question.isCorrect ? 'result-badge-right' : 'result-badge-wrong'}>
                    {question.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {question.isCorrect ? 'Right' : 'Wrong'}
                  </div>
                </div>
                <p className="exam-flow-muted mt-2 text-sm">{question.skill} | {question.difficulty}</p>
                <div className="mt-4 space-y-2 text-sm">
                  {question.options.map((option, optionIndex) => (
                    <div key={`${option}-${optionIndex}`} className={`${
                      optionIndex === question.correctAnswer
                        ? 'result-option-correct'
                        : optionIndex === question.selectedAnswer
                          ? 'result-option-selected'
                          : 'result-option-neutral'
                    }`}>
                      {String.fromCharCode(65 + optionIndex)}. {option}
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <p className="exam-flow-muted">Phase 1 detailed answers are not available for this result.</p>
            )}
          </div>
        </section>

        <section className="result-section">
          <h2 className="exam-flow-title text-2xl font-bold">Phase 2 Detailed Review</h2>
          <div className="mt-6 space-y-4">
            {result.phase2?.questions?.length ? result.phase2.questions.map((question, index) => {
              const evaluation = result.phase2?.evaluation.find((item) => item.questionId === question.id);
              const statusColor = evaluation?.status === 'right'
                ? 'bg-emerald-500/20 text-emerald-200'
                : evaluation?.status === 'partial'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'bg-rose-500/20 text-rose-200';

              return (
                <div key={question.id} className="result-soft-block">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="exam-flow-title text-lg font-semibold">{index + 1}. {question.title}</h3>
                    <div className={evaluation?.status === 'right' ? 'result-badge-right' : evaluation?.status === 'partial' ? 'result-badge-partial' : 'result-badge-wrong'}>
                      {(evaluation?.status || 'wrong').toUpperCase()} | {evaluation?.score || 0}%
                    </div>
                  </div>
                  <p className="exam-flow-title mt-2">{question.question}</p>
                  <p className="exam-flow-muted mt-2 text-sm">{question.skill} | {question.difficulty}</p>
                  <div className="result-answer-selected mt-4">
                    <p className="text-sm font-semibold">Candidate Answer</p>
                    <p className="exam-flow-title mt-2 whitespace-pre-wrap">{evaluation?.selectedAnswer || 'No answer submitted'}</p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="result-soft-block">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">Expected Review Points</p>
                      <ul className="exam-flow-title mt-2 space-y-2 text-sm">
                        {(evaluation?.expectedPoints || []).map((point) => (
                          <li key={point}>- {point}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="result-soft-block">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-200">Expected Approach</p>
                      <p className="exam-flow-title mt-2 text-sm">{evaluation?.expectedApproach || 'N/A'}</p>
                      {evaluation?.matchedKeywords?.length ? (
                        <>
                          <p className="mt-4 text-sm font-semibold text-amber-200">Matched Keywords</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {evaluation.matchedKeywords.map((keyword) => (
                              <span key={keyword} className="rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-100">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-slate-300">Phase 2 detailed review is not available yet.</p>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={downloadResult}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <Download className="h-4 w-4" />
            Download Result
          </button>
          <button
            onClick={() => navigate(isRecruiterView ? '/recruiter/candidates' : '/dashboard')}
            className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            {isRecruiterView ? 'Back to Recruiter Candidates' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

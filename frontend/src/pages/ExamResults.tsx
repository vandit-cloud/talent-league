import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileDown,
  Trophy,
  XCircle,
} from 'lucide-react';

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
    candidateName?: string;
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

interface LegacyExamResults {
  score: number;
  totalPoints: number;
  correct: number;
  total: number;
  percentage: number;
  answers: Record<string, string>;
  questions: Array<{
    id: number | string;
    question: string;
    correctAnswer: string;
    skill?: string;
    difficulty?: string;
  }>;
  timeSpent?: number;
}

interface Phase1StoredResult {
  token?: string;
  candidateName?: string;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  violations?: string[];
  submittedAt?: string;
}

const getBackendUrl = (backendFromQuery: string | null) =>
  backendFromQuery || window.location.origin.replace(/:5173$/, ':5000');

const getStatusBadgeClass = (status: 'right' | 'partial' | 'wrong') => {
  switch (status) {
    case 'right':
      return 'result-badge-right';
    case 'partial':
      return 'result-badge-partial';
    default:
      return 'result-badge-wrong';
  }
};

const escapePdfText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '')
    .replace(/\t/g, '    ');

const chunkLines = (lines: string[], size: number) => {
  const chunks: string[][] = [];

  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size));
  }

  return chunks.length > 0 ? chunks : [['Result not available']];
};

const buildPdfBlob = (lines: string[]) => {
  const pages = chunkLines(lines, 45);
  const objectContents: Array<{ id: number; content: string }> = [
    { id: 1, content: '<< /Type /Catalog /Pages 2 0 R >>' },
    {
      id: 2,
      content: `<< /Type /Pages /Count ${pages.length} /Kids [${pages
        .map((_, index) => `${4 + index * 2} 0 R`)
        .join(' ')}] >>`,
    },
    { id: 3, content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
  ];

  pages.forEach((pageLines, index) => {
    const pageId = 4 + index * 2;
    const contentId = 5 + index * 2;
    const stream = [
      'BT',
      '/F1 11 Tf',
      '14 TL',
      '40 800 Td',
      ...pageLines.flatMap((line, lineIndex) =>
        lineIndex === 0 ? [`(${escapePdfText(line)}) Tj`] : ['T*', `(${escapePdfText(line)}) Tj`]
      ),
      'ET',
    ].join('\n');

    objectContents.push({
      id: pageId,
      content: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    });
    objectContents.push({
      id: contentId,
      content: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    });
  });

  const maxId = Math.max(...objectContents.map((item) => item.id));
  const offsets: number[] = new Array(maxId + 1).fill(0);
  let pdf = '%PDF-1.4\n';

  objectContents
    .sort((left, right) => left.id - right.id)
    .forEach((item) => {
      offsets[item.id] = pdf.length;
      pdf += `${item.id} 0 obj\n${item.content}\nendobj\n`;
    });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${maxId + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let id = 1; id <= maxId; id += 1) {
    pdf += `${offsets[id].toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

const downloadPdfFile = (filename: string, lines: string[]) => {
  const blob = buildPdfBlob(lines);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const buildDetailedPdfLines = (result: DetailedResult) => {
  const lines: string[] = [
    'Assessment Result',
    `Candidate: ${result.candidateName || 'Candidate'}`,
    `Email: ${result.candidateEmail || 'N/A'}`,
    `Assessment: ${result.assessmentTitle || 'Assessment'}`,
    `Required Skills: ${result.requiredSkills.join(', ') || 'N/A'}`,
    '',
    'Phase 1 Summary',
    `Score: ${result.phase1.score}%`,
    `Correct: ${result.phase1.correctAnswers}/${result.phase1.totalQuestions}`,
    `Violations: ${result.phase1.violations.join(', ') || 'None'}`,
    '',
    'Phase 1 Detailed Review',
  ];

  result.phase1.questions.forEach((question, index) => {
    const selectedOption =
      question.selectedAnswer >= 0 ? question.options[question.selectedAnswer] || 'Not answered' : 'Not answered';
    const correctOption = question.options[question.correctAnswer] || 'N/A';
    lines.push(`${index + 1}. ${question.question}`);
    lines.push(`Skill: ${question.skill} | Difficulty: ${question.difficulty}`);
    lines.push(`Selected Answer: ${selectedOption}`);
    lines.push(`Correct Answer: ${correctOption}`);
    lines.push(`Status: ${question.isCorrect ? 'Right' : 'Wrong'}`);
    lines.push('');
  });

  lines.push('Phase 2 Summary');
  lines.push(`Average Score: ${result.phase2?.summary.averageScore || 0}%`);
  lines.push(`Right: ${result.phase2?.summary.rightCount || 0}`);
  lines.push(`Partial: ${result.phase2?.summary.partialCount || 0}`);
  lines.push(`Wrong: ${result.phase2?.summary.wrongCount || 0}`);
  lines.push('');
  lines.push('Phase 2 Detailed Review');

  (result.phase2?.questions || []).forEach((question, index) => {
    const evaluation = result.phase2?.evaluation.find((item) => item.questionId === question.id);
    lines.push(`${index + 1}. ${question.title}`);
    lines.push(question.question);
    lines.push(`Skill: ${question.skill} | Difficulty: ${question.difficulty}`);
    lines.push(`Status: ${(evaluation?.status || 'wrong').toUpperCase()} | Score: ${evaluation?.score || 0}%`);
    lines.push(`Candidate Answer: ${evaluation?.selectedAnswer || 'No answer submitted'}`);
    lines.push(`Expected Points: ${(evaluation?.expectedPoints || []).join(', ') || 'N/A'}`);
    lines.push(`Expected Approach: ${evaluation?.expectedApproach || 'N/A'}`);
    lines.push('');
  });

  return lines;
};

const buildLegacyPdfLines = (result: LegacyExamResults) => {
  const lines: string[] = [
    'Exam Result',
    `Score: ${result.percentage}%`,
    `Correct: ${result.correct}/${result.total}`,
    `Total Points: ${result.totalPoints}`,
    '',
    'Detailed Review',
  ];

  result.questions.forEach((question, index) => {
    const answerKey = String(question.id);
    lines.push(`${index + 1}. ${question.question}`);
    lines.push(`Skill: ${question.skill || 'General'} | Difficulty: ${question.difficulty || 'N/A'}`);
    lines.push(`Selected Answer: ${result.answers[answerKey] || 'Not answered'}`);
    lines.push(`Correct Answer: ${question.correctAnswer}`);
    lines.push('');
  });

  return lines;
};

const buildCombinedFromStorage = (): DetailedResult | null => {
  const storedDetailedResult = localStorage.getItem('assessmentDetailedResult');
  const storedPhase2 = localStorage.getItem('phase2Submission');
  const storedPhase1Raw = localStorage.getItem('phase1McqResult');

  let parsedDetailed: any = null;
  let parsedPhase2: any = null;
  let parsedPhase1: Phase1StoredResult | null = null;

  try {
    parsedDetailed = storedDetailedResult ? JSON.parse(storedDetailedResult) : null;
  } catch {
    parsedDetailed = null;
  }

  try {
    parsedPhase2 = storedPhase2 ? JSON.parse(storedPhase2) : null;
  } catch {
    parsedPhase2 = null;
  }

  try {
    parsedPhase1 = storedPhase1Raw ? (JSON.parse(storedPhase1Raw) as Phase1StoredResult) : null;
  } catch {
    parsedPhase1 = null;
  }

  if (parsedDetailed?.phase1) {
    return {
      candidateName: parsedDetailed.candidateName || parsedPhase1?.candidateName || 'Candidate',
      candidateEmail: parsedDetailed.candidateEmail || '',
      assessmentTitle: parsedDetailed.assessmentTitle || 'Assessment',
      requiredSkills: Array.isArray(parsedDetailed.requiredSkills) ? parsedDetailed.requiredSkills : [],
      phase1: {
        score: parsedDetailed.phase1?.score || 0,
        correctAnswers: parsedDetailed.phase1?.correctAnswers || 0,
        totalQuestions: parsedDetailed.phase1?.totalQuestions || 0,
        violations: Array.isArray(parsedDetailed.phase1?.violations) ? parsedDetailed.phase1.violations : [],
        submittedAt: parsedDetailed.phase1?.submittedAt,
        questions: Array.isArray(parsedDetailed.phase1?.questions) ? parsedDetailed.phase1.questions : [],
      },
      phase2: parsedDetailed.phase2 || null,
    };
  }

  const phase2Submission = parsedDetailed?.phase2Submission || parsedPhase2 || null;

  if (!parsedPhase1 && !phase2Submission) {
    return null;
  }

  return {
    candidateName: parsedPhase1?.candidateName || phase2Submission?.candidateName || 'Candidate',
    candidateEmail: '',
    assessmentTitle: 'Assessment',
    requiredSkills: [],
    phase1: {
      score: parsedPhase1?.score || 0,
      correctAnswers: parsedPhase1?.correctAnswers || 0,
      totalQuestions: parsedPhase1?.totalQuestions || 0,
      violations: parsedPhase1?.violations || [],
      submittedAt: parsedPhase1?.submittedAt,
      questions: [],
    },
    phase2: phase2Submission
      ? {
          candidateName: phase2Submission.candidateName || parsedPhase1?.candidateName || 'Candidate',
          submittedAt: phase2Submission.submittedAt,
          questions: Array.isArray(phase2Submission.questions) ? phase2Submission.questions : [],
          evaluation: Array.isArray(phase2Submission.evaluation) ? phase2Submission.evaluation : [],
          summary: {
            averageScore: phase2Submission.summary?.averageScore || 0,
            rightCount: phase2Submission.summary?.rightCount || 0,
            partialCount: phase2Submission.summary?.partialCount || 0,
            wrongCount: phase2Submission.summary?.wrongCount || 0,
            totalQuestions: phase2Submission.summary?.totalQuestions || 0,
          },
        }
      : null,
  };
};

export function ExamResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ token?: string }>();
  const [loading, setLoading] = useState(true);
  const [detailedResult, setDetailedResult] = useState<DetailedResult | null>(null);
  const [legacyResult, setLegacyResult] = useState<LegacyExamResults | null>(null);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = params.token || queryParams.get('token') || '';
  const backend = queryParams.get('backend');
  const isRecruiterView = location.pathname.startsWith('/recruiter/');
  const backPath = isRecruiterView ? '/recruiter/candidates' : '/dashboard';

  useEffect(() => {
    let isMounted = true;

    const loadResults = async () => {
      try {
        if (token) {
          const response = await fetch(`${getBackendUrl(backend)}/api/mcq/assessment-result/${token}`);
          if (!response.ok) {
            throw new Error('Failed to load result');
          }

          const data = (await response.json()) as DetailedResult;
          if (!isMounted) {
            return;
          }

          setDetailedResult(data);
          setLegacyResult(null);
          localStorage.setItem('assessmentDetailedResult', JSON.stringify(data));
          return;
        }

        const combined = buildCombinedFromStorage();
        if (combined) {
          if (!isMounted) {
            return;
          }

          setDetailedResult(combined);
          setLegacyResult(null);
          return;
        }

        const savedLegacyResults = localStorage.getItem('examResults');
        if (savedLegacyResults && isMounted) {
          setLegacyResult(JSON.parse(savedLegacyResults) as LegacyExamResults);
          setDetailedResult(null);
        }
      } catch (error) {
        console.error('Failed to load exam result:', error);

        const combined = buildCombinedFromStorage();
        if (combined && isMounted) {
          setDetailedResult(combined);
          setLegacyResult(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      isMounted = false;
    };
  }, [backend, token]);

  const handleDownloadPdf = () => {
    const filenameBase = (detailedResult?.candidateName || 'candidate')
      .replace(/\s+/g, '-')
      .toLowerCase();

    if (detailedResult) {
      downloadPdfFile(`${filenameBase}-exam-result.pdf`, buildDetailedPdfLines(detailedResult));
      return;
    }

    if (legacyResult) {
      downloadPdfFile(`${filenameBase}-exam-result.pdf`, buildLegacyPdfLines(legacyResult));
    }
  };

  if (loading) {
    return (
      <div className="result-page-shell flex items-center justify-center">
        <div className="result-panel text-center">
          <p className="exam-flow-title text-lg font-semibold">Loading exam results...</p>
          <p className="exam-flow-muted mt-2">Please wait while we prepare the result details.</p>
        </div>
      </div>
    );
  }

  if (!detailedResult && !legacyResult) {
    return (
      <div className="result-page-shell flex items-center justify-center">
        <div className="result-panel text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15">
            <Trophy className="h-8 w-8 text-cyan-600 dark:text-cyan-300" />
          </div>
          <p className="exam-flow-title text-lg font-semibold">Result not found.</p>
          <button
            onClick={() => navigate(backPath)}
            className="exam-flow-primary-button mt-4"
          >
            {isRecruiterView ? 'Back to Recruiter Candidates' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  if (legacyResult && !detailedResult) {
    return (
      <div className="result-page-shell">
        <div className="result-page-container max-w-5xl">
          <div className="result-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => navigate(backPath)}
                  className="exam-flow-outline-button mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {isRecruiterView ? 'Back to Recruiter Candidates' : 'Back to Dashboard'}
                </button>
                <h1 className="exam-flow-title text-3xl font-bold">Exam Results</h1>
                <p className="exam-flow-muted mt-2">Phase 1 summary for the completed exam.</p>
              </div>
              <button
                onClick={handleDownloadPdf}
                className="exam-flow-primary-button"
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="result-section">
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Score</p>
                <p className="exam-flow-title mt-3 text-3xl font-bold">{legacyResult.percentage}%</p>
              </div>
            </div>
            <div className="result-section">
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Correct</p>
                <p className="exam-flow-title mt-3 text-3xl font-bold">
                  {legacyResult.correct}/{legacyResult.total}
                </p>
              </div>
            </div>
            <div className="result-section">
              <div className="result-stat">
                <p className="exam-flow-muted text-sm">Total Points</p>
                <p className="exam-flow-title mt-3 text-3xl font-bold">{legacyResult.totalPoints}</p>
              </div>
            </div>
          </div>

          <section className="result-section">
            <h2 className="exam-flow-title text-2xl font-bold">Detailed Review</h2>
            <div className="mt-6 space-y-4">
              {legacyResult.questions.map((question, index) => {
                const selectedAnswer = legacyResult.answers[String(question.id)] || 'Not answered';
                const isCorrect = selectedAnswer === question.correctAnswer;

                return (
                  <div key={`${question.id}-${index}`} className="result-soft-block">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="exam-flow-title text-lg font-semibold">{index + 1}. {question.question}</h3>
                      <div className={isCorrect ? 'result-badge-right' : 'result-badge-wrong'}>
                        {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {isCorrect ? 'Right' : 'Wrong'}
                      </div>
                    </div>
                    <p className="exam-flow-muted mt-2 text-sm">
                      {question.skill || 'General'} | {question.difficulty || 'N/A'}
                    </p>
                    <div className="result-soft-block mt-4 text-sm">
                      <p><span className="font-semibold text-cyan-700 dark:text-cyan-200">Selected Answer:</span> <span className="exam-flow-title">{selectedAnswer}</span></p>
                      <p className="mt-2"><span className="font-semibold text-emerald-700 dark:text-emerald-200">Correct Answer:</span> <span className="exam-flow-title">{question.correctAnswer}</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const result = detailedResult as DetailedResult;

  return (
    <div className="result-page-shell">
      <div className="result-page-container max-w-6xl">
        <div className="result-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                onClick={() => navigate(backPath)}
                className="exam-flow-outline-button mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                {isRecruiterView ? 'Back to Recruiter Candidates' : 'Back to Dashboard'}
              </button>
              <h1 className="exam-flow-title text-3xl font-bold">Exam Results</h1>
              <p className="exam-flow-muted mt-2">
                {result.assessmentTitle || 'Assessment'} | {result.candidateName}
                {result.candidateEmail ? ` | ${result.candidateEmail}` : ''}
              </p>
              {result.requiredSkills.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.requiredSkills.map((skill) => (
                    <span key={skill} className="result-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              onClick={handleDownloadPdf}
              className="exam-flow-primary-button"
            >
              <FileDown className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="result-section">
            <div className="flex items-center justify-between gap-4">
              <h2 className="exam-flow-title text-2xl font-bold">Phase 1 Result</h2>
              <div className="result-pill">
                MCQ Round
              </div>
            </div>
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
                {isRecruiterView && result.phase1.violations.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.phase1.violations.map((v, i) => (
                      <p key={i} className="text-[10px] text-rose-500 font-medium">• {v}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="result-section">
            <div className="flex items-center justify-between gap-4">
              <h2 className="exam-flow-title text-2xl font-bold">Phase 2 Result</h2>
              <div className="result-pill">
                Coding Round
              </div>
            </div>
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
          <div className="flex items-center justify-between gap-4">
            <h2 className="exam-flow-title text-2xl font-bold">Phase 1 Detailed Review</h2>
            <div className="result-pill">
              Right and wrong answers
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {result.phase1.questions.length > 0 ? result.phase1.questions.map((question, index) => (
              <div key={`${question.question}-${index}`} className="result-soft-block">
                {(() => {
                  const selectedOption =
                    question.selectedAnswer >= 0
                      ? question.options[question.selectedAnswer] || 'Not answered'
                      : 'Not answered';
                  const correctOption = question.options[question.correctAnswer] || 'N/A';

                  return (
                    <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="exam-flow-title text-lg font-semibold">{index + 1}. {question.question}</h3>
                  <div className={question.isCorrect ? 'result-badge-right' : 'result-badge-wrong'}>
                    {question.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {question.isCorrect ? 'Right' : 'Wrong'}
                  </div>
                </div>
                <p className="exam-flow-muted mt-2 text-sm">{question.skill} | {question.difficulty}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="result-answer-selected text-sm">
                    <p className="font-semibold">Candidate Selected Answer</p>
                    <p className="exam-flow-title mt-2">{selectedOption}</p>
                  </div>
                  <div className="result-answer-correct text-sm">
                    <p className="font-semibold">Right Answer</p>
                    <p className="exam-flow-title mt-2">{correctOption}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {question.options.map((option, optionIndex) => {
                    const isCorrectAnswer = optionIndex === question.correctAnswer;
                    const isSelectedAnswer = optionIndex === question.selectedAnswer;
                    return (
                      <div
                        key={`${option}-${optionIndex}`}
                          className={`${
                           isCorrectAnswer
                             ? 'result-option-correct'
                             : isSelectedAnswer
                               ? 'result-option-selected'
                               : 'result-option-neutral'
                         }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{String.fromCharCode(65 + optionIndex)}. {option}</span>
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {isCorrectAnswer ? 'Correct' : isSelectedAnswer ? 'Selected' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                    </>
                  );
                })()}
              </div>
            )) : (
              <p className="exam-flow-muted">Phase 1 detailed answers are not available for this result.</p>
            )}
          </div>
        </section>

        <section className="result-section">
          <div className="flex items-center justify-between gap-4">
            <h2 className="exam-flow-title text-2xl font-bold">Phase 2 Detailed Review</h2>
            <div className="result-pill">
              Auto-evaluated answer review
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {result.phase2?.questions?.length ? result.phase2.questions.map((question, index) => {
              const evaluation = result.phase2?.evaluation.find((item) => item.questionId === question.id);
              const status = evaluation?.status || 'wrong';

              return (
                <div key={question.id} className="result-soft-block">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="exam-flow-title text-lg font-semibold">{index + 1}. {question.title}</h3>
                    <div className={getStatusBadgeClass(status)}>
                      {status.toUpperCase()} | {evaluation?.score || 0}%
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
                        {(evaluation?.expectedPoints || []).length > 0 ? (
                          (evaluation?.expectedPoints || []).map((point) => (
                            <li key={point}>- {point}</li>
                          ))
                        ) : (
                          <li>- No review points available</li>
                        )}
                      </ul>
                    </div>
                    <div className="result-soft-block">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-200">Expected Approach</p>
                      <p className="exam-flow-title mt-2 text-sm">{evaluation?.expectedApproach || 'N/A'}</p>
                      {evaluation?.matchedKeywords?.length ? (
                        <>
                          <p className="mt-4 text-sm font-semibold text-amber-700 dark:text-amber-200">Matched Keywords</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {evaluation.matchedKeywords.map((keyword) => (
                              <span key={keyword} className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">
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
              <p className="exam-flow-muted">Phase 2 detailed review is not available yet.</p>
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDownloadPdf}
            className="exam-flow-primary-button"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={() => navigate(backPath)}
            className="exam-flow-secondary-button"
          >
            {isRecruiterView ? 'Back to Recruiter Candidates' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

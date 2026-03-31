import React, { useEffect, useState } from 'react';
import { FileText, Clock, Award, TrendingUp, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import './TestPage.css';

interface Question {
  question: string;
  options: string[];
  correct: number;
  correctAnswer?: number;
  skill: string;
  difficulty?: string;
}

interface TestPageProps {
  mcqToken?: string | null;
  backendUrl?: string | null;
  frontendUrl?: string | null;
}

const normalizePublicUrl = (value?: string | null) => {
  return value ? value.replace(/\/+$/, '') : null;
};

const getBackendUrl = (resolvedBackendUrl?: string | null) => {
  return normalizePublicUrl(resolvedBackendUrl || process.env.REACT_APP_BACKEND_URL || null);
};

const getFrontendUrl = (resolvedFrontendUrl?: string | null) => {
  return normalizePublicUrl(resolvedFrontendUrl || process.env.REACT_APP_FRONTEND_URL || null);
};

const getMissingUrlError = (label: 'backend' | 'frontend') => {
  const envVar = label === 'backend' ? 'REACT_APP_BACKEND_URL' : 'REACT_APP_FRONTEND_URL';
  return `Missing ${label} URL. Open a fresh email link generated after starting both Cloudflare tunnels, or set ${envVar} before rebuilding the mobile app.`;
};

const openExternalPhase2Page = (url: string) => {
  const nativePlatform = Capacitor.isNativePlatform();

  if (nativePlatform) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 150);

    window.setTimeout(() => {
      window.location.href = url;
    }, 600);

    return;
  }

  window.location.href = url;
};

const TestPage: React.FC<TestPageProps> = ({ mcqToken, backendUrl, frontendUrl }) => {
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [mcqQuestions, setMcqQuestions] = useState<Question[]>([]);
  const [testDuration, setTestDuration] = useState(0);
  const [candidateName, setCandidateName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mcqToken) {
      fetchMCQTest(mcqToken);
    }
  }, [mcqToken, backendUrl, frontendUrl]);

  useEffect(() => {
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testStarted, timeRemaining, testCompleted]);

  const fetchMCQTest = async (token: string) => {
    setIsLoadingTest(true);
    setError(null);
    setTestStarted(false);
    setTestCompleted(false);
    setTestResult(null);
    setMcqQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setTimeRemaining(0);
    setCandidateName('');

    const resolvedBackendUrl = getBackendUrl(backendUrl);
    const resolvedFrontendUrl = getFrontendUrl(frontendUrl);

    if (!resolvedBackendUrl) {
      setError(getMissingUrlError('backend'));
      setIsLoadingTest(false);
      return;
    }

    if (!resolvedFrontendUrl) {
      setError(getMissingUrlError('frontend'));
      setIsLoadingTest(false);
      return;
    }

    try {
      const verifyRes = await fetch(`${resolvedBackendUrl}/api/mcq/verify/${token}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.message || 'Invalid test link');
      }

      const verifyData = await verifyRes.json();
      setCandidateName(verifyData.candidateName);
      setTestDuration(verifyData.duration);

      const questionsRes = await fetch(`${resolvedBackendUrl}/api/mcq/questions/${token}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!questionsRes.ok) {
        throw new Error('Failed to fetch questions');
      }

      const questionsData = await questionsRes.json();
      setMcqQuestions(questionsData.questions);
      setAnswers(new Array(questionsData.questions.length).fill(-1));
      setTimeRemaining(questionsData.duration * 60);
    } catch (err: any) {
      const errorMsg = `${err.message} | Backend: ${resolvedBackendUrl} | Token: ${token?.substring(0, 10)}...`;
      setError(errorMsg);
      console.error('Error fetching MCQ test:', err);
    } finally {
      setIsLoadingTest(false);
    }
  };

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mcqQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!mcqToken) return;

    const resolvedBackendUrl = getBackendUrl(backendUrl);
    const resolvedFrontendUrl = getFrontendUrl(frontendUrl);

    if (!resolvedBackendUrl) {
      setError(getMissingUrlError('backend'));
      return;
    }

    setTestCompleted(true);

    try {
      const response = await fetch(`${resolvedBackendUrl}/api/mcq/submit/${mcqToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, violations: [] })
      });

      if (!response.ok) {
        throw new Error('Failed to submit test');
      }

      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      console.error('Error submitting test:', err);
      setTestCompleted(false);
      setError(`Failed to submit test | Backend: ${resolvedBackendUrl}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (mcqToken && isLoadingTest) {
    return (
      <div className="test-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your test...</p>
        </div>
      </div>
    );
  }

  if (mcqToken && error) {
    return (
      <div className="test-page">
        <div className="error-container">
          <XCircle size={48} color="#ef4444" />
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (mcqToken && testCompleted && testResult) {
    return (
      <div className="test-page">
        <div className="result-container">
          <CheckCircle size={64} color="#10b981" />
          <h1>Phase 1 Completed!</h1>
          <div className="result-score">
            <h2>Your Score: {testResult.score}%</h2>
            <p>{testResult.correctAnswers} out of {testResult.totalQuestions} correct</p>
          </div>
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <AlertTriangle size={24} color="#f59e0b" style={{ marginBottom: '8px' }} />
            <h3 style={{ color: '#f59e0b', margin: '0 0 8px 0', fontSize: '16px' }}>Phase 2: Coding Assessment</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
              Phase 2 will automatically start on your <strong style={{ color: '#e2e8f0' }}>laptop</strong> where monitoring is open. You can close this app now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mcqToken && mcqQuestions.length > 0 && !testStarted) {
    return (
      <div className="test-page">
        <div className="test-intro">
          <h1>Welcome, {candidateName}!</h1>
          <div className="test-info">
            <p><strong>Total Questions:</strong> {mcqQuestions.length}</p>
            <p><strong>Duration:</strong> {testDuration} minutes</p>
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Answer all questions to the best of your ability</li>
              <li>You can navigate between questions</li>
              <li>The test will auto-submit when time is up</li>
              <li>Click "Submit Test" when you're done</li>
            </ul>
          </div>
          <button className="start-test-btn" onClick={handleStartTest}>
            <Play size={20} />
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (mcqToken && testStarted && !testCompleted) {
    const currentQuestion = mcqQuestions[currentQuestionIndex];
    const answeredCount = answers.filter((a) => a !== -1).length;

    return (
      <div className="test-page mcq-test-active">
        <div className="test-timer">
          <Clock size={20} />
          <span>{formatTime(timeRemaining)}</span>
        </div>

        <div className="test-progress">
          <p>Question {currentQuestionIndex + 1} of {mcqQuestions.length}</p>
          <p>{answeredCount} answered</p>
        </div>

        <div className="question-container">
          <h3>{currentQuestion.question}</h3>
          <div className="question-meta">
            <span className="skill-tag">{currentQuestion.skill}</span>
            <span className="difficulty-tag">{currentQuestion.difficulty}</span>
          </div>

          <div className="options-list">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${answers[currentQuestionIndex] === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="test-navigation">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="nav-btn"
          >
            Previous
          </button>

          {currentQuestionIndex === mcqQuestions.length - 1 ? (
            <button onClick={handleSubmitTest} className="submit-btn">
              Submit Test
            </button>
          ) : (
            <button onClick={handleNextQuestion} className="nav-btn">
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  const tests = [
    {
      id: 1,
      title: 'React Developer Assessment',
      category: 'Frontend Development',
      duration: '45 minutes',
      questions: 25,
      difficulty: 'Intermediate',
      completed: true,
      score: 85,
      icon: '⚛️'
    },
    {
      id: 2,
      title: 'JavaScript Fundamentals',
      category: 'Programming',
      duration: '30 minutes',
      questions: 20,
      difficulty: 'Beginner',
      completed: true,
      score: 92,
      icon: '📜'
    },
    {
      id: 3,
      title: 'CSS & Styling',
      category: 'Frontend Development',
      duration: '25 minutes',
      questions: 15,
      difficulty: 'Beginner',
      completed: false,
      score: null,
      icon: '🎨'
    },
    {
      id: 4,
      title: 'Node.js Backend',
      category: 'Backend Development',
      duration: '60 minutes',
      questions: 30,
      difficulty: 'Advanced',
      completed: false,
      score: null,
      icon: '🔧'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="test-page">
      <div className="test-header">
        <h1>Assessment Tests</h1>
        <p>Test your skills and improve your profile</p>
      </div>

      <div className="test-stats">
        <div className="stat-card">
          <Award size={20} />
          <div>
            <h3>12</h3>
            <p>Tests Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <h3>88%</h3>
            <p>Average Score</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={20} />
          <div>
            <h3>2.5h</h3>
            <p>Total Time</p>
          </div>
        </div>
      </div>

      <div className="test-list">
        {tests.map((test) => (
          <div key={test.id} className="test-card">
            <div className="test-icon">{test.icon}</div>
            <div className="test-content">
              <div className="test-header-info">
                <h3>{test.title}</h3>
                <span
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(test.difficulty) }}
                >
                  {test.difficulty}
                </span>
              </div>

              <p className="test-category">{test.category}</p>

              <div className="test-meta">
                <span className="meta-item">
                  <Clock size={14} />
                  {test.duration}
                </span>
                <span className="meta-item">
                  <FileText size={14} />
                  {test.questions} questions
                </span>
              </div>

              {test.completed ? (
                <div className="test-result">
                  <span className="score-label">Your Score:</span>
                  <span className="score-value">{test.score}%</span>
                </div>
              ) : (
                <button className="start-test-button">
                  <Play size={16} />
                  Start Test
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPage;

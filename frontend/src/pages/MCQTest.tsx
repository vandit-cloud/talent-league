import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../lib/api/base';

interface Question {
  question: string;
  options: string[];
  skill: string;
  difficulty: string;
}

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

export function MCQTest() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Verify token and load test
  useEffect(() => {
    const verifyTest = async () => {
      try {
        const response = await axios.get(getApiUrl(`/mcq/verify/${token}`));
        setCandidateName(response.data.candidateName);
        setTimeLeft(response.data.duration * 60);
        
        // Load questions
        const questionsRes = await axios.get(getApiUrl(`/mcq/questions/${token}`));
        setQuestions(questionsRes.data.questions);
        setAnswers(new Array(questionsRes.data.questions.length).fill(-1));
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load test');
        setLoading(false);
      }
    };

    verifyTest();
  }, [token]);

  // Camera setup
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' },
          audio: false 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        setViolations(prev => [...prev, 'Camera access denied']);
      }
    };

    if (!loading && !error) {
      setupCamera();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [loading, error]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !testCompleted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, testCompleted]);

  // Proctoring - Tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !testCompleted) {
        const violation = 'Tab switched at ' + new Date().toLocaleTimeString();
        setViolations(prev => [...prev, violation]);
        alert('⚠️ Warning: Tab switching detected! This is a violation.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testCompleted]);

  // Proctoring - Copy/Paste prevention
  useEffect(() => {
    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation = 'Copy/Paste attempted at ' + new Date().toLocaleTimeString();
      setViolations(prev => [...prev, violation]);
      alert('⚠️ Copy/Paste is not allowed!');
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);

    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
    };
  }, []);

  // Proctoring - Right click prevention
  useEffect(() => {
    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
      const violation = 'Right-click attempted at ' + new Date().toLocaleTimeString();
      setViolations(prev => [...prev, violation]);
    };

    document.addEventListener('contextmenu', preventRightClick);
    return () => document.removeEventListener('contextmenu', preventRightClick);
  }, []);

  // Proctoring - Keyboard shortcuts
  useEffect(() => {
    const preventShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        const violation = `Keyboard shortcut ${e.key.toUpperCase()} blocked at ` + new Date().toLocaleTimeString();
        setViolations(prev => [...prev, violation]);
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', preventShortcuts);
    return () => document.removeEventListener('keydown', preventShortcuts);
  }, []);

  // Capture snapshot every 30 seconds
  useEffect(() => {
    if (!cameraActive || testCompleted) return;

    const captureSnapshot = () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        // Could send to server here
      }
    };

    const interval = setInterval(captureSnapshot, 30000);
    return () => clearInterval(interval);
  }, [cameraActive, testCompleted]);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting || testCompleted) return;
    
    setSubmitting(true);
    try {
      const response = await axios.post(getApiUrl(`/mcq/submit/${token}`), {
        answers,
        violations
      });
      
      setScore(response.data.score);
      setTestCompleted(true);

      const phase1Result: Phase1Result = {
        token: token || '',
        candidateName,
        score: response.data.score,
        correctAnswers: response.data.correctAnswers,
        totalQuestions: response.data.totalQuestions,
        answeredQuestions: answers.filter(answer => answer !== -1).length,
        violations,
        submittedAt: new Date().toISOString(),
      };

      localStorage.setItem('phase1McqResult', JSON.stringify(phase1Result));
      
      // Redirect to the Phase 2 handoff page
      setTimeout(() => {
        navigate('/test-phase-2', {
          state: {
            phase1Result,
          },
        });
      }, 1200);
      
    } catch (err: any) {
      alert('Failed to submit test: ' + (err.response?.data?.message || 'Unknown error'));
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading your test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Completed!</h2>
          <p className="text-4xl font-bold text-green-600 mb-2">{score}%</p>
          <p className="text-gray-600 mb-4">Your score</p>
          <p className="text-sm text-gray-500">Redirecting to Phase 2...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">MCQ Test</h1>
            <p className="text-sm text-gray-600">Candidate: {candidateName}</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
            </div>

            {/* Camera Preview */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-24 h-18 rounded-lg border-2 border-gray-300 object-cover"
              />
              {!cameraActive && (
                <div className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Violations Warning */}
      {violations.length > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Violations: {violations.length} - Stay focused on the test!</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Question {currentQuestion + 1} of {questions.length}</span>
              <span className="text-sm text-gray-600">{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {questions[currentQuestion]?.skill}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                questions[currentQuestion]?.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                questions[currentQuestion]?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {questions[currentQuestion]?.difficulty}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {questions[currentQuestion]?.question}
            </h2>

            <div className="space-y-3">
              {questions[currentQuestion]?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion] === index && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-700">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {/* Question Navigator */}
            <div className="flex items-center gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    currentQuestion === index
                      ? 'bg-blue-600 text-white'
                      : answers[index] !== -1
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 bg-white rounded-lg p-4 text-center">
            <p className="text-gray-600">
              Answered: <span className="font-bold text-green-600">{answers.filter(a => a !== -1).length}</span> / {questions.length}
            </p>
          </div>
        </div>
      </main>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, CheckCircle, XCircle, Monitor, Lock, Unlock, RefreshCw, Clock, ChevronLeft, ChevronRight, Grid3x3, Eye, Flag, Award, Brain, Zap, Shield, UserCheck, Sparkles } from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FaceMesh } from "@mediapipe/face_mesh";
import { getSession } from '@/services/proctoring/session';
import { getApiUrl } from '../lib/api/base';

interface Question {
  id: number;
  _id?: string;
  question: string;
  options: string[];
  type: 'mcq' | 'coding' | 'logic' | 'syntax';
  correctAnswer?: number;
  skill?: string;
  difficulty?: string;
}

interface Violation {
  type: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export function TakeExam() {
  const navigate = useNavigate();
  
  const session = getSession();
  const isVerified = session !== null || localStorage.getItem('candidateVerified') === 'true';

  useEffect(() => {
    if (!isVerified) navigate('/candidate-verification');
  }, [isVerified, navigate]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);

  const lastVideoTimeRef = useRef<number>(-1);
  const requestRef = useRef<number | null>(0);
  const blinkCountRef = useRef<number>(0);
  const lastBlinkTimeRef = useRef<number>(0);
  
  // AI Analysis refs
  const lastEyesOpenRef = useRef<boolean>(true);
  const blinkStartTimeRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);

  // Exam state
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [questionReview, setQuestionReview] = useState<Record<number, 'answered' | 'unanswered' | 'flagged'>>({});

  // Camera state
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cameraError, setCameraError] = useState<string>('');
  const [faceDetected, setFaceDetected] = useState(false);

  const [positionLocked, setPositionLocked] = useState(false);
  const [headPose, setHeadPose] = useState<{ yaw: number; pitch: number; status: string }>({ yaw: 0, pitch: 0, status: 'Unknown' });

  // Proctoring state
  const [violations, setViolations] = useState<Violation[]>([]);
  const [warnings, setWarnings] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [examTerminated, setExamTerminated] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [lastViolation, setLastViolation] = useState<string>('');
  
  // Strict proctoring refs
  const violationCountRef = useRef(0);
  const lastGazeRef = useRef('center');
  const gazeViolationCountRef = useRef(0);
  const noFaceCountRef = useRef(0);
  const voiceViolationCount = useRef(0);
  
  // New proctoring refs
  const lookAwayStartTimeRef = useRef<number | null>(null);
  const sideGazeStartTimeRef = useRef<number | null>(null);
  const lastFaceWidthRef = useRef<number>(0);
  const shoulderWidthRef = useRef<number>(0);

  // Advanced proctoring metrics - removed unused state
  
  // Real-time AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState({
    faceDetected: false,
    eyesOpen: false,
    blinkCount: 0,
    isLivenessVerified: false,
    expression: 'unknown',
    faceQuality: 0,
    confidence: 0,
    processingFPS: 0
  });

  // Dynamic questions from backend
  const [questions, setQuestions] = useState<Question[]>([]);

  const localQuestions: Question[] = [
    {
      id: 1,
      question: 'What is React primarily used for?',
      options: ['Backend development', 'Building user interfaces', 'Database management', 'Server configuration'],
      type: 'mcq',
      correctAnswer: 1
    },
    {
      id: 2,
      question: 'Which hook is used for side effects in React?',
      options: ['useState', 'useEffect', 'useContext', 'useReducer'],
      type: 'mcq',
      correctAnswer: 1
    },
    {
      id: 3,
      question: 'What does JSX stand for?',
      options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'],
      type: 'mcq',
      correctAnswer: 0
    },
    {
      id: 4,
      question: 'Which method is used to update state in React?',
      options: ['setState()', 'updateState()', 'changeState()', 'modifyState()'],
      type: 'mcq',
      correctAnswer: 0
    },
    {
      id: 5,
      question: 'What is the virtual DOM?',
      options: ['A database', 'A lightweight copy of the actual DOM', 'A server', 'A testing tool'],
      type: 'mcq',
      correctAnswer: 1
    }
  ];

  // Fetch questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log('Fetching questions from backend...');
        const response = await fetch(getApiUrl('/exams/questions'), {
          cache: 'no-store' // Avoid stale data
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`Received ${data.length} questions from backend`);
          alert(`Fetched ${data.length} questions from backend.`);
          if (data && data.length > 0) {
            const mappedData = data.map((q: any, idx: number) => ({
              ...q,
              id: q.id || idx + 1
            }));
            setQuestions(mappedData);
          } else {
            console.warn('Backend returned 0 questions, using fallback');
            setQuestions(localQuestions);
          }
        } else {
          console.error('Backend questions fetch failed:', response.status);
          setQuestions(localQuestions);
        }
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setQuestions(localQuestions);
      }
    };
    fetchQuestions();
  }, []);

  // Initialize MediaPipe and Camera
  useEffect(() => {
    const initFullSystem = async () => {
      try {
        await initializeMediaPipe();
        await initializeCamera();
        await initializeAudioDetection();
      } catch (error) {
        console.error("Initialization failed:", error);
      }
    };

    initFullSystem();

    // Handle page unload/refresh to ensure camera is released
    const handleBeforeUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // COMPLETE CAMERA CLEANUP - Critical for browser to release camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      // Clear video srcObject to fully release camera
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Force video element reset
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);
  
  // STRICT PROCTORING - Block all cheating attempts
  useEffect(() => {
    if (!examStarted || examTerminated) return;
    
    // Block copy-paste
    const blockCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Copy/Paste Attempt', 'high', 'Copy and paste is not allowed during the exam');
      return false;
    };
    
    // Block right-click
    const blockRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    // Block keyboard shortcuts
    const blockShortcuts = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+P, Ctrl+S, Ctrl+T, Ctrl+N, Ctrl+W, F12, Alt+Tab, etc.
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = ['c', 'v', 'x', 'a', 'p', 's', 't', 'n', 'w', 'j', 'u', 'i', 'k'];
        if (blockedKeys.includes(e.key.toLowerCase())) {
          e.preventDefault();
          handleViolation('Keyboard Shortcut', 'medium', `Blocked ${e.ctrlKey ? 'Ctrl+' : ''}${e.key.toUpperCase()}`);
          return false;
        }
      }
      
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        handleViolation('DevTools Attempt', 'high', 'Opening developer tools is not allowed');
        return false;
      }
      
      // Block Alt+Tab, Alt+F4 detection (limited in browser)
      if (e.altKey && (e.key === 'Tab' || e.key === 'F4')) {
        handleViolation('Window Switch', 'high', 'Switching windows is not allowed');
      }
      
      // Block Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        return false;
      }
    };
    
    // Tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        handleViolation('Tab Switch', 'high', 'You switched to another tab or window');
      }
    };
    
    // Window blur (lost focus)
    const handleWindowBlur = () => {
      handleViolation('Window Focus Lost', 'high', 'Exam window lost focus');
    };
    
    // Add event listeners
    document.addEventListener('copy', blockCopyPaste);
    document.addEventListener('paste', blockCopyPaste);
    document.addEventListener('cut', blockCopyPaste);
    document.addEventListener('contextmenu', blockRightClick);
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      document.removeEventListener('copy', blockCopyPaste);
      document.removeEventListener('paste', blockCopyPaste);
      document.removeEventListener('cut', blockCopyPaste);
      document.removeEventListener('contextmenu', blockRightClick);
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [examStarted, examTerminated]);
  
  // Handle violations with auto-termination
  const handleViolation = (type: string, severity: 'low' | 'medium' | 'high', description: string) => {
    violationCountRef.current++;
    const violation: Violation = {
      type,
      timestamp: new Date(),
      severity,
      description
    };
    
    setViolations(prev => [...prev, violation]);
    setLastViolation(description);
    setShowViolationWarning(true);
    
    // Auto-hide warning after 5 seconds
    setTimeout(() => setShowViolationWarning(false), 5000);
    
    // Calculate warning level
    const highSeverityCount = violationCountRef.current;
    
    // Auto-terminate after 3 high severity violations
    if (highSeverityCount >= 3) {
      performTermination('Multiple violations detected. Exam terminated.');
    }
  };
  
  // Perform exam termination
  const performTermination = (reason: string) => {
    setExamTerminated(true);
    setExamStarted(false);
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    // Save exam state with termination reason
    localStorage.setItem('examTerminated', JSON.stringify({
      reason,
      timestamp: new Date(),
      violations: violations.length
    }));
    
    // Navigate to results after short delay
    setTimeout(() => navigate('/exam-results'), 2000);
  };

  const initializeMediaPipe = async () => {
    try {
      // Initialize FaceLandmarker
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
      );

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });

      console.log("MediaPipe FaceLandmarker loaded");
      
      // Initialize FaceMesh for better real-time detection
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });
      
      faceMesh.onResults((results) => {
        handleFaceMeshResults(results);
      });
      
      faceMeshRef.current = faceMesh;
      console.log("MediaPipe FaceMesh loaded");
    } catch (err) {
      console.error("MediaPipe initialization error:", err);
    }
  };
  
  // Handle FaceMesh results for real-time AI analysis
  const handleFaceMeshResults = (results: any) => {
    frameCountRef.current++;
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Calculate eye aspect ratio for blink detection
      const leftEAR = computeEAR(landmarks, [33, 160, 158, 133, 153, 144]);
      const rightEAR = computeEAR(landmarks, [362, 385, 387, 263, 373, 380]);
      const avgEAR = (leftEAR + rightEAR) / 2;
      const eyesOpen = avgEAR >= 0.12;
      
      // Blink detection
      if (lastEyesOpenRef.current && !eyesOpen) {
        blinkStartTimeRef.current = Date.now();
      } else if (!lastEyesOpenRef.current && eyesOpen && blinkStartTimeRef.current) {
        const blinkDuration = Date.now() - blinkStartTimeRef.current;
        if (blinkDuration > 100 && blinkDuration < 800) {
          blinkCountRef.current++;
          setAiAnalysis(prev => ({
            ...prev,
            blinkCount: blinkCountRef.current,
            isLivenessVerified: blinkCountRef.current >= 2
          }));
        }
        blinkStartTimeRef.current = null;
      }
      lastEyesOpenRef.current = eyesOpen;
      
      // Detect expression
      const expression = detectExpression(landmarks);
      
      // Calculate face quality
      const faceVisible = isFaceProperlyVisible(landmarks);
      const confidence = (eyesOpen ? 0.4 : 0) + (faceVisible ? 0.4 : 0) + 0.2;
      
      // STRICT PROCTORING: Check gaze direction
      const gaze = detectGazeDirection(landmarks);
      lastGazeRef.current = gaze;
      if (examStarted && gaze !== 'center') {
        gazeViolationCountRef.current++;
        if (gazeViolationCountRef.current > 30) { // ~3 seconds of looking away
          handleViolation('Looking Away', 'high', `Looking ${gaze} - Focus on screen!`);
          gazeViolationCountRef.current = 0;
        }
      } else {
        gazeViolationCountRef.current = Math.max(0, gazeViolationCountRef.current - 1);
      }
      
      // STRICT PROCTORING: Reset no-face counter
      noFaceCountRef.current = 0;
      
      setAiAnalysis(prev => ({
        ...prev,
        faceDetected: true,
        eyesOpen: eyesOpen,
        expression: expression,
        faceQuality: faceVisible ? 1 : 0.5,
        confidence: confidence
      }));
      
      setFaceDetected(true);
    } else {
      // STRICT PROCTORING: No face detected during exam
      if (examStarted) {
        noFaceCountRef.current++;
        if (noFaceCountRef.current > 50) { // ~5 seconds without face
          handleViolation('Face Not Detected', 'high', 'Your face is not visible in camera');
          noFaceCountRef.current = 0;
        }
      }
      
      setAiAnalysis(prev => ({
        ...prev,
        faceDetected: false,
        eyesOpen: false,
        confidence: 0
      }));
      setFaceDetected(false);
    }
  };
  
  // Helper functions for FaceMesh
  const computeEAR = (landmarks: any[], indices: number[]): number => {
    const points = indices.map(i => landmarks[i]).filter(Boolean);
    if (points.length < 6) return 1;
    
    const [p1, p2, p3, p4, p5, p6] = points;
    const v1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
    const v2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
    const h = Math.hypot(p1.x - p4.x, p1.y - p4.y);
    return h === 0 ? 0 : (v1 + v2) / (2 * h);
  };
  
  const detectExpression = (landmarks: any[]): string => {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];
    
    if (!leftEye || !rightEye || !nose || !mouthTop || !mouthBottom) return 'unknown';
    
    const mouthOpen = Math.abs(mouthTop.y - mouthBottom.y) > 0.05;
    const eyeDistance = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);
    
    if (mouthOpen) return 'speaking';
    if (eyeDistance < 0.15) return 'focused';
    return 'neutral';
  };
  
  const isFaceProperlyVisible = (landmarks: any[]): boolean => {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const p of landmarks) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    return w >= 0.15 && h >= 0.15 && minX >= 0.1 && maxX <= 0.9 && minY >= 0.1 && maxY <= 0.9;
  };

  const initializeCamera = async () => {
    setCameraStatus('loading');
    setCameraError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Play video with promise handling and fallback
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Camera started successfully');
            })
            .catch((err) => {
              console.error('Camera play error:', err);
              // Fallback: try muted play
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch((e) => {
                  console.error('Muted play also failed:', e);
                });
              }
            });
        }
        
        // Set up frame processing
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        
        // Fallback: if loadeddata doesn't fire, start processing anyway
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            predictWebcam();
          }
        }, 1000);
      }
      setCameraStatus('ready');
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraStatus('error');
      setCameraError(error.message || 'Failed to access camera');
    }
  };

  const predictWebcam = async () => {
    const video = videoRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
    const faceMesh = faceMeshRef.current;

    if (!video || video.readyState < 2) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    
    // STRICT PROCTORING: Check if exam is terminated
    if (examTerminated) return;

    // Always process frames for real-time detection
    const startTimeMs = performance.now();

    // Use FaceMesh for real-time detection (primary)
    if (faceMesh) {
      try {
        await faceMesh.send({ image: video });
      } catch (err) {
        console.log("FaceMesh processing error:", err);
      }
    }

    // Also use FaceLandmarker for additional analysis (backup)
    if (faceLandmarker && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const faceResults = faceLandmarker.detectForVideo(video, startTimeMs);
      if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
        const landmarks = faceResults.faceLandmarks[0];
        analyzeHeadPose(landmarks);
        runAdvancedProctoring(faceResults, video);
        
        // Ensure face is marked as detected
        if (!aiAnalysis.faceDetected) {
          setFaceDetected(true);
          setAiAnalysis(prev => ({ ...prev, faceDetected: true }));
        }
      }
    }

    // Voice detection - note: proctoringMetrics state removed
    const voiceData = detectVoiceActivity();

    // Voice violation tracking
    if (examStarted && voiceData.detected) {
      voiceViolationCount.current++;
      if (voiceViolationCount.current > 50) { // ~5 seconds of continuous voice
        handleViolation('voice', 'high', 'Voice detected during exam - Possible cheating attempt');
        voiceViolationCount.current = 0;
      }
    } else {
      voiceViolationCount.current = Math.max(0, voiceViolationCount.current - 1);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const analyzeHeadPose = (landmarks: any[]) => {
    // Simple pose estimation using relative landmark positions
    // Nose tip: 1, Left Ear: 234, Right Ear: 454
    const nose = landmarks[1];
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];

    // Calculate Yaw (Left/Right rotation)
    // Compare nose horizontal position relative to ears
    const midPointX = (leftEar.x + rightEar.x) / 2;
    const noseOffset = nose.x - midPointX;
    const earDistance = Math.abs(rightEar.x - leftEar.x);

    // Normalize yaw: -1 (Right) to +1 (Left) roughly
    const yaw = noseOffset / (earDistance * 0.5);

    // Calculate Pitch (Up/Down)
    // Use eye-to-nose vertical distance, or nose z-depth roughly
    // Simple heuristic: Nose Y position relative to ear Y center
    const midPointY = (leftEar.y + rightEar.y) / 2;
    const pitch = nose.y - midPointY; // Positive = Down, Negative = Up (roughly)

    let status = 'Good';
    const YAW_THRESHOLD = 0.4; // Sensitivity

    if (yaw > YAW_THRESHOLD) status = 'Looking Left';
    else if (yaw < -YAW_THRESHOLD) status = 'Looking Right';
    else if (Math.abs(pitch) > 0.15) status = 'Adjust Angle'; // Looking Up/Down too much

    setHeadPose({
      yaw: yaw * 90, // Approx conversion to degrees for display
      pitch: pitch * 100,
      status
    });

    // Proctoring Checks
    if (examStarted && positionLocked) {
      if (status !== 'Good') {
        // Debounce warnings in a real app
        // triggerWarning(); 
      }

    }
  };

  // Advanced proctoring detection functions
  const detectBackgroundPersons = (landmarks: any[]) => {
    // Simple background person detection based on face landmarks
    // In production, this would use a dedicated person detection model
    const faceCount = landmarks.length;
    return Math.max(0, faceCount - 1); // Subtract the main user
  };

  const detectMotionAnomaly = (currentFrame: ImageData) => {
    if (!previousFrameRef.current) return false;
    
    let diff = 0;
    for (let i = 0; i < currentFrame.data.length; i += 4) {
      diff += Math.abs(currentFrame.data[i] - previousFrameRef.current.data[i]);
    }
    
    const avgDiff = diff / (currentFrame.data.length / 4);
    previousFrameRef.current = currentFrame;
    return avgDiff > 15; // Threshold for motion detection
  };

  const detectLightingAnomaly = (imageData: ImageData) => {
    let sum = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      sum += imageData.data[i]; // Red channel for brightness
    }
    const avgBrightness = sum / (imageData.data.length / 4);
    return avgBrightness < 40 || avgBrightness > 220; // Too dark or too bright
  };

  const detectScreenReflection = (landmarks: any[]) => {
    // Detect screen reflection in glasses or eyes
    if (landmarks.length === 0) return false;
    
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    if (!leftEye || !rightEye) return false;
    
    // Simple heuristic: bright spots in eye region
    return (leftEye.z < -0.1 && rightEye.z < -0.1);
  };

  const detectBlinkFrequency = (landmarks: any[]) => {
    if (landmarks.length === 0) return 0;
    
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    
    if (!leftEyeTop || !leftEyeBottom || !rightEyeTop || !rightEyeBottom) return 0;
    
    const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
    
    const currentTime = Date.now();
    if (avgEyeHeight < 0.01 && currentTime - lastBlinkTimeRef.current > 200) {
      blinkCountRef.current++;
      lastBlinkTimeRef.current = currentTime;
    }
    
    return blinkCountRef.current;
  };

  const detectGazeDirection = (landmarks: any[]) => {
    if (landmarks.length === 0) return 'center';
    
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    
    if (!leftEye || !rightEye || !nose) return 'center';
    
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    };
    
    const gazeVector = {
      x: nose.x - eyeCenter.x,
      y: nose.y - eyeCenter.y
    };
    
    if (Math.abs(gazeVector.x) < 0.02 && Math.abs(gazeVector.y) < 0.02) return 'center';
    if (gazeVector.x > 0.02) return 'right';
    if (gazeVector.x < -0.02) return 'left';
    if (gazeVector.y > 0.02) return 'down';
    if (gazeVector.y < -0.02) return 'up';
    
    return 'center';
  };

  const detectOcclusion = (landmarks: any[]) => {
    if (landmarks.length === 0) return true;
    
    // Check if key facial features are visible
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const mouth = landmarks[13];
    
    const keyPointsVisible = [nose, leftEye, rightEye, mouth].every(point => 
      point && point.visibility && point.visibility > 0.5
    );
    
    return !keyPointsVisible;
  };

  // NEW: Detect if hands are visible on desk using lower frame analysis
  const detectHandsVisible = (landmarks: any[]) => {
    if (landmarks.length === 0) return false;
    
    // Check for hand-like shapes in lower portion of frame
    // Using shoulder and wrist landmarks if available
    const leftWrist = landmarks[15]; // Pose landmark approximations
    const rightWrist = landmarks[16];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    // If we have wrist landmarks below shoulders, hands are likely visible
    if (leftWrist && rightWrist && leftShoulder && rightShoulder) {
      const handsBelowShoulders = leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;
      const handsInFrame = leftWrist.y < 0.95 && rightWrist.y < 0.95; // Not cut off at bottom
      return handsBelowShoulders && handsInFrame;
    }
    
    // Fallback: Check if face is in upper portion (leaving room for hands below)
    const nose = landmarks[1];
    if (nose && nose.y < 0.4) {
      return true; // Face positioned high, likely room for hands below
    }
    
    return false;
  };

  // NEW: Check if face is centered in frame
  const detectFaceCentered = (landmarks: any[]) => {
    if (landmarks.length === 0) return false;
    
    const nose = landmarks[1];
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];
    
    if (!nose || !leftEar || !rightEar) return false;
    
    // Calculate face center
    const faceCenterX = (leftEar.x + rightEar.x) / 2;
    const faceCenterY = (leftEar.y + rightEar.y) / 2;
    
    // Check if face center is within center region (40% of frame)
    const centerThreshold = 0.2;
    const isCenteredX = Math.abs(faceCenterX - 0.5) < centerThreshold;
    const isCenteredY = Math.abs(faceCenterY - 0.5) < centerThreshold;
    
    return isCenteredX && isCenteredY;
  };

  // NEW: Check if shoulders are visible
  const detectShouldersVisible = (landmarks: any[]) => {
    if (landmarks.length === 0) return false;
    
    // Check shoulder landmarks
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];
    
    // Calculate shoulder width ratio relative to face width
    if (leftShoulder && rightShoulder && leftEar && rightEar) {
      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
      const faceWidth = Math.abs(rightEar.x - leftEar.x);
      const ratio = shoulderWidth / faceWidth;
      
      shoulderWidthRef.current = ratio;
      
      // Shoulders should be wider than face (typical ratio: 2.5-4x face width)
      return ratio > 1.5 && ratio < 6;
    }
    
    // Fallback: Check if face occupies reasonable portion (not too zoomed in)
    const faceWidth = Math.abs(rightEar.x - leftEar.x);
    return faceWidth > 0.15 && faceWidth < 0.6;
  };

  // NEW: Estimate distance using face bounding box size
  const estimateDistance = (landmarks: any[]) => {
    if (landmarks.length === 0) return 0;
    
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    
    if (!leftEar || !rightEar || !forehead || !chin) return 0;
    
    // Calculate face width and height in normalized coordinates
    const faceWidth = Math.abs(rightEar.x - leftEar.x);
    const faceHeight = Math.abs(chin.y - forehead.y);
    const faceArea = faceWidth * faceHeight;
    
    lastFaceWidthRef.current = faceWidth;
    
    // Estimate distance based on face area
    // Larger face area = closer to camera
    // Typical values: 0.05-0.15 at 50-70cm, 0.2+ at 30cm, <0.03 at 100cm+
    if (faceArea > 0.18) return 30; // Very close (30cm)
    if (faceArea > 0.12) return 40;
    if (faceArea > 0.08) return 50;
    if (faceArea > 0.05) return 60;
    if (faceArea > 0.03) return 70;
    if (faceArea > 0.02) return 80;
    return 100; // Far (100cm+)
  };

  // NEW: Monitor look-away duration and constant side gaze
  const monitorGazeDuration = (gazeDirection: string) => {
    const currentTime = Date.now();
    
    // Check for looking away (not center)
    if (gazeDirection !== 'center') {
      if (!lookAwayStartTimeRef.current) {
        lookAwayStartTimeRef.current = currentTime;
      }
      const lookAwayDuration = (currentTime - lookAwayStartTimeRef.current) / 1000;
      
      // Check for constant side gaze
      if ((gazeDirection === 'left' || gazeDirection === 'right')) {
        if (!sideGazeStartTimeRef.current) {
          sideGazeStartTimeRef.current = currentTime;
        }
        const sideGazeDuration = (currentTime - sideGazeStartTimeRef.current) / 1000;
        
        return {
          lookAwayDuration,
          isLookingAway: lookAwayDuration > 2, // Looking away > 2 seconds
          constantSideGaze: sideGazeDuration > 5 // Side gaze > 5 seconds
        };
      } else {
        sideGazeStartTimeRef.current = null;
      }
      
      return {
        lookAwayDuration,
        isLookingAway: lookAwayDuration > 2,
        constantSideGaze: false
      };
    } else {
      // Reset timers when looking at center
      lookAwayStartTimeRef.current = null;
      sideGazeStartTimeRef.current = null;
      
      return {
        lookAwayDuration: 0,
        isLookingAway: false,
        constantSideGaze: false
      };
    }
  };

  const initializeAudioDetection = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      
      return audioStream;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return null;
    }
  };

  const detectVoiceActivity = () => {
    if (!analyserRef.current) return { detected: false, multiSpeaker: false, aiProbability: 0 };
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const detected = average > 30; // Voice activity threshold
    
    // Simple AI voice probability estimation (in production, use ML model)
    const aiProbability = detected ? Math.min(0.9, average / 100) : 0;
    
    return {
      detected,
      multiSpeaker: false, // Would need more sophisticated analysis
      aiProbability
    };
  };

  const addViolation = (type: string, severity: 'low' | 'medium' | 'high', description: string) => {
    const newViolation: Violation = {
      type,
      timestamp: new Date(),
      severity,
      description
    };
    setViolations((prev: Violation[]) => [...prev, newViolation]);
  };

  const lockPosition = () => {
    if (faceDetected) {
      setPositionLocked(true);
      // Could capture current landmarks as baseline
    }
  };

  // Enhanced detection loop with all proctoring features
  const runAdvancedProctoring = (faceResults: any, videoElement: HTMLVideoElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const landmarks = faceResults.faceLandmarks?.[0] || [];

    // Get gaze direction for monitoring
    const gazeDirection = detectGazeDirection(landmarks);
    const gazeMonitor = monitorGazeDuration(gazeDirection);
    
    // Update proctoring metrics
    const newMetrics = {
      backgroundPersons: detectBackgroundPersons(landmarks),
      motionDetected: detectMotionAnomaly(imageData),
      lightingAnomaly: detectLightingAnomaly(imageData),
      screenReflection: detectScreenReflection(landmarks),
      voiceDetected: false, // Will be updated separately
      multiSpeakerDetected: false, // Will be updated separately
      aiVoiceProbability: 0, // Will be updated separately
      blinkFrequency: detectBlinkFrequency(landmarks),
      gazeDirection: gazeDirection,
      headPose: {
        yaw: headPose.yaw,
        pitch: headPose.pitch,
        roll: 0 // Would need additional calculation
      },
      multiFaceDetected: faceResults.faceLandmarks?.length > 1,
      occlusionDetected: detectOcclusion(landmarks),
      // New features
      handsVisible: detectHandsVisible(landmarks),
      faceCentered: detectFaceCentered(landmarks),
      shouldersVisible: detectShouldersVisible(landmarks),
      estimatedDistance: estimateDistance(landmarks),
      lookAwayDuration: gazeMonitor.lookAwayDuration,
      isLookingAway: gazeMonitor.isLookingAway,
      constantSideGaze: gazeMonitor.constantSideGaze
    };

    // Note: proctoringMetrics state removed - metrics calculated but not stored

    // Check for violations
    if (examStarted) {
      if (newMetrics.backgroundPersons > 0) {
        addViolation('Background person detected', 'high', `${newMetrics.backgroundPersons} person(s) detected in background`);
      }
      if (newMetrics.motionDetected) {
        addViolation('Suspicious motion', 'medium', 'Unusual movement detected');
      }
      if (newMetrics.lightingAnomaly) {
        addViolation('Lighting anomaly', 'medium', 'Sudden lighting change detected');
      }
      if (newMetrics.screenReflection) {
        addViolation('Screen reflection', 'low', 'Screen reflection detected in glasses');
      }
      if (newMetrics.multiFaceDetected) {
        addViolation('Multiple faces', 'high', 'Multiple faces detected in camera');
      }
      if (newMetrics.occlusionDetected) {
        addViolation('Face occlusion', 'medium', 'Face partially or fully occluded');
      }
      // New violation checks
      if (!newMetrics.handsVisible && positionLocked) {
        addViolation('Hands not visible', 'medium', 'Please keep both hands visible on desk');
      }
      if (!newMetrics.faceCentered && positionLocked) {
        addViolation('Face not centered', 'low', 'Please center your face in the frame');
      }
      if (!newMetrics.shouldersVisible && positionLocked) {
        addViolation('Shoulders not visible', 'low', 'Please adjust camera to show shoulders');
      }
      if (newMetrics.isLookingAway) {
        addViolation('Looking away', 'medium', `Looking away for ${newMetrics.lookAwayDuration.toFixed(1)}s`);
      }
      if (newMetrics.constantSideGaze) {
        addViolation('Constant side gaze', 'high', 'Looking sideways for extended period - possible cheating');
      }
      if (newMetrics.estimatedDistance < 40) {
        addViolation('Too close to screen', 'low', 'Please move back from the screen');
      }
      if (newMetrics.estimatedDistance > 90) {
        addViolation('Too far from screen', 'low', 'Please move closer to the camera');
      }
      if (newMetrics.gazeDirection !== 'center') {
        addViolation('Gaze deviation', 'low', `Looking ${newMetrics.gazeDirection}`);
      }
    }

    return newMetrics;
  };

  const triggerWarning = () => {
    const newWarnings = warnings + 1;
    setWarnings(newWarnings);

    if (newWarnings >= 3) {
      performTermination('Too many violations detected (3 warnings exceeded)');
    }
  };



  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted) {
        const newTabSwitches = tabSwitches + 1;
        setTabSwitches(newTabSwitches);
        addViolation('Tab switched', 'high', `Tab switch #${newTabSwitches}`);

        if (newTabSwitches >= 2) {
          performTermination('Maximum tab switches exceeded (2 allowed)');
        } else {
          triggerWarning();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, tabSwitches, warnings]);

  // Copy/paste prevention
  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      if (examStarted) {
        e.preventDefault();
        addViolation('Copy attempt', 'low', 'Copy action blocked');
      }
    };

    const preventPaste = (e: ClipboardEvent) => {
      if (examStarted) {
        e.preventDefault();
        addViolation('Paste attempt', 'low', 'Paste action blocked');
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
    };
  }, [examStarted]);

  // Fullscreen enforcement
  useEffect(() => {
    if (examStarted) {
      document.documentElement.requestFullscreen?.();
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examStarted) {
        addViolation('Fullscreen exited', 'medium', 'Fullscreen mode required');
        triggerWarning();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [examStarted, warnings]);

  // Timer
  useEffect(() => {
    if (!examStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted]);

  const startExam = () => {
    if (!positionLocked) {
      alert('Please lock your position first!');
      return;
    }
    if (!faceDetected) {
      alert('Face not detected! Please ensure your face is visible.');
      return;
    }
    setExamStarted(true);
  };

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers((prev: Record<number, number>) => ({ ...prev, [questionId]: answerIndex }));
    setQuestionReview(prev => ({ ...prev, [questionId]: 'answered' }));
  };

  const toggleFlagQuestion = (questionId: number) => {
    setQuestionReview(prev => ({
      ...prev,
      [questionId]: prev[questionId] === 'flagged' ? 'answered' : 'flagged'
    }));
  };

  const submitExam = () => {
    if (!showConfirmSubmit) {
      setShowConfirmSubmit(true);
      return;
    }
    
    const score = questions.reduce((acc: number, q: Question) => {
      const qId = q.id;
      return acc + (answers[qId] === q.correctAnswer ? 1 : 0);
    }, 0);

    localStorage.setItem('examScore', score.toString());
    localStorage.setItem('examAnswers', JSON.stringify(answers));
    localStorage.setItem('examViolations', JSON.stringify(violations));
    localStorage.setItem('examTerminated', 'false');

    fetch(getApiUrl('/exams/submit'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score,
        totalQuestions: questions.length,
        answers,
        violations
      })
    }).catch(err => console.error('Failed to save to database:', err));

    navigate('/exam-results');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera loading/error screen
  if (cameraStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Initializing AI Proctoring...</h2>
            <p className="text-gray-600 mb-4">Loading face detection models...</p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cameraStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Camera Access Failed</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{cameraError}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exam Terminated Screen
  if (examTerminated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-red-500/30 shadow-2xl text-center">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Exam Terminated</h1>
          <p className="text-red-200 text-lg mb-6">
            Your exam has been terminated due to multiple violations of the proctoring rules.
          </p>
          <div className="bg-red-900/30 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm">Total Violations: {violations.length}</p>
            <p className="text-red-400 text-xs mt-2">All violations have been recorded and reported.</p>
          </div>
          <button
            onClick={() => navigate('/exam-results')}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg transition-all"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  // Instructions screen - Enhanced with modern design
  if (!examStarted && cameraStatus === 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-600/10 rounded-full filter blur-3xl animate-pulse delay-500"></div>
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="max-w-7xl w-full">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-6xl font-bold text-white mb-4 tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-Proctored Assessment
              </h1>
              <p className="text-2xl text-blue-200 mb-2">Advanced Technical Evaluation with Real-time Monitoring</p>
              <div className="flex items-center justify-center gap-2 text-sm text-purple-300">
                <Sparkles className="w-4 h-4" />
                <span>Enterprise-Grade Security • Intelligent Proctoring • Fair Assessment</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Panel - Large Camera Feed */}
              <div className="space-y-4">
                {/* Main Camera Feed - Wide Horizontal */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Camera className="w-6 h-6" />
                      Live Camera
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-full">
                      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${aiAnalysis.faceDetected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <span className={`text-sm font-medium ${aiAnalysis.faceDetected ? 'text-emerald-400' : 'text-red-400'}`}>
                        {aiAnalysis.faceDetected ? 'Face Detected' : 'No Face'}
                      </span>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-black/50">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-[320px] object-cover transform scale-x-[-1]"
                    />
                    {/* Face Detection Overlay */}
                    <div className={`absolute inset-0 border-4 rounded-xl transition-all duration-300 ${
                      !aiAnalysis.faceDetected ? 'border-red-500 animate-pulse' :
                      aiAnalysis.eyesOpen ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 
                      'border-yellow-500 animate-pulse'
                    }`}>
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/80 backdrop-blur rounded-full">
                        <span className={`text-xs font-bold ${
                          !aiAnalysis.faceDetected ? 'text-red-400' :
                          aiAnalysis.eyesOpen ? 'text-emerald-400' : 'text-yellow-400'
                        }`}>
                          {!aiAnalysis.faceDetected ? 'No Face Detected' : 
                           aiAnalysis.eyesOpen ? 'Eyes Open ✓' : 'Eyes Closed'}
                        </span>
                      </div>
                      {/* Liveness Badge */}
                      {aiAnalysis.isLivenessVerified && (
                        <div className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-600/90 backdrop-blur rounded-full">
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Live Person
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Analysis Panel - Compact */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-3 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Analysis
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                      <div className={`w-1.5 h-1.5 rounded-full ${aiAnalysis.faceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
                      {aiAnalysis.faceDetected ? 'Active' : 'Scanning'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Face Status */}
                    <div className={`rounded-lg p-2 text-center ${aiAnalysis.faceDetected ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}>
                      <div className="text-[10px] text-white/70">Face</div>
                      <div className="text-xs font-bold">{aiAnalysis.faceDetected ? '✓ Detected' : '✗ None'}</div>
                    </div>
                    {/* Eye Status */}
                    <div className={`rounded-lg p-2 text-center ${aiAnalysis.eyesOpen ? 'bg-emerald-500/30' : 'bg-red-500/30'}`}>
                      <div className="text-[10px] text-white/70">Eyes</div>
                      <div className="text-xs font-bold">{aiAnalysis.eyesOpen ? '✓ Open' : '✗ Closed'}</div>
                    </div>
                    {/* Liveness */}
                    <div className={`rounded-lg p-2 text-center ${aiAnalysis.isLivenessVerified ? 'bg-emerald-500/30' : 'bg-amber-500/30'}`}>
                      <div className="text-[10px] text-white/70">Liveness</div>
                      <div className="text-xs font-bold">{aiAnalysis.blinkCount}/2</div>
                    </div>
                    {/* Expression */}
                    <div className="bg-white/10 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-white/70">Expression</div>
                      <div className="text-xs font-bold capitalize">{aiAnalysis.expression}</div>
                    </div>
                  </div>
                  
                  {/* Confidence Bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-white/70 mb-1">
                      <span>AI Confidence</span>
                      <span>{Math.round(aiAnalysis.confidence * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                        style={{ width: `${aiAnalysis.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${positionLocked ? 'bg-blue-500/20 border-blue-400/50' : 'bg-gray-500/20 border-gray-400/50'}`}>
                    <div className="flex items-center gap-2">
                      {positionLocked ? <Lock className="w-5 h-5 text-blue-400" /> : <Unlock className="w-5 h-5 text-gray-400" />}
                      <div>
                        <p className={`text-xs ${positionLocked ? 'text-blue-300' : 'text-gray-300'}`}>Position</p>
                        <p className={`text-sm font-semibold ${positionLocked ? 'text-blue-400' : 'text-gray-400'}`}>
                          {positionLocked ? 'Locked' : 'Unlocked'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-xl border ${faceDetected ? 'bg-emerald-500/20 border-emerald-400/50' : 'bg-red-500/20 border-red-400/50'}`}>
                    <div className="flex items-center gap-2">
                      <UserCheck className={`w-5 h-5 ${faceDetected ? 'text-emerald-400' : 'text-red-400'}`} />
                      <div>
                        <p className={`text-xs ${faceDetected ? 'text-emerald-300' : 'text-red-300'}`}>Face Status</p>
                        <p className={`text-sm font-semibold ${faceDetected ? 'text-emerald-400' : 'text-red-400'}`}>
                          {faceDetected ? 'Active' : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={lockPosition}
                    disabled={!faceDetected || positionLocked}
                    className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all ${faceDetected && !positionLocked
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {positionLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                    {positionLocked ? 'Position Locked ✓' : 'Lock Position'}
                  </button>

                  <button
                    onClick={startExam}
                    disabled={!positionLocked}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all text-lg ${positionLocked
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center gap-3'
                      : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {positionLocked ? (
                      <>
                        <Zap className="w-6 h-6" />
                        Start Assessment
                      </>
                    ) : (
                      <>
                        <Clock className="w-6 h-6" />
                        Lock Position First
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">AI Proctoring Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Secure Environment</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Risk Score: <span className="text-yellow-400 font-semibold">0</span> • 
                  Tab Switches: <span className="text-green-400 font-semibold">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam screen
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Violation Warning Overlay */}
      {showViolationWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl shadow-2xl border border-red-400 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <div>
              <p className="font-bold text-sm">⚠️ VIOLATION DETECTED</p>
              <p className="text-xs text-red-100">{lastViolation}</p>
              <p className="text-[10px] text-red-200 mt-1">
                Warning {violationCountRef.current}/3 - Exam will terminate after 3 violations
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header with Progress */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {questions[currentQuestion]?.skill
                  ? `${questions[currentQuestion].skill} Assessment`
                  : (questions[currentQuestion]?.question?.includes('React') ? 'React Assessment' : 'Technical Assessment')}
              </h1>
              <p className="text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="flex-1 mx-8">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Progress: {Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                <span>Answered: {Object.keys(answers).length}/{questions.length}</span>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-600">Time Remaining</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Main Content Area */}
        <div className="flex-1 p-8">
          {/* Warning banner */}
          {(warnings > 0 || headPose.status !== 'Good') && (
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${headPose.status !== 'Good' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
              }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={headPose.status !== 'Good' ? 'text-red-600 animate-pulse' : 'text-yellow-600'} />
                <div>
                  <p className={`font-semibold ${headPose.status !== 'Good' ? 'text-red-800' : 'text-yellow-800'}`}>
                    {headPose.status !== 'Good'
                      ? `⚠️ ${headPose.status.toUpperCase()}!`
                      : `⚠️ Warning ${warnings}/3`}
                  </p>
                  <p className={`text-sm ${headPose.status !== 'Good' ? 'text-red-700' : 'text-yellow-700'}`}>
                    {headPose.status !== 'Good'
                      ? 'Please look at the screen immediately.'
                      : 'Please follow exam rules.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Question card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex-1">
                {questions[currentQuestion].question}
              </h2>
              <button
                onClick={() => toggleFlagQuestion(questions[currentQuestion].id)}
                className={`ml-4 p-2 rounded-lg transition-colors ${
                  questionReview[questions[currentQuestion].id] === 'flagged'
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Flag for review"
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(questions[currentQuestion].id, index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all group ${
                    answers[questions[currentQuestion].id] === index
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[questions[currentQuestion].id] === index
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 group-hover:border-blue-400'
                    }`}>
                      {answers[questions[currentQuestion].id] === index && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-gray-700 group-hover:text-gray-900">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion((prev: number) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center gap-2 transition-colors"
              >
                <Eye className="w-5 h-5" />
                Review All
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={submitExam}
                  className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2 transition-colors"
                >
                  <Award className="w-5 h-5" />
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion((prev: number) => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Question Navigator */}
        <div className="w-80 bg-white shadow-lg p-6 border-l border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              Question Navigator
            </h3>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = questionReview[q.id] === 'flagged';
                const isCurrent = index === currentQuestion;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`aspect-square rounded-lg font-semibold text-sm transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                        : isFlagged
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded"></div>
              <span className="text-gray-600">Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Not Answered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Submit Exam?</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Questions Answered:</span>
                <span className="font-semibold">{Object.keys(answers).length}/{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Flagged Questions:</span>
                <span className="font-semibold">{Object.values(questionReview).filter(s => s === 'flagged').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Remaining:</span>
                <span className="font-semibold">{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            {Object.keys(answers).length < questions.length && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ You have unanswered questions. Are you sure you want to submit?
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  // Call submitExam again with confirmation bypass
                  const score = questions.reduce((acc: number, q: Question) => {
                    const qId = q.id;
                    return acc + (answers[qId] === q.correctAnswer ? 1 : 0);
                  }, 0);

                  localStorage.setItem('examScore', score.toString());
                  localStorage.setItem('examAnswers', JSON.stringify(answers));
                  localStorage.setItem('examViolations', JSON.stringify(violations));
                  localStorage.setItem('examTerminated', 'false');

                  fetch(getApiUrl('/exams/submit'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      score,
                      totalQuestions: questions.length,
                      answers,
                      violations
                    })
                  }).catch(err => console.error('Failed to save to database:', err));

                  navigate('/exam-results');
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Camera Overlay - Wide Horizontal */}
      <div className="fixed top-6 right-6 w-[600px] bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700 z-[9999]">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-base">Camera Monitor</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
          </div>

          {/* Wide Horizontal Camera View */}
          <div className="relative mb-5">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[220px] rounded-xl bg-black object-cover transform scale-x-[-1]"
            />

            {/* Status Border */}
            <div className={`absolute inset-0 border-4 rounded-xl pointer-events-none ${
              !faceDetected ? 'border-red-500' :
              headPose.status === 'Good' ? 'border-green-500' : 'border-yellow-500'
            }`} />

            {/* Simple Status Badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 rounded-lg">
              <span className={`text-xs font-bold ${
                !faceDetected ? 'text-red-400' :
                headPose.status === 'Good' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {!faceDetected ? 'NO FACE' : headPose.status === 'Good' ? 'GOOD' : 'ADJUST'}
              </span>
            </div>
          </div>

          {/* Lock Screen Button - Prominent */}
          <button
            onClick={lockPosition}
            disabled={!faceDetected || positionLocked}
            className={`w-full py-5 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all mb-4 ${
              positionLocked
                ? 'bg-emerald-600 text-white'
                : faceDetected
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {positionLocked ? (
              <>
                <Lock className="w-6 h-6" />
                <span>SCREEN LOCKED ✓</span>
              </>
            ) : (
              <>
                <Unlock className="w-6 h-6" />
                <span>LOCK SCREEN TO START</span>
              </>
            )}
          </button>

          {/* Start Exam Button */}
          <button
            onClick={startExam}
            disabled={!positionLocked}
            className={`w-full py-5 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              positionLocked
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Zap className="w-6 h-6" />
            <span>START EXAM</span>
          </button>

          {/* Simple Status Row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>AI Proctoring Active</span>
            </div>
            {warnings > 0 && (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{warnings}/3</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

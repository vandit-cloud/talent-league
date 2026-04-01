import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  encryptReferenceImages,
  createProctoringSession,
  saveSession,
} from "@/services/proctoring/session";
import { createSessionOnBackend } from "@/services/proctoring/api";
import { FaceMesh } from "@mediapipe/face_mesh";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { 
  ArrowLeft, 
  Camera as CameraIcon, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  Send,
  Shield,
  Scan,
  Brain,
  Activity,
  Fingerprint,
  Eye,
  Sparkles,
  Video,
  UserCheck
} from "lucide-react";

/* =====================================================
   CONFIG
===================================================== */

const CONFIG = {
  width: 1280,
  height: 720,
  // Face angle ranges (yaw in degrees)
  FRONT_MIN: -10,
  FRONT_MAX: 10,
  LEFT_MIN: -50,
  LEFT_MAX: -15,
  RIGHT_MIN: 15,
  RIGHT_MAX: 50,
  // Eye Aspect Ratio – below this = eyes closed
  EAR_OPEN_THRESHOLD: 0.18,
  EAR_MIN_INDIVIDUAL_THRESHOLD: 0.14,
  // Face size – min width as fraction of frame (face too far = reject)
  MIN_FACE_WIDTH_RATIO: 0.15,
  // Face must be in center – margin from edges (0–1)
  FACE_MARGIN: 0.12,
  // Minimum face detection confidence
  MIN_DETECTION_CONFIDENCE: 0.7,
  // Image quality (0-1)
  IMAGE_QUALITY: 0.95,
  // Liveness detection thresholds
  LIVENESS_BLINK_COUNT: 2,
  LIVENESS_TIMEOUT: 10000,
  // Face similarity threshold (0-1, higher = more similar)
  FACE_SIMILARITY_THRESHOLD: 0.75,
  // Anti-spoofing thresholds
  SPOOF_DEPTH_THRESHOLD: 0.3,
  TEXTURE_VARIANCE_THRESHOLD: 100,
  POSE_HOLD_MS: 500,
};

type ViewType = "front" | "left" | "right";

interface CapturedPhoto {
  type: ViewType;
  dataUrl: string;
  timestamp: Date;
}

interface EyeMetrics {
  left: number;
  right: number;
  average: number;
  leftOpen: boolean;
  rightOpen: boolean;
  bothOpen: boolean;
}

const VIEW_LABELS: Record<ViewType, string> = {
  front: "Front face",
  left: "Left side",
  right: "Right side",
};

/* =====================================================
   MAIN COMPONENT – Native camera, no MediaPipe (no freezing)
===================================================== */

function estimateYaw(lm: Array<{ x: number }>): number {
  const left = lm[234];
  const right = lm[454];
  const nose = lm[1];
  if (!left || !right || !nose) return 0;
  const dx = right.x - left.x;
  if (dx === 0) return 0;
  const center = (left.x + right.x) * 0.5;
  // Keep pose labels in the candidate's real-world orientation.
  return ((nose.x - center) / dx) * 90;
}

function isYawValidFor(type: ViewType, yaw: number): boolean {
  if (type === "front") return yaw >= CONFIG.FRONT_MIN && yaw <= CONFIG.FRONT_MAX;
  if (type === "left") return yaw >= CONFIG.LEFT_MIN && yaw <= CONFIG.LEFT_MAX;
  if (type === "right") return yaw >= CONFIG.RIGHT_MIN && yaw <= CONFIG.RIGHT_MAX;
  return false;
}

function classifyViewFromYaw(yaw: number): ViewType | "unknown" {
  if (isYawValidFor("front", yaw)) return "front";
  if (isYawValidFor("left", yaw)) return "left";
  if (isYawValidFor("right", yaw)) return "right";
  return "unknown";
}

function getViewInstruction(type: ViewType): string {
  if (type === "front") return "Look straight at the camera.";
  if (type === "left") return "Turn slightly to your left and show your left side.";
  return "Turn slightly to your right and show your right side.";
}

function computeEAR(lm: Array<{ x: number; y: number }>, points: number[]): number {
  const [p1, p4, p2, p6, p3, p5] = points.map((i) => lm[i]);
  if (!p1 || !p4 || !p2 || !p6 || !p3 || !p5) return 0;
  const v1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
  const v2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
  const h = Math.hypot(p1.x - p4.x, p1.y - p4.y);
  if (h === 0) return 0;
  return (v1 + v2) / (2 * h);
}

// MediaPipe Face Mesh eye landmarks
// Order for EAR: corner-left, corner-right, upper-1, lower-1, upper-2, lower-2
const LEFT_EYE_INDICES = [33, 133, 160, 144, 158, 153];
const RIGHT_EYE_INDICES = [362, 263, 385, 380, 387, 373];

function getEyeMetrics(lm: Array<{ x: number; y: number }>): EyeMetrics {
  const leftEAR = computeEAR(lm, LEFT_EYE_INDICES);
  const rightEAR = computeEAR(lm, RIGHT_EYE_INDICES);
  const avgEAR = (leftEAR + rightEAR) / 2;
  const leftOpen = leftEAR >= CONFIG.EAR_MIN_INDIVIDUAL_THRESHOLD;
  const rightOpen = rightEAR >= CONFIG.EAR_MIN_INDIVIDUAL_THRESHOLD;
  const bothOpen =
    avgEAR >= CONFIG.EAR_OPEN_THRESHOLD &&
    leftOpen &&
    rightOpen;

  console.log(
    `Eye EAR - Left: ${leftEAR.toFixed(3)}, Right: ${rightEAR.toFixed(3)}, Avg: ${avgEAR.toFixed(3)}, OpenThreshold: ${CONFIG.EAR_OPEN_THRESHOLD}`
  );

  return {
    left: leftEAR,
    right: rightEAR,
    average: avgEAR,
    leftOpen,
    rightOpen,
    bothOpen,
  };
}

function areEyesOpen(lm: Array<{ x: number; y: number }>): boolean {
  return getEyeMetrics(lm).bothOpen;
}

// Get detailed eye status for each eye
function getEyeStatus(lm: Array<{ x: number; y: number }>): EyeMetrics {
  return getEyeMetrics(lm);
}

function getFaceCountStatus(faceCount: number): {
  label: string;
  isValid: boolean;
  tone: "positive" | "warning" | "negative";
} {
  if (faceCount === 1) {
    return {
      label: "Single face detected",
      isValid: true,
      tone: "positive",
    };
  }
  if (faceCount > 1) {
    return {
      label: `Multiple faces detected (${faceCount})`,
      isValid: false,
      tone: "negative",
    };
  }
  return {
    label: "No face detected",
    isValid: false,
    tone: "warning",
  };
}

function isFaceProperlyVisible(lm: Array<{ x: number; y: number }>): boolean {
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const p of lm) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const margin = CONFIG.FACE_MARGIN;
  return (
    w >= CONFIG.MIN_FACE_WIDTH_RATIO &&
    h >= CONFIG.MIN_FACE_WIDTH_RATIO &&
    minX >= margin && maxX <= 1 - margin &&
    minY >= margin && maxY <= 1 - margin
  );
}

/* =====================================================
   ADVANCED AI FEATURES
===================================================== */

// Generate face embedding (feature vector) from landmarks
function generateFaceEmbedding(lm: Array<{ x: number; y: number; z?: number }>): number[] {
  // Use key facial landmarks to create a feature vector
  const keyPoints = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 33, 37, 38, 40, 46, 52, 55, 61, 133, 152, 159, 145, 362, 263, 291, 373, 374, 380, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 454];
  const embedding: number[] = [];
  
  // Normalize coordinates relative to face center
  const centerX = lm[1].x;
  const centerY = lm[1].y;
  const faceWidth = Math.abs(lm[454].x - lm[234].x);
  
  for (const idx of keyPoints) {
    if (lm[idx]) {
      embedding.push((lm[idx].x - centerX) / faceWidth);
      embedding.push((lm[idx].y - centerY) / faceWidth);
      embedding.push((lm[idx].z || 0) / faceWidth);
    }
  }
  
  return embedding;
}

// Detect if face is a photo/spoof (basic texture analysis)
function detectSpoofAttempt(lm: Array<{ x: number; y: number }>, canvas: HTMLCanvasElement): { isSpoof: boolean; confidence: number } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isSpoof: false, confidence: 0 };
  
  // Get face region
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const p of lm) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  const x = Math.floor(minX * canvas.width);
  const y = Math.floor(minY * canvas.height);
  const w = Math.floor((maxX - minX) * canvas.width);
  const h = Math.floor((maxY - minY) * canvas.height);
  
  try {
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;
    
    // Calculate texture variance (real faces have more texture variation)
    let variance = 0;
    let mean = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      mean += gray;
    }
    mean /= (data.length / 4);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      variance += Math.pow(gray - mean, 2);
    }
    variance /= (data.length / 4);
    
    // Check for moiré patterns (common in screen photos)
    let moireScore = 0;
    for (let i = 0; i < h; i += 4) {
      for (let j = 0; j < w; j += 4) {
        const idx = (i * w + j) * 4;
        if (idx < data.length - 4) {
          const diff = Math.abs(data[idx] - data[idx + 4]);
          if (diff > 50) moireScore++;
        }
      }
    }
    
    const isSpoof = variance < CONFIG.TEXTURE_VARIANCE_THRESHOLD || moireScore > (w * h) / 32;
    const confidence = Math.min(1, (CONFIG.TEXTURE_VARIANCE_THRESHOLD - variance) / CONFIG.TEXTURE_VARIANCE_THRESHOLD);
    
    return { isSpoof, confidence };
  } catch {
    return { isSpoof: false, confidence: 0 };
  }
}

// Detect facial expression for liveness
function detectExpression(lm: Array<{ x: number; y: number }>): { 
  expression: string; 
  confidence: number;
  isNatural: boolean;
} {
  // Mouth aspect ratio
  const mouthTop = lm[13];
  const mouthBottom = lm[14];
  const mouthLeft = lm[78];
  const mouthRight = lm[308];
  
  if (!mouthTop || !mouthBottom || !mouthLeft || !mouthRight) {
    return { expression: 'unknown', confidence: 0, isNatural: false };
  }
  
  const mouthHeight = Math.hypot(mouthBottom.x - mouthTop.x, mouthBottom.y - mouthTop.y);
  const mouthWidth = Math.hypot(mouthRight.x - mouthLeft.x, mouthRight.y - mouthLeft.y);
  const mar = mouthHeight / mouthWidth;
  
  // Eyebrow position
  const leftBrow = lm[105];
  const rightBrow = lm[334];
  const leftEye = lm[33];
  const rightEye = lm[263];
  
  const browRaise = (
    Math.abs(leftBrow?.y - leftEye?.y) + 
    Math.abs(rightBrow?.y - rightEye?.y)
  ) / 2;
  
  let expression = 'neutral';
  let confidence = 0.5;
  
  if (mar > 0.5) {
    expression = 'surprise';
    confidence = Math.min(1, mar);
  } else if (mar < 0.15 && browRaise < 0.1) {
    expression = 'neutral';
    confidence = 0.8;
  }
  
  return { 
    expression, 
    confidence,
    isNatural: expression === 'neutral' || expression === 'surprise'
  };
}

// Check for consistent lighting (prevent screen photos)
function analyzeLighting(canvas: HTMLCanvasElement): { isConsistent: boolean; confidence: number } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isConsistent: false, confidence: 0 };

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Divide image into regions
    const regions = 4;
    const regionWidth = canvas.width / regions;
    const regionHeight = canvas.height / regions;
    const regionBrightness: number[] = [];

    for (let ry = 0; ry < regions; ry++) {
      for (let rx = 0; rx < regions; rx++) {
        let sum = 0;
        let count = 0;

        for (let y = ry * regionHeight; y < (ry + 1) * regionHeight; y += 10) {
          for (let x = rx * regionWidth; x < (rx + 1) * regionWidth; x += 10) {
            const idx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            sum += brightness;
            count++;
          }
        }

        regionBrightness.push(sum / count);
      }
    }

    // Calculate variance between regions
    const mean = regionBrightness.reduce((a, b) => a + b, 0) / regionBrightness.length;
    const variance = regionBrightness.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / regionBrightness.length;

    // Real photos have some variance, screen photos are very uniform
    const isConsistent = variance > 50 && variance < 5000;
    const confidence = Math.min(1, variance / 1000);

    return { isConsistent, confidence };
  } catch {
    return { isConsistent: false, confidence: 0 };
  }
}

export default function CandidateVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const pendingCaptureRef = useRef<{ type: ViewType } | null>(null);
  const doCaptureRef = useRef<(type: ViewType) => void>(() => {});
  const stableViewRef = useRef<ViewType | "unknown">("unknown");
  const stableViewSinceRef = useRef<number | null>(null);
  const detectedFaceCountRef = useRef(0);
  const lastDetectorRunRef = useRef(0);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceModelReady, setFaceModelReady] = useState(false);
  const [poseError, setPoseError] = useState<string | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(
    () => (typeof document !== "undefined" ? document.visibilityState === "visible" : true)
  );
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [detectedFaceCount, setDetectedFaceCount] = useState(0);
  const [eyeStatus, setEyeStatus] = useState<EyeMetrics>({
    left: 0,
    right: 0,
    average: 0,
    leftOpen: false,
    rightOpen: false,
    bothOpen: false,
  });
  
  // Face quality state
  const [faceQuality, setFaceQuality] = useState<{
    isVisible: boolean;
    isClear: boolean;
    eyesOpen: boolean;
    position: ViewType | "unknown";
    yaw: number;
    stableMs: number;
    confidence: number;
  }>({
    isVisible: false,
    isClear: false,
    eyesOpen: false,
    position: 'unknown',
    yaw: 0,
    stableMs: 0,
    confidence: 0
  });
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<{
    isLivenessCheckComplete: boolean;
    blinkCount: number;
    expression: string;
    overallConfidence: number;
  }>({
    isLivenessCheckComplete: false,
    blinkCount: 0,
    expression: 'unknown',
    overallConfidence: 0
  });
  
  const blinkStartTimeRef = useRef<number | null>(null);
  const lastEyesOpenRef = useRef<boolean>(true);

  /* ================= START / STOP CAMERA ================= */

  const startCamera = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Safari.");
        setCameraReady(false);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user",
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Explicitly play video with promise handling
        const playVideo = async () => {
          if (!videoRef.current) return;
          
          try {
            // Try to play the video
            await videoRef.current.play();
            console.log("Camera started successfully");
            setCameraReady(true);
            setCameraError(null);
          } catch (playErr) {
            console.error("Error playing video:", playErr);
            
            // Fallback: Try muted play (browsers often block autoplay with sound)
            if (videoRef.current) {
              videoRef.current.muted = true;
              try {
                await videoRef.current.play();
                console.log("Camera started with muted play");
                setCameraReady(true);
                setCameraError(null);
              } catch (mutedErr) {
                console.error("Muted play also failed:", mutedErr);
                setCameraError("Failed to start video stream. Please allow camera access.");
              }
            }
          }
        };
        
        // Set up event listener for when metadata is loaded
        videoRef.current.onloadedmetadata = () => {
          playVideo();
        };
        
        // Immediate fallback: if video is already ready, play now
        if (videoRef.current.readyState >= 2) {
          playVideo();
        }
        
        // Backup timeout: force ready state if video is playing but event didn't fire
        setTimeout(() => {
          if (!cameraReady && videoRef.current) {
            if (videoRef.current.readyState >= 2 && !videoRef.current.paused) {
              setCameraReady(true);
              setCameraError(null);
            } else if (videoRef.current.readyState >= 2) {
              playVideo();
            }
          }
        }, 800);
      }
      
      setCameraError(null);
    } catch (err) {
      console.error("Camera error:", err);
      let errorMessage = "Camera access denied";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        } else {
          errorMessage = err.message;
        }
      }
      setCameraError(errorMessage);
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    // COMPLETE CAMERA CLEANUP - Critical for browser to release camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force video element reset
    }
    detectedFaceCountRef.current = 0;
    lastDetectorRunRef.current = 0;
    setDetectedFaceCount(0);
    setEyeStatus({
      left: 0,
      right: 0,
      average: 0,
      leftOpen: false,
      rightOpen: false,
      bothOpen: false,
    });
    setCameraReady(false);
    setFaceModelReady(false);
  };

  /* ================= TAB VISIBILITY ================= */

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    
    // Handle page unload/refresh to ensure camera is released
    const handleBeforeUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  /* ================= FACE MODEL (for pose validation on capture) ================= */

  useEffect(() => {
    let cancelled = false;
    
    const initFaceMesh = async () => {
      try {
        console.log("Initializing FaceMesh...");
        
        const fm = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        
        fm.setOptions({
          maxNumFaces: 2,
          refineLandmarks: false,
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
        
        fm.onResults((results) => {
          // Real-time face quality updates
          const meshFaceCount = results.multiFaceLandmarks?.length || 0;
          const faceCount = Math.max(meshFaceCount, detectedFaceCountRef.current);
          const hasFace = faceCount > 0;
          
          // Face detection logging removed for performance
          
          if (hasFace && faceCount === 1 && results.multiFaceLandmarks?.length) {
            const lm = results.multiFaceLandmarks[0];
            const eyeMetrics = getEyeStatus(lm);
            const eyesOpen = eyeMetrics.bothOpen;
            const faceVisible = isFaceProperlyVisible(lm);
            const yaw = estimateYaw(lm);
            const position = classifyViewFromYaw(yaw);
            const baseQualityReady = eyesOpen && faceVisible && position !== "unknown";
            let stableMs = 0;

            if (baseQualityReady) {
              if (stableViewRef.current !== position) {
                stableViewRef.current = position;
                stableViewSinceRef.current = Date.now();
              }

              if (stableViewSinceRef.current) {
                stableMs = Date.now() - stableViewSinceRef.current;
              }
            } else {
              stableViewRef.current = "unknown";
              stableViewSinceRef.current = null;
            }
            
            // Per-frame logging removed for performance
            
            setFaceQuality({
              isVisible: true,
              isClear: faceVisible,
              eyesOpen: eyesOpen,
              position: position,
              yaw,
              stableMs,
              confidence: 0.8
            });
            
            // AI Analysis - expression and blink detection
            const expression = detectExpression(lm);
            setEyeStatus(eyeMetrics);
            
            // Blink detection for liveness
            const currentEyesOpen = eyesOpen;
            if (lastEyesOpenRef.current && !currentEyesOpen) {
              // Eyes just closed - start blink
              blinkStartTimeRef.current = Date.now();
              // blink started
            } else if (!lastEyesOpenRef.current && currentEyesOpen && blinkStartTimeRef.current) {
              // Eyes just opened - complete blink
              const blinkDuration = Date.now() - blinkStartTimeRef.current;
              // blink ended
              if (blinkDuration > 100 && blinkDuration < 800) {
                // Valid blink (100-800ms)
                setAiAnalysis(prev => {
                  const newBlinkCount = prev.blinkCount + 1;
                  // valid blink counted
                  return {
                    ...prev,
                    blinkCount: newBlinkCount,
                    isLivenessCheckComplete: newBlinkCount >= CONFIG.LIVENESS_BLINK_COUNT,
                    expression: expression.expression
                  };
                });
              }
              blinkStartTimeRef.current = null;
            }
            lastEyesOpenRef.current = currentEyesOpen;
            
            setAiAnalysis(prev => ({
              ...prev,
              expression: expression.expression
            }));
          } else if (faceCount > 1) {
            console.log("Multiple faces detected");
            stableViewRef.current = "unknown";
            stableViewSinceRef.current = null;
            setEyeStatus({
              left: 0,
              right: 0,
              average: 0,
              leftOpen: false,
              rightOpen: false,
              bothOpen: false,
            });
            setFaceQuality({
              isVisible: false,
              isClear: false,
              eyesOpen: false,
              position: 'unknown',
              yaw: 0,
              stableMs: 0,
              confidence: 0
            });
          } else {
            console.log("No face detected");
            stableViewRef.current = "unknown";
            stableViewSinceRef.current = null;
            setEyeStatus({
              left: 0,
              right: 0,
              average: 0,
              leftOpen: false,
              rightOpen: false,
              bothOpen: false,
            });
            setFaceQuality({
              isVisible: false,
              isClear: false,
              eyesOpen: false,
              position: 'unknown',
              yaw: 0,
              stableMs: 0,
              confidence: 0
            });
          }
          
          // Handle pending capture validation
          const pending = pendingCaptureRef.current;
          if (pending) {
            pendingCaptureRef.current = null;

            if (!results.multiFaceLandmarks?.length) {
              setPoseError("No face detected. Position your face in the frame.");
              return;
            }
            if (faceCount > 1 || results.multiFaceLandmarks.length > 1) {
              setPoseError("Multiple faces detected. Only one person should be in frame.");
              return;
            }

            const lm = results.multiFaceLandmarks[0];
            const yaw = estimateYaw(lm);
            const detectedView = classifyViewFromYaw(yaw);
            const eyesOpen = getEyeMetrics(lm).bothOpen;
            const currentStableMs =
              detectedView !== "unknown" && stableViewSinceRef.current
                ? Date.now() - stableViewSinceRef.current
                : 0;
            if (!eyesOpen) {
              setPoseError("Please keep your eyes open.");
              return;
            }
            if (!isFaceProperlyVisible(lm)) {
              setPoseError("Face not clearly visible. Move closer and ensure your face is fully in frame.");
              return;
            }

            if (detectedView !== pending.type) {
              const msg = getViewInstruction(pending.type);
              setPoseError(msg);
              return;
            }

            if (currentStableMs < CONFIG.POSE_HOLD_MS) {
              setPoseError(`Hold the ${VIEW_LABELS[pending.type].toLowerCase()} still for a moment before capture.`);
              return;
            }

            setPoseError(null);
            doCaptureRef.current(pending.type);
          }
        });

        // Initialize FaceDetector
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const fd = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          },
          minDetectionConfidence: 0.3,
          runningMode: "IMAGE",
        });

        if (!cancelled) {
          faceMeshRef.current = fm;
          faceDetectorRef.current = fd;
          setFaceModelReady(true);
          console.log("FaceMesh initialized successfully");
        }
      } catch (err) {
        console.error("FaceMesh initialization error:", err);
        if (!cancelled) setFaceModelReady(false);
      }
    };
    
    // Start initialization immediately
    const t = setTimeout(initFaceMesh, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (isTabVisible) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isTabVisible]);

  // Real-time face detection loop
  useEffect(() => {
    if (!cameraReady || !faceMeshRef.current || !videoRef.current) return;
    
    let isRunning = true;
    let lastProcessTime = 0;
    let animFrameId: number;
    const PROCESS_INTERVAL = 100; // Process every 100ms for faster detection
    const FACE_COUNT_INTERVAL = 200;

    const detectFace = async () => {
      if (!isRunning) return;

      const now = Date.now();
      if (
        videoRef.current &&
        faceDetectorRef.current &&
        videoRef.current.readyState >= 2 &&
        now - lastDetectorRunRef.current >= FACE_COUNT_INTERVAL
      ) {
        try {
          const result = faceDetectorRef.current.detect(videoRef.current);
          const count = result.detections?.length || 0;
          detectedFaceCountRef.current = count;
          setDetectedFaceCount((prev) => (prev === count ? prev : count));
        } catch {
          detectedFaceCountRef.current = 0;
          setDetectedFaceCount((prev) => (prev === 0 ? prev : 0));
        }
        lastDetectorRunRef.current = now;
      }

      if (now - lastProcessTime > PROCESS_INTERVAL) {
        if (videoRef.current && faceMeshRef.current && videoRef.current.readyState >= 2) {
          try {
            await faceMeshRef.current.send({ image: videoRef.current });
          } catch (err) {
            // Silent error - face mesh might not be ready
          }
          lastProcessTime = now;
        }
      }

      // Continue loop using requestAnimationFrame for better performance
      animFrameId = requestAnimationFrame(detectFace);
    };

    // Start detection loop
    detectFace();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameId);
    };
  }, [cameraReady]);

  /* ================= CAPTURE ================= */

  const doCapture = (type: ViewType) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject || video.readyState < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Enable high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", CONFIG.IMAGE_QUALITY);

    setCapturedPhotos((prev) => {
      const filtered = prev.filter((p) => p.type !== type);
      return [...filtered, { type, dataUrl, timestamp: new Date() }];
    });
    
    // Simple AI Analysis on captured image - just log for now
    if (faceMeshRef.current && video) {
      faceMeshRef.current.send({ image: video }).then((results: any) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
          const lm = results.multiFaceLandmarks[0];
                      
          // Generate face embedding for future comparison
          const embedding = generateFaceEmbedding(lm);
          console.log(`Captured ${type} view - Face embedding generated (${embedding.length} dimensions)`);
                      
          // Anti-spoofing detection
          const spoofResult = detectSpoofAttempt(lm, canvas);
          if (spoofResult.isSpoof) {
            console.warn(`Spoofing detected! Confidence: ${(spoofResult.confidence * 100).toFixed(1)}%`);
          } else {
            console.log(`Spoofing check passed. Confidence: ${(spoofResult.confidence * 100).toFixed(1)}%`);
          }

          // Lighting analysis for additional anti-spoofing
          const lightingResult = analyzeLighting(canvas);
          if (!lightingResult.isConsistent) {
            console.warn(`Inconsistent lighting detected! Confidence: ${(lightingResult.confidence * 100).toFixed(1)}%`);
          } else {
            console.log(`Lighting check passed. Confidence: ${(lightingResult.confidence * 100).toFixed(1)}%`);
          }
                      
          // Calculate overall confidence
          const eyesOpen = areEyesOpen(lm);
          const faceVisible = isFaceProperlyVisible(lm);
          const confidence = (eyesOpen ? 0.4 : 0) + (faceVisible ? 0.4 : 0) + 0.2;
                      
          setAiAnalysis(prev => ({
            ...prev,
            overallConfidence: Math.max(prev.overallConfidence, confidence)
          }));
        }
      }).catch((err: any) => {
        console.log("AI analysis error:", err);
      });
    }
  };

  doCaptureRef.current = doCapture;

  useEffect(() => {
    if (!poseError) return;
    const t = setTimeout(() => setPoseError(null), 4000);
    return () => clearTimeout(t);
  }, [poseError]);

  const isCaptureReadyFor = (type: ViewType) =>
    cameraReady &&
    detectedFaceCount === 1 &&
    faceQuality.isVisible &&
    faceQuality.eyesOpen &&
    faceQuality.isClear &&
    faceQuality.position === type &&
    faceQuality.stableMs >= CONFIG.POSE_HOLD_MS;

  const capture = (type: ViewType) => {
    const video = videoRef.current;
    if (!video || !video.srcObject || video.readyState < 2) return;

    setPoseError(null);

    if (detectedFaceCount > 1) {
      setPoseError("Multiple faces detected. Only one person should be in frame.");
      return;
    }

    if (!faceQuality.isVisible) {
      setPoseError("No face detected. Position your face in the frame.");
      return;
    }

    if (!faceQuality.eyesOpen) {
      setPoseError("Please keep your eyes open.");
      return;
    }

    if (!faceQuality.isClear) {
      setPoseError("Move closer and keep your full face inside the guide frame.");
      return;
    }

    if (faceQuality.position !== type) {
      setPoseError(getViewInstruction(type));
      return;
    }

    if (faceQuality.stableMs < CONFIG.POSE_HOLD_MS) {
      setPoseError(`Hold the ${VIEW_LABELS[type].toLowerCase()} still for a moment before capture.`);
      return;
    }

    if (faceMeshRef.current && faceModelReady) {
      if (faceDetectorRef.current) {
        try {
          const result = faceDetectorRef.current.detect(video);
          if (result.detections && result.detections.length > 1) {
            setPoseError("Multiple faces detected. Only one person should be in frame.");
            return;
          }
        } catch {
          // If face detector fails, continue with FaceMesh checks
        }
      }
      pendingCaptureRef.current = { type };
      faceMeshRef.current.send({ image: video });
    } else {
      doCapture(type);
    }
  };

  const handleRetake = (type: ViewType) => {
    // Only remove photo – candidate must click capture again when ready
    setCapturedPhotos((prev) => prev.filter((p) => p.type !== type));
  };

  const getPhoto = (type: ViewType) => capturedPhotos.find((p) => p.type === type);
  const allCaptured = (["front", "left", "right"] as ViewType[]).every((t) => getPhoto(t));
  const faceCountStatus = getFaceCountStatus(detectedFaceCount);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!allCaptured) return;
    const front = getPhoto("front")?.dataUrl;
    const left = getPhoto("left")?.dataUrl;
    const right = getPhoto("right")?.dataUrl;
    if (!front || !left || !right) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const photos = { front, left, right };
      const userId = user?.id ?? user?._id ?? "anonymous";

      const referenceImagesEncrypted = await encryptReferenceImages(photos, userId);
      const session = createProctoringSession(userId, referenceImagesEncrypted);
      saveSession(session);

      await createSessionOnBackend(session);

      navigate("/proctoring-rules");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to start proctoring session");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="exam-flow-shell">
      <div className="exam-flow-container max-w-6xl px-4 py-6 sm:py-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="app-ghost-button p-2 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="exam-flow-title text-xl sm:text-2xl font-bold">
                Candidate Verification
              </h1>
              <p className="exam-flow-muted text-sm mt-0.5">
                Capture front, left and right profile for verification
              </p>
            </div>
          </div>
        </header>

        {cameraError && (
          <div className="exam-flow-card rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Camera Error</h3>
                <p className="text-red-700 text-sm mt-1">{cameraError}</p>
                
                <div className="mt-4 p-3 bg-red-100/50 rounded-lg">
                  <p className="text-red-800 text-xs font-medium mb-2">Troubleshooting steps:</p>
                  <ol className="text-red-700 text-xs space-y-1 list-decimal list-inside">
                    <li>Make sure you have allowed camera permissions in your browser</li>
                    <li>Check that no other app is using your camera</li>
                    <li>Try refreshing the page</li>
                    <li>Use Chrome, Firefox, or Safari for best results</li>
                  </ol>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => { setCameraError(null); startCamera(); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!cameraError && (
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <section className="space-y-4">
              <div className="exam-flow-card overflow-hidden">
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ 
                      transform: "scaleX(-1)",
                      minWidth: "100%",
                      minHeight: "100%"
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" width={CONFIG.width} height={CONFIG.height} />
                  
                  {/* Face Quality Overlay */}
                  {cameraReady && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Face frame guide */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-48 h-64 border-2 border-dashed rounded-2xl transition-colors duration-300 ${
                          faceQuality.isClear && faceQuality.eyesOpen 
                            ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]' 
                            : 'border-white/30'
                        }`}>
                          {/* Corner markers */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white/50" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white/50" />
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white/50" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white/50" />
                        </div>
                      </div>
                      
                      {/* Quality indicators */}
                      <div className="absolute top-4 left-4 space-y-2">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${
                          faceCountStatus.tone === "positive"
                            ? 'bg-emerald-500/80 text-white'
                            : faceCountStatus.tone === "negative"
                              ? 'bg-red-500/80 text-white'
                              : 'bg-amber-500/80 text-white'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${faceCountStatus.isValid ? 'bg-white animate-pulse' : 'bg-white'}`} />
                          {faceCountStatus.label}
                        </div>
                        
                        {detectedFaceCount === 1 && faceQuality.isVisible && (
                          <>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${
                              faceQuality.eyesOpen 
                                ? 'bg-emerald-500/80 text-white' 
                                : 'bg-red-500/80 text-white'
                            }`}>
                              <Eye className={`w-3 h-3 ${faceQuality.eyesOpen ? '' : 'animate-pulse'}`} />
                              {faceQuality.eyesOpen ? 'Eyes Open' : 'EYES CLOSED'}
                            </div>
                            
                            {/* Individual eye status */}
                            {detectedFaceCount === 1 && (
                              <div className="flex gap-1">
                                <div
                                  className={`flex-1 text-center px-2 py-1 rounded text-[10px] font-medium ${
                                    eyeStatus.leftOpen ? "bg-emerald-500/60 text-white" : "bg-red-500/60 text-white"
                                  }`}
                                >
                                  L: {eyeStatus.leftOpen ? "Open" : "Closed"}
                                </div>
                                <div
                                  className={`flex-1 text-center px-2 py-1 rounded text-[10px] font-medium ${
                                    eyeStatus.rightOpen ? "bg-emerald-500/60 text-white" : "bg-red-500/60 text-white"
                                  }`}
                                >
                                  R: {eyeStatus.rightOpen ? "Open" : "Closed"}
                                </div>
                              </div>
                            )}
                            
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${
                              faceQuality.isClear 
                                ? 'bg-emerald-500/80 text-white' 
                                : 'bg-amber-500/80 text-white'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${faceQuality.isClear ? 'bg-white' : 'bg-white animate-pulse'}`} />
                              {faceQuality.isClear ? 'Clear View' : 'Move Closer'}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Position indicator */}
                      {detectedFaceCount === 1 && faceQuality.isVisible && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm bg-white/20 text-white capitalize">
                          Pose: {faceQuality.position === "unknown" ? "adjust" : VIEW_LABELS[faceQuality.position]} | Yaw: {Math.round(faceQuality.yaw)}°
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!cameraReady && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
                      <div className="text-center">
                        <div className="inline-block w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm">Starting camera…</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-100">
                  {poseError && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-sm mb-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{poseError}</span>
                    </div>
                  )}
                  
                  {/* Quality Guide */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Capture Requirements:</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${detectedFaceCount === 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        Only one face should be visible in frame
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${faceQuality.eyesOpen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        Eyes must be open
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${faceQuality.isClear ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        Good lighting and no blur
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Match the required face angle
                      </li>
                    </ul>
                  </div>
                  
                  <p className="text-slate-500 text-sm mb-3">
                    Position your face within the green frame. Capture only works when the exact target pose button shows ready to capture.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["left", "front", "right"] as ViewType[]).map((type) => {
                      const photo = getPhoto(type);
                      const canCapture = isCaptureReadyFor(type);
                      const hint = photo
                        ? "Tap to retake"
                        : canCapture
                          ? "Ready to capture"
                          : detectedFaceCount > 1
                            ? "Remove extra faces from the frame"
                          : faceQuality.position !== "unknown" && faceQuality.position !== type
                            ? `Current: ${VIEW_LABELS[faceQuality.position]}`
                            : getViewInstruction(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={!photo && !canCapture}
                          onClick={() => (photo ? handleRetake(type) : capture(type))}
                          className={`
                            flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-sm font-medium transition-all
                            ${photo
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : canCapture
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 cursor-pointer"
                                : "bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed"
                            }
                          `}
                        >
                          {photo ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>Captured</span>
                              <span className="text-xs opacity-80">Tap to retake</span>
                            </>
                          ) : (
                            <>
                              <CameraIcon className="w-5 h-5" />
                              <span>{VIEW_LABELS[type]}</span>
                              <span className="text-center text-xs opacity-80">
                                {hint}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              {/* AI Analysis Panel */}
              <div className="exam-flow-accent-panel p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Analysis Engine
                  </h2>
                    <div className="exam-flow-accent-pill text-xs">
                      <div className={`w-2 h-2 rounded-full ${faceCountStatus.isValid ? 'bg-emerald-400 animate-pulse' : detectedFaceCount > 1 ? 'bg-red-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                      {faceCountStatus.isValid ? 'Active - Single Face Locked' : faceCountStatus.label}
                    </div>
                </div>
                
                <div className="space-y-3">
                  {/* Liveness Detection */}
                  <div className="exam-flow-accent-subcard p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-4 h-4" />
                        Liveness Check
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        aiAnalysis.isLivenessCheckComplete 
                          ? 'bg-emerald-500/80' : 'bg-amber-500/80'
                      }`}>
                        {aiAnalysis.isLivenessCheckComplete ? 'Complete' : 'In Progress'}
                      </span>
                    </div>
                    <div className="exam-flow-accent-muted mb-2 flex items-center gap-2 text-xs">
                      <Eye className="w-3 h-3" />
                      Blinks detected: {aiAnalysis.blinkCount}/{CONFIG.LIVENESS_BLINK_COUNT}
                    </div>
                    {/* Blink progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden bg-slate-300/50 dark:bg-white/20">
                      <div 
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${(aiAnalysis.blinkCount / CONFIG.LIVENESS_BLINK_COUNT) * 100}%` }}
                      />
                    </div>
                    <p className="exam-flow-accent-muted mt-1 text-[10px]">
                      Blink naturally to verify liveness
                    </p>
                  </div>
                  
                  {/* Expression Analysis */}
                  <div className="exam-flow-accent-subcard p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Scan className="w-4 h-4" />
                        Expression Analysis
                      </div>
                      <span className="exam-flow-accent-pill text-xs capitalize">
                        {aiAnalysis.expression}
                      </span>
                    </div>
                    <div className="exam-flow-accent-muted flex items-center gap-2 text-xs">
                      <UserCheck className="w-3 h-3" />
                      Eye Status: {faceQuality.eyesOpen ? 'Open' : 'Closed'} | L {eyeStatus.left.toFixed(2)} | R {eyeStatus.right.toFixed(2)}
                    </div>
                  </div>
                  
                  {/* Real-time Status */}
                  <div className="exam-flow-accent-subcard p-3">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Video className="w-4 h-4" />
                      Live Detection Status
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`text-center py-1.5 rounded ${faceCountStatus.isValid ? 'exam-flow-status-positive' : detectedFaceCount > 1 ? 'exam-flow-status-negative' : 'exam-flow-status-warning'}`}>
                        Faces: {detectedFaceCount || 0}
                      </div>
                      <div className={`text-center py-1.5 rounded ${faceQuality.eyesOpen ? 'exam-flow-status-positive' : 'exam-flow-status-negative'}`}>
                        Eyes: {faceQuality.eyesOpen ? '✓ Open' : '✗ Closed'}
                      </div>
                      <div className={`text-center py-1.5 rounded ${faceQuality.isClear ? 'exam-flow-status-positive' : 'exam-flow-status-warning'}`}>
                        Clarity: {faceQuality.isClear ? '✓ Good' : '⚠ Poor'}
                      </div>
                      <div className="exam-flow-status-neutral text-center py-1.5 capitalize">
                        Pos: {faceQuality.position}
                      </div>
                    </div>
                  </div>
                  
                  {/* Face Embedding */}
                  {capturedPhotos.length > 0 && (
                    <div className="exam-flow-accent-subcard p-3">
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Fingerprint className="w-4 h-4" />
                        Face Embedding Generated
                      </div>
                      <div className="text-xs text-white/70">
                        {capturedPhotos.length} reference templates created
                      </div>
                    </div>
                  )}
                  
                  {/* Overall Confidence */}
                  <div className="exam-flow-accent-subcard p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4" />
                        AI Confidence Score
                      </div>
                      <span className="text-lg font-bold">
                        {Math.round(
                          (faceQuality.confidence * 0.3 + 
                           (aiAnalysis.isLivenessCheckComplete ? 0.3 : aiAnalysis.blinkCount * 0.15) +
                           (faceQuality.isClear ? 0.2 : 0) +
                           (faceQuality.eyesOpen ? 0.2 : 0)) * 100
                        )}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-300/50 dark:bg-white/20">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                        style={{ 
                          width: `${Math.round(
                            (faceQuality.confidence * 0.3 + 
                             (aiAnalysis.isLivenessCheckComplete ? 0.3 : aiAnalysis.blinkCount * 0.15) +
                             (faceQuality.isClear ? 0.2 : 0) +
                             (faceQuality.eyesOpen ? 0.2 : 0)) * 100
                          )}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 border-t border-slate-300/50 pt-4 dark:border-white/20">
                  <p className="exam-flow-accent-muted flex items-center gap-1 text-xs">
                    <Sparkles className="w-3 h-3" />
                    Powered by MediaPipe Face Mesh & Custom AI Models
                  </p>
                </div>
              </div>

              <div className="exam-flow-card p-4">
                <h2 className="exam-flow-title mb-3 flex items-center gap-2 font-semibold">
                  <CameraIcon className="w-4 h-4" />
                  Captured photos
                </h2>
                <div className="space-y-4">
                  {(["front", "left", "right"] as ViewType[]).map((type) => {
                    const photo = getPhoto(type);
                    return (
                      <div key={type} className="flex items-center gap-4">
                        <div className="w-24 shrink-0 text-sm font-medium text-slate-600 capitalize">
                          {VIEW_LABELS[type]}
                        </div>
                        <div className="flex-1 min-w-0 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video max-h-32">
                          {photo ? (
                            <img
                              src={photo.dataUrl}
                              alt={VIEW_LABELS[type]}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                              Not captured
                            </div>
                          )}
                        </div>
                        {photo && (
                          <button
                            type="button"
                            onClick={() => handleRetake(type)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Retake
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  {submitError && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-3 py-2 text-sm mb-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!allCaptured || submitting}
                    onClick={handleSubmit}
                    className={`
                      w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all
                      ${allCaptured && !submitting
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <Send className="w-5 h-5" />
                    {submitting
                      ? "Starting…"
                      : allCaptured
                        ? "Submit verification"
                        : "Capture all three views to continue"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

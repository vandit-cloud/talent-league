import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle,
  Clock,
  Eye,
  Mic,
  Monitor,
  Shield,
  Users,
  X,
} from "lucide-react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { getApiUrl } from "../lib/api/base";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

interface ViolationRecord {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
  description: string;
}

interface ModelState {
  faceMesh: "loading" | "ready" | "error";
  objectDetection: "loading" | "ready" | "error";
}

interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ObjectSummary {
  labels: string[];
  primaryLabel: string | null;
  primaryConfidence: number;
}

type GazeDirection = "center" | "left" | "right" | "up" | "down" | "unknown";
type PostureState = "good" | "slouching" | "leaning" | "away";

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

const EMPTY_FACE_BOUNDS: FaceBounds = { x: 0, y: 0, width: 0, height: 0 };

export default function MonitoringCamera() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const objectDetectorRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const lastViolationRef = useRef<Record<string, number>>({});
  const detectionFrameRef = useRef<number | null>(null);
  const objectDetectionRef = useRef(0);
  const processingRef = useRef(false);
  const fullscreenWarningRef = useRef<number | null>(null);
  const monitoringActiveRef = useRef(true);

  const [modelState, setModelState] = useState<ModelState>({
    faceMesh: "loading",
    objectDetection: "loading",
  });
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [eyesOpen, setEyesOpen] = useState(false);
  const [eyeOpenness, setEyeOpenness] = useState(0);
  const [lookingAtScreen, setLookingAtScreen] = useState(false);
  const [gazeDirection, setGazeDirection] = useState<GazeDirection>("unknown");
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [posture, setPosture] = useState<PostureState>("away");
  const [postureDetails, setPostureDetails] = useState("Align your face inside the frame");
  const [mobileDetected, setMobileDetected] = useState(false);
  const [objectSummary, setObjectSummary] = useState<ObjectSummary>({
    labels: [],
    primaryLabel: null,
    primaryConfidence: 0,
  });
  const [facePosition, setFacePosition] = useState<FaceBounds>(EMPTY_FACE_BOUNDS);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [examTime, setExamTime] = useState(0);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [microphoneActive, setMicrophoneActive] = useState(false);

  const modelsReady = modelState.faceMesh === "ready" && modelState.objectDetection === "ready";
  const readyModelCount = Object.values(modelState).filter((value) => value === "ready").length;

  const updateModelState = (key: keyof ModelState, value: ModelState[keyof ModelState]) => {
    setModelState((prev) => ({ ...prev, [key]: value }));
  };

  const stopCameraStream = () => {
    monitoringActiveRef.current = false;

    if (detectionFrameRef.current) {
      cancelAnimationFrame(detectionFrameRef.current);
      detectionFrameRef.current = null;
    }

    processingRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (faceMeshRef.current) {
      (faceMeshRef.current as unknown as { close?: () => void }).close?.();
      faceMeshRef.current = null;
    }

    objectDetectorRef.current = null;
    setMicrophoneActive(false);
  };

  const addViolation = (description: string, severity: "low" | "medium" | "high") => {
    const now = Date.now();
    const lastTime = lastViolationRef.current[description] || 0;
    if (now - lastTime < 5000) {
      return;
    }

    lastViolationRef.current[description] = now;

    const newViolation: ViolationRecord = {
      id: `${now}-${description}`,
      type: description,
      severity,
      timestamp: new Date(),
      description,
    };

    setViolations((prev) => [...prev.slice(-9), newViolation]);

    if (severity === "high") {
      setAlertMessage(`High severity: ${description}`);
      setShowAlert(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const computeEAR = (landmarks: any[], indices: number[]) => {
    const points = indices.map((index) => landmarks[index]).filter(Boolean);
    if (points.length < 6) {
      return 0;
    }

    const [p1, p2, p3, p4, p5, p6] = points;
    const v1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
    const v2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
    const h = Math.hypot(p1.x - p4.x, p1.y - p4.y);

    return h === 0 ? 0 : (v1 + v2) / (2 * h);
  };

  const analyseGaze = (landmarks: any[]) => {
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const nose = landmarks[1];
    const leftEyeTop = landmarks[159];
    const rightEyeTop = landmarks[386];
    const leftEyeBottom = landmarks[145];
    const rightEyeBottom = landmarks[374];
    const faceTop = landmarks[10];
    const faceBottom = landmarks[152];

    if (
      !leftCheek ||
      !rightCheek ||
      !nose ||
      !leftEyeTop ||
      !rightEyeTop ||
      !leftEyeBottom ||
      !rightEyeBottom ||
      !faceTop ||
      !faceBottom
    ) {
      return { lookingAtScreen: false, direction: "unknown" as GazeDirection };
    }

    const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
    const faceWidth = Math.max(Math.abs(rightCheek.x - leftCheek.x), 0.001);
    const yawRatio = (nose.x - faceCenterX) / faceWidth;

    const eyeMidY = (leftEyeTop.y + rightEyeTop.y + leftEyeBottom.y + rightEyeBottom.y) / 4;
    const faceHeight = Math.max(Math.abs(faceBottom.y - faceTop.y), 0.001);
    const pitchRatio = (nose.y - eyeMidY) / faceHeight;

    let direction: GazeDirection = "center";
    if (yawRatio < -0.1) direction = "left";
    else if (yawRatio > 0.1) direction = "right";
    else if (pitchRatio < -0.08) direction = "up";
    else if (pitchRatio > 0.2) direction = "down";

    return {
      lookingAtScreen: Math.abs(yawRatio) <= 0.1 && pitchRatio >= -0.08 && pitchRatio <= 0.2,
      direction,
    };
  };

  const analysePosture = (landmarks: any[], bounds: FaceBounds) => {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];

    if (!leftEye || !rightEye || !nose) {
      return { posture: "away" as PostureState, details: "Face landmarks incomplete" };
    }

    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    const horizontalOffset = Math.abs(bounds.x + bounds.width / 2 - 0.5);

    if (bounds.width < 0.12 || bounds.height < 0.16) {
      return { posture: "away" as PostureState, details: "Move closer to the camera" };
    }

    if (nose.y > 0.68) {
      return { posture: "slouching" as PostureState, details: "Raise your head slightly" };
    }

    if (Math.abs(roll) > 10 || horizontalOffset > 0.18) {
      return { posture: "leaning" as PostureState, details: "Center your head and shoulders" };
    }

    return { posture: "good" as PostureState, details: "Centered and steady" };
  };

  const formatObjectLabel = (label: string) =>
    label
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const detectObjects = async () => {
    const video = videoRef.current;
    const detector = objectDetectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      return;
    }

    try {
      const predictions = await detector.detect(video);
      const relevant = predictions
        .filter((prediction) => prediction.score >= 0.55 && prediction.class !== "person")
        .sort((a, b) => b.score - a.score);

      const phone = predictions
        .filter((prediction) => prediction.class === "cell phone")
        .sort((a, b) => b.score - a.score)[0];

      const labels = relevant.slice(0, 3).map((prediction) => formatObjectLabel(prediction.class));
      setObjectSummary({
        labels,
        primaryLabel: labels[0] ?? null,
        primaryConfidence: relevant[0]?.score ?? 0,
      });

      if (phone && phone.score >= 0.45) {
        setMobileDetected(true);
        addViolation("Mobile device detected", "high");
      } else {
        setMobileDetected(false);
      }
    } catch (error) {
      console.error("Object detection error:", error);
      updateModelState("objectDetection", "error");
      setObjectSummary({
        labels: [],
        primaryLabel: null,
        primaryConfidence: 0,
      });
    }
  };

  useEffect(() => {
    monitoringActiveRef.current = true;

    const handleFaceResults = (results: any) => {
      const faces = results.multiFaceLandmarks ?? [];

      if (faces.length === 0) {
        setFaceDetected(false);
        setFaceCount(0);
        setMultipleFaces(false);
        setFacePosition(EMPTY_FACE_BOUNDS);
        setEyesOpen(false);
        setEyeOpenness(0);
        setLookingAtScreen(false);
        setGazeDirection("unknown");
        setPosture("away");
        setPostureDetails("Face not visible");
        return;
      }

      const landmarks = faces[0];
      let minX = 1;
      let maxX = 0;
      let minY = 1;
      let maxY = 0;

      for (const point of landmarks) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      const bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };

      const leftEAR = computeEAR(landmarks, [33, 160, 158, 133, 153, 144]);
      const rightEAR = computeEAR(landmarks, [362, 385, 387, 263, 373, 380]);
      const averageEAR = Number(((leftEAR + rightEAR) / 2).toFixed(3));
      const eyeState = averageEAR >= 0.16;
      const gaze = analyseGaze(landmarks);
      const postureAnalysis = analysePosture(landmarks, bounds);

      setFaceDetected(true);
      setFaceCount(faces.length);
      setMultipleFaces(faces.length > 1);
      setFacePosition(bounds);
      setEyesOpen(eyeState);
      setEyeOpenness(averageEAR);
      setLookingAtScreen(gaze.lookingAtScreen);
      setGazeDirection(gaze.direction);
      setPosture(postureAnalysis.posture);
      setPostureDetails(postureAnalysis.details);

      if (faces.length > 1) {
        addViolation("Multiple faces detected", "high");
      } else if (!eyeState) {
        addViolation("Eyes closed detected", "medium");
      } else if (!gaze.lookingAtScreen) {
        addViolation(`Looking ${gaze.direction}`, "medium");
      } else if (postureAnalysis.posture !== "good") {
        addViolation(`Posture issue: ${postureAnalysis.posture}`, "low");
      }
    };

    const processFrame = async () => {
      const video = videoRef.current;
      const faceMesh = faceMeshRef.current;
      if (!monitoringActiveRef.current) {
        return;
      }

      if (!video || !faceMesh || video.readyState < 2) {
        detectionFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (!processingRef.current) {
        processingRef.current = true;
        try {
          await faceMesh.send({ image: video });

          if (objectDetectorRef.current && performance.now() - objectDetectionRef.current > 1200) {
            objectDetectionRef.current = performance.now();
            await detectObjects();
          }
        } catch (error) {
          console.error("Detection loop error:", error);
        } finally {
          processingRef.current = false;
        }
      }

      detectionFrameRef.current = requestAnimationFrame(processFrame);
    };

    const initializeMonitoring = async () => {
      try {
        setAlertMessage("Initializing camera and AI models...");
        setShowAlert(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

        if (!monitoringActiveRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setMicrophoneActive(stream.getAudioTracks().some((track) => track.readyState === "live"));

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((error) => {
              console.error("Video play error:", error);
            });
          };
        }

        const faceMesh = new FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        if (!monitoringActiveRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        faceMesh.setOptions({
          maxNumFaces: 3,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        faceMesh.onResults(handleFaceResults);
        faceMeshRef.current = faceMesh;
        updateModelState("faceMesh", "ready");

        try {
          objectDetectorRef.current = await cocoSsd.load({ base: "mobilenet_v2" });
          if (monitoringActiveRef.current) {
            updateModelState("objectDetection", "ready");
          }
        } catch (error) {
          console.error("Object detector initialization error:", error);
          if (monitoringActiveRef.current) {
            updateModelState("objectDetection", "error");
          }
        }

        setAlertMessage("Camera ready. Running live AI checks.");
        setShowAlert(true);
        window.setTimeout(() => setShowAlert(false), 1500);
        if (monitoringActiveRef.current) {
          detectionFrameRef.current = requestAnimationFrame(processFrame);
        }
      } catch (error) {
        console.error("Camera initialization error:", error);
        if (monitoringActiveRef.current) {
          updateModelState("faceMesh", "error");
          updateModelState("objectDetection", "error");
          setAlertMessage("Failed to initialize camera. Please check permissions.");
          setShowAlert(true);
        }
      }
    };

    initializeMonitoring();

    return () => {
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
      }
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    const requestFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.log("Fullscreen request failed:", error);
      }
    };

    const timeoutId = window.setTimeout(requestFullscreen, 1000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      setFullscreen(isFullscreen);

      if (!isFullscreen) {
        setAlertMessage("Fullscreen is required for the exam session.");
        setShowAlert(true);

        fullscreenWarningRef.current = window.setTimeout(async () => {
          try {
            await document.documentElement.requestFullscreen();
            setAlertMessage("Fullscreen restored.");
            setShowAlert(true);
          } catch {
            addViolation("Fullscreen mode exited", "high");
          }
        }, 3000);
      } else if (fullscreenWarningRef.current) {
        window.clearTimeout(fullscreenWarningRef.current);
        fullscreenWarningRef.current = null;
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (fullscreenWarningRef.current) {
        window.clearTimeout(fullscreenWarningRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExamTime((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation("Tab switching detected", "high");
        stopCameraStream();
        setAlertMessage("Camera turned off because the exam page was left.");
        setShowAlert(true);
      }
    };

    const handlePageLeave = () => {
      stopCameraStream();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handlePageLeave);
    window.addEventListener("pagehide", handlePageLeave);
    window.addEventListener("beforeunload", handlePageLeave);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handlePageLeave);
      window.removeEventListener("pagehide", handlePageLeave);
      window.removeEventListener("beforeunload", handlePageLeave);
    };
  }, []);

  useEffect(() => {
    const activeToken = localStorage.getItem("activeMcqToken");
    console.log("MCQ polling - activeMcqToken:", activeToken);
    if (!activeToken) {
      console.log("No activeMcqToken found, skipping MCQ completion polling");
      return;
    }

    let isMounted = true;

    const checkPhase1Completion = async () => {
      try {
        const url = getApiUrl(`/mcq/result/${activeToken}`);
        console.log("Polling MCQ status:", url);
        const response = await fetch(url);
        if (!response.ok) {
          console.log("MCQ poll response not ok:", response.status);
          return;
        }

        const result = await response.json();
        console.log("MCQ poll result:", result.status);
        if (!isMounted || result.status !== "completed") {
          return;
        }

        const phase1Result: Phase1Result = {
          token: activeToken,
          candidateName: result.candidateName || "Candidate",
          score: result.score || 0,
          correctAnswers: result.correctAnswers || 0,
          totalQuestions: result.totalQuestions || 0,
          answeredQuestions: result.totalQuestions || 0,
          violations: result.violations || [],
          submittedAt: new Date().toISOString(),
        };

        localStorage.setItem("phase1McqResult", JSON.stringify(phase1Result));
        localStorage.removeItem("activeMcqToken");
        console.log("Phase 1 completed! Navigating to Phase 2 with token:", activeToken);
        navigate(`/test-phase-2?token=${activeToken}`, {
          replace: true,
          state: {
            phase1Result,
          },
        });
      } catch (error) {
        console.error("Failed to check MCQ completion:", error);
      }
    };

    checkPhase1Completion();
    const intervalId = window.setInterval(checkPhase1Completion, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  const endExam = () => {
    if (window.confirm("Are you sure you want to end the exam?")) {
      navigate("/exam-complete");
    }
  };

  const modelStatusText = modelsReady
    ? "Face Mesh + COCO-SSD ready"
    : `Models ready ${readyModelCount}/2`;

  const faceStatusText = faceDetected ? `${faceCount} face detected` : "No face detected";
  const eyeStatusText = faceDetected ? `${eyesOpen ? "Eyes open" : "Eyes closed"} (EAR ${eyeOpenness.toFixed(3)})` : "Waiting for face";
  const gazeStatusText = faceDetected
    ? `${lookingAtScreen ? "Looking at screen" : "Looking away"} (${gazeDirection})`
    : "Waiting for face";
  const objectStatusText =
    modelState.objectDetection === "loading"
      ? "Object model loading"
      : modelState.objectDetection === "error"
        ? "Object model unavailable"
        : mobileDetected
          ? "Mobile phone detected"
          : objectSummary.primaryLabel
            ? `${objectSummary.primaryLabel} (${Math.round(objectSummary.primaryConfidence * 100)}%)`
            : "No risky objects detected";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold text-slate-800">Proctoring Alert</h3>
                <p className="text-slate-600">{alertMessage}</p>
              </div>
              <button onClick={() => setShowAlert(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        <div className="relative flex-1">
          <div className="absolute inset-0 bg-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 flex items-center justify-center">
              {faceDetected && facePosition.width > 0 ? (
                <div
                  className={`absolute rounded-2xl border-2 transition-colors duration-300 ${
                    faceDetected && eyesOpen && lookingAtScreen && !multipleFaces
                      ? "border-green-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]"
                      : "border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                  }`}
                  style={{
                    left: `${facePosition.x * 100}%`,
                    top: `${facePosition.y * 100}%`,
                    width: `${facePosition.width * 100}%`,
                    height: `${facePosition.height * 100}%`,
                    minWidth: "150px",
                    minHeight: "180px",
                  }}
                >
                  <div className="absolute -left-2 -top-2 h-6 w-6 border-l-4 border-t-4 border-green-400" />
                  <div className="absolute -right-2 -top-2 h-6 w-6 border-r-4 border-t-4 border-green-400" />
                  <div className="absolute -bottom-2 -left-2 h-6 w-6 border-b-4 border-l-4 border-green-400" />
                  <div className="absolute -bottom-2 -right-2 h-6 w-6 border-b-4 border-r-4 border-green-400" />
                </div>
              ) : (
                <div className="h-80 w-64 rounded-2xl border-2 border-dashed border-red-400" />
              )}
            </div>

            <div className="absolute left-4 top-4 space-y-2">
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm ${
                  modelsReady ? "bg-green-500/80 text-white" : "bg-amber-500/80 text-white"
                }`}
              >
                <Shield className="h-4 w-4" />
                {modelStatusText}
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm ${
                  faceDetected ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                {faceStatusText}
                {multipleFaces && <span className="rounded bg-red-600 px-1 text-xs">Multiple</span>}
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm ${
                  eyesOpen ? "bg-green-500/80 text-white" : "bg-amber-500/80 text-white"
                }`}
              >
                <Eye className="h-4 w-4" />
                {eyeStatusText}
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm ${
                  lookingAtScreen ? "bg-green-500/80 text-white" : "bg-amber-500/80 text-white"
                }`}
              >
                <Monitor className="h-4 w-4" />
                {gazeStatusText}
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm ${
                  posture === "good" ? "bg-green-500/80 text-white" : "bg-amber-500/80 text-white"
                }`}
              >
                <Activity className="h-4 w-4" />
                {`Posture: ${posture} - ${postureDetails}`}
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm ${
                  mobileDetected
                    ? "bg-red-600/90 text-white"
                    : modelState.objectDetection === "error"
                      ? "bg-slate-600/90 text-white"
                      : "bg-green-500/80 text-white"
                }`}
              >
                <Camera className="h-4 w-4" />
                {objectStatusText}
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium backdrop-blur-sm ${
                  fullscreen ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
                }`}
              >
                <Activity className="h-4 w-4" />
                {fullscreen ? "Fullscreen active" : "Not fullscreen"}
              </div>
            </div>

            <div className="absolute right-4 top-4">
              <div className="rounded-lg bg-black/60 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5" />
                  <span className="font-mono text-2xl font-bold">{formatTime(examTime)}</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4">
              <div className="flex items-center gap-2 rounded-lg bg-red-600/90 px-3 py-2 backdrop-blur-sm">
                <div className="h-3 w-3 animate-pulse rounded-full bg-white" />
                <span className="text-sm font-medium">Recording</span>
              </div>
            </div>

            <div className="pointer-events-auto absolute bottom-4 right-4">
              <button
                onClick={endExam}
                className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700"
              >
                End Exam
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-80 flex-col border-l border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-indigo-400" />
              <h2 className="text-lg font-semibold">Proctoring Monitor</h2>
            </div>
          </div>

          <div className="border-b border-slate-700 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-400">Detection Systems</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Camera className="h-4 w-4" /> Face Detection
                </span>
                <span className={`rounded px-2 py-1 text-xs ${modelState.faceMesh === "ready" ? "bg-green-500/20 text-green-400" : modelState.faceMesh === "error" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {modelState.faceMesh === "ready" ? "Face Mesh" : modelState.faceMesh}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" /> Eye Tracking
                </span>
                <span className={`rounded px-2 py-1 text-xs ${eyesOpen ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {eyesOpen ? `Open ${eyeOpenness.toFixed(3)}` : faceDetected ? "Closed" : "Waiting"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Monitor className="h-4 w-4" /> Screen Focus
                </span>
                <span className={`rounded px-2 py-1 text-xs ${lookingAtScreen ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {gazeDirection}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4" /> Posture Analysis
                </span>
                <span className={`rounded px-2 py-1 text-xs ${posture === "good" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {posture}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" /> Object Detection
                </span>
                <span className={`rounded px-2 py-1 text-xs ${mobileDetected ? "bg-red-500/20 text-red-400" : modelState.objectDetection === "error" ? "bg-slate-500/20 text-slate-300" : "bg-green-500/20 text-green-400"}`}>
                  {modelState.objectDetection === "ready" ? mobileDetected ? "Phone" : objectSummary.primaryLabel || "Clear" : modelState.objectDetection}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Mic className="h-4 w-4" /> Microphone
                </span>
                <span className={`rounded px-2 py-1 text-xs ${microphoneActive ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {microphoneActive ? "Active" : "Unavailable"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-700 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-400">Live Details</h3>
            <div className="space-y-2 text-sm text-slate-200">
              <p>{`Faces in frame: ${faceCount}`}</p>
              <p>{`Gaze direction: ${gazeDirection}`}</p>
              <p>{`Posture note: ${postureDetails}`}</p>
              <p>{`Objects: ${objectSummary.labels.length > 0 ? objectSummary.labels.join(", ") : "none"}`}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-400">Recent Violations</h3>
            <div className="space-y-2">
              {violations.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-400" />
                  <p className="text-sm text-slate-400">No violations detected</p>
                </div>
              ) : (
                violations.map((violation) => (
                  <div key={violation.id} className={`rounded-lg border p-3 ${getSeverityColor(violation.severity)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{violation.type}</p>
                        <p className="text-xs opacity-75">{violation.timestamp.toLocaleTimeString()}</p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs font-medium ${violation.severity === "high" ? "bg-red-100 text-red-700" : violation.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-700 p-4">
            <div className="text-center text-xs text-slate-400">
              <p>{`Exam ID: EXAM-${Date.now().toString().slice(-6)}`}</p>
              <p>Session is being monitored and recorded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

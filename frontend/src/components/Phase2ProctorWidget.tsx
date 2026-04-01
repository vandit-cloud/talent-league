import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Eye, Shield, Smartphone, UserRound } from "lucide-react";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

interface ViolationRecord {
  id: string;
  type: string;
  severity: "low" | "medium" | "high";
  timestamp: Date;
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

interface ModelState {
  faceMesh: "loading" | "ready" | "error";
  objectDetection: "loading" | "ready" | "error";
}

type GazeDirection = "center" | "left" | "right" | "up" | "down" | "unknown";
type PostureState = "good" | "slouching" | "leaning" | "away";

const EMPTY_FACE_BOUNDS: FaceBounds = { x: 0, y: 0, width: 0, height: 0 };

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
    return { posture: "away" as PostureState, details: "Move closer to camera" };
  }

  if (nose.y > 0.68) {
    return { posture: "slouching" as PostureState, details: "Raise your head slightly" };
  }

  if (Math.abs(roll) > 10 || horizontalOffset > 0.18) {
    return { posture: "leaning" as PostureState, details: "Center your head" };
  }

  return { posture: "good" as PostureState, details: "Centered and steady" };
};

const formatObjectLabel = (label: string) =>
  label
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function Phase2ProctorWidget() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const objectDetectorRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const detectionFrameRef = useRef<number | null>(null);
  const objectDetectionRef = useRef(0);
  const processingRef = useRef(false);
  const lastViolationRef = useRef<Record<string, number>>({});
  const monitoringActiveRef = useRef(true);

  const [modelState, setModelState] = useState<ModelState>({
    faceMesh: "loading",
    objectDetection: "loading",
  });
  const [cameraError, setCameraError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [eyesOpen, setEyesOpen] = useState(false);
  const [gazeDirection, setGazeDirection] = useState<GazeDirection>("unknown");
  const [lookingAtScreen, setLookingAtScreen] = useState(false);
  const [posture, setPosture] = useState<PostureState>("away");
  const [postureDetails, setPostureDetails] = useState("Align your face in frame");
  const [facePosition, setFacePosition] = useState<FaceBounds>(EMPTY_FACE_BOUNDS);
  const [mobileDetected, setMobileDetected] = useState(false);
  const [objectSummary, setObjectSummary] = useState<ObjectSummary>({
    labels: [],
    primaryLabel: null,
    primaryConfidence: 0,
  });
  const [violations, setViolations] = useState<ViolationRecord[]>([]);

  const modelsReady = modelState.faceMesh === "ready" && modelState.objectDetection === "ready";

  const updateModelState = (key: keyof ModelState, value: ModelState[keyof ModelState]) => {
    setModelState((prev) => ({ ...prev, [key]: value }));
  };

  const addViolation = (type: string, severity: "low" | "medium" | "high") => {
    const now = Date.now();
    const lastTime = lastViolationRef.current[type] || 0;
    if (now - lastTime < 5000) {
      return;
    }

    lastViolationRef.current[type] = now;

    setViolations((prev) => [
      {
        id: `${now}-${type}`,
        type,
        severity,
        timestamp: new Date(),
      },
      ...prev,
    ].slice(0, 5));
  };

  const suspiciousLevel = useMemo(() => {
    if (cameraError) {
      return "camera-error";
    }
    if (mobileDetected || faceCount > 1) {
      return "high";
    }
    if (!faceDetected || !lookingAtScreen || posture !== "good") {
      return "medium";
    }
    return "clear";
  }, [cameraError, mobileDetected, faceCount, faceDetected, lookingAtScreen, posture]);

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
  };

  useEffect(() => {
    monitoringActiveRef.current = true;

    const detectObjects = async () => {
      const video = videoRef.current;
      const detector = objectDetectorRef.current;
      if (!monitoringActiveRef.current || !video || !detector || video.readyState < 2) {
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
        console.error("Phase 2 object detection error:", error);
        updateModelState("objectDetection", "error");
      }
    };

    const handleFaceResults = (results: any) => {
      const faces = results.multiFaceLandmarks ?? [];

      if (faces.length === 0) {
        setFaceDetected(false);
        setFaceCount(0);
        setEyesOpen(false);
        setLookingAtScreen(false);
        setGazeDirection("unknown");
        setPosture("away");
        setPostureDetails("Face not visible");
        setFacePosition(EMPTY_FACE_BOUNDS);
        addViolation("Face not visible", "high");
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
      const averageEAR = (leftEAR + rightEAR) / 2;
      const eyeState = averageEAR >= 0.16;
      const gaze = analyseGaze(landmarks);
      const postureAnalysis = analysePosture(landmarks, bounds);

      setFaceDetected(true);
      setFaceCount(faces.length);
      setEyesOpen(eyeState);
      setLookingAtScreen(gaze.lookingAtScreen);
      setGazeDirection(gaze.direction);
      setPosture(postureAnalysis.posture);
      setPostureDetails(postureAnalysis.details);
      setFacePosition(bounds);

      if (faces.length > 1) {
        addViolation("Multiple faces detected", "high");
      } else if (!eyeState) {
        addViolation("Eyes closed", "medium");
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

          if (objectDetectorRef.current && performance.now() - objectDetectionRef.current > 1400) {
            objectDetectionRef.current = performance.now();
            await detectObjects();
          }
        } catch (error) {
          console.error("Phase 2 detection loop error:", error);
        } finally {
          processingRef.current = false;
        }
      }

      detectionFrameRef.current = requestAnimationFrame(processFrame);
    };

    const initializeMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });

        if (!monitoringActiveRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((error) => {
              console.error("Phase 2 video play error:", error);
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
          console.error("Phase 2 object model init error:", error);
          if (monitoringActiveRef.current) {
            updateModelState("objectDetection", "error");
          }
        }

        if (monitoringActiveRef.current) {
          detectionFrameRef.current = requestAnimationFrame(processFrame);
        }
      } catch (error) {
        console.error("Phase 2 camera init error:", error);
        if (monitoringActiveRef.current) {
          updateModelState("faceMesh", "error");
          updateModelState("objectDetection", "error");
          setCameraError("Camera access blocked. Allow webcam to continue proctoring.");
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
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation("Tab switching detected", "high");
        stopCameraStream();
        setCameraError("Camera turned off because the candidate left the Phase 2 test page.");
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
    const summary = {
      suspiciousLevel,
      faceDetected,
      faceCount,
      lookingAtScreen,
      gazeDirection,
      posture,
      postureDetails,
      mobileDetected,
      objectSummary,
      violations: violations.map((violation) => ({
        ...violation,
        timestamp: violation.timestamp.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("phase2ProctoringSummary", JSON.stringify(summary));
  }, [
    suspiciousLevel,
    faceDetected,
    faceCount,
    lookingAtScreen,
    gazeDirection,
    posture,
    postureDetails,
    mobileDetected,
    objectSummary,
    violations,
  ]);

  const headerTone =
    suspiciousLevel === "high" || suspiciousLevel === "camera-error"
      ? "bg-red-500/20 text-red-100 ring-red-400/30"
      : suspiciousLevel === "medium"
        ? "bg-amber-500/20 text-amber-50 ring-amber-300/30"
        : "bg-emerald-500/20 text-emerald-50 ring-emerald-300/30";

  return (
    <aside className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
      <div className={`mb-4 flex items-center justify-between rounded-2xl px-3 py-2 ring-1 ${headerTone}`}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4" />
          Phase 2 Proctoring
        </div>
        <span className="text-xs uppercase tracking-[0.2em]">
          {suspiciousLevel === "clear"
            ? "Clear"
            : suspiciousLevel === "medium"
              ? "Watch"
              : suspiciousLevel === "camera-error"
                ? "Camera Off"
                : "Alert"}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-48 w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {faceDetected && facePosition.width > 0 ? (
          <div
            className={`pointer-events-none absolute rounded-2xl border-2 ${
              lookingAtScreen && faceCount === 1 ? "border-emerald-400" : "border-red-400"
            }`}
            style={{
              left: `${facePosition.x * 100}%`,
              top: `${facePosition.y * 100}%`,
              width: `${facePosition.width * 100}%`,
              height: `${facePosition.height * 100}%`,
              minWidth: "72px",
              minHeight: "88px",
            }}
          />
        ) : null}

        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
          {modelsReady ? "AI live" : "Loading AI"}
        </div>

        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-4 text-center">
            <div>
              <AlertTriangle className="mx-auto h-7 w-7 text-red-300" />
              <p className="mt-2 text-sm text-red-100">{cameraError}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-slate-200">
            <UserRound className="h-4 w-4 text-cyan-300" />
            Face
          </span>
          <span className={faceDetected && faceCount === 1 ? "text-emerald-300" : "text-red-300"}>
            {faceDetected ? `${faceCount} detected` : "Not visible"}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-slate-200">
            <Eye className="h-4 w-4 text-cyan-300" />
            Focus
          </span>
          <span className={lookingAtScreen ? "text-emerald-300" : "text-amber-300"}>
            {lookingAtScreen ? "On screen" : gazeDirection}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-cyan-300" />
            Posture
          </span>
          <span className={posture === "good" ? "text-emerald-300" : "text-amber-300"}>{posture}</span>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 text-slate-200">
            <Smartphone className="h-4 w-4 text-cyan-300" />
            Objects
          </span>
          <span className={mobileDetected ? "text-red-300" : "text-slate-200"}>
            {mobileDetected
              ? "Phone detected"
              : objectSummary.primaryLabel
                ? objectSummary.primaryLabel
                : modelState.objectDetection === "error"
                  ? "Unavailable"
                  : "Clear"}
          </span>
        </div>

        <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-300">
          {eyesOpen ? "Eyes open" : "Eyes not clear"} | {postureDetails}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Camera className="h-4 w-4 text-cyan-300" />
          Recent Alerts
        </div>
        {violations.length === 0 ? (
          <p className="text-xs text-slate-400">No cheating alerts detected yet.</p>
        ) : (
          <div className="space-y-2">
            {violations.map((violation) => (
              <div key={violation.id} className="rounded-xl bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-100">{violation.type}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      violation.severity === "high"
                        ? "bg-red-500/20 text-red-200"
                        : violation.severity === "medium"
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-blue-500/20 text-blue-200"
                    }`}
                  >
                    {violation.severity}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{violation.timestamp.toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
